import { 
  parseRdf, t, 
  isLiteral, isNamedNode, isTerm,
  qrmm, foaf, schema, rdf, 
} from "./utils/rdf-utils.mjs";
import { Store } from "./pulled-in/N3.js/v2.13.12/n3.esm.min.js";
import { iri, IRI } from "./pulled-in/IRI/3.1.6/mod.mjs";
import { LanguageTag, langTag } from "./pulled-in/language/1.2.0/mod.mjs";
import { userLang } from "./utils/user-lang.mjs";
import { isArray, isString } from "./utils/js-utils.mjs";

const
/** @type {Object.<string, IRI>} */
iris = { qrmm, foaf, schema, rdf },

/**
 * `qrmm:prose` annotations to translate existing ontologies.
 * @type {Object.<string, string>}
 */
translations = { // TODO: reflect any update here to vocab.qworum.net.
  rdf: `
    # https://vocab.qworum.net/prose-annotations/rdf-and-rdfs-annotations.ttl
    PREFIX qrmm: <https://vocab.qworum.net/qrmm.ttl#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    # PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    rdf:type qrmm:prose 'is'@en, 'est'@fr, 'ist'@de .
  `,

  foaf: `
    # https://vocab.qworum.net/prose-annotations/foaf-annotations.ttl
    PREFIX qrmm: <https://vocab.qworum.net/qrmm.ttl#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>

    # Classes (stable)
    foaf:Agent qrmm:prose 
      'an agent'@en,
      'un agent'@fr,
      'ein Agent'@de.
    foaf:Document qrmm:prose 
      'a document'@en,
      'un document'@fr,
      'ein Dokument'@de.
    foaf:Group qrmm:prose 
      'a group'@en,
      'un groupe'@fr,
      'eine Gruppe'@de.
    foaf:Image qrmm:prose 
      'an image'@en,
      'an image'@fr,
      'an image'@de.
    foaf:Organization qrmm:prose 'a kind of agent corresponding to social instititutions such as companies, societies etc'@en .
    foaf:Person qrmm:prose 'a person'@en .

    # Classes (testing)
    foaf:OnlineAccount qrmm:prose "an agent's account in an online service"@en .
    foaf:PersonalProfileDocument qrmm:prose 'a personal profile RDF document'@en .
    foaf:Project qrmm:prose "a project, so it's an individual or collective endeavour of some kind"@en .

    # Classes (unstable)
    foaf:LabelProperty qrmm:prose 'a label'@en .
    foaf:OnlineChatAccount qrmm:prose 'an online chat account'@en .
    foaf:OnlineEcommerceAccount qrmm:prose 'an online e-commerce account'@en .
    foaf:OnlineGamingAccount qrmm:prose 'an online gaming account'@en .


    # Properties (stable)
    foaf:homepage qrmm:prose 'has the homepage'@en .
    foaf:isPrimaryTopicOf qrmm:prose 'is the primary topic of'@en .
    foaf:knows qrmm:prose 'knows'@en .
    foaf:made qrmm:prose 'has made'@en .
    foaf:maker qrmm:prose 'was made by'@en .
    foaf:mbox qrmm:prose 'has the personal mailbox'@en .
    foaf:member qrmm:prose 'is a member of the group'@en .
    foaf:page qrmm:prose 'is described by the page'@en .
    foaf:primaryTopic qrmm:prose 'has the primary topic'@en .
    foaf:weblog qrmm:prose 'has the weblog'@en .

    # Properties (testing)
    foaf:account qrmm:prose 'holds the online account'@en . 
    foaf:accountName qrmm:prose 'uses the account name'@en .
    foaf:accountServiceHomepage qrmm:prose 'is hosted by the online service that has the homepage'@en .
    foaf:aimChatID qrmm:prose 'has the AIM chat ID'@en .
    foaf:based_near qrmm:prose 'is near'@en .
    foaf:currentProject qrmm:prose 'is currently working on the project'@en .
    foaf:depiction qrmm:prose 'is depicted by the image'@en .
    foaf:depicts qrmm:prose 'depicts'@en .
    foaf:familyName qrmm:prose 'has the family name'@en .
    foaf:firstName qrmm:prose 'has the first name'@en .
    foaf:focus qrmm:prose 'is the focus of'@en .
    foaf:gender qrmm:prose 'has the gender'@en .
    foaf:givenName qrmm:prose 'has the given name'@en .
    foaf:icqChatID qrmm:prose 'has the ICQ chat ID'@en .
    foaf:img qrmm:prose 'has the image'@en .
    foaf:interest qrmm:prose 'is interested in'@en .
    foaf:jabberID qrmm:prose 'has the Jabber ID'@en .
    foaf:lastName qrmm:prose 'has the last name'@en .
    foaf:logo qrmm:prose 'has the logo'@en .
    foaf:mbox_sha1sum qrmm:prose 'has a mailbox address URL with the SHA1 checksum'@en .
    foaf:msnChatID qrmm:prose 'has the MSN chat ID'@en .
    foaf:myersBriggs qrmm:prose 'has the Myers Briggs personality classification code'@en .
    foaf:name qrmm:prose # redundant with the subject's prose annotation 
      'has the name'@en,
      'est nommé'@fr,
      'hat den Namen'@de.
    foaf:nick qrmm:prose 'has the nickname'@en .
    foaf:openid qrmm:prose 'has the OpenID'@en .
    foaf:pastProject qrmm:prose 'has worked on the project'@en .
    foaf:phone qrmm:prose 'has the phone number'@en .
    foaf:plan qrmm:prose 'has a .plan file that says'@en .
    foaf:publications qrmm:prose 'has published'@en .
    foaf:schoolHomepage qrmm:prose 'has attended the school that has the homepage'@en .
    foaf:skypeID qrmm:prose 'has the Skype ID'@en .
    foaf:thumbnail qrmm:prose 'is depicted in an image whose thumbnail version is'@en .
    foaf:tipjar qrmm:prose 'accepts payments as described in'@en .
    foaf:title qrmm:prose 'has the title'@en .
    foaf:topic qrmm:prose 'has the topic'@en .
    foaf:topic_interest qrmm:prose 'is interested in'@en .
    foaf:workInfoHomepage qrmm:prose 'has the job description homepage'@en .
    foaf:workplaceHomepage qrmm:prose 'has the work homepage'@en .
    foaf:yahooChatID qrmm:prose 'has the Yahoo chat ID'@en .

    # Properties (unstable)
    foaf:age qrmm:prose 'is aged'@en .
    foaf:birthday qrmm:prose 'has the birthday'@en .
    foaf:membershipClass qrmm:prose 'has the members'@en .
    foaf:sha1 qrmm:prose 'has the SHA1 hash'@en .
    foaf:status qrmm:prose 'has the status'@en .

    # Properties (archaic)
    foaf:dnaChecksum qrmm:prose 'has the DNA checksum'@en .
    foaf:family_name qrmm:prose 'has the family name'@en .
    foaf:fundedBy qrmm:prose 'is funded by'@en .
    foaf:geekcode qrmm:prose 'has the geekcode'@en .
    foaf:givenname qrmm:prose 'has the given name'@en .
    foaf:holdsAccount qrmm:prose 'holds the account'@en .
    foaf:surname qrmm:prose 'has the surname'@en .
    foaf:theme qrmm:prose 'broadly fits the theme'@en .
  `,
};


