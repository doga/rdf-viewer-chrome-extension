/**
 * The untouched initial document
 * @type {string}
 */
const rawText = document.body ? document.body.innerText : "";
// if (!rawText.trim()) return;

if (isRdf(document.contentType)) showHumanReadableRdf(document.body.innerText);


/**
 * The main function of the content script.
 * @param {string} rdf 
 * @async
 */
async function showHumanReadableRdf(rdf) {
  // validate args
  if(!isString(rdf))throw new TypeError('not a string');

  // have the service worker parse the RDF
  const 
  request = {
    endpoint: 'get view model for rdf',
    body    : {rdf},
  },
  response = await chrome.runtime.sendMessage(request);

  // console.debug(`response`, response);
  if (!ok(response))return;
  if (response.body.documentType !== 'ontology')return;

  // make ontology human-readable
  showHumanReadableOntology(response.body);
}




// libraries //////////////////////////////////////////////////////

function showHumanReadableOntology(viewModel) {
  emptyOntologyPage();
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
  ui.description.innerText      = viewModel.description ?? 'No description';
  ui.vann.prefix.innerText      = viewModel.vann.prefix;
  ui.vann.iri.innerText         = viewModel.vann.iri;
  ui.prefixes.badge.innerText   = Object.entries(viewModel.prefixes).length;
  ui.classes.badge.innerText    = Object.entries(viewModel.classes).length;
  ui.predicates.badge.innerText = Object.entries(viewModel.predicates).length;
  ui.datatypes.badge.innerText  = Object.entries(viewModel.datatypes).length;

  // console.debug('ui', ui);

  // display prefixes
  for (const [prefix, iri] of Object.entries(viewModel.prefixes)) {
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
    ui2.iri.innerText = iri;
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


function emptyOntologyPage() {
  // console.debug(`page init`);
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    hide {display: none;}
    body.ontology-body {
      background-color: #f8fafc;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .ontology-container {
      max-width: 960px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .ontology-header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .ontology-header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      color: #0284c7;
    }
    .ontology-header p {
      margin: 0 0 12px 0;
      color: #64748b;
      font-size: 15px;
    }
    .vann-meta {
      display: inline-flex;
      gap: 16px;
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      color: #0369a1;
    }
    .ontology-section {
      margin-bottom: 32px;
    }
    .ontology-section h2 {
      font-size: 20px;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
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
      border-bottom: 1px solid #e2e8f0;
    }
    .prefix-table th, .entity-table th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 600;
    }
    .entity-iri {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      color: #0369a1;
      font-size: 13px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 9999px;
      background-color: #e0f2fe;
      color: #0369a1;
      margin-left: 8px;
    }
    .badge-vann {
      background-color: #dcfce7;
      color: #15803d;
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
      background: #0f172a;
      color: #fff;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .toggle-raw-btn:hover {
      background: #334155;
    }
  `;
  document.head.appendChild(styleTag);

  document.body.className = "ontology-body";
  document.body.innerHTML = `
    <div class="ontology-container">
      <div class="ontology-header">
        <h1></h1>
        <p></p>
        <div id='vann' class="vann-meta hide">
          <span><strong>Preferred Prefix:</strong> <code class='vann-prefix'></code></span>
          <span><strong>Preferred Namespace:</strong> <code class='vann-iri'></code></span>
        </div>
      </div>

      <!-- Prefixes Section -->
      <div class="ontology-section">
        <h2>Declared <!-- & Inferred --> Prefixes <span class="badge"></span></h2>
        <table class="prefix-table">
          <thead>
            <tr><th>Prefix</th><th>Namespace IRI</th></tr>
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
        <h2>Classes <span class="badge"></span></h2>
        <table class="entity-table">
          <thead>
            <tr><th>Class Name / IRI</th><th>Description</th></tr>
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
          <h2>Predicates / Properties <span class="badge"></span></h2>
          <table class="entity-table">
            <thead>
              <tr><th>Predicate / IRI</th><th>Description</th></tr>
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
          <h2>Datatypes <span class="badge"></span></h2>
          <table class="entity-table">
            <thead>
              <tr><th>Datatype / IRI</th><th>Description</th></tr>
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

    <button class="toggle-raw-btn" id="toggleRawBtn">View raw</button>
  `;

  let showingRaw = false;
  document.getElementById('toggleRawBtn').addEventListener('click', () => {
    showingRaw = !showingRaw;
    if (showingRaw) {
      document.body.innerHTML = `<pre style="white-space: pre-wrap; word-break: break-all; padding: 20px; font-family: monospace;">${rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre><button class="toggle-raw-btn" id="toggleRawBtn">View as HTML document</button>`;
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

