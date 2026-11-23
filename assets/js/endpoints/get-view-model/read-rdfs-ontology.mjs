import { 
  t, selectUserLiteral,
  rdf, rdfs, dcterms, skos,
} from "../../utils/rdf-utils.mjs";

const
rdfType            = t.namedNode(`${rdf}type`),
rdfsClass          = t.namedNode(`${rdfs}Class`),
rdfsSubClassOf     = t.namedNode(`${rdfs}subClassOf`),
rdfProperty        = t.namedNode(`${rdf}Property`),
rdfsSubPropertyOf  = t.namedNode(`${rdfs}subPropertyOf`),
rdfsDatatype       = t.namedNode(`${rdfs}Datatype`),
rdfsLabel          = t.namedNode(`${rdfs}label`),
dctermsTitle       = t.namedNode(`${dcterms}title`),
rdfsComment        = t.namedNode(`${rdfs}comment`),
dctermsDescription = t.namedNode(`${dcterms}description`),
skosDefinition     = t.namedNode(`${skos}definition`),
rdfsDomain         = t.namedNode(`${rdfs}domain`),
rdfsRange          = t.namedNode(`${rdfs}range`);


/**
 * Returns an ontology view model.
 * @param {Object} dataset
 * @param {{?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>}} meta
 * @throws {TypeError}
 * @returns {{ontologyType: string, ?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>, classes: {?label: string, iri: string, ?description: string}[], predicates: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[], datatypes: {?label: string, iri: string, ?description: string}[]}}
 * @async
 */
function readRdfsOntology(dataset, meta) {
  // console.debug(`rdfs ontology`);
  const
  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  classesDs = dataset.match(null, rdfType, rdfsClass),
  
  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  propertiesDs = dataset.match(null, rdfType, rdfProperty),
  
  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  subclassesDs = dataset.match(null, rdfsSubClassOf),
  
  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  subpropertiesDs = dataset.match(null, rdfsSubPropertyOf),

  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  datatypesDs = dataset.match(null, rdfType, rdfsDatatype),

  viewModel            = meta;
  viewModel.classes    = [];
  viewModel.predicates = [];
  viewModel.datatypes  = [];

  // merge subclassesDs with classesDs
  for (const quad of subclassesDs) {
    classesDs.add(
      t.quad(
        quad.subject, rdfType, rdfsClass // quad.graph?
      )
    );
  }

  // merge subpropertiesDs with propertiesDs
  for (const quad of subpropertiesDs) {
    propertiesDs.add(
      t.quad(
        quad.subject, rdfType, rdfProperty
      )
    );
  }
  
  // labels and descriptions
  const vms = [viewModel.classes, viewModel.predicates, viewModel.datatypes];
  [classesDs, propertiesDs, datatypesDs].forEach(
    ds => {
      const vm = vms.shift();
      for (const quad of ds) {
        const
        anIri       = quad.subject.value,
        label       = (
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
        vm.push({iri: anIri, label, description});
      }
    }
  );

  // predicates: domains and ranges
  for (const quad of propertiesDs) {
    const 
    iri = quad.subject.value,
    vm  = viewModel.predicates.find(e => e.iri === iri);

    vm.domain = [];
    vm.range  = [];

    for (const q of dataset.match(quad.subject, rdfsDomain)) {
      vm.domain.push(q.object.value);
    }

    for (const q of dataset.match(quad.subject, rdfsRange)) {
      vm.range.push(q.object.value);
    }
    
  }

  return viewModel;
}

export {readRdfsOntology};
