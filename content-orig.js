(function () {
  if (window.hasTurtleOntologyViewerRun) return;
  window.hasTurtleOntologyViewerRun = true;

  // -------------------------------------------------------------
  // 1. Detection
  // -------------------------------------------------------------
  function isTurtleDocument() {
    const url = window.location.href.toLowerCase();
    if (url.endsWith('.ttl') || url.endsWith('.turtle')) return true;
    if (document.contentType && document.contentType.includes('text/turtle')) return true;

    const textContent = document.body ? document.body.innerText.trim() : "";
    if (textContent.length > 0) {
      const turtleRegex = /^\s*(@prefix|PREFIX|@base|BASE)\s+[\w\-]*:/i;
      if (turtleRegex.test(textContent)) return true;
    }
    return false;
  }

  if (!isTurtleDocument()) return;

  const rawText = document.body ? document.body.innerText : "";
  if (!rawText.trim()) return;

  // -------------------------------------------------------------
  // 2. Turtle & Ontology Parser
  // -------------------------------------------------------------
  function parseTurtleOntology(text) {
    const prefixes = {};
    const classes = [];
    const predicates = [];
    const datatypes = [];
    let ontologyTitle = "";
    let ontologyComment = "";

    let vannPrefix = "";
    let vannUri = "";

    // Normalize whitespace & remove full-line comments
    const cleanText = text.replace(/#.*$/gm, '').replace(/\s+/g, ' ');

    // Standard @prefix / PREFIX extraction
    const prefixRegex = /(?:@prefix|PREFIX)\s+([a-zA-Z0-9_\-]*):\s*<([^>]+)>/gi;
    let match;
    while ((match = prefixRegex.exec(cleanText)) !== null) {
      const prefixKey = match[1] || '(default)';
      prefixes[prefixKey] = match[2];
    }

    function formatIri(iriStr) {
      if (!iriStr) return '';
      iriStr = iriStr.trim();
      if (iriStr.startsWith('<') && iriStr.endsWith('>')) {
        return iriStr.slice(1, -1);
      }
      return iriStr;
    }

    // Extracts literal values enclosed in single or double quotes
    function extractLiteral(text, predicate) {
      const regex = new RegExp(`${predicate}\\s+("([^"]+)"|'([^']+)')`, 'i');
      const m = text.match(regex);
      return m ? (m[2] || m[3]) : '';
    }

    function extractIriObject(text, predicate) {
      const regex = new RegExp(`${predicate}\\s+(<[^>]+>|\\S+)`, 'i');
      const m = text.match(regex);
      return m ? formatIri(m[1]) : '';
    }

    // Split statement blocks by '.'
    const statements = cleanText.split(/\.\s+/);

    statements.forEach(stmt => {
      stmt = stmt.trim();
      if (!stmt) return;

      const firstSpace = stmt.indexOf(' ');
      if (firstSpace === -1) return;

      const subject = formatIri(stmt.substring(0, firstSpace).trim());
      const body = stmt.substring(firstSpace).trim();

      if (!subject || subject.startsWith('@') || subject.toUpperCase().startsWith('PREFIX')) return;

      const isClass = /\b(a|rdf:type)\s+(owl:Class|rdfs:Class)\b/.test(body);
      const isPredicate = /\b(a|rdf:type)\s+(rdf:Property|owl:ObjectProperty|owl:DatatypeProperty|owl:AnnotationProperty)\b/.test(body);
      const isDatatype = /\b(a|rdf:type)\s+(rdfs:Datatype|owl:DataRange)\b/.test(body);
      const isOntology = /\b(a|rdf:type)\s+owl:Ontology\b/.test(body);

      // Extract labels
      const label = extractLiteral(body, 'rdfs:label');

      // Check VANN preferred namespace declarations
      const prefPrefix = extractLiteral(body, 'vann:preferredNamespacePrefix');
      const prefUriLiteral = extractLiteral(body, 'vann:preferredNamespaceUri');
      const prefUriIri = extractIriObject(body, 'vann:preferredNamespaceUri');

      if (prefPrefix) vannPrefix = prefPrefix;
      if (prefUriLiteral || prefUriIri) vannUri = prefUriLiteral || prefUriIri;

      if (isOntology) {
        if (label) ontologyTitle = label;
        const comment = extractLiteral(body, 'rdfs:comment') || extractLiteral(body, 'dc:description') || extractLiteral(body, 'dcterms:description');
        if (comment) ontologyComment = comment;
      } else if (isPredicate) {
        // Explicitly read predicate descriptions solely from rdfs:comment
        const rdfsComment = extractLiteral(body, 'rdfs:comment');
        predicates.push({
          uri: subject,
          label: label || subject,
          comment: rdfsComment
        });
      } else if (isClass) {
        const comment = extractLiteral(body, 'rdfs:comment') || extractLiteral(body, 'dc:description') || extractLiteral(body, 'dcterms:description');
        classes.push({
          uri: subject,
          label: label || subject,
          comment: comment
        });
      } else if (isDatatype) {
        const comment = extractLiteral(body, 'rdfs:comment') || extractLiteral(body, 'dc:description') || extractLiteral(body, 'dcterms:description');
        datatypes.push({
          uri: subject,
          label: label || subject,
          comment: comment
        });
      }
    });

    if (vannPrefix && vannUri) {
      prefixes[vannPrefix] = vannUri;
    } else if (vannPrefix && !prefixes[vannPrefix]) {
      prefixes[vannPrefix] = "(Inferred from vann:preferredNamespacePrefix)";
    }

    return { prefixes, classes, predicates, datatypes, ontologyTitle, ontologyComment, vannPrefix, vannUri };
  }

  // -------------------------------------------------------------
  // 3. HTML Renderer
  // -------------------------------------------------------------
  const data = parseTurtleOntology(rawText);

  const totalEntities = data.classes.length + data.predicates.length + data.datatypes.length;
  if (totalEntities === 0 && Object.keys(data.prefixes).length === 0) {
    return;
  }

  const styleTag = document.createElement('style');
  styleTag.textContent = `
    body.turtle-ontology-body {
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
    .entity-uri {
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

  document.body.className = "turtle-ontology-body";
  document.body.innerHTML = `
    <div class="ontology-container">
      <div class="ontology-header">
        <h1>${data.ontologyTitle || 'RDF/Turtle Ontology Specification'}</h1>
        <p>${data.ontologyComment || 'Generated web preview for Turtle document.'}</p>
        ${(data.vannPrefix || data.vannUri) ? `
          <div class="vann-meta">
            ${data.vannPrefix ? `<span><strong>Preferred Prefix:</strong> <code>${data.vannPrefix}</code></span>` : ''}
            ${data.vannUri ? `<span><strong>Preferred Namespace:</strong> <code>${data.vannUri}</code></span>` : ''}
          </div>
        ` : ''}
      </div>

      <!-- Prefixes Section -->
      <div class="ontology-section">
        <h2>Declared & Inferred Prefixes <span class="badge">${Object.keys(data.prefixes).length}</span></h2>
        <table class="prefix-table">
          <thead>
            <tr><th>Prefix</th><th>Namespace IRI</th></tr>
          </thead>
          <tbody>
            ${Object.entries(data.prefixes).map(([prefix, namespace]) => `
              <tr>
                <td>
                  <strong>${prefix}</strong>${prefix === data.vannPrefix ? '<span class="badge-vann" title="Inferred via vann:preferredNamespacePrefix">VANN</span>' : ''}
                </td>
                <td class="entity-uri">${namespace}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Classes Section -->
      ${data.classes.length > 0 ? `
        <div class="ontology-section">
          <h2>Classes <span class="badge">${data.classes.length}</span></h2>
          <table class="entity-table">
            <thead>
              <tr><th>Class Name / IRI</th><th>Description</th></tr>
            </thead>
            <tbody>
              ${data.classes.map(c => `
                <tr>
                  <td>
                    <strong>${c.label}</strong><br/>
                    <span class="entity-uri">${c.uri}</span>
                  </td>
                  <td>${c.comment || '<em>No description provided.</em>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Predicates Section -->
      ${data.predicates.length > 0 ? `
        <div class="ontology-section">
          <h2>Predicates / Properties <span class="badge">${data.predicates.length}</span></h2>
          <table class="entity-table">
            <thead>
              <tr><th>Predicate / IRI</th><th>Description (rdfs:comment)</th></tr>
            </thead>
            <tbody>
              ${data.predicates.map(p => `
                <tr>
                  <td>
                    <strong>${p.label}</strong><br/>
                    <span class="entity-uri">${p.uri}</span>
                  </td>
                  <td>${p.comment || '<em>No rdfs:comment provided.</em>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Datatypes Section -->
      ${data.datatypes.length > 0 ? `
        <div class="ontology-section">
          <h2>Datatypes <span class="badge">${data.datatypes.length}</span></h2>
          <table class="entity-table">
            <thead>
              <tr><th>Datatype / IRI</th><th>Description</th></tr>
            </thead>
            <tbody>
              ${data.datatypes.map(d => `
                <tr>
                  <td>
                    <strong>${d.label}</strong><br/>
                    <span class="entity-uri">${d.uri}</span>
                  </td>
                  <td>${d.comment || '<em>No description provided.</em>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>

    <button class="toggle-raw-btn" id="toggleRawBtn">View Raw Turtle</button>
  `;

  let showingRaw = false;
  document.getElementById('toggleRawBtn').addEventListener('click', () => {
    showingRaw = !showingRaw;
    if (showingRaw) {
      document.body.innerHTML = `<pre style="white-space: pre-wrap; word-break: break-all; padding: 20px; font-family: monospace;">${rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre><button class="toggle-raw-btn" id="toggleRawBtn">View Rendered Ontology</button>`;
      document.getElementById('toggleRawBtn').addEventListener('click', () => location.reload());
    }
  });
})();
