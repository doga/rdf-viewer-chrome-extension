import { 
  Translator, OntologyDictionary, parse, langTag, LanguagePreferences,
} from '../pulled-in/rdf-to-text/1.0.1/mod.mjs';

const 
storageKey   = 'ontology urls',
dictionaries = [];


/**
 * 
 * @param {{urls: string[]}} args 
 * @returns {Promise<null>}
 */
function setOntologyUrls(args) {
  sessionStorage.setItem(storageKey, JSON.stringify(args.urls));
  return Promise.resolve(null);
}


/**
 * 
 * @returns {Promise<string[]>}
 */
function getOntologyUrls() {
  return Promise.resolve(
    JSON.parse(sessionStorage.getItem(storageKey))
  );
}


const knownOntologies = {
  getUrls: getOntologyUrls,
  setUrls: setOntologyUrls,
  dictionaries
}


export {knownOntologies};
export default knownOntologies;
