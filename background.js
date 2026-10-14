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
 * @returns {({documentType: 'unknown'} | {documentType: 'ontology', ontologyType: string, ?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>, classes: {?label: string, iri: string, ?description: string}[], predicates: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[], datatypes: {?label: string, iri: string, ?description: string}[]})}
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
    vannUri,
    /** @type {string} */
    ontologyTitle,
    /** @type {string} */
    ontologyDescription,
    /** @type {string} */
    ontologyIri;

    for (const quad of vannPrefixDs) {
      vannPrefix = quad.object.value;
      ontologyIri = quad.subject.value;
    }
    for (const quad of vannUriDs) {
      if(ontologyIri !== quad.subject.value)ontologyIri = null; // only one ontology!
      vannUri = quad.object.value;

      // ontology title
      for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}label`))) {
        ontologyTitle = q.object.value.trim();
      }

      // ontology description
      for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}comment`))) {
        ontologyDescription = q.object.value.trim();
      }
    }
    console.debug(`is ontology`, ontologyIri);
    console.debug(`title`, ontologyTitle);
    console.debug(`description`, ontologyDescription);
    if(!ontologyIri)return { documentType: 'unknown' };

    const viewModel = getViewModelForOntology(
      dataset, 
      {title: ontologyTitle, description: ontologyDescription, prefixes, vann: {prefix: vannPrefix, iri: vannUri}}
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
 * @param {?title: string, ?description: string, {vann: {prefix: string, iri: string}, prefixes: Object.<string, string>}} meta
 * @throws {TypeError}
 * @returns {{ontologyType: string, ?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>, classes: {?label: string, iri: string, ?description: string}[], predicates: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[], datatypes: {?label: string, iri: string, ?description: string}[]}}
 * @async
 */
function getViewModelForOntology(dataset, meta) {
  const
  viewModel = {
    ontologyType: 'rdfs', // owl
    title       : meta.title,
    description : meta.description,
    vann        : meta.vann,
    prefixes    : meta.prefixes,
    classes     : [],
    predicates  : [],
    datatypes   : []
  },

  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  classesDs = dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${rdfs}Class`)),
  
  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  predicatesDs = dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${rdf}Property`)),

  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  datatypesDs = dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${rdfs}Datatype`));

  // labels and descriptions
  const vms = [viewModel.classes, viewModel.predicates, viewModel.datatypes];
  [classesDs, predicatesDs, datatypesDs].forEach(
    ds => {
      const vm = vms.shift();
      for (const quad of ds) {
        const iri = quad.subject.value;
        let label, description;
        for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}label`))) {
          label = q.object.value;
        }
        for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}comment`))) {
          description = q.object.value;
        }
        vm.push({iri, label, description});
      }
    }
  );

  // predicates: domains and ranges
  for (const quad of predicatesDs) {
    const 
    iri = quad.subject.value,
    vm  = viewModel.predicates.find(e => e.iri === iri);

    vm.domain = [];
    vm.range  = [];

    for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}domain`))) {
      vm.domain.push(q.object.value);
    }

    for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}range`))) {
      vm.range.push(q.object.value);
    }
    
  }

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


