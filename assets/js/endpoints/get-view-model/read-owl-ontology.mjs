import { iri } from "../../pulled-in/IRI/3.1.6/mod.mjs";
import { 
  t, selectUserLiteral,
  owl, rdfs, rdf, dcterms, skos,
} from "../../utils/rdf-utils.mjs";

const
rdfType             = t.namedNode(`${rdf}type`),
rdfsClass           = t.namedNode(`${rdfs}Class`),
rdfsSubClassOf      = t.namedNode(`${rdfs}subClassOf`),
rdfProperty         = t.namedNode(`${rdf}Property`),
rdfsSubPropertyOf   = t.namedNode(`${rdfs}subPropertyOf`),
rdfsDatatype        = t.namedNode(`${rdfs}Datatype`),
rdfsLabel           = t.namedNode(`${rdfs}label`),
dctermsTitle        = t.namedNode(`${dcterms}title`),
rdfsComment         = t.namedNode(`${rdfs}comment`),
dctermsDescription  = t.namedNode(`${dcterms}description`),
skosDefinition      = t.namedNode(`${skos}definition`),
rdfsDomain          = t.namedNode(`${rdfs}domain`),
rdfsRange           = t.namedNode(`${rdfs}range`),
owlClass            = t.namedNode(`${owl}Class`),
owlObjectProperty   = t.namedNode(`${owl}ObjectProperty`),
owlDatatypeProperty = t.namedNode(`${owl}DatatypeProperty`),

iriOwlClass = iri`${owl}Class`;


/**
 * Returns an ontology view model.
 * @param {Object} dataset
 * @param {{?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>}} meta
 * @throws {TypeError}
 * @returns {{ontologyType: string, ?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>, classes: {?label: string, iri: string, ?description: string}[], objectProperties: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[], datatypeProperties: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[]}}
 * @async
 */
function readOwlOntology(dataset, meta) {
  console.debug(`owl ontology`);
  const
  /** 
   * @type {Object} RDF dataset compliant with the rdf.js.org specification.
   * @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} 
   */
  classesDs            = dataset.match(null, rdfType, owlClass),
  objectPropertiesDs   = dataset.match(null, rdfType, owlObjectProperty),
  datatypePropertiesDs = dataset.match(null, rdfType, owlDatatypeProperty),
  datatypesDs          = dataset.match(null, rdfType, rdfsDatatype),
  subclassesDs         = dataset.match(null, rdfsSubClassOf),
  subpropertiesDs      = dataset.match(null, rdfsSubPropertyOf),
  viewModel            = meta;

  viewModel.classes            = [];
  viewModel.objectProperties   = [];
  viewModel.datatypeProperties = [];
  viewModel.datatypes          = [];

  // merge subclassesDs with classesDs
  for (const quad of subclassesDs) {
    classesDs.add(
      t.quad(
        quad.subject, rdfType, owlClass // quad.graph?
      )
    );
  }

  // for (const quad of datatypePropertiesDs) {
  //   console.debug(`datatype property`, quad.subject.value);
  // }

  // update objectPropertiesDs and datatypePropertiesDs to include subpropertiesDs terms
  let updated = true;
  let quadToRemove = null;
  while(updated){
    updated = false;
    quadToRemove = null;
    for (const quad of subpropertiesDs) {
      const {subject: subpropertyId, object: parentPropertyId} = quad;
      // console.debug(`\nsubproperty`, subpropertyId.value);
      // console.debug(`parent property`, parentPropertyId.value);

      // is subproperty an object property?
      if (objectPropertiesDs.has(t.quad(parentPropertyId, rdfType, owlObjectProperty))) {
        objectPropertiesDs.add(t.quad(subpropertyId, rdfType, owlObjectProperty));
        quadToRemove = quad;
        // console.debug(`✅ parent property is an object property`);
        break;
      } else {
        // console.debug(`parent property is not an object property`);
      }

      // is subproperty a datatype property?
      if (datatypePropertiesDs.has(t.quad(parentPropertyId, rdfType, owlDatatypeProperty))) {
        datatypePropertiesDs.add(t.quad(subpropertyId, rdfType, owlDatatypeProperty));
        quadToRemove = quad;
        // console.debug(`✅ parent property is a datatype property`);
        break;
      } else {
        // console.debug(`parent property is not a datatype property`);
      }

      // console.debug(`❌ parent property not found`);
    }
    if (quadToRemove) {
      subpropertiesDs.delete(quadToRemove);
      updated = true;
    }
  }

  // labels and descriptions
  let vms = [viewModel.classes, viewModel.objectProperties, viewModel.datatypeProperties, viewModel.datatypes];
  [classesDs, objectPropertiesDs, datatypePropertiesDs, datatypesDs].forEach(
    ds => {
      const vm = vms.shift();
      for (const quad of ds) {
        const
        anIri = quad.subject.value,
        label = (
          selectUserLiteral(dataset.match(quad.subject, rdfsLabel))?.value.trim() 
          ?? selectUserLiteral(dataset.match(quad.subject, dctermsTitle))?.value.trim() 
          ?? ''
        ),
        description = (
          selectUserLiteral(dataset.match(quad.subject, rdfsComment))?.value.trim() 
          ?? selectUserLiteral(dataset.match(quad.subject, dctermsDescription))?.value.trim() 
          ?? selectUserLiteral(dataset.match(quad.subject, skosDefinition))?.value.trim() 
          ?? ''
        );

        
        if (iriOwlClass.equals(iri`${quad.object.value}`)) {
          vm.push({iri: anIri, label, description});
        } else { // property
          const domain = [], range  = [];
          
          for (const q of dataset.match(quad.subject, rdfsDomain)) {
            domain.push(q.object.value);
          }
          
          for (const q of dataset.match(quad.subject, rdfsRange)) {
            range.push(q.object.value);
          }
          
          vm.push({iri: anIri, label, description, domain, range});
        }
      }
    }
  );

  return viewModel;
}

export {readOwlOntology};
