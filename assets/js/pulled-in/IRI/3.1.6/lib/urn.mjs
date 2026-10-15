import { IRI } from "./iri.mjs";

class URN extends IRI {
  static regexp = /^urn:(?<nid>[^:]+):(?<nss>[^?]+)(?<resolv>[?][+][^?#]*)?(?<query>[?][=][^#]*)?(?<frag>[#].*)?$/; 

  #namespace;
  #namespaceSpecific;
  #query;
  #resolver;
  #fragment;

  constructor(str){
    super(str);
    if(!str) throw new TypeError('Not a Uniform Resource Name');
    str = `${str}`;
    const match = str.match(URN.regexp);
    if(!match) throw new TypeError('Format does not match a Uniform Resource Name');

    this.#namespace         = match.groups.nid;
    this.#namespaceSpecific = match.groups.nss;
    this.#query             = match.groups.query;
    this.#resolver          = match.groups.resolv;
    this.#fragment          = match.groups.frag;
  }

  get namespace(){return this.#namespace;}
  get namespaceSpecific(){return this.#namespaceSpecific;}
  get query(){return this.#query;}
  get resolver(){return this.#resolver;}
  get fragment(){return this.#fragment;}
}


/** 
 * Tagged template parser for URNs.
 * @example
 * const aUrn = urn`urn:qworum:user:9f90bcb5-2ca4-48f3-b951-193eb9f02f6b`;
 * @returns {(URN|null)} 
 * @see {@link https://en.wikipedia.org/wiki/Internationalized_Resource_Identifier|Internationalized Resource Identifier}
 **/
function urn(strings, ...values){
  // console.log(strings, values); 
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return new URN(res);
  } catch (_error) {
    return null;
  }
}


export {URN, urn};
