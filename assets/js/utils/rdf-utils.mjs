/**
 * @module rdf-utils
 * @description utility functions for handling RDF
 */

import { Parser, DataFactory } from '../pulled-in/N3.js/v2.13.12/n3.esm.min.js';
import { iri, IRI } from "../pulled-in/IRI/3.1.6/mod.mjs";
import { LanguageTag, langTag } from "../pulled-in/language/1.2.0/mod.mjs";
import { isNull, isUndefined, isPlainObject, isString, isEmptyString } from "./js-utils.mjs";


const 
/**
 * A parser that can parse Turtle, TriG, N-Triples, and N-Quads documents.
 * @see {@link https://github.com/rdfjs/N3.js#parsing}
 */
parser = new Parser(),

/** Functions to create RDF statements and terms. */
t = {
  quad        : DataFactory.quad,
  triple      : DataFactory.triple,
  namedNode   : DataFactory.namedNode,
  blankNode   : DataFactory.blankNode,
  literal     : DataFactory.literal,
  defaultGraph: DataFactory.defaultGraph,
},

// keep `normalisePrefixes()` in sync with these
owl     = iri`http://www.w3.org/2002/07/owl#`,
rdf     = iri`http://www.w3.org/1999/02/22-rdf-syntax-ns#`,
rdfs    = iri`http://www.w3.org/2000/01/rdf-schema#`,
vann    = iri`http://purl.org/vocab/vann/`,
dcterms = iri`http://purl.org/dc/terms/`,
skos    = iri`http://www.w3.org/2004/02/skos/core#`,
foaf    = iri`http://xmlns.com/foaf/0.1/`,
schema  = iri`https://schema.org/`,
qrmm    = iri`https://vocab.qworum.net/qrmm.ttl#`;


/**
 * Datasets don't always use the vann prefixes of ontologies.
 * This functions normalises the prefixes that the end-user will see.
 * @param {Object.<string, string>} prefixes 
 * @returns {Object.<string, string>}
 */
