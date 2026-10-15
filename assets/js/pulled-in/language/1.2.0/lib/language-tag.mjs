import { Language, lang } from "./language.mjs";

/** 
 * Tagged template parser for language tags that conform to RFC 5646.
 * @example Usage
 * ```javascript
 * const languageTag = langTag`tr-TR`;
 * ```
 * @returns {(LanguageTag | null)} 
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646 | RFC 5646 — Tags for Identifying Languages}
 **/
function langTag(strings, ...values){ 
  // console.log(strings, values); 
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return new LanguageTag(res);
  } catch (_error) {
    return null;
  }
}

/**
 * RFC-5646-conformant language tag.
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646 | RFC 5646 — Tags for Identifying Languages}
 */
class LanguageTag {
  /** @type {Language} */
  #code;

  /** @type {string} */
  #tag;

  /** 
   * ISO-639 language.
   * @returns {Language} 
   **/
  get code(){return this.#code};

  /** 
   * The full RFC-5646-conformant language tag.
   * @returns {string} 
   **/
  get tag(){return this.#tag};

  /**
   * @param {string} langTag RFC-5646-conformant language tag.
   * @returns {(LanguageTag | null)}
   */
  static fromTag(langTag){
    try {
      return new LanguageTag(langTag);
    } catch (error) {
      return null;
    }
  }

  /**
   * 
   * @param {string} langTag RFC-5646-conformant language tag.
   * @throws {TypeError}
   */
  constructor(langTag){
    if (!(
      typeof langTag === 'string' &&
      /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/.test(langTag)
    )) throw new TypeError("not a language tag");
    
    const 
    language = lang`${langTag.split('-')[0]}`;

    if (!language) throw new TypeError("not a language code");
    this.#code = language;
    this.#tag = langTag;
  }
  
  /** 
   * @param {*} other 
   * @returns {boolean} 
   **/
  equals(other) {
    return (
      other instanceof LanguageTag &&
      this.tag.toLowerCase() === other.tag.toLowerCase()
    );
  }

  /** @returns {string} */
  toString() {
    return this.#tag;
  }

}

export {LanguageTag, langTag};
export default {LanguageTag, langTag};
