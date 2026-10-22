import { rdf,  } from "../../utils/rdf-utils.mjs";
import {
  Dictionary
} from "../../rdf-to-human-dictionary.mjs";
import { UserLang } from "../../utils/user-lang.mjs";

import { LanguageTag, langTag } from "../../pulled-in/language/1.2.0/mod.mjs";

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
  // console.debug(`[readNonOntologyDataset] built-in translations:`, Dictionary.builtinTranslations);
  prefixes['rdf'] = `${rdf}`;

  // create a dictionary which includes only the translations that are relevant for this dataset.
  const 
  prefixNames = Object.entries(prefixes).map(arr => arr[0]),
  dictionary  = new Dictionary();
  
  await dictionary.addTranslations(prefixNames);
  dictionary.addDataset(dataset);
  // console.debug(`[readNonOntologyDataset] dictionary`, prefixNames,dictionary.size, dictionary);
  
  // build the view modal
  const viewModel = { documentType: 'dataset', prefixes, statements: [], prose: [] };
  for (const statement of dataset) {
    // display the statement
    viewModel.statements.push(statement);

    // display the prose
    /** @type {?string} */
    const prose = proseOf(statement, dictionary);

    viewModel.prose.push(prose ? `${prose}.` : null);
  }

  return viewModel;
}


/**
 * 
 * @param {Object} term 
 * @param {Object} dictionary 
 * @returns {?string}
 */
function proseOf(term, dictionary) {
  // console.debug(`[proseOf] term`, term);
  if (isQuad(term)) {
    // console.debug(`[proseOf] quad`);
    const 
    l10n = [langTag`en`, langTag`fr`, langTag`de`],
    binding = {
      en: 'this',
      fr: 'ceci',
      de: 'dies'
    },

    userLang = new UserLang(),
    snippetMarker = {sha256: '070ffe9fe882ac061af035500765d81f758c267041f9c4de434d8fd02b088b9b', cleartext: 'rdf viewer chrome extension'},
    prosePlaceholder = '⍁⍁⍁', // TODO use plain RDF instead
    // prosePlaceholder = '❓',
    prose = {
      subject  : proseOf(term.subject, dictionary),
      predicate: proseOf(term.predicate, dictionary),
      object   : proseOf(term.object, dictionary),
    };

    if (!prose.subject && !prose.predicate && !prose.object)return null;
    if (isTriple(term.subject)) { // TODO "; xxx" I18N BUG
      return `${prose.subject ?? prosePlaceholder}; ${binding[`${userLang.selectContentLangForUser(l10n)}`]} ${prose.predicate ?? prosePlaceholder} ${prose.object ?? prosePlaceholder}`;
    } else {
      return `${prose.subject ?? prosePlaceholder} ${prose.predicate ?? prosePlaceholder} ${prose.object ?? prosePlaceholder}`;
    }
  } else if(isNamedNode(term)) {
    // console.debug(`[proseOf] named node`);
    return dictionary.lookup(term);
  } else if(isBlankNode(term)) {
    // console.debug(`[proseOf] blank node`);
    return dictionary.lookup(term);
  } else if(isLiteral(term)) {
    // console.debug(`[proseOf] literal`);
    return term.value;
  }
  return null;
}


export {readNonOntologyDataset};
