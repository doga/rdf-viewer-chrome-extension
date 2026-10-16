import { 
  t, selectUserLiteral,
  rdf, rdfs, dcterms, skos,
} from "../../utils/rdf-utils.mjs";

/**
 * Returns an ontology view model.
 * @param {Object} dataset
 * @param {{?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>}} meta
 * @throws {TypeError}
 * @returns {{ontologyType: string, ?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>, classes: {?label: string, iri: string, ?description: string}[], predicates: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[], datatypes: {?label: string, iri: string, ?description: string}[]}}
 * @async
 */
function readRdfsOntology(dataset, meta) {
  console.debug(`rdfs ontology`);
  const
  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  classesDs = dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${rdfs}Class`)),
  
  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  predicatesDs = dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${rdf}Property`)),

  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  datatypesDs = dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${rdfs}Datatype`)),

  viewModel            = meta;
  viewModel.classes    = [];
  viewModel.predicates = [];
  viewModel.datatypes  = [];
  
  // labels and descriptions
  const vms = [viewModel.classes, viewModel.predicates, viewModel.datatypes];
  [classesDs, predicatesDs, datatypesDs].forEach(
    ds => {
      const vm = vms.shift();
      for (const quad of ds) {
        const
        anIri       = quad.subject.value,
        label       = (
          selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${rdfs}label`)))?.value.trim() 
          ?? selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${dcterms}title`)))?.value.trim() 
          ?? ''
        ),
        description = (
          selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${rdfs}comment`)))?.value.trim() 
          ?? selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${dcterms}description`)))?.value.trim() 
          ?? selectUserLiteral(dataset.match(quad.subject, t.namedNode(`${skos}definition`)))?.value.trim() 
          ?? ''
        );
        vm.push({iri: anIri, label, description});
      }
    }
  );

  // predicates: domains and ranges
  for (const quad of predicatesDs) {
    const 
    iri = quad.subject.value,
    vm  = viewModel.predicates.find(e => e.iri === iri);

    vm.domain = [];
    vm.range  = [];

    for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}domain`))) {
      vm.domain.push(q.object.value);
    }

    for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}range`))) {
      vm.range.push(q.object.value);
    }
    
  }

  return viewModel;
}

export {readRdfsOntology};
