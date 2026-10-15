/**
 * An endpoint to respond to content-script requests.
 * @module get-view-model
 */

// RDF
import { Store } from '../pulled-in/N3.js/v2.13.12/n3.esm.min.js';
import { parseRdf, t, selectUserLiteral } from "../utils/rdf-utils.mjs";

// IRI
import {IRI, IRL, URN, irl, url, urn, iri} from '../pulled-in/IRI/3.1.6/mod.mjs';


const
rdf  = iri`http://www.w3.org/1999/02/22-rdf-syntax-ns#`,
rdfs = iri`http://www.w3.org/2000/01/rdf-schema#`,
vann = iri`http://purl.org/vocab/vann/`;


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
  console.debug('args:', args);
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

  console.debug('dataset:', dataset);

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
      ontologyTitle = selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${rdfs}label`)))?.value.trim() ?? '';
      // for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}label`))) {
      //   ontologyTitle = q.object.value.trim();
      // }

      // ontology description
      ontologyDescription = selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${rdfs}comment`)))?.value.trim() ?? 'An RDF Ontology';
      // for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}comment`))) {
      //   ontologyDescription = q.object.value.trim();
      // }
    }
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
        const
        iri         = quad.subject.value,
        label       = selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${rdfs}label`)))?.value.trim() ?? '',
        description = selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${rdfs}comment`)))?.value.trim() ?? '';

        // for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}label`))) {
        //   label = q.object.value;
        // }
        // for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}comment`))) {
        //   description = q.object.value;
        // }
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

export {getViewModel};
