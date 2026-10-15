/**
 * @module rdf-utils
 * @description utility functions for handling RDF
 */

// N3.js
import { Parser, DataFactory } from '../pulled-in/N3.js/v2.13.12/n3.esm.min.js';
import languageTag from '../pulled-in/language/1.2.0/lib/language-tag.mjs';

import { LanguageTag, Language, langTag, lang } from "../pulled-in/language/1.2.0/mod.mjs";

const 
/** Functions to create RDF statements and terms. */
t = {
  quad        : DataFactory.quad,
  triple      : DataFactory.triple,
  namedNode   : DataFactory.namedNode,
  blankNode   : DataFactory.blankNode,
  literal     : DataFactory.literal,
  defaultGraph: DataFactory.defaultGraph,
},

/**
 * A parser that can parse Turtle, TriG, N-Triples, and N-Quads documents.
 * @see {@link https://github.com/rdfjs/N3.js#parsing}
 */
parser = new Parser();


/**
 * Parses an RDF document and returns prefixes and quads.
 * @param {string} rdfDocument 
 * @throws {TypeError}
 * @returns {{prefixes: Object.<string, string>, quads: Object[]}}
 * @async
 * @see {@link http://rdf.js.org/data-model-spec/#quad-interface | Quad interface}
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


/**
 * Selects an RDF literal that fits the end-user's language preferences.
 * @param {Object} dataset the literals are the objects of the quads.
 * @returns {?Object}
 * @see {@link https://rdf.js.org/data-model-spec/#literal-interface | Literal interface}
 */
function selectUserLiteral(dataset) {
  const 
  /**
   * @type {{preferred: LanguageTag, all: LanguageTag[]}}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages}
   * @see {@link https://github.com/doga/language}
   */
  userLangs = {
    preferred: langTag`${navigator.language}`,
    all      : navigator.languages.map(s => langTag`${s}`)
  };

  try { // TODO optimise (langTag computing etc)
    // find exact preferred language tag
    for (const quad of dataset) {
      if(quad.object.termType !== 'Literal')continue;
      const literalLang = langTag`${quad.object.language}`;
      if(!literalLang)continue;
      if(!literalLang.equals(userLangs.preferred))continue;
      return quad.object;
    }

    // find same preferred language code
    for (const quad of dataset) {
      if(quad.object.termType !== 'Literal')continue;
      const literalLang = langTag`${quad.object.language}`;
      if(!literalLang)continue;
      if(!literalLang.code.equals(userLangs.preferred.code))continue;
      return quad.object;
    }

    // find same language tag
    for (const lang of userLangs.all) {
      for (const quad of dataset) {
        if(quad.object.termType !== 'Literal')continue;
        const literalLang = langTag`${quad.object.language}`;
        if(!literalLang)continue;
        if(!literalLang.equals(lang))continue;
        return quad.object;
      }
    }

    // find same language code
    for (const lang of userLangs.all) {
      for (const quad of dataset) {
        if(quad.object.termType !== 'Literal')continue;
        const literalLang = langTag`${quad.object.language}`;
        if(!literalLang)continue;
        if(!literalLang.code.equals(lang.code))continue;
        return quad.object;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

export { 
  parseRdf, t, selectUserLiteral
};
