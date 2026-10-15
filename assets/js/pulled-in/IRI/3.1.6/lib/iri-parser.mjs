import {IRI} from './iri.mjs';
import {IRL} from './irl.mjs';
import {URN} from './urn.mjs';

/**
 * An IRI parser.
 * @see {@link https://en.wikipedia.org/wiki/Internationalized_Resource_Identifier|Internationalized Resource Identifier}
 */
class IriParser {
  /** 
   * Parses an IRI. All arguments will be stringified if they are not already strings.
   * 
   * @param {*} iri 
   * @param {*} base
   * @returns {IRI} 
   * @throws {TypeError}
   **/
  static parse(iri, base){
    try {
      return new URN(`${iri}`);
    } catch (_error) {
      try {
        return new IRL(`${iri}`, base);
      } catch (_error) {
        if (base) throw new TypeError(`Invalid IRI: '${iri}' with base '${base}'`);
        throw new TypeError(`Invalid IRI: '${iri}'`);
      }
    }
  }
}


/** 
 * Tagged template parser for IRIs.
 * @example
 * const anIri = iri`https://url.example`;
 * @returns {IRI?} 
 * @see {@link https://en.wikipedia.org/wiki/Internationalized_Resource_Identifier|Internationalized Resource Identifier}
 **/
function iri(strings, ...values){ 
  // console.log(strings, values); 
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return IriParser.parse(res);
  } catch (_error) {
    return null;
  }
}


export {IriParser, iri};
