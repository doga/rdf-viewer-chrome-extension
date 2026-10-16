// import { 
//   rdf, 
// } from "../../utils/rdf-utils.mjs";

import {
  proseAnnotations,
  rdf, rdfs, foaf,
} from "../../prose-annotations.mjs";

import { isTerm, isNamedNode, isBlankNode, isDefaultGraph, isQuad } from "../../utils/rdf-utils.mjs";

/**
 * Returns an ontology view model. The returned documentType is 'dataset'.
 * "Statement" is an alias for "quad".
 * @param {Object} dataset
 * @param {Object.<string, string>} prefixes
 * @throws {TypeError}
 * @returns {{documentType: string, prefixes: Object.<string, string>, statements: Object[], prose: string[]}}
 * @async
 * @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface}
 * @see {@link https://rdf.js.org/data-model-spec/#quad-interface | Quad interface}
 */
function readNonOntologyDataset(dataset, prefixes) {
  // console.debug(`not an ontology`);
  prefixes['rdf'] = `${rdf}`;
  const viewModel = { documentType: 'dataset', prefixes, statements: [], prose: [] };

  for (const statement of dataset) {
    // statement
    viewModel.statements.push(statement);

    // prose
    
  }

  return viewModel;
}

export {readNonOntologyDataset};
