import { langTag, LanguageTag } from "../deps.mjs";
import { isArray, isNull } from "./utils/js-utils.mjs";
import { 
  isQuad, isTriple, isNamedNode, isBlankNode, isLiteral,
  transformToRdfStarDataset,
} from "./utils/rdf-utils.mjs";
import { 
  OntologyDictionary, DatasetDictionary, annotationPredicates
} from "./dictionary.mjs";
import { LanguagePreferences } from "./language-preferences.mjs";


const
/**
 * Glue text for reifying triples.
 * @type {{language: LanguageTag, value: string}[]}
 * @see {@link https://www.w3.org/TR/rdf12-primer/#section-triple-terms}
 */
glueForReifyingTriples = [
  { language: langTag`en`, value: 'this' },
  { language: langTag`fr`, value: 'ceci' },
  { language: langTag`de`, value: 'dies' },
],
glueLangs = glueForReifyingTriples.map(e => e.language);


class Translator {
  /**
   * @type {?LanguagePreferences}
   * @ignore
   */
  #prefs = null;

  /**
   * 
   * @param {LanguagePreferences} prefs
   * @throws {TypeError}
   */
  constructor(prefs){
    if(!(prefs instanceof LanguagePreferences))throw new TypeError("not a language prefs object");
    this.#prefs = prefs;
  }

  /**
   * Returns one string, or null, for each quad in the dataset.
   * @param {Object} dataset 
   * @param {OntologyDictionary[]} dictionaries
   * @returns {Array.<?string>}
   * @throws {Error}
   * @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface}
   */
  translate(dataset, dictionaries) {
    // console.debug(`translate`, dataset);
    if(!(
      isArray(dictionaries) && dictionaries.every(d => d instanceof OntologyDictionary)
    )) throw new TypeError('ontology dictionaries expected');
    
    dataset = transformToRdfStarDataset(dataset);
    const datasetDict = new DatasetDictionary(dataset);
    
    const res = 
    dataset
    .reduce(
      (statementStrings, quad, _dataset) => {
        // console.debug(`quad`,quad);
        if(annotationPredicates.find(e => e.equals(quad.predicate))){
          statementStrings.push(null);
          return statementStrings;
        }
        const statementString = this.#proseOf(quad, datasetDict, dictionaries);
        if (statementString) {
          statementStrings.push(`${statementString}.`)
        } else {
          statementStrings.push(null);
        }
        return statementStrings;
      },
      []
    );

    return res;
  }

  /**
   * @param {Object} term 
   * @param {DatasetDictionary} datasetDict 
   * @param {OntologyDictionary[]} ontologyDicts 
   * @returns {?string}
   * @ignore
   */
  #proseOf(term, datasetDict, ontologyDicts) {
    // console.debug(`#proseOf`);
    const xxx = '⍁⍁⍁';
    if (isQuad(term)) {
      const 
      {subject, predicate, object} = term,
      prose = {
        subject  : this.#proseOf(subject, datasetDict, ontologyDicts),
        predicate: this.#proseOf(predicate, datasetDict, ontologyDicts),
        object   : this.#proseOf(object, datasetDict, ontologyDicts),
      };

      if (!prose.subject && !prose.predicate && !prose.object)return null;
      if (isTriple(subject)) { 
        const 
        glueLang              = this.#prefs.selectContentLanguage(glueLangs),
        glueForReifyingTriple = glueLang ? glueForReifyingTriples.find(e => e.language.equals(glueLang)).value : xxx;

        // console.debug(`glueForReifyingTriple`, glueForReifyingTriple);

        return `${prose.subject ?? xxx}; ${glueForReifyingTriple} ${prose.predicate ?? xxx} ${prose.object ?? xxx}`;
      } else {
        return `${prose.subject ?? xxx} ${prose.predicate ?? xxx} ${prose.object ?? xxx}`;
      }
    } else if(isNamedNode(term)) {
      const 
      /**
       * @type {?Array.<{language: ?LanguageTag, value: string}>}
       */
      translations = (
        datasetDict.lookUpTerm(term) ?? ontologyDicts.map(d => d.lookUpTerm(term)).find(e => !isNull(e)) ?? null
      );

      if (translations) {
        const 
        translationLangs = translations.map(e => e.language),
        selectedLang     = this.#prefs.selectContentLanguage(translationLangs);

        if (selectedLang) {
          return translations.find(e => selectedLang.equals(e.language)).value;
        } else {
          return translations.find(e => isNull(e.language))?.value ?? null;
        }
      } else {
        return null;
      }
    } else if(isBlankNode(term)) {
      const translations = datasetDict.lookUpTerm(term);
      if (translations) {
        const 
        translationLangs    = translations.map(e => e.language),
        selectedLang        = this.#prefs.selectContentLanguage(translationLangs),
        selectedTranslation = (
          selectedLang 
          ? translations.find(e => selectedLang.equals(e.language)).value
          : (translations.find(e => isNull(e.language))?.value ?? null)
        );

        return selectedTranslation;
      } else {
        return null;
      }
    } else if(isLiteral(term)) {
      // console.debug(`[proseOf] literal`);
      const termLang = langTag`${term.value}`;
      if (!termLang) {
        return term.value;
      } else if (this.#prefs.selectContentLanguage([termLang])) {
        return term.value;
      } else {
        return null;
      }
    }
    return null;
  }

}


export {Translator};
export default Translator;
