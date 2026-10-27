import { Store } from "../deps.mjs";
import { iri, IRI } from "../deps.mjs";
import { LanguageTag, langTag } from "../deps.mjs";
import { isArray, isBoolean, isString, isNull } from "./utils/js-utils.mjs";
import { 
  t, 
  isLiteral, isNamedNode, isTerm, isBlankNode, 
  rdfs, foaf, schema, qrmm,
} from "./utils/rdf-utils.mjs";

const
annotationPredicates = [
  t.namedNode(`${qrmm}prose`),
  t.namedNode(`${rdfs}label`),
  t.namedNode(`${foaf}name`),
  t.namedNode(`${schema}name`),
  t.namedNode(`${schema}givenName`),
];


/**
 * Dictionary to translate RDF into human languages.
 */
class Dictionary { // TODO the translation predicates should be settable by the user of this class.
  /**
   * @type {boolean}
   */
  #isOntologyDictionary = true;

  /** 
   * Stores the translations of blank nodes and
   * @type {Array.<{term: {termType: string, value: string}, translations: Array.<{language: ?LanguageTag, value: string}>}>} 
   * @example
   * ```javascript
   * [
   *   {
   *     term: {termType: 'NamedNode', value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', equals: other => ...}, // named node
   *     translations: [
   *       {
   *         language: langTag`en`,
   *         value   : 'is'
   *       }
   *     ]
   *   },
   *   {
   *     term: {termType: 'BlankNode', value: 'a1', equals: other => ...}, // blank node
   *     translations: [
   *       {
   *         language: null,
   *         value   : 'Jim Do'
   *       }
   *     ]
   *   },
   * ]
   * ```
   * @private
   * @ignore
   * @see {@link https://rdf.js.org/data-model-spec/#namednode-interface | NamedNode interface}
   * @see {@link https://rdf.js.org/data-model-spec/#blanknode-interface | BlankNode interface}
   * @see {@link https://github.com/doga/language | language library}
   */
  #dict = [];

