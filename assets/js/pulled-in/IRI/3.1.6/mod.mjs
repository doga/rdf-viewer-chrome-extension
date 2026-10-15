/**
 * IRI is a library for parsing URLs and URNs.
 * @module IRI (Internationalized Resource Identifier)
 * @author Doğa Armangil <d.armangil@gmail.com>
 * @license Apache-2.0 <https://www.apache.org/licenses/LICENSE-2.0>
 * @example How to parse a URL or URN.
 * ```javascript
 * import { iri, irl, urn, url, IRI, IRL, URN} from 'https://esm.sh/gh/doga/IRI@3.1.4/mod.mjs';
 * const
 * host = 'çağlayan.info',
 * irl1 = iri`https://${host}/résumé`, // an IRL (Unicode-aware variant of URL) and IRI instance
 * irl2 = irl`https://${host}/résumé`, // an IRL and IRI instance
 * url1 = irl1.url,                    // a URL instance
 * url2 = url`https://${host}/résumé`, // a URL instance
 * urn1 = iri`urn:ietf:rfc:3987`,      // a URN and IRI instance
 * urn2 = urn`urn:ietf:rfc:3987`;      // a URN and IRI instance
 * 
 * irl1.host;              // 'çağlayan.info'
 * irl1.url.host;          // 'xn--alayan-vua36b.info'
 * irl1.pathname;          // '/résumé'
 * irl1.url.pathname;      // '/r%C3%A9sum%C3%A9'
 * urn1.namespace;         // 'ietf'
 * urn1.namespaceSpecific; // 'rfc:3987'
 * ```
 * @see {@link https://github.com/doga/IRI | GitHub repository}
 * @see {@link https://en.wikipedia.org/wiki/Internationalized_Resource_Identifier | Internationalized Resource Identifier on Wikipedia}
 * @see {@link https://www.ietf.org/rfc/rfc3987.txt | RFC 3987: Internationalized Resource Identifiers (IRIs)}
 */

export {IRI} from './lib/iri.mjs';
export {IRL, irl, url} from './lib/irl.mjs';
export {URN, urn} from './lib/urn.mjs';
export {IriParser, iri} from './lib/iri-parser.mjs';
