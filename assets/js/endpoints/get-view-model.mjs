/**
 * An endpoint to respond to content-script requests.
 * @module get-view-model
 */

// RDF
import { Store } from '../pulled-in/N3.js/v2.13.12/n3.esm.min.js';
import { 
  parseRdf, t, selectUserLiteral, isPrefix,
  owl, rdf, rdfs, vann, dcterms,
} from "../utils/rdf-utils.mjs";
import {IRI, IRL, URN, irl, url, urn, iri} from '../pulled-in/IRI/3.1.6/mod.mjs';

import { readRdfsOntology } from "./get-view-model/read-rdfs-ontology.mjs";
import { readOwlOntology } from "./get-view-model/read-owl-ontology.mjs";
import { readNonOntologyDataset } from './get-view-model/read-non-ontology-dataset.mjs';

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
  {prefixes, quads} = await parseRdf(rdf),

  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  dataset = new Store(quads),

  /**
   * @type {?{ontologyType: string, vann: {prefix: string, iri: string}, title: string, description: string}}
   */
  meta = detectOntology(dataset) ?? { documentType: 'dataset' };

  // add vann prefix to declared prefixes
  if (meta.documentType === 'ontology') {
    prefixes[meta.vann.prefix] = meta.vann.iri;
    meta.prefixes              = prefixes;
  }

  const viewModel = (
    meta.documentType === 'dataset'
    ? readNonOntologyDataset(dataset, prefixes)
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
    prefix: dataset.match(null, t.namedNode(`${vann}preferredNamespacePrefix`)),
  
    /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
    iri: dataset.match(null, t.namedNode(`${vann}preferredNamespaceUri`)),
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
      selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${rdfs}label`)))?.value.trim() 
      ?? selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${dcterms}title`)))?.value.trim() 
      ?? ''
    );
    ontology.description = (
      selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${rdfs}comment`)))?.value.trim() 
      ?? selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${dcterms}description`)))?.value.trim() 
      ?? ''
    );
  }
  
  if (!isPrefix(vannMeta.prefix, vannMeta.iri))return null;
  
  if (
    dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${owl}Class`)).size > 0 ||
    dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${owl}ObjectProperty`)).size > 0 ||
    dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${owl}DatatypeProperty`)).size > 0
  ) return {documentType: 'ontology', ontologyType: 'owl', vann: vannMeta, title: ontology.title, description: ontology.description};
  
  if (
    dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${rdfs}Class`)).size > 0 ||
    dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${rdf}Property`)).size > 0 ||
    dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${rdfs}Datatype`)).size > 0
  ) return {documentType: 'ontology', ontologyType: 'rdfs', vann: vannMeta, title: ontology.title, description: ontology.description};
  
  return null;
}


export {getViewModel};
