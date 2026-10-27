/**
 * Endpoints used by the service worker to respond to content-script requests.
 */

import { getViewModel } from "./content-script.mjs";
import { knownOntologies } from "./options-page.mjs";

const 
endpoints = {
  'get view model for rdf': getViewModel,
  // 'get known ontologies'     : ,
  // 'set known ontologies'     : setOntologyUrls,
};

export {endpoints};
