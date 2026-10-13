// js utilities
import { isNull, isUndefined, isArray, isPlainObject, isString, isEmptyString } from "./assets/js/util.mjs";

// N3.js
import { Store, Parser, DataFactory } from './assets/js/pulled-in/N3.js/v2.13.12/n3.esm.min.js';

const
rdf  = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
rdfs = 'http://www.w3.org/2000/01/rdf-schema#',
vann = 'http://purl.org/vocab/vann/',

//** @type {string[]} */
userLanguages = navigator.languages,

//** Functions to create RDF statements and terms. */
t = {
  quad        : DataFactory.quad,
  triple      : DataFactory.triple,
  namedNode   : DataFactory.namedNode,
  blankNode   : DataFactory.blankNode,
  literal     : DataFactory.literal,
  defaultGraph: DataFactory.defaultGraph,
};


// respond the incoming requests sent by the content script
chrome.runtime.onMessage.addListener(async (request, _sender, sendResponse) => {
  try {
    // sendResponse({status: {code: 501, message: 'not implemented'}}); return;

    // find the endpoint implementation for the content-script's request
    const endpoint = endpoints[request.endpoint];
    if (!endpoint) {
      sendResponse({status: {code: 404, message: 'not found'}}); return;
    }

    // return a response
    const responseBody = await endpoint(request.body);
    // console.debug('response body', responseBody);
    sendResponse({status: {code: 200, message: 'OK'}, body: responseBody});

  } catch (error) {
    sendResponse({status: {code: 500, message: 'internal server error'}});
  }
});


/**
 * ENDPOINT FOR CONTENT SCRIPT REQUESTS.
 * Parses an RDF document (Turtle, TriG, N-Triples or N-Quads) and returns a view model
 * for the content script to display.
 * @param {{rdf: string}} args 
 * @throws {TypeError}
 * @returns {Object}
 * @async
 */
async function getViewModel(args) {
  const 
  {rdf}             = args,
  {prefixes, quads} = await parseRdf(rdf),

  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  dataset = new Store(quads),

  // Ontology?
  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  vannPrefixDs = dataset.match(null, t.namedNode(`${vann}preferredNamespacePrefix`)),

  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  vannUriDs = dataset.match(null, t.namedNode(`${vann}preferredNamespaceUri`));

  if ([vannPrefixDs, vannUriDs].every(ds => ds.size === 1)) {
    // ontology
    let 
    /** @type {string} */
    vannPrefix, 
    /** @type {string} */
    vannUri;

    for (const quad of vannPrefixDs) {
      vannPrefix = quad.object.value;
    }
    for (const quad of vannUriDs) {
      vannUri = quad.object.value;
    }

    const viewModel = getViewModelForOntology(
      dataset, 
      {prefixes, vann: {prefix: vannPrefix, iri: vannUri}}
    );
    viewModel.documentType = 'ontology';

    return viewModel;
  } else {
  }

  return { documentType: 'unknown' };
}

/**
 * Returns an ontology view model.
 * @param {Object} dataset
 * @param {{vann: {prefix: string, iri: string}, prefixes: Object.<string, string>}} meta
 * @throws {TypeError}
 * @returns {{ontologyType: string, ?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>, classes: {iri: string, ?description: string}[], predicates: {iri: string, ?description: string}[], datatypes: {iri: string, ?description: string}[]}}
 * @async
 */
function getViewModelForOntology(dataset, meta) {
  const viewModel = {
    ontologyType: 'rdfs', // owl
    title       : null,
    description : null,
    vann        : meta.vann,
    prefixes    : meta.prefixes,
    classes     : [],
    predicates  : [],
    datatypes   : []
  };
  return viewModel;
}

/**
 * Parses an RDF document.
 * @param {string} rdfDocument 
 * @throws {TypeError}
 * @returns {{prefixes: Object.<string, string>, quads: Object}}
 * @async
 */
async function parseRdf(rdfDocument) {
  return new Promise((resolve, reject) => {
    const 
    prefixes = {},
    quads    = [];

    parser.parse(
      rdfDocument,
      {
        // onQuad (optional) receives errors, quads, and completion
        onQuad: (error, quad) => {
          if (error) return reject(new TypeError('not rdf'));
          if(quad){
            // console.debug(quad);
            quads.push(quad); 
          } else {
            // console.debug(`end`);
            resolve({ prefixes, quads }); return;
          }
        },

        // onPrefix (optional) accepts a listener of type (prefix: string, iri: NamedNode) => void
        onPrefix: (prefix, iri) => { 
          prefixes[prefix] = iri.value; 
          // console.debug(prefix, 'expands to', iri.value); 
        },
        // onComment (optional) accepts a listener of type (comment: string) => void
        // onComment: (comment) => { console.debug('#', comment); },
      }
    );
  });
}


const 
parser = new Parser(),
endpoints = {
  'get view model for rdf': getViewModel
};


