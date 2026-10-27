/**
 * Dependencies.
 */

// https://github.com/rdfjs/N3.js
export { Store, Parser, DataFactory, Writer } from '../../N3.js/v2.13.12/n3.esm.min.js';

// https://github.com/doga/IRI
export { 
  iri, IRI, 
  irl, IRL, 
  urn, URN,
  url 
} from '../../IRI/3.1.6/mod.mjs';

// https://github.com/doga/language
export {
  langTag, LanguageTag, 
  lang, Language
} from '../../language/1.2.0/mod.mjs';
