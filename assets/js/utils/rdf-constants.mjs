
import { 
  t,
  owl, rdf, rdfs, vann, dcterms, skos, schema, qrmm, qrmd, qrmsw,
} from "../utils/rdf-utils.mjs";

const
vannPreferredNamespacePrefix = t.namedNode(`${vann}preferredNamespacePrefix`),
vannPreferredNamespaceUri    = t.namedNode(`${vann}preferredNamespaceUri`),
rdfsLabel                    = t.namedNode(`${rdfs}label`),
rdfType                      = t.namedNode(`${rdf}type`),
dctermsTitle                 = t.namedNode(`${dcterms}title`),
rdfsComment                  = t.namedNode(`${rdfs}comment`),
dctermsDescription           = t.namedNode(`${dcterms}description`),
owlClass                     = t.namedNode(`${owl}Class`),
owlObjectProperty            = t.namedNode(`${owl}ObjectProperty`),
owlDatatypeProperty          = t.namedNode(`${owl}DatatypeProperty`),
rdfsClass                    = t.namedNode(`${rdfs}Class`),
rdfProperty                  = t.namedNode(`${rdf}Property`),
rdfsDatatype                 = t.namedNode(`${rdfs}Datatype`),
rdfsDomain                   = t.namedNode(`${rdfs}domain`),
rdfsRange                    = t.namedNode(`${rdfs}range`),
rdfsSubPropertyOf            = t.namedNode(`${rdfs}subPropertyOf`),
rdfsSubClassOf               = t.namedNode(`${rdfs}subClassOf`),
skosDefinition               = t.namedNode(`${skos}definition`);

export {
  vannPreferredNamespacePrefix,
  vannPreferredNamespaceUri,
  rdfsLabel,
  rdfType,
  dctermsTitle,
  rdfsComment,
  dctermsDescription,
  owlClass,
  owlObjectProperty,
  owlDatatypeProperty,
  rdfsClass,
  rdfProperty,
  rdfsDatatype,
  rdfsDomain,
  rdfsRange,
  rdfsSubPropertyOf,
  rdfsSubClassOf,
  skosDefinition,
};
