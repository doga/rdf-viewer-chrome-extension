import { rdf,  } from "../../utils/rdf-utils.mjs";
import {
  createDefaultDictionary, Dictionary
} from "../../rdf-to-human-dictionary.mjs";

import { isTerm, isNamedNode, isBlankNode, isLiteral, isDefaultGraph, isQuad, isTriple } from "../../utils/rdf-utils.mjs";

/**
 * Returns a view model. The returned documentType is a 'dataset'.
 * "Statement" is an alias for "quad".
 * @param {Object} dataset
 * @param {Object.<string, string>} prefixes
 * @throws {TypeError}
 * @returns {{documentType: string, prefixes: Object.<string, string>, statements: Object[], prose: string[]}}
 * @async
 * @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface}
 * @see {@link https://rdf.js.org/data-model-spec/#quad-interface | Quad interface}
 */
async function readNonOntologyDataset(dataset, prefixes) {
  console.debug(`[readNonOntologyDataset]`);
  prefixes['rdf'] = `${rdf}`;
  const 
  defaultDictionary = await createDefaultDictionary(),
  datasetDictionary = new Dictionary([dataset]),
  viewModel  = { documentType: 'dataset', prefixes, statements: [], prose: [] };
  console.debug(`[readNonOntologyDataset] defaultDictionary`,defaultDictionary.size);
  console.debug(`[readNonOntologyDataset] datasetDictionary`,datasetDictionary.size);
  
  for (const statement of dataset) {
    viewModel.statements.push(statement);
    console.debug(`[readNonOntologyDataset] 3`);
    const prose = proseOf(statement, defaultDictionary, datasetDictionary);
    console.debug(`[readNonOntologyDataset] 31`);
    viewModel.prose.push(prose ? `${prose}.` : null);
  }

  console.debug(`[readNonOntologyDataset] viewModel`, viewModel);

  return viewModel;
}


/**
 * 
 * @param {Object} term 
 * @param {Object} defaultDictionary 
 * @param {Object} datasetDictionary 
 * @returns {?string}
 */
function proseOf(term, defaultDictionary, datasetDictionary) {
  console.debug(`[proseOf] term`, term);
  if (isQuad(term)) {
    console.debug(`[proseOf] quad`);
    const prose = {
      subject  : proseOf(term.subject, defaultDictionary, datasetDictionary),
      predicate: proseOf(term.predicate, defaultDictionary, datasetDictionary),
      object   : proseOf(term.object, defaultDictionary, datasetDictionary),
    };
    console.debug(`[proseOf] quad prose ❝`,prose.subject, prose.predicate, prose.object, '❞');
    // if (prose.subject && prose.predicate && prose.object) {
    //   if (isTriple(term.subject)) {
    //     return `${prose.subject}; this ${prose.predicate} ${prose.object}`;
    //   } else {
    //     return `${prose.subject} ${prose.predicate} ${prose.object}`;
    //   }
    // } else {
    //   return null;
    // }
    if (!prose.subject && !prose.predicate && !prose.object)return null;
    if (isTriple(term.subject)) {
      return `${prose.subject ?? '❓'}; this ${prose.predicate ?? '❓'} ${prose.object ?? '❓'}`;
    } else {
      return `${prose.subject ?? '❓'} ${prose.predicate ?? '❓'} ${prose.object ?? '❓'}`;
    }
  } else if(isNamedNode(term)) {
    console.debug(`[proseOf] named node`);
    return defaultDictionary.lookup(term);
  } else if(isBlankNode(term)) {
    console.debug(`[proseOf] blank node`);
    return datasetDictionary.lookup(term);
  } else if(isLiteral(term)) {
    console.debug(`[proseOf] literal`);
    return term.value;
  }
  return null;
}


export {readNonOntologyDataset};