function normalisePrefixes(prefixes) {
  const 
  wellKnownPrefixes = {
    owl    ,
    rdf    ,
    rdfs   ,
    vann   ,
    dcterms,
    skos   ,
    foaf   ,
    schema ,
    qrmm   ,
  },
  wellKnownPrefixNames = Object.keys(wellKnownPrefixes),
  wellKnownIris        = Object.values(wellKnownPrefixes),
  reverseWellKnownPrefixes = wellKnownIris.reduce(
    (output, wellKnownIri) => {
      const wellKnownPrefixName = wellKnownPrefixNames.find(n => wellKnownIri.equals(wellKnownPrefixes[n]));
      output[`${wellKnownIri}`] = wellKnownPrefixName;
      return output;
    },
    {}
  ),
  normalisedPrefixes = {};

  for (const [prefix, anIriStr] of Object.entries(prefixes)) {
    if (wellKnownIris.find(v => v.equals(iri`${anIriStr}`))) {
      normalisedPrefixes[reverseWellKnownPrefixes[anIriStr]] = anIriStr;
    } else {
      normalisedPrefixes[prefix] = anIriStr;
    }
  }
  return normalisedPrefixes;
}


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
            resolve({ prefixes: normalisePrefixes(prefixes), quads }); return;
          }
        },

        // onPrefix (optional) accepts a listener of type (prefix: string, iri: NamedNode) => void
        onPrefix: (prefix, anIri) => { 
          if(iri`${anIri.value}` && iri`${anIri.value}a`) prefixes[prefix] = anIri.value; //  && iri`${anIri.value}a` ?
          // console.debug(prefix, 'expands to', anIri.value); 
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

  try { // TODO compute langTags only once
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


/**
 * 
 * @param {string} prefix
 * @param {string} namespace 
 * @returns {boolean}
 */
function isPrefix(prefix, namespace) {
  return isString(prefix) && prefix.match(/[\S]+/) && isString(namespace) && iri`${namespace}` && iri`${namespace}a`; // && iri`${namespace}a` ?
}



/**
 * Is the arg an RDF term?
 * @param {*} term 
 * @returns {boolean}
 * @see {@link https://rdf.js.org/data-model-spec/#term-interface | Term interface}
 */
function isTerm(term) {
  return (
    isPlainObject(term) && 
    [
      'NamedNode', 'BlankNode', 'Literal', 'Variable', 'DefaultGraph', 
      'Quad', 'Triple' // should have been another term type named 'Triple' for triple-terms; 'Quad' is unsuitable for triple-terms
    ].includes(term.termType) && 
    isString(term.value) 
  );
}


/**
 * Is the arg a named node?
 * @param {*} term 
 * @returns {boolean}
 * @see {@link https://rdf.js.org/data-model-spec/#namednode-interface | NamedNode interface}
 */
function isNamedNode(term) {
  try {
    return (
      isTerm(term) && 
      term.termType === 'NamedNode' &&
      iri`${term.value}` instanceof IRI // wastes compute?
    );
  } catch (error) {
    return false;
  }
}


/**
 * Is the arg a blank node?
 * @param {*} term 
 * @returns {boolean}
 * @see {@link https://rdf.js.org/data-model-spec/#blanknode-interface | BlankNode interface}
 */
function isBlankNode(term) {
  try {
    return (
      isTerm(term) && 
      term.termType === 'BlankNode'
    );
  } catch (error) {
    return false;
  }
}


/**
 * Is the arg a literal?
 * @param {*} term 
 * @returns {boolean}
 * @see {@link https://rdf.js.org/data-model-spec/#literal-interface | Literal interface}
 */
function isLiteral(term) {
  if(!isTerm(term))return false;
  if(!(term.termType === 'Literal'))return false;

  // language and direction
  let 
  language         = term.language,
  direction        = term.direction,
  isDirectionGiven = false;

  if (!isString(language)) return false;
  if (!isEmptyString(language)) {
    language = langTag`${language}`; if(isNull(language)) return false;
    isDirectionGiven = ['ltr', 'rtl'].includes(direction);
    if(!(isDirectionGiven || direction === '' || isNull(direction) || isUndefined(direction))) return false;
  } else language = null;
  
  // datatype
  let datatype = iri`http://www.w3.org/2001/XMLSchema#string`; // if datatype is omitted, then it's a plain string

  if (isNamedNode(term.datatype))
  try {
    datatype  = iri`${term.datatype.value}`;
  } catch (error) {
    return false;
  }

  // verify datatype's value
  if (language) {
    if (isDirectionGiven) {
      if(!datatype.equals(iri`http://www.w3.org/1999/02/22-rdf-syntax-ns#dirLangString`))return false;
    } else {
      if(!datatype.equals(iri`http://www.w3.org/1999/02/22-rdf-syntax-ns#langString`))return false;
    }
  }

  return true;
}


/**
 * Is the arg the default graph term?
 * @param {*} term 
 * @returns {boolean}
 * @see {@link https://rdf.js.org/data-model-spec/#defaultgraph-interface | DefaultGraph interface}
 */
function isDefaultGraph(term) {
  return isTerm(term) && term.termType === 'DefaultGraph' && isEmptyString(term.value);
}


/**
 * Is the arg a quad?
 * @param {*} term 
 * @returns {boolean}
 * @see {@link https://rdf.js.org/data-model-spec/#quad-interface | Quad interface}
 */
function isQuad(term) {
  return (
    isTerm(term) && ['Quad', 'Triple'].includes(term.termType) && isEmptyString(term.value) &&
    // subject
    (isNamedNode(term.subject) || isBlankNode(term.subject) || isQuad(term.subject)) &&
    // predicate
    isNamedNode(term.predicate) &&
    // object
    (isNamedNode(term.object) || isLiteral(term.object) || isBlankNode(term.object)) &&
    // graph
    (isDefaultGraph(term.graph) || isNamedNode(term.graph) || isBlankNode(term.graph))
  );
}

const isTriple = isQuad;

export { 
  parseRdf, t, selectUserLiteral, isPrefix,
  owl, rdf, rdfs, vann, dcterms, skos, foaf, schema, qrmm,
  isTerm, isNamedNode, isBlankNode, isLiteral, isDefaultGraph, isQuad, isTriple,
};
