import { parseRdf } from "./utils/rdf-utils.mjs";
import { Store } from "./pulled-in/N3.js/v2.13.12/n3.esm.min.js";
import { iri, IRI } from "./pulled-in/IRI/3.1.6/mod.mjs";

const
rdf  = iri`http://www.w3.org/1999/02/22-rdf-syntax-ns#`,
rdfs = iri`http://www.w3.org/2000/01/rdf-schema#`,
foaf = iri`http://xmlns.com/foaf/0.1/`,

proseAnnotations = {
  rdf: new Store(parseRdf(`
    # https://vocab.qworum.net/prose-annotations/rdf-and-rdfs-annotations.ttl
    PREFIX qrmm: <https://vocab.qworum.net/qrmm.ttl#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    rdf:type qrmm:prose 'is'@en .
    # rdfs:label qrmm:prose 'is'@en .
  `).quads),

  foaf: new Store(parseRdf(`
    # https://vocab.qworum.net/prose-annotations/foaf-annotations.ttl
    PREFIX qrmm: <https://vocab.qworum.net/qrmm.ttl#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>

    # Classes (stable)
    foaf:Agent qrmm:prose 'an agent capable of action'@en .
    foaf:Document qrmm:prose 'a physical or digital document'@en .
    foaf:Group qrmm:prose 'a collection of agents, and is itself an agent'@en .
    foaf:Image qrmm:prose 'a physical or digital document which is an image'@en .
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
    # foaf:name qrmm:prose 'has the name'@en . // redundant with the subject's prose annotation
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
  `).quads),
};

export {
  proseAnnotations,
  rdf, rdfs, foaf,
};

