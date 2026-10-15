/**
 * @module rdf-utils
 * @description utility functions for handling RDF
 */

// N3.js
import { Parser, DataFactory } from '../pulled-in/N3.js/v2.13.12/n3.esm.min.js';

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
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages}
   */
  userLangs = {
    preferred: navigator.language.toLowerCase(),
    all      : navigator.languages.map(s => s.toLowerCase())
  };

  try {
    // look for the exact preferred language string
    for (const quad of dataset) {
      if(quad.object.termType !== 'Literal')continue;
      if(quad.object.language.toLowerCase() !== userLangs.preferred)continue;
      return quad.object;
    }

    // look for the same preferred language code
    const prefLangCode = userLangs.preferred.split('-')[0];
    for (const quad of dataset) {
      if(quad.object.termType !== 'Literal')continue;
      if(quad.object.language.toLowerCase() !== prefLangCode)continue;
      return quad.object;
    }

    // look for the exact language string
    for (const lang of userLangs.all) {
      for (const quad of dataset) {
        if(quad.object.termType !== 'Literal')continue;
        if(quad.object.language.toLowerCase().split('-')[0] !== lang)continue;
        return quad.object;
      }
    }

    // look for the same language code
    const langCodes = userLangs.all.map(s => s.split('-')[0]);
    for (const langCode of langCodes) {
      for (const quad of dataset) {
        if(quad.object.termType !== 'Literal')continue;
        if(quad.object.language.toLowerCase().split('-')[0] !== langCode)continue;
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