/**
 * Dictionary to translate RDF into human languages.
 */
class Dictionary {
  /** 
   * @type {Object.<string, Object.<string, string>>} 
   * @example
   * ```javascript
   * {
   *   'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': {en: 'is'},
   *   'https://site.example/jimdo': {'': 'Jim Do'}
   * }
   * ```
   * @private
   * @ignore
   */
  #dict = {};

  static get builtinTranslations(){return Object.entries(translations).map(arr => arr[0]);}

  get size(){return Object.entries(this.#dict).length}

  /**
   * @param {(Object[] | undefined)} datasets
   * @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface}
   */
  constructor(datasets){
    console.debug(`Dict new`);
    if (datasets) {
      for (const ds of datasets)this.addDataset(ds);
    }
  }

  /**
   * Add the translations contained in a dataset.
   * 
   * In RDF statements, the subject is translated to the object if the predicate is one of:
   * - `qrmm:prose`
   * - `foaf:name`
   * - `schema:name`
   * - `schema:givenName`
   * 
   * Both ontologies/vocabs and non-ontology datasets can contain `qrm:prose` statements.
   * 
   * But the following predicates are intended for non-ontology datasets only:
   * - `foaf:name`
   * - `schema:name`
   * - `schema:givenName`
   * 
   * @param {Object} dataset
   * @param {(boolean | undefined)} isOntology
   * @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface}
   */
  addDataset(dataset, isOntology){
    console.debug(`add(dataset) ${dataset.size}`,dataset);

    const translationDs = dataset.match(null, t.namedNode(`${qrmm}prose`));
    console.debug(`[addDataset] translationDs`,translationDs.size,translationDs);

    if (!isOntology) {
      const
      foafNameDs        = dataset.match(null, t.namedNode(`${foaf}name`)),
      schemaNameDs      = dataset.match(null, t.namedNode(`${schema}name`)),
      schemaGivenNameDs = dataset.match(null, t.namedNode(`${schema}givenName`));

      translationDs.addAll(foafNameDs.union(schemaNameDs).union(schemaGivenNameDs));
    }
    console.debug(`[addDataset] translationDs _`,translationDs.size,translationDs);

    for (const statement of translationDs){
      if (isNamedNode(statement.subject) && isLiteral(statement.object)) {
        // console.debug(`add(dataset)`,dataset);
        // init dictionary entry for subject's IRI
        this.#dict[statement.subject.value] ??= {};

        // add prose to subject's dictionary entry
        this.#dict[statement.subject.value][statement.object.language] = statement.object.value;
      }
    }
    // console.debug(this.#dict);
  }

  /**
   * Add built-in ontology translations.
   * @param {string[]} prefixes 
   */
  async addTranslations(prefixes) { // BUG check prefix's IRI
    if(!(isArray(prefixes) && prefixes.every(prefix => isString(prefix)))) return;
    for (const prefix of prefixes) {
      await this.addTranslation(prefix);
    }
  }

  /**
   * Adds one of the builtIn ontology translations to this dictionary.
   * @param {string} prefix 
   */
  async addTranslation(prefix) {
    if(!isString(prefix)) return;
    /** @type {?string} */
    const translation = translations[prefix] ?? null; 
    if(!translation){
      console.debug(`translation not found for "${prefix}"`);
      return;
    }
    console.debug(`adding translation for`,prefix);
    const dataset = new Store((await parseRdf(translation)).quads);
    this.addDataset(dataset, true);
  }

  /**
   * If the arg is a named node, returns a translation that matches the end-user's preferences.
   * @param {Object} term
   * @returns {?string}
   * @see {@link https://rdf.js.org/data-model-spec/#term-interface | Term interface}
   * @see {@link https://rdf.js.org/data-model-spec/#namednode-interface | NamedNode interface}
   */
  lookup(term){
    console.debug(`[lookup]`,term);
    if(!isNamedNode(term))return null;
    const dictEntry = this.#dict[term.value];
    if (dictEntry) {
      const 
      langEntries = Object.entries(dictEntry),

      /** @type {string[]} */
      langTagStrings = langEntries.map(langEntry => langEntry[0]),

      /** @type {?LanguageTag} */
      selectedLangTag = userLang.selectContentLangForUser(langTagStrings),

      translationToHumanLang = dictEntry[selectedLangTag ? `${selectedLangTag}` : ''] ?? null;

      console.debug(`[lookup] returning`,translationToHumanLang);
      return translationToHumanLang;
    } else {
      console.debug(`[lookup] returning null`);
      return null;
    }
  }
}


export {
  Dictionary, 
};

