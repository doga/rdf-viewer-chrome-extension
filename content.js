
/**
 * The untouched initial document
 * @type {string}
 */
const rawText = document.body ? document.body.innerText : "";
// if (!rawText.trim()) return;

if (isRdf(document.contentType)) showRdf(document.body.innerText);


/**
 * The main function of the content script.
 * @param {string} rdf 
 * @async
 */
async function showRdf(rdf) {
  // validate args
  if(!isString(rdf))throw new TypeError('not a string');

  // have the service worker parse the RDF
  const 
  request = {
    endpoint: 'get view model for rdf',
    body    : {rdf},
  },
  response = await chrome.runtime.sendMessage(request);
  if (!ok(response))return;
  // console.debug(`response`, response);

  switch (response.body.documentType) {
    case 'ontology':
      switch (response.body.ontologyType) {
        case 'owl':
          // console.debug(`rendering owl`);
          showOwlOntology(response.body);
          break;
        case 'rdfs':
          // console.debug(`rendering rdfs`);
          showRdfsOntology(response.body);
          break;
        default:
            break;
      }
      break;
    case 'dataset':
      showNonOntologyDataset(response.body);
      break;
    default:
      break;
  }
}




// libraries //////////////////////////////////////////////////////

/**
 * 
 * @param {{documentType: string, prefixes: Object.<string, string>, statements: Object[]}} viewModel
 */
function showNonOntologyDataset(viewModel) {
  // console.debug(`non-ontology dataset`);
  emptyNonOntologyDatasetPage();
  const 
  foaf   = 'http://xmlns.com/foaf/0.1/',
  schema = 'https://schema.org/',
  rdfs   = 'http://www.w3.org/2000/01/rdf-schema#',
  qrmm   = 'https://vocab.qworum.net/qrmm.ttl#',
  ui     = {
    // title      : document.querySelector('.dataset-header > h1'),
    // description: document.querySelector('.dataset-header > p'),
    prefixes: {
      badge    : document.querySelector('.dataset-section:nth-child(2) .badge'),
      tableBody: document.querySelector('.dataset-section:nth-child(2) .prefix-table'),
    },
    statements: {
      badge    : document.querySelector('.dataset-section:nth-child(3) .badge'),
      tableBody: document.querySelector('.dataset-section:nth-child(3) .entity-table tbody'),
    },
  };
  // ui.title.innerText                    = viewModel.title ?? 'An RDF Ontology';
  // ui.description.innerText              = viewModel.description ?? '';
  ui.prefixes.badge.innerText   = Object.entries(viewModel.prefixes).length;
  ui.statements.badge.innerText = viewModel.statements.length;

  // display prefixes
  for (const [prefix, anIri] of Object.entries(viewModel.prefixes)) {
    // console.debug(prefix, '→', iri);
    // console.debug(ui.prefixes);
    const entry = document.createElement('tr');
    ui.prefixes.tableBody.append(entry);
    entry.innerHTML = `
      <td>
        <strong></strong>
      </td>
      <td class="entity-iri"></td>
    `;
    const 
    ui2 = {
      prefix: entry.querySelector('strong'),
      iri   : entry.querySelector('.entity-iri'),
    };
    ui2.prefix.innerText = prefix;
    ui2.iri.innerText    = anIri;
  }

  // display statements
  for (let index = 0; index < viewModel.statements.length; index++) {
    const statement = viewModel.statements[index];
    if ([`${qrmm}begin`, `${qrmm}end`].includes(statement.predicate.value))continue;
    // if(['Quad', 'Triple'].includes(statement.subject.termType))continue;

    const entry = document.createElement('tr');
    ui.statements.tableBody.append(entry);
    entry.innerHTML = `
      <td>
        <strong></strong><br /><span></span>
      </td>
    `;
    const statementUi = {
      prose: entry.querySelector('strong'),
      rdf  : entry.querySelector('span'),
    }

    // ignore predicates used in the dictionary in the background.
    if (![`${qrmm}prose`, `${foaf}name`, `${schema}name`, `${schema}givenName`, `${rdfs}label`].includes(statement.predicate.value)) {
      const prose = viewModel.prose[index];
      if(prose)statementUi.prose.innerText = prose;
    }
    renderStatement(statement, statementUi.rdf, viewModel.prefixes);
  }
}


function renderStatement(statement, parentUi, prefixes) {
    parentUi.innerHTML = `
      <span class="subject entity-iri"></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <span class="predicate entity-iri"></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <span class="object entity-iri"></span>
    `;

    const statementUi = {
      subject  : parentUi.querySelector('.subject'),
      predicate: parentUi.querySelector('.predicate'),
      object   : parentUi.querySelector('.object'),
    };

    if (statement.subject.termType === 'NamedNode') {
      statementUi.subject.innerText = prefixedIri(statement.subject.value, prefixes);
    } else if(['Quad', 'Triple'].includes(statement.subject.termType)) { // triple
      // recursive!
      statementUi.subject.classList.remove('entity-iri');
      statementUi.subject.innerHTML = `
        <span class='triple-term'>
        </span>
      `;
      renderStatement(statement.subject, statementUi.subject.querySelector('span'), prefixes);
    } else { // blank node
      statementUi.subject.innerText = `_:${statement.subject.value}`;
    }
    
    statementUi.predicate.innerText = prefixedIri(statement.predicate.value, prefixes);
    
    if (statement.object.termType === 'NamedNode') {
      statementUi.object.innerText = prefixedIri(statement.object.value, prefixes);
    } else if(statement.object.termType === 'BlankNode') {
      statementUi.object.innerText = `_:${statement.object.value}`;
    } else if(statement.object.termType === 'Literal') {
      statementUi.object.classList.remove('entity-iri');
      statementUi.object.innerText = statement.object.value;
    }
}


