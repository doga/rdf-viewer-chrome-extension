import { iri } from "../../pulled-in/IRI/3.1.6/mod.mjs";
import { 
  t, selectUserLiteral,
  owl, rdfs, rdf, dcterms, skos,
} from "../../utils/rdf-utils.mjs";

/**
 * Returns an ontology view model.
 * @param {Object} dataset
 * @param {{?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>}} meta
 * @throws {TypeError}
 * @returns {{ontologyType: string, ?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>, classes: {?label: string, iri: string, ?description: string}[], objectProperties: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[], datatypeProperties: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[]}}
 * @async
 */
function readOwlOntology(dataset, meta) {
  // console.debug(`owl ontology`);
  const
  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  classesDs = dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${owl}Class`)),
  
  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  objectPropertiesDs = dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${owl}ObjectProperty`)),

  /** @see {@link https://rdf.js.org/dataset-spec/#dataset-interface | Dataset interface} */
  datatypePropertiesDs = dataset.match(null, t.namedNode(`${rdf}type`), t.namedNode(`${owl}DatatypeProperty`)),

  viewModel                    = meta;
  viewModel.classes            = [];
  viewModel.objectProperties   = [];
  viewModel.datatypeProperties = [];
  
  // labels and descriptions
  let vms = [viewModel.classes, viewModel.objectProperties, viewModel.datatypeProperties];
  [classesDs, objectPropertiesDs, datatypePropertiesDs].forEach(
    ds => {
      const vm = vms.shift();
      for (const quad of ds) {
        const
        anIri = quad.subject.value,
        label = (
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

        
        if (iri`${quad.object.value}`.equals(iri`${owl}Class`)) {
          vm.push({iri: anIri, label, description});
        } else { // property
          const domain = [], range  = [];
          
          for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}domain`))) {
            domain.push(q.object.value);
          }
          
          for (const q of dataset.match(quad.subject, t.namedNode(`${rdfs}range`))) {
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
