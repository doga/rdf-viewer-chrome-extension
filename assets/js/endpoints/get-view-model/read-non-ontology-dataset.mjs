import { 
  rdf,
} from "../../utils/rdf-utils.mjs";

/**
 * Returns an ontology view model. The returned documentType is 'dataset'.
 * "Statement" is an alias for "quad".
 * @param {Object} dataset
 * @param {Object.<string, string>} prefixes
 * @throws {TypeError}
 * @returns {{documentType: string, prefixes: Object.<string, string>, statements: Object[]}}
 * @async
 * @see {@link https://rdf.js.org/data-model-spec/#quad-interface | Quad interface}
 */
function readNonOntologyDataset(dataset, prefixes) {
  // console.debug(`not an ontology`);
  prefixes['rdf'] = `${rdf}`;
  const viewModel = { documentType: 'dataset', prefixes, statements: [] };

  for (const statement of dataset) {
    viewModel.statements.push(statement);
  }

  return viewModel;
}

export {readNonOntologyDataset};