/**
 * Selects the language to display HTML templates with.
 * @param {string[]} l10nLangs the languages that are available for the HTML template.
 * @returns {string}
 */
function l10nLang(l10nLangs) {
  const
  userLang     = navigator.language.split('-')[0].toLowerCase(),
  userLangs    = navigator.languages.map(l => l.split('-')[0].toLowerCase()),
  selectedLang = l10nLangs.find(lang => lang === userLang) ?? userLangs.find(uLang => l10nLangs.find(lLang => lLang === uLang)) ?? l10nLangs[0];

  return selectedLang;
}



function emptyNonOntologyDatasetPage() {
  // console.debug(`page init`);
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    hide {display: none;}
    body.dataset-body {
      --bg: #f8fafc;
      --text: #0f172a;
      --surface: #ffffff;
      --border: #e2e8f0;
      --border-soft: #f1f5f9;
      --heading: #1e293b;
      --muted: #64748b;
      --accent: #0284c7;
      --accent-deep: #0369a1;
      --accent-bg: #f0f9ff;
      --accent-border: #bae6fd;
      --th-bg: #f1f5f9;
      --th-text: #475569;
      --badge-bg: #e0f2fe;
      --green-bg: #dcfce7;
      --green-text: #15803d;
      --btn-bg: #0f172a;
      --btn-bg-hover: #334155;
      --btn-text: #fff;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      --btn-shadow: 0 4px 12px rgba(0,0,0,0.15);

      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.6;
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      body.dataset-body {
        --bg: #0b1120;
        --text: #e2e8f0;
        --surface: #111a2e;
        --border: #1e293b;
        --border-soft: #1e293b;
        --heading: #f1f5f9;
        --muted: #94a3b8;
        --accent: #38bdf8;
        --accent-deep: #7dd3fc;
        --accent-bg: #0c2340;
        --accent-border: #0c4a6e;
        --th-bg: #1e293b;
        --th-text: #cbd5e1;
        --badge-bg: #082f49;
        --green-bg: #052e16;
        --green-text: #86efac;
        --btn-bg: #e2e8f0;
        --btn-bg-hover: #cbd5e1;
        --btn-text: #0f172a;
        --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.4);
        --btn-shadow: 0 4px 12px rgba(0,0,0,0.5);
      }
    }
    .dataset-container {
      max-width: 960px;
      margin: 0 auto;
      background: var(--surface);
      padding: 32px;
      border-radius: 12px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    .dataset-header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .dataset-header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      color: var(--accent);
    }
    .dataset-header p {
      margin: 0 0 12px 0;
      color: var(--muted);
      font-size: 15px;
    }
    .dataset-section {
      margin-bottom: 32px;
    }
    .dataset-section h2 {
      font-size: 20px;
      color: var(--heading);
      border-bottom: 1px solid var(--border-soft);
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .prefix-table, .entity-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 14px;
    }
    .prefix-table th, .prefix-table td,
    .entity-table th, .entity-table td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
    }
    .prefix-table th, .entity-table th {
      background-color: var(--th-bg);
      color: var(--th-text);
      font-weight: 600;
    }
    .entity-iri {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      color: var(--accent-deep);
      font-size: 13px;
    }
    .triple-term {
      &::before {
        content: '<< ';
      };
      &::after {
        content: ' >>'
      };
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 9999px;
      background-color: var(--badge-bg);
      color: var(--accent-deep);
      margin-left: 8px;
    }
    .toggle-raw-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--btn-bg);
      color: var(--btn-text);
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      box-shadow: var(--btn-shadow);
    }
    .toggle-raw-btn:hover {
      background: var(--btn-bg-hover);
    }  
  `;

  document.head.appendChild(styleTag);

  const
  /**
   * The localisation languages available for the HTML template. The first is the default.
   */
  l10nLangs = ['en', 'fr', 'de', 'tr'],

  /** 
   * Localised template strings.
   * @see {@link https://www.emse.fr/~zimmermann/W3C/glossaire.html | Glossaire français-anglais pour les concepts de RDF 1.1} 
   **/
  l10n = {
    title: {
      en: 'Dataset',
      fr: 'Jeu de données',
      de: 'Datensatz',
      tr: 'Veri kümesi',
    },
    prefixes: {
      en: 'Prefixes',
      fr: 'Préfixes',
      de: 'Präfixe',
      tr: 'Ön ekler',
    },
    prefix: {
      en: 'Prefix',
      fr: 'Préfixe',
      de: 'Präfix',
      tr: 'Ön ek',
    },
    namespaceIri: {
      en: 'Namespace IRI',
      fr: "IRI d'espace de noms",
      de: 'IRI des Namespaces',
      tr: "Ad alanının IRI'si",
    },
    statements: {
      en: 'Statements',
      fr: 'Affirmations',
      de: 'Erklärungen',
      tr: "Açıklamalar",
    },
    viewRaw: {
      en: 'View raw',
      fr: "Voir l'original",
      de: 'Ursprungliches Dokument sehen',
      tr: 'Orijinal belgeyi görüntüle',
    },
    viewHtml: {
      en: 'View as HTML document',
      fr: 'Voir le HTML dérivé',
      de: 'Abgeleitetes HTML sehen',
      tr: "Türetilmiş HTML'yi görüntüle",
    },
  },
  userLang  = navigator.language.split('-')[0].toLowerCase(),
  userLangs = navigator.languages.map(l => l.split('-')[0].toLowerCase()),
  // selectedLang = 'de';
  // selectedLang = 'fr';
  // selectedLang = `tr`;
  selectedLang = l10nLang( l10nLangs);
  // .find(lang => lang === userLang) ?? userLangs.find(uLang => l10nLangs.find(lLang => lLang === uLang)) ?? l10nLangs[0];

  document.body.className = 'dataset-body';
  document.body.innerHTML = `
    <div class="dataset-container">
      <div class="dataset-header">
        <h1>${l10n.title[selectedLang]}</h1>
        <p></p>
      </div>

      <!-- Prefixes Section -->
      <div class="dataset-section">
        <h2>${l10n.prefixes[selectedLang]} <span class="badge"></span></h2>
        <table class="prefix-table">
          <thead>
            <tr><th>${l10n.prefix[selectedLang]}</th><th>${l10n.namespaceIri[selectedLang]}</th></tr>
          </thead>
          <tbody>
          <!--
            <tr>
              <td>
                <strong></strong> <span class="badge-vann"></span>
              </td>
              <td class="entity-iri"></td>
            </tr>
          -->
          </tbody>
        </table>
      </div>

      <!-- Statements Section -->
      <div class="dataset-section">
        <h2>${l10n.statements[selectedLang]} <span class="badge"></span></h2>
        <table class="entity-table">
          <tbody>
            <!--
              <tr>
                <td>
                  <strong></strong><br/>
                  <span class="entity-iri"></span>
                </td>
                <td></td>
              </tr>
            -->
          </tbody>
        </table>
      </div>

    </div>

    <button class="toggle-raw-btn" id="toggleRawBtn">${l10n.viewRaw[selectedLang]}</button>
  `;

  let showingRaw = false;
  document.getElementById('toggleRawBtn').addEventListener('click', () => {
    showingRaw = !showingRaw;
    if (showingRaw) {
      document.body.innerHTML = `<pre style="white-space: pre-wrap; word-break: break-all; padding: 20px; font-family: monospace;">${rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre><button class="toggle-raw-btn" id="toggleRawBtn">${l10n.viewHtml[selectedLang]}</button>`;
      document.getElementById('toggleRawBtn').addEventListener('click', () => location.reload());
    }
  });
}


/**
 * 
 * @param {{ontologyType: string, ?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>, classes: {?label: string, iri: string, ?description: string}[], objectProperties: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[], datatypeProperties: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[]}} viewModel
 */
function showOwlOntology(viewModel) {
  emptyOwlOntologyPage();
  const 
  ui = {
    title      : document.querySelector('.ontology-header > h1'),
    description: document.querySelector('.ontology-header > p'),
    vann: {
      all:  document.querySelector('#vann'),
      prefix: document.querySelector('.vann-prefix'),
      iri   : document.querySelector('.vann-iri'),
    },
    prefixes: {
      badge    : document.querySelector('.ontology-section:nth-child(2) .badge'),
      tableBody: document.querySelector('.ontology-section:nth-child(2) .prefix-table'),
    },
    classes: {
      badge    : document.querySelector('.ontology-section:nth-child(3) .badge'),
      tableBody: document.querySelector('.ontology-section:nth-child(3) .entity-table tbody'),
    },
    objectProperties: {
      badge    : document.querySelector('.ontology-section:nth-child(4) .badge'),
      tableBody: document.querySelector('.ontology-section:nth-child(4) .entity-table tbody'),
    },
    datatypeProperties: {
      badge    : document.querySelector('.ontology-section:nth-child(5) .badge'),
      tableBody: document.querySelector('.ontology-section:nth-child(5) .entity-table tbody'),
    },
  };
  ui.vann.all.classList.remove('hide');
  ui.title.innerText                    = viewModel.title ?? 'An RDF Ontology';
  ui.description.innerText              = viewModel.description ?? '';
  ui.vann.prefix.innerText              = viewModel.vann.prefix;
  ui.vann.iri.innerText                 = viewModel.vann.iri;
  ui.prefixes.badge.innerText           = Object.entries(viewModel.prefixes).length;
  ui.classes.badge.innerText            = Object.entries(viewModel.classes).length;
  ui.objectProperties.badge.innerText   = Object.entries(viewModel.objectProperties).length;
  ui.datatypeProperties.badge.innerText = Object.entries(viewModel.datatypeProperties).length;

  // console.debug('ui', ui);

  // display prefixes
  for (const [prefix, anIri] of Object.entries(viewModel.prefixes)) {
    // console.debug(prefix, '→', iri);
    // console.debug(ui.prefixes);
    const entry = document.createElement('tr');
    ui.prefixes.tableBody.append(entry);
    entry.innerHTML = `
      <td>
        <strong></strong>
      </td>
      <td class="entity-iri"></td>
    `;
    const 
    ui2 = {
      prefix: entry.querySelector('strong'),
      iri   : entry.querySelector('.entity-iri'),
    };
    ui2.prefix.innerText = prefix;
    ui2.iri.innerText = anIri;
  }


  // display classes, predicates and datatypes
  const uis = [ui.classes, ui.objectProperties, ui.datatypeProperties];
  [viewModel.classes, viewModel.objectProperties, viewModel.datatypeProperties].forEach(
    definitions => {
      const currentUi = uis.shift();
      for (const def of definitions) {
        const entry = document.createElement('tr');
        currentUi.tableBody.append(entry);
        entry.innerHTML = `
          <td>
            <strong></strong><br/>
            <span class="entity-iri"></span>
          </td>
          <td></td>
        `;
        const 
        ui2 = {
          label      : entry.querySelector('strong'),
          iri        : entry.querySelector('.entity-iri'),
          description: entry.querySelector('td:nth-child(2)')
        };
        ui2.iri.innerText = prefixedIri(def.iri, viewModel.prefixes);
        if(def.label)ui2.label.innerText = def.label;

        if (def.description) {
          const descrP = document.createElement('p');
          descrP.innerText = def.description;
          ui2.description.append(descrP);
        }

        // predicate?
        if (def.domain && (def.domain.length > 0 || def.range.length > 0)) {
          // ui2.description.append(document.createElement('br'));

          // display domains
          if (def.domain.length > 0) {
            const 
            p = document.createElement('p'),
            title = document.createElement('em');
            title.innerText = 'Domain: ';
            p.append(title);

            for (const iri of def.domain) {
              const iriSpan = document.createElement('span');
              iriSpan.classList.add('entity-iri');
              iriSpan.innerText = prefixedIri(iri, viewModel.prefixes);
              p.append(iriSpan);
              p.append(document.createTextNode(' '));
            }
            ui2.description.append(p);
          }

          // display ranges
          if (def.range.length > 0) {
            const p = document.createElement('p');
            title = document.createElement('em');
            title.innerText = 'Range: ';
            p.append(title);

            for (const iri of def.range) {
              const iriSpan = document.createElement('span');
              iriSpan.classList.add('entity-iri');
              iriSpan.innerText = prefixedIri(iri, viewModel.prefixes);
              p.append(iriSpan);
              p.append(document.createTextNode(' '));
            }
            ui2.description.append(p);
          }
          
        }
      }
    }
  );
}

function emptyOwlOntologyPage() {
  // console.debug(`page init`);
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    hide {display: none;}
    body.ontology-body {
      --bg: #f8fafc;
      --text: #0f172a;
      --surface: #ffffff;
      --border: #e2e8f0;
      --border-soft: #f1f5f9;
      --heading: #1e293b;
      --muted: #64748b;
      --accent: #0284c7;
      --accent-deep: #0369a1;
      --accent-bg: #f0f9ff;
      --accent-border: #bae6fd;
      --th-bg: #f1f5f9;
      --th-text: #475569;
      --badge-bg: #e0f2fe;
      --green-bg: #dcfce7;
      --green-text: #15803d;
      --btn-bg: #0f172a;
      --btn-bg-hover: #334155;
      --btn-text: #fff;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      --btn-shadow: 0 4px 12px rgba(0,0,0,0.15);

      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.6;
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      body.ontology-body {
        --bg: #0b1120;
        --text: #e2e8f0;
        --surface: #111a2e;
        --border: #1e293b;
        --border-soft: #1e293b;
        --heading: #f1f5f9;
        --muted: #94a3b8;
        --accent: #38bdf8;
        --accent-deep: #7dd3fc;
        --accent-bg: #0c2340;
        --accent-border: #0c4a6e;
        --th-bg: #1e293b;
        --th-text: #cbd5e1;
        --badge-bg: #082f49;
        --green-bg: #052e16;
        --green-text: #86efac;
        --btn-bg: #e2e8f0;
        --btn-bg-hover: #cbd5e1;
        --btn-text: #0f172a;
        --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.4);
        --btn-shadow: 0 4px 12px rgba(0,0,0,0.5);
      }
    }

    .ontology-container {
      max-width: 960px;
      margin: 0 auto;
      background: var(--surface);
      padding: 32px;
      border-radius: 12px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    .ontology-header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .ontology-header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      color: var(--accent);
    }
    .ontology-header p {
      margin: 0 0 12px 0;
      color: var(--muted);
      font-size: 15px;
    }
    .vann-meta {
      display: inline-flex;
      gap: 16px;
      background-color: var(--accent-bg);
      border: 1px solid var(--accent-border);
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--accent-deep);
    }
    .ontology-section {
      margin-bottom: 32px;
    }
    .ontology-section h2 {
      font-size: 20px;
      color: var(--heading);
      border-bottom: 1px solid var(--border-soft);
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .prefix-table, .entity-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 14px;
    }
    .prefix-table th, .prefix-table td,
    .entity-table th, .entity-table td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
    }
    .prefix-table th, .entity-table th {
      background-color: var(--th-bg);
      color: var(--th-text);
      font-weight: 600;
    }
    .entity-iri {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      color: var(--accent-deep);
      font-size: 13px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 9999px;
      background-color: var(--badge-bg);
      color: var(--accent-deep);
      margin-left: 8px;
    }
    .badge-vann {
      background-color: var(--green-bg);
      color: var(--green-text);
      margin-left: 6px;
      padding: 1px 6px;
      font-size: 10px;
      text-transform: uppercase;
      // &::after {content: 'VANN'}
    }
    .toggle-raw-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--btn-bg);
      color: var(--btn-text);
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      box-shadow: var(--btn-shadow);
    }
    .toggle-raw-btn:hover {
      background: var(--btn-bg-hover);
    }  
  `;

  document.head.appendChild(styleTag);

  const
  /**
   * The localisation languages for the HTML template. The first is the default.
   */
  l10nLangs = ['en', 'fr', 'de', 'tr'],

  /** 
   * Localised template strings.
   * @see {@link https://www.emse.fr/~zimmermann/W3C/glossaire.html | Glossaire français-anglais pour les concepts de RDF 1.1} 
   **/
  l10n = {
    preferredPrefix: {
      en: 'Preferred prefix',
      fr: 'Préfixe préférée',
      de: 'Bevorzugtes Präfix',
      tr: 'Tercih edilen ön ek',
    },
    preferredNamespace: {
      en: 'Preferred namespace',
      fr: 'Espace de nom préféré',
      de: 'Bevorzugtes Namespace',
      tr: 'Tercih edilen ad alanı',
    },
    declaredPrefixes: {
      en: 'Prefixes',
      fr: 'Préfixes',
      de: 'Präfixe',
      tr: 'Ön ekler',
    },
    prefix: {
      en: 'Prefix',
      fr: 'Préfixe',
      de: 'Präfix',
      tr: 'Ön ek',
    },
    namespaceIri: {
      en: 'Namespace IRI',
      fr: "IRI d'espace de noms",
      de: 'IRI des Namespaces',
      tr: "Ad alanının IRI'si",
    },
    classes: {
      en: 'Classes',
      fr: 'Classes',
      de: 'Klassen',
      tr: 'Sınıflar',
    },
    classNameIri: {
      en: 'Class name / IRI',
      fr: 'Nom de classe / IRI',
      de: 'Klassenname / IRI',
      tr: 'Sınıf ismi / IRI',
    },
    description: {
      en: 'Description',
      fr: 'Description',
      de: 'Beschreibung',
      tr: 'Açıklama',
    },
    objectProperties: {
      en: 'Object properties',
      fr: 'Propriétés - objets',
      de: 'Objekt-Eigenschaften',
      tr: 'Obje yüklemleri',
    },
    objectPropertyIri: {
      en: 'Object property / IRI',
      fr: 'Propriété - objet / IRI',
      de: 'Objekt-Eigenschaft / IRI',
      tr: 'Obje yüklemi / IRI',
    },
    datatypeProperties: {
      en: 'Datatype properties',
      fr: 'Propriétés - types de données',
      de: 'Datenart-Eigenschaften',
      tr: 'Veri türü yüklemleri',
    },
    datatypePropertyIri: {
      en: 'Datatype / IRI',
      fr: 'Propriété - type de données / IRI',
      de: 'Datenart-Eigenschaft / IRI',
      tr: 'Veri türü yüklemi / IRI',
    },
    viewRaw: {
      en: 'View raw',
      fr: "Voir l'original",
      de: 'Ursprungliches Dokument sehen',
      tr: 'Orijinal belgeyi görüntüle',
    },
    viewHtml: {
      en: 'View as HTML document',
      fr: 'Voir le HTML dérivé',
      de: 'Abgeleitetes HTML sehen',
      tr: "Türetilmiş HTML'yi görüntüle",
    },
  },
  userLang  = navigator.language.split('-')[0].toLowerCase(),
  userLangs = navigator.languages.map(l => l.split('-')[0].toLowerCase()),
  // selectedLang = 'de';
  // selectedLang = 'fr';
  // selectedLang = `tr`;
  selectedLang = l10nLangs.find(lang => lang === userLang) ?? userLangs.find(uLang => l10nLangs.find(lLang => lLang === uLang)) ?? l10nLangs[0];

  document.body.className = 'ontology-body';
  document.body.innerHTML = `
    <div class="ontology-container">
      <div class="ontology-header">
        <h1></h1>
        <p></p>
        <div id='vann' class="vann-meta hide">
          <span><strong>${l10n.preferredPrefix[selectedLang]}</strong>: <code class='vann-prefix'></code></span>
          <span><strong>${l10n.preferredNamespace[selectedLang]}</strong>: <code class='vann-iri'></code></span>
        </div>
      </div>

      <!-- Prefixes Section -->
      <div class="ontology-section">
        <h2>${l10n.declaredPrefixes[selectedLang]} <span class="badge"></span></h2>
        <table class="prefix-table">
          <thead>
            <tr><th>${l10n.prefix[selectedLang]}</th><th>${l10n.namespaceIri[selectedLang]}</th></tr>
          </thead>
          <tbody>
          <!--
            <tr>
              <td>
                <strong></strong> <span class="badge-vann"></span>
              </td>
              <td class="entity-iri"></td>
            </tr>
          -->
          </tbody>
        </table>
      </div>

      <!-- Classes Section -->
      <div class="ontology-section">
        <h2>${l10n.classes[selectedLang]} <span class="badge"></span></h2>
        <table class="entity-table">
          <thead>
            <tr><th>${l10n.classNameIri[selectedLang]}</th><th>${l10n.description[selectedLang]}</th></tr>
          </thead>
          <tbody>
            <!--
              <tr>
                <td>
                  <strong></strong><br/>
                  <span class="entity-iri"></span>
                </td>
                <td></td>
              </tr>
            -->
          </tbody>
        </table>
      </div>

      <!-- Predicates Section -->
        <div class="ontology-section">
          <h2>${l10n.objectProperties[selectedLang]} <span class="badge"></span></h2>
          <table class="entity-table">
            <thead>
              <tr><th>${l10n.objectPropertyIri[selectedLang]}</th><th>${l10n.description[selectedLang]}</th></tr>
            </thead>
            <tbody>
              <!--
                <tr>
                  <td>
                    <strong></strong><br/>
                    <span class="entity-iri"></span>
                  </td>
                  <td></td>
                </tr>
              -->
            </tbody>
          </table>
        </div>

      <!-- Datatypes Section -->
        <div class="ontology-section">
          <h2>${l10n.datatypeProperties[selectedLang]} <span class="badge"></span></h2>
          <table class="entity-table">
            <thead>
              <tr><th>${l10n.datatypePropertyIri[selectedLang]}</th><th>Description</th></tr>
            </thead>
            <tbody>
              <!--
                <tr>
                  <td>
                    <strong></strong><br/>
                    <span class="entity-iri"></span>
                  </td>
                  <td></td>
                </tr>
              -->
            </tbody>
          </table>
        </div>
    </div>

    <button class="toggle-raw-btn" id="toggleRawBtn">${l10n.viewRaw[selectedLang]}</button>
  `;

  let showingRaw = false;
  document.getElementById('toggleRawBtn').addEventListener('click', () => {
    showingRaw = !showingRaw;
    if (showingRaw) {
      document.body.innerHTML = `<pre style="white-space: pre-wrap; word-break: break-all; padding: 20px; font-family: monospace;">${rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre><button class="toggle-raw-btn" id="toggleRawBtn">${l10n.viewHtml[selectedLang]}</button>`;
      document.getElementById('toggleRawBtn').addEventListener('click', () => location.reload());
    }
  });
}


