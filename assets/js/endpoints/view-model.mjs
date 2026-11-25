/**
 * Responds to content-script requests.
 * @module view-model
 */

// RDF
import { Store } from '../pulled-in/N3.js/v2.13.12/n3.esm.min.js';
import { 
  parseRdf, transformToRdfStarDataset, t, selectUserLiteral, isPrefix,
} from "../utils/rdf-utils.mjs";
import {IRI, IRL, URN, irl, url, urn, iri} from '../pulled-in/IRI/3.1.6/mod.mjs';

import { readRdfsOntology } from "./get-view-model/read-rdfs-ontology.mjs";
import { readOwlOntology } from "./get-view-model/read-owl-ontology.mjs";
import { readNonOntologyDataset } from './get-view-model/read-non-ontology-dataset.mjs';

import {
  vannPreferredNamespacePrefix,
  vannPreferredNamespaceUri,
  rdfsLabel,
  rdfType,
  dctermsTitle,
  rdfsComment,
  dctermsDescription,
  owlClass,
  owlObjectProperty,
  owlDatatypeProperty,
  rdfsClass,
  rdfProperty,
  rdfsDatatype,
} from '../utils/rdf-constants.mjs';

/**
 * ENDPOINT FOR CONTENT SCRIPT REQUESTS.
 * Parses an RDF document (Turtle, TriG, N-Triples or N-Quads) and returns a view model
 * for the content script to display.
 * 
 * In the returned result, `documentType` is 'dataset' or 'ontology'. `ontologyType` is 'owl', 'rdfs' or undefined.
 * 
 * @param {{rdf: string}} args 
 * @throws {TypeError}
 * @returns {({documentType: string, ontologyType: string, ?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>, classes: {?label: string, iri: string, ?description: string}[], objectProperties: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[], datatypeProperties: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[]} | {documentType: string, ontologyType: string, ?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>, classes: {?label: string, iri: string, ?description: string}[], predicates: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[], datatypes: {?label: string, iri: string, ?description: string}[]} | {documentType: string, prefixes: Object.<string, string>, statements: Object[]})}
 * @async
 */
async function getViewModel(args) {
  const 
  {rdf}             = args,
  {prefixes, quads} = await parseRdf(rdf);

  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  let dataset = new Store();
  
  dataset.addAll(quads);
  dataset = transformToRdfStarDataset(dataset);

  const
  /**
   * @type {?{ontologyType: string, vann: {prefix: string, iri: string}, title: string, description: string}}
   */
  meta = detectOntology(dataset) ?? { documentType: 'dataset' };
  console.debug(`meta.documentType`, meta.documentType);

  // add vann prefix to declared prefixes
  if (meta.documentType === 'ontology') {
    prefixes[meta.vann.prefix] = meta.vann.iri;
    meta.prefixes              = prefixes;
  }


  const viewModel = (
    meta.documentType === 'dataset'
    ? await readNonOntologyDataset(dataset, prefixes)
    : (
      meta.ontologyType === 'owl'
      ? readOwlOntology(dataset, meta)
      : readRdfsOntology(dataset, meta)
    )
  );

  // console.debug(`viewModel`,viewModel);

  return viewModel;
}

/**
 * Does the dataset contain an ontology?
 * ontologyType is 'owl' or 'rdfs'.
 * @param {Object} dataset
 * @returns {?{ontologyType: string, vann: {prefix: string, namespace: string}, title: string, description: string}}
 */
function detectOntology(dataset) {
  const
  vannDs = {
    /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
    prefix: dataset.match(null, vannPreferredNamespacePrefix),
  
    /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
    iri: dataset.match(null, vannPreferredNamespaceUri),
  };
  if (![vannDs.prefix, vannDs.iri].every(ds => ds.size === 1)) return null;

  const 
  vannMeta = {
    /** @type {?string} */
    prefix: null, 
    /** @type {?string} */
    iri: null,
  },
  ontology = {
    /** @type {?string} */
    title: null,
    /** @type {?string} */
    description: null,
  };

  let
  /** @type {?IRI} */
  ontologyIri = null;
  
  for (const quad of vannDs.prefix) {
    vannMeta.prefix = quad.object.value;
    ontologyIri = iri`${quad.subject.value}`;
    if(!ontologyIri) return null;
  }
  
  for (const quad of vannDs.iri) {
    if(!ontologyIri.equals(iri`${quad.subject.value}`))return null; // only one ontology!
    vannMeta.iri         = quad.object.value;
    ontology.title       = (
      selectUserLiteral(dataset.match(quad.subject, rdfsLabel))?.value.trim() 
      ?? selectUserLiteral(dataset.match(quad.subject, dctermsTitle))?.value.trim() 
      ?? ''
    );
    ontology.description = (
      selectUserLiteral(dataset.match(quad.subject, rdfsComment))?.value.trim() 
      ?? selectUserLiteral(dataset.match(quad.subject, dctermsDescription))?.value.trim() 
      ?? ''
    );
  }

  if (!isPrefix(vannMeta.prefix, vannMeta.iri))return null;

  if (
    dataset.match(null, rdfType, owlClass).size > 0 ||
    dataset.match(null, rdfType, owlObjectProperty).size > 0 ||
    dataset.match(null, rdfType, owlDatatypeProperty).size > 0
  ) return {documentType: 'ontology', ontologyType: 'owl', vann: vannMeta, title: ontology.title, description: ontology.description};
  
  if (
    dataset.match(null, rdfType, rdfsClass).size > 0 ||
    dataset.match(null, rdfType, rdfProperty).size > 0 ||
    dataset.match(null, rdfType, rdfsDatatype).size > 0
  ) return {documentType: 'ontology', ontologyType: 'rdfs', vann: vannMeta, title: ontology.title, description: ontology.description};
  
  return null;
}


export {getViewModel};
