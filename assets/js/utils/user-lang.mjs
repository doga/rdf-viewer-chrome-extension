import { LanguageTag, langTag } from "../pulled-in/language/1.2.0/mod.mjs";
import { isString, isArray, isEmptyArray } from "./js-utils.mjs";

/**
 * Matches the end-user's language preferences against the languages on offer for a piece of content.
 */
class UserLang {
  /** 
   * @type {LanguageTag} 
   * @ignore
   */
  #userLang = langTag`${navigator.language}`;
  
  /** 
   * @type {LanguageTag[]} 
   * @ignore
   */
  #userLangs = navigator.languages.map(aLang => langTag`${aLang}`);

  constructor(){}

  /**
   * 
   * @param {((?LanguageTag)[] | (?string)[])} contentLanguages 
   * @returns {?LanguageTag}
   * @throws {TypeError}
   */
  selectContentLangForUser(contentLanguages){
    // sanitise arg: make it a LanguageTag[]
    if(!isArray(contentLanguages) || isEmptyArray(contentLanguages))throw new TypeError('not a lang array');
    if(!contentLanguages.every(cLang => cLang instanceof LanguageTag || !cLang))
    contentLanguages = contentLanguages.map(aLang => langTag`${aLang}`);

    const
    selectedLang = (
      // a content lang matches user's preferred lang exactly
      contentLanguages.find(cLang => this.#userLang.equals(cLang)) 

      // a content lang matches another user lang exactly
      ?? this.#userLangs.find(uLang => contentLanguages.find(cLang => uLang.equals(cLang))) 

      // a content lang sort of matches user's preferred lang
      ?? contentLanguages.find(cLang => this.#userLang.code.equals(cLang?.code)) 

      // a content lang sort of matches another user lang
      ?? this.#userLangs.find(uLang => contentLanguages.find(cLang => uLang.code.equals(cLang?.code))) 
      ?? null
    );

    return selectedLang;
  }
}

const userLang = new UserLang();

export {UserLang, userLang};
