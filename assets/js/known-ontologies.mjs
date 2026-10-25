import { 
  Translator, OntologyDictionary, parse, langTag, LanguagePreferences,
} from './pulled-in/rdf-to-text/1.0.1/mod.mjs';

import { irl, IRL } from "./pulled-in/IRI/3.1.6/mod.mjs";
import { isArray, isNull} from "./utils/js-utils.mjs";

const 
storageKey = 'Ontology IRLs',

/** @type {OntologyDictionary[]} */
ontologyDictionaries = [];


class KnownOntology {
  /** @type {?IRL} */
  #webAddress = null;
  
  /** @type {?OntologyDictionary} */
  #dictionary = null;
  
  /** @returns {IRL} */
  get webAddress(){return this.#webAddress;}

  /**
   * @param {IRL} webAddress 
   * @throws {TypeError}
   */
  constructor(webAddress){
    if(!(webAddress instanceof IRL))throw new TypeError("known ontologies must have web addresses that are IRLs");
    this.#webAddress = webAddress;
  }

  /**
   * @returns {?OntologyDictionary}
   */
  async getDictionary() {
    try {
      if(this.#dictionary)return this.#dictionary;

      const
      rdfFileContent = (await fetch(`${this.#webAddress}`)).text(),
      dataset = await parse(rdfFileContent);

      this.#dictionary = new OntologyDictionary();
      this.#dictionary.addDataset(dataset);

      return this.#dictionary;
    } catch (error) {
      return null;
    }
  }
  
}


class KnownOntologies {
  /** @type {KnownOntology[]} */
  #ontologies = [];

  /**
   * This gets called when the end-user is on the extension's options page.
   * @returns {IRL[]} 
   */
  get webAddresses(){return this.#ontologies.map(o => o.webAddress);}

  // /** @type {Promise} */
  // #mutex = Promise.resolve();

  constructor(){
    this.#ontologies = KnownOntologies.#getIrlsFromStorage().map(anIrl => new KnownOntology(anIrl));
  }

  /**
   * 
   * @returns {IRL[]}
   */
  static #getIrlsFromStorage(){
    const rawData = localStorage.getItem(storageKey);
    // console.debug(`rawData from localStorage`,rawData);
    if(!rawData)return [];
    return JSON.parse(rawData).map(str => irl`${str}`)
  }

  /**
   * 
   * @params {IRL[]} irls
   */
  static #setIrlsInStorage(irls){
    localStorage.setItem(storageKey, JSON.stringify(irls.map(anIrl => `${anIrl}`)));
  }

  /**
   * This gets called when the end-user sets ontologies from the extension's options page.
   * @param {IRL[]} irls 
   * @throws {TypeError}
   */
  setWebAddresses(irls){
    if(!(
      isArray(irls) && irls.every(e => e instanceof IRL)
    ))throw new TypeError("wrong IRLs for known ontologies");
    // await this.#mutex;
    // this.#mutex

    // remove ontologies that are no longer requested by the end-user
    this.#ontologies = this.#ontologies.filter(o => irls.find(anIrl => o.webAddress.equals(anIrl)));

    // add new ontologies as requested by the end-user
    for (const anIrl of irls) {
      if(
        this.#ontologies.find(o => o.webAddress.equals(anIrl))
      )continue;

      this.#ontologies.push(
        new KnownOntology(anIrl)
      );
    }

    KnownOntologies.#setIrlsInStorage(irls);
  }

  /**
   * Reads the user's language preferences from the browser, and produces a dataset translation
   * that is tailor-made for the user.
   * @param {Object} dataset 
   * @returns {Array.<?string>}
   * @throws {Error}
   * @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface}
   */
  async translate(dataset){
    const
    langPrefs   = new LanguagePreferences(navigator.languages.map(aLang => langTag`${aLang}`)),
    translator  = new Translator(langPrefs),
    translation = translator.translate(dataset, await this.#getDictionaries());

    return translation;
  }

  /**
   * @returns {OntologyDictionary[]}
   */
  async #getDictionaries(){
    const dicts = [];
    for (const o of this.#ontologies) {
      dicts.push(await o.getDictionary());
    }
    return dicts.filter(d => !isNull(d))
  }

}


const knownOntologies = new KnownOntologies();


export {KnownOntologies, knownOntologies};
export default knownOntologies;
