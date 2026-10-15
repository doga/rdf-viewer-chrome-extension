import { IRI } from "./iri.mjs";
import { punycode } from "../deps.mjs";
import { isUndefined } from "./util.mjs";

/**
 * An "internationalised resource locator" (a Unicode version of a URL).
 * IRLs are non-standard but they should be, because they are a fix for URLs.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL|URL}
 * 
 */
class IRL extends IRI {
  /**
   * Creates an IRL instance.
   * @param {*} url 
   * @param {(URL|IRL|undefined)} base 
   * @throws {TypeError}
   */
  constructor(url, base){
    if(!isUndefined(base)) base = new URL(`${base}`);
    url = new URL(`${url}`, base);

    const 
    protocol    = url.protocol,
    username    = url.username,
    password    = url.password,
    hostname    = punycode.toUnicode(url.hostname),
    port        = url.port,
    host        = port ? `${hostname}:${port}` : hostname,
    // origin      = `${protocol}//${host}`,
    pathname    = decodeURIComponent(url.pathname),
    search      = decodeURIComponent(url.search),
    hash        = decodeURIComponent(url.hash),
    credentials = url.username ? (url.password ? `${url.username}:${url.password}@` : `${url.username}@`) : '';

    let
    href        = `${protocol}//${credentials}${host}${pathname}${search}${hash}`;
    if(url.href.endsWith('#') && !href.endsWith('#')) href = `${href}#`

    super(href);

    this.protocol = protocol;
    this.username = username;
    this.password = password;
    this.hostname = punycode.toUnicode(hostname);
    this.port     = port;
    this.host     = this.port ? `${this.hostname}:${this.port}` : this.hostname;
    this.origin   = `${this.protocol}//${this.host}`;
    this.pathname = pathname;
    this.search   = search;
    this.hash     = hash;
    this.href     = `${this.protocol}//${credentials}${this.host}${this.pathname}${this.search}${this.hash}`;
    if(url.href.endsWith('#') && !this.href.endsWith('#')) this.href = `${this.href}#`

    this.url = url;
  }
}



/** 
 * Tagged template parser for IRLs.
 * @example
 * const anIrl = irl`https://çağlayan.info/user/çağlayan/?çağlayan#çağlayan`;
 * @returns {IRL?}
 * @see {@link https://en.wikipedia.org/wiki/Internationalized_Resource_Identifier|Internationalized Resource Identifier}
 **/
function irl(strings, ...values){
  // console.log(strings, values); 
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return new IRL(res);
  } catch (_error) {
    return null;
  }
}



/** 
 * Tagged template parser for URLs.
 * @example
 * const anUrl = url`https://xn--alayan-vua36b.info`;
 * @returns {(URL|null)}
 * @see {@link https://en.wikipedia.org/wiki/Internationalized_Resource_Identifier|Internationalized Resource Identifier}
 **/
function url(strings, ...values){
  // console.log(strings, values); 
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return new URL(res);
  } catch (_error) {
    return null;
  }
}


export {IRL, irl, url};