/**
 * 
 * @param {{ontologyType: string, ?title: string, ?description: string, vann: {prefix: string, iri: string}, prefixes: Object.<string, string>, classes: {?label: string, iri: string, ?description: string}[], predicates: {?label: string, iri: string, ?description: string, domain: string[], range: string[]}[], datatypes: {?label: string, iri: string, ?description: string}[]}} viewModel
 */
function showRdfsOntology(viewModel) {
  emptyRdfsOntologyPage();
  const 
  ui = {
    title      : document.querySelector('.ontology-header > h1'),
    description: document.querySelector('.ontology-header > p'),
    vann: {
      all:  document.querySelector('#vann'),
      prefix: document.querySelector('.vann-prefix'),
      iri   : document.querySelector('.vann-iri'),
    },
    prefixes: {
      badge    : document.querySelector('.ontology-section:nth-child(2) .badge'),
      tableBody: document.querySelector('.ontology-section:nth-child(2) .prefix-table'),
    },
    classes: {
      badge    : document.querySelector('.ontology-section:nth-child(3) .badge'),
      tableBody: document.querySelector('.ontology-section:nth-child(3) .entity-table tbody'),
    },
    predicates: {
      badge    : document.querySelector('.ontology-section:nth-child(4) .badge'),
      tableBody: document.querySelector('.ontology-section:nth-child(4) .entity-table tbody'),
    },
    datatypes: {
      badge    : document.querySelector('.ontology-section:nth-child(5) .badge'),
      tableBody: document.querySelector('.ontology-section:nth-child(5) .entity-table tbody'),
    },
  };
  ui.vann.all.classList.remove('hide');
  ui.title.innerText            = viewModel.title ?? 'An RDF Ontology';
  ui.description.innerText      = viewModel.description ?? '';
  ui.vann.prefix.innerText      = viewModel.vann.prefix;
  ui.vann.iri.innerText         = viewModel.vann.iri;
  ui.prefixes.badge.innerText   = Object.entries(viewModel.prefixes).length;
  ui.classes.badge.innerText    = Object.entries(viewModel.classes).length;
  ui.predicates.badge.innerText = Object.entries(viewModel.predicates).length;
  ui.datatypes.badge.innerText  = Object.entries(viewModel.datatypes).length;

  // console.debug('ui', ui);

  // display prefixes
  for (const [prefix, anIri] of Object.entries(viewModel.prefixes)) {
    // console.debug(prefix, '→', iri);
    // console.debug(ui.prefixes);
    const entry = document.createElement('tr');
    ui.prefixes.tableBody.append(entry);
    entry.innerHTML = `
      <td>
        <strong></strong>
      </td>
      <td class="entity-iri"></td>
    `;
    const 
    ui2 = {
      prefix: entry.querySelector('strong'),
      iri   : entry.querySelector('.entity-iri'),
    };
    ui2.prefix.innerText = prefix;
    ui2.iri.innerText = anIri;
  }


  // display classes, predicates and datatypes
  const uis = [ui.classes, ui.predicates, ui.datatypes];
  [viewModel.classes, viewModel.predicates, viewModel.datatypes].forEach(
    definitions => {
      const currentUi = uis.shift();
      for (const def of definitions) {
        const entry = document.createElement('tr');
        currentUi.tableBody.append(entry);
        entry.innerHTML = `
          <td>
            <strong></strong><br/>
            <span class="entity-iri"></span>
          </td>
          <td></td>
        `;
        const 
        ui2 = {
          label      : entry.querySelector('strong'),
          iri        : entry.querySelector('.entity-iri'),
          description: entry.querySelector('td:nth-child(2)')
        };
        ui2.iri.innerText = prefixedIri(def.iri, viewModel.prefixes);
        if(def.label)ui2.label.innerText = def.label;

        if (def.description) {
          const descrP = document.createElement('p');
          descrP.innerText = def.description;
          ui2.description.append(descrP);
        }

        // predicate?
        if (def.domain && (def.domain.length > 0 || def.range.length > 0)) {
          // ui2.description.append(document.createElement('br'));

          // display domains
          if (def.domain.length > 0) {
            const 
            p = document.createElement('p'),
            title = document.createElement('em');
            title.innerText = 'Domain: ';
            p.append(title);

            for (const iri of def.domain) {
              const iriSpan = document.createElement('span');
              iriSpan.classList.add('entity-iri');
              iriSpan.innerText = prefixedIri(iri, viewModel.prefixes);
              p.append(iriSpan);
              p.append(document.createTextNode(' '));
            }
            ui2.description.append(p);
          }

          // display ranges
          if (def.range.length > 0) {
            const p = document.createElement('p');
            title = document.createElement('em');
            title.innerText = 'Range: ';
            p.append(title);

            for (const iri of def.range) {
              const iriSpan = document.createElement('span');
              iriSpan.classList.add('entity-iri');
              iriSpan.innerText = prefixedIri(iri, viewModel.prefixes);
              p.append(iriSpan);
              p.append(document.createTextNode(' '));
            }
            ui2.description.append(p);
          }
          
        }
      }
    }
  );
}

