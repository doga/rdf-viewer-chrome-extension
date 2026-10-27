import { langTag, LanguageTag } from "../deps.mjs";
import { isString, isArray, isEmptyArray, isNull } from "./utils/js-utils.mjs";

/**
 * Matches the end-user's language preferences against the languages on offer for a piece of content.
 */
class LanguagePreferences {
  /** 
   * The reader's preferred languages, in decreasing order of preference.
   * @type {LanguageTag[]} 
   * @ignore
   */
  #languageTags = [];

  /**
   * @param {LanguageTag[]} languageTags ≥ 1 language tags
   * @throws {TypeError}
   */
  constructor(languageTags){
    // check arg
    if(!(
      isArray(languageTags) && languageTags.length > 0 && languageTags.every(e => e instanceof LanguageTag)
    )) throw new TypeError('not a language tag array');

    this.#languageTags = languageTags;
  }

  /**
   * Selects a content language that fits preferences.
   * @param {Array.<?LanguageTag>} contentLanguages `null`s are allowed; RDF literals don't always have a language.
   * @returns {?LanguageTag}
   * @throws {TypeError}
   */
  selectContentLanguage(contentLanguages){
    // check arg
    if(
      !isArray(contentLanguages) || isEmptyArray(contentLanguages) ||
      !contentLanguages.every(cLang => isNull(cLang) || cLang instanceof LanguageTag)
    )throw new TypeError('not a language array');

    const
    selectedLang = (
      // are the RFC 5646 language tags matching? (i.e. 'en-GB')
      this.#languageTags.find(prefLang => contentLanguages.find(cLang => prefLang.equals(cLang))) 
      
      // are the ISO 639 language codes matching? (i.e. 'en')
      ?? this.#languageTags.find(prefLang => contentLanguages.find(cLang => prefLang.code.equals(cLang?.code))) 

      ?? null
    );

    return selectedLang;
  }
}

export {LanguagePreferences};
export default LanguagePreferences;