  get size(){return this.#dict.length}

  /**
   * @param {boolean} isOntologyDictionary
   * @throws {TypeError}
   */
  constructor(isOntologyDictionary){
    if (!isBoolean(isOntologyDictionary)) throw new TypeError("not an ontology flag");
    this.#isOntologyDictionary = isOntologyDictionary;
  }

  /**
   * Add the translations contained in a dataset.
   * 
   * Blank nodes are only translated if the dataset is not an ontology. Named nodes are always translated.
   * 
   * In an RDF statement, the subject is translated to the object literal if the predicate is one of:
   * - `qrmm:prose`
   * - `foaf:name`
   * - `schema:name`
   * - `schema:givenName`
   * 
   * Both ontologies/vocabs and non-ontology datasets can contain `qrm:prose` statements.
   * 
   * But the following predicates are intended for non-ontology datasets only:
   * - `foaf:name`
   * - `schema:name`
   * - `schema:givenName`
   * 
   * Lastly, `rdfs:label` is the fallback translation for both ontologies and non-ontology datasets.
   * 
   * @param {Object} dataset
   * @throws {Error}
   * @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface}
   */
  addDataset(dataset){
    // console.debug(`addDataset`);
    // console.debug(`add(dataset) ${dataset.size}`,dataset);
    const 
    translationDs         = dataset.match(null, t.namedNode(`${qrmm}prose`)),
    fallbackTranslationDs = dataset.match(null, t.namedNode(`${rdfs}label`));
    // console.debug(`addDataset 2`);
    // console.debug(`[addDataset] translationDs`,translationDs.size,translationDs);
    
    if (!this.#isOntologyDictionary) {
      const
      foafNameDs        = dataset.match(null, t.namedNode(`${foaf}name`)),
      schemaNameDs      = dataset.match(null, t.namedNode(`${schema}name`)),
      schemaGivenNameDs = dataset.match(null, t.namedNode(`${schema}givenName`));
      
      translationDs.addAll(
        foafNameDs
        .union(schemaNameDs)
        .union(schemaGivenNameDs)
      );
    }
    // console.debug(`addDataset 3`);
    // console.debug(`[addDataset] translationDs _`,translationDs.size,translationDs);
    
    [translationDs, fallbackTranslationDs].forEach(ds => {
      for (const statement of ds){
        // console.debug(`addDataset 30`);
        const
        translatedTerm     = statement.subject,
        translationLiteral = statement.object;
        // 
        if (!this.#canTranslate(translatedTerm, translationLiteral)) throw new TypeError('not translatable');
        // console.debug(`addDataset 31`);
        
        let dictionaryEntry = this.#dict.find(e => e.term.equals(translatedTerm));
        if (!dictionaryEntry) {
          dictionaryEntry = {
            term        : translatedTerm,
            translations: []
          };
          this.#dict.push(dictionaryEntry);
        }
        // console.debug(`addDataset 32`);
        
        const 
        language = langTag`${translationLiteral.language}`,
        translationExists = dictionaryEntry.translations.find(
          translation => (
            [translation.language, language].every(e => isNull(e)) || 
            (translation.language?.equals(language) ?? false)
          )
        );
        // console.debug(`addDataset 33`);
        
        if (!translationExists) {
          dictionaryEntry.translations.push({
            language: langTag`${translationLiteral.language}`,
            value   : translationLiteral.value
          });
        }
        // console.debug(`addDataset 34`);
      }
    });
    // console.debug(`addDataset 4`);
  }

  #canTranslate(translatedTerm, translationLiteral) {
    return (
      ( // sanity check for the translated term and the translation
        (isNamedNode(translatedTerm) || isBlankNode(translatedTerm)) && 
        isLiteral(translationLiteral)
      ) &&
      ( // blank nodes are not translated in ontologies
        !this.#isOntologyDictionary || !isBlankNode(translatedTerm)
      )
    );
  }

  /**
   * If the arg is a term, returns its translation if any.
   * @param {{termType: string, value: string}} term
   * @returns {?Array.<{language: ?LanguageTag, value: string}>}
   * @throws {TypeError}
   * @see {@link https://rdf.js.org/data-model-spec/#term-interface | Term interface}
   */
  lookUpTerm(term){
    // console.debug(`[lookUpTerm]`,term);
    if(!isTerm(term))throw new TypeError(`not a term`);
    try {
      const dictionaryEntry = this.#dict.find(e => e.term.equals(term));
      if (dictionaryEntry) {
        // if (term.value === 'b0_henryvii') {
        //   console.debug(`henry vii translations`, dictionaryEntry.translations);
        // }
        // if (term.value === 'b0_henryviii') {
        //   console.debug(`henry viii translations`, dictionaryEntry.translations);
        // }
        return dictionaryEntry.translations;
      }
      return null;
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }
}

/**
 * Stores the translations defined in any number of ontologies
 */
class OntologyDictionary extends Dictionary{
  constructor(){
    super(true);
  }
  
}


/**
 * Stores the translations defined in one plain dataset (not an ontology).
 */
class DatasetDictionary extends Dictionary {
  /**
   * A dataset dictionary can be populated only once, at creation time.
   * @param {*} dataset 
   */
  constructor(dataset){
    super(false);
    super.addDataset(dataset);
  }

  /**
   * 
   * @param {{termType: string, value: string}} term
   * @param {(OntologyDictionary | undefined)} ontologyDictionary 
   * @returns 
   */
  lookUpTerm(term, ontologyDictionary){
    return super.lookUpTerm(term) ?? ontologyDictionary?.lookUpTerm(term) ?? null;
  }

  /**
   * DOES NOTHING.
   * @param {Object} dataset
   * @throws {Error}
   * @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface}
   */
  addDataset(dataset){
    throw new Error("this dictionary can contain translations for only one dataset");
  }
}


export {
  Dictionary, OntologyDictionary, DatasetDictionary,
  annotationPredicates,
};