function emptyRdfsOntologyPage() {
  // console.debug(`page init`);
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    hide {display: none;}
    body.ontology-body {
      --bg: #f8fafc;
      --text: #0f172a;
      --surface: #ffffff;
      --border: #e2e8f0;
      --border-soft: #f1f5f9;
      --heading: #1e293b;
      --muted: #64748b;
      --accent: #0284c7;
      --accent-deep: #0369a1;
      --accent-bg: #f0f9ff;
      --accent-border: #bae6fd;
      --th-bg: #f1f5f9;
      --th-text: #475569;
      --badge-bg: #e0f2fe;
      --green-bg: #dcfce7;
      --green-text: #15803d;
      --btn-bg: #0f172a;
      --btn-bg-hover: #334155;
      --btn-text: #fff;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      --btn-shadow: 0 4px 12px rgba(0,0,0,0.15);

      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.6;
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      body.ontology-body {
        --bg: #0b1120;
        --text: #e2e8f0;
        --surface: #111a2e;
        --border: #1e293b;
        --border-soft: #1e293b;
        --heading: #f1f5f9;
        --muted: #94a3b8;
        --accent: #38bdf8;
        --accent-deep: #7dd3fc;
        --accent-bg: #0c2340;
        --accent-border: #0c4a6e;
        --th-bg: #1e293b;
        --th-text: #cbd5e1;
        --badge-bg: #082f49;
        --green-bg: #052e16;
        --green-text: #86efac;
        --btn-bg: #e2e8f0;
        --btn-bg-hover: #cbd5e1;
        --btn-text: #0f172a;
        --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.4);
        --btn-shadow: 0 4px 12px rgba(0,0,0,0.5);
      }
    }

    .ontology-container {
      max-width: 960px;
      margin: 0 auto;
      background: var(--surface);
      padding: 32px;
      border-radius: 12px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    .ontology-header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .ontology-header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      color: var(--accent);
    }
    .ontology-header p {
      margin: 0 0 12px 0;
      color: var(--muted);
      font-size: 15px;
    }
    .vann-meta {
      display: inline-flex;
      gap: 16px;
      background-color: var(--accent-bg);
      border: 1px solid var(--accent-border);
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--accent-deep);
    }
    .ontology-section {
      margin-bottom: 32px;
    }
    .ontology-section h2 {
      font-size: 20px;
      color: var(--heading);
      border-bottom: 1px solid var(--border-soft);
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .prefix-table, .entity-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 14px;
    }
    .prefix-table th, .prefix-table td,
    .entity-table th, .entity-table td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
    }
    .prefix-table th, .entity-table th {
      background-color: var(--th-bg);
      color: var(--th-text);
      font-weight: 600;
    }
    .entity-iri {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      color: var(--accent-deep);
      font-size: 13px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 9999px;
      background-color: var(--badge-bg);
      color: var(--accent-deep);
      margin-left: 8px;
    }
    .badge-vann {
      background-color: var(--green-bg);
      color: var(--green-text);
      margin-left: 6px;
      padding: 1px 6px;
      font-size: 10px;
      text-transform: uppercase;
      // &::after {content: 'VANN'}
    }
    .toggle-raw-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--btn-bg);
      color: var(--btn-text);
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      box-shadow: var(--btn-shadow);
    }
    .toggle-raw-btn:hover {
      background: var(--btn-bg-hover);
    }  
  `;

  document.head.appendChild(styleTag);

  const
  /**
   * The localisation languages for the HTML template. The first is the default.
   */
  l10nLangs = ['en', 'fr', 'de', 'tr'],

  /** 
   * Localised template strings.
   * @see {@link https://www.emse.fr/~zimmermann/W3C/glossaire.html | Glossaire français-anglais pour les concepts de RDF 1.1} 
   **/
  l10n = {
    preferredPrefix: {
      en: 'Preferred prefix',
      fr: 'Préfixe préférée',
      de: 'Bevorzugtes Präfix',
      tr: 'Tercih edilen ön ek',
    },
    preferredNamespace: {
      en: 'Preferred namespace',
      fr: 'Espace de nom préféré',
      de: 'Bevorzugtes Namespace',
      tr: 'Tercih edilen ad alanı',
    },
    declaredPrefixes: {
      en: 'Prefixes',
      fr: 'Préfixes',
      de: 'Präfixe',
      tr: 'Ön ekler',
    },
    prefix: {
      en: 'Prefix',
      fr: 'Préfixe',
      de: 'Präfix',
      tr: 'Ön ek',
    },
    namespaceIri: {
      en: 'Namespace IRI',
      fr: "IRI d'espace de noms",
      de: 'IRI des Namespaces',
      tr: "Ad alanının IRI'si",
    },
    classes: {
      en: 'Classes',
      fr: 'Classes',
      de: 'Klassen',
      tr: 'Sınıflar',
    },
    classNameIri: {
      en: 'Class name / IRI',
      fr: 'Nom de classe / IRI',
      de: 'Klassenname / IRI',
      tr: 'Sınıf ismi / IRI',
    },
    description: {
      en: 'Description',
      fr: 'Description',
      de: 'Beschreibung',
      tr: 'Açıklama',
    },
    predicates: {
      en: 'Predicates / Properties',
      fr: 'Prédicats / Propriétés',
      de: 'Eigenschaften / Relationen',
      tr: 'Yüklemler / Özellikler',
    },
    predicateIri: {
      en: 'Predicate / IRI',
      fr: 'Prédicat / IRI',
      de: 'Eigenschaft / IRI',
      tr: 'Veri türü',
    },
    datatypes: {
      en: 'Datatypes',
      fr: 'Types de données',
      de: 'Datenarten',
      tr: 'Veri türleri',
    },
    datatypeIri: {
      en: 'Datatype / IRI',
      fr: 'Type de données / IRI',
      de: 'Datenart / IRI',
      tr: 'Veri türü / IRI',
    },
    viewRaw: {
      en: 'View raw',
      fr: "Voir l'original",
      de: 'Ursprungliches Dokument sehen',
      tr: 'Orijinal belgeyi görüntüle',
    },
    viewHtml: {
      en: 'View as HTML document',
      fr: 'Voir le HTML dérivé',
      de: 'Abgeleitetes HTML sehen',
      tr: "Türetilmiş HTML'yi görüntüle",
    },
  },
  userLang  = navigator.language.split('-')[0].toLowerCase(),
  userLangs = navigator.languages.map(l => l.split('-')[0].toLowerCase()),
  // selectedLang = 'de';
  // selectedLang = 'fr';
  // selectedLang = `tr`;
  selectedLang = l10nLangs.find(lang => lang === userLang) ?? userLangs.find(uLang => l10nLangs.find(lLang => lLang === uLang)) ?? l10nLangs[0];

  document.body.className = 'ontology-body';
  document.body.innerHTML = `
    <div class="ontology-container">
      <div class="ontology-header">
        <h1></h1>
        <p></p>
        <div id='vann' class="vann-meta hide">
          <span><strong>${l10n.preferredPrefix[selectedLang]}</strong>: <code class='vann-prefix'></code></span>
          <span><strong>${l10n.preferredNamespace[selectedLang]}</strong>: <code class='vann-iri'></code></span>
        </div>
      </div>

      <!-- Prefixes Section -->
      <div class="ontology-section">
        <h2>${l10n.declaredPrefixes[selectedLang]} <span class="badge"></span></h2>
        <table class="prefix-table">
          <thead>
            <tr><th>${l10n.prefix[selectedLang]}</th><th>${l10n.namespaceIri[selectedLang]}</th></tr>
          </thead>
          <tbody>
          <!--
            <tr>
              <td>
                <strong></strong> <span class="badge-vann"></span>
              </td>
              <td class="entity-iri"></td>
            </tr>
          -->
          </tbody>
        </table>
      </div>

      <!-- Classes Section -->
      <div class="ontology-section">
        <h2>${l10n.classes[selectedLang]} <span class="badge"></span></h2>
        <table class="entity-table">
          <thead>
            <tr><th>${l10n.classNameIri[selectedLang]}</th><th>${l10n.description[selectedLang]}</th></tr>
          </thead>
          <tbody>
            <!--
              <tr>
                <td>
                  <strong></strong><br/>
                  <span class="entity-iri"></span>
                </td>
                <td></td>
              </tr>
            -->
          </tbody>
        </table>
      </div>

      <!-- Predicates Section -->
        <div class="ontology-section">
          <h2>${l10n.predicates[selectedLang]} <span class="badge"></span></h2>
          <table class="entity-table">
            <thead>
              <tr><th>${l10n.predicateIri[selectedLang]}</th><th>${l10n.description[selectedLang]}</th></tr>
            </thead>
            <tbody>
              <!--
                <tr>
                  <td>
                    <strong></strong><br/>
                    <span class="entity-iri"></span>
                  </td>
                  <td></td>
                </tr>
              -->
            </tbody>
          </table>
        </div>

      <!-- Datatypes Section -->
        <div class="ontology-section">
          <h2>${l10n.datatypes[selectedLang]} <span class="badge"></span></h2>
          <table class="entity-table">
            <thead>
              <tr><th>${l10n.datatypeIri[selectedLang]}</th><th>Description</th></tr>
            </thead>
            <tbody>
              <!--
                <tr>
                  <td>
                    <strong></strong><br/>
                    <span class="entity-iri"></span>
                  </td>
                  <td></td>
                </tr>
              -->
            </tbody>
          </table>
        </div>
    </div>

    <button class="toggle-raw-btn" id="toggleRawBtn">${l10n.viewRaw[selectedLang]}</button>
  `;

  let showingRaw = false;
  document.getElementById('toggleRawBtn').addEventListener('click', () => {
    showingRaw = !showingRaw;
    if (showingRaw) {
      document.body.innerHTML = `<pre style="white-space: pre-wrap; word-break: break-all; padding: 20px; font-family: monospace;">${rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre><button class="toggle-raw-btn" id="toggleRawBtn">${l10n.viewHtml[selectedLang]}</button>`;
      document.getElementById('toggleRawBtn').addEventListener('click', () => location.reload());
    }
  });
}

/**
 * Is the browser tab showing RDF?
 * @param {string} contentType 
 * @returns {boolean}
 * @throws {TypeError}
 */
function isRdf(contentType) {
  // validate args
  if(!isString(contentType))throw new TypeError('not a content type');

  return (
    ['text/turtle', 'application/trig', 'application/n-triples', 'application/n-quads'].find(
      rdfContentType => contentType?.includes(rdfContentType)
    ) ? true : false
  );
}


/**
 * 
 * @param {string} iri 
 * @param {Object.<string, string>} prefixes 
 * @return {string}
 */
function prefixedIri(iri, prefixes) {
  for (const [prefix, prefixIri] of Object.entries(prefixes)) {
    if (iri.startsWith(prefixIri)) {
      return `${prefix}:${iri.substring(prefixIri.length)}`;
    }
  }
  return iri;
}



/**
 * Is the response from the service worker OK?
 * @param {Object} response 
 * @returns {boolean}
 * @throws {TypeError}
 */
function ok(response) {
  // validate args
  if(!isPlainObject(response))throw new TypeError('not a js object');

  // console.debug(`status code`, response.status?.code);
  // console.debug(`response.status?.code === 200`, response.status?.code === 200);

  return response.status?.code === 200;
}


/**
 * Is the arg a string?
 * @param {*} val 
 * @returns {boolean}
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Is the arg a js object?
 * @param {*} val 
 * @returns {boolean}
 */
function isPlainObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]';
}

