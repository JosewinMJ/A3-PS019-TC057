// PrivacyLens Interactive Application Logic
const state = {
  currentTab: 'dashboard',
  dashboardData: null,
  datasets: [],
  inventory: [],
  metadata: [],
  gapsReport: null,
  evalHistory: [],
  selectedScanDatasetId: null,
  rulesConfig: null,
  inspectRecord: null,
  reviewRecord: null
};

// Icons (SVG strings)
const icons = {
  dashboard: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
  datasources: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  scandata: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><polyline points="8 11 10 13 14 9"/></svg>`,
  inventory: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>`,
  purposeretention: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  evidencegaps: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  evaluation: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  reviewcenter: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>`
};

// Badges
function renderClassBadge(cls) {
  const map = {
    person_name: ['badge-name', 'Person Name'],
    email_address: ['badge-email', 'Email Address'],
    phone_number: ['badge-phone', 'Phone Number'],
    government_id: ['badge-govid', 'Gov ID (Aadhaar/PAN)'],
    date_of_birth: ['badge-dob', 'Date of Birth'],
    non_personal: ['badge-rejected', 'Non-Personal']
  };
  const [clsStyle, label] = map[cls] || ['badge-pending', cls];
  return `<span class="badge ${clsStyle}">${label}</span>`;
}

function renderMetaBadge(status) {
  const map = {
    'Complete metadata': ['badge-complete', 'Complete'],
    'Missing purpose': ['badge-missing-p', 'Missing Purpose'],
    'Missing retention': ['badge-missing-r', 'Missing Retention'],
    'Missing both': ['badge-missing-b', 'Missing Both'],
    'Ambiguous metadata match': ['badge-ambiguous', 'Ambiguous Match']
  };
  const [clsStyle, label] = map[status] || ['badge-pending', status];
  return `<span class="badge ${clsStyle}">${label}</span>`;
}

function renderReviewBadge(status) {
  const map = {
    CONFIRMED: ['badge-confirmed', 'Confirmed PII'],
    REJECTED: ['badge-rejected', 'Rejected'],
    PENDING: ['badge-pending', 'Pending Review']
  };
  const [clsStyle, label] = map[status] || ['badge-pending', status];
  return `<span class="badge ${clsStyle}">${label}</span>`;
}

function renderConfidenceBar(score) {
  const pct = Math.round(score * 100);
  const color = pct >= 85 ? '#10b981' : pct >= 70 ? '#0284c7' : '#f59e0b';
  return `
    <div style="display:flex; align-items:center; gap:8px;">
      <div style="width:50px; background:#e2e8f0; height:6px; border-radius:3px; overflow:hidden;">
        <div style="width:${pct}%; height:100%; background:${color};"></div>
      </div>
      <span style="font-size:11px; font-family:monospace; font-weight:700;">${pct}%</span>
    </div>
  `;
}

// Navigation Handler
function navigateTo(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  renderActiveView();
}

// Main View Dispatcher
async function renderActiveView() {
  const container = document.getElementById('view-container');
  const headerTitle = document.getElementById('header-title');
  const headerSub = document.getElementById('header-sub');

  const titles = {
    dashboard: ['Dashboard Overview', 'Real-time telemetry and privacy evidence posture'],
    datasources: ['Data Sources Management', 'Upload CSV files, SQLite databases, and inspect schemas'],
    scandata: ['Personal-Data Scanner', 'Execute multi-signal discovery across schemas and sampled data values'],
    inventory: ['Privacy Evidence Inventory', 'Searchable catalog linking detected candidate fields to declared metadata'],
    purposeretention: ['Purpose & Retention Register', 'Declared business purposes and retention periods register'],
    evidencegaps: ['Technical Evidence Gaps', 'Missing metadata, unreviewed detections, and technical limitations'],
    evaluation: ['Evaluation & Benchmark Metrics', 'Transparent precision, recall, and F1 calculations from labelled synthetic test set'],
    reviewcenter: ['Human Review & Triage Center', 'Human-in-the-loop decision center to confirm or reject candidate detections'],
    settings: ['Configurable Rules & Settings', 'Inspect and customize YAML regex patterns and scoring weights']
  };

  headerTitle.textContent = titles[state.currentTab][0];
  headerSub.textContent = titles[state.currentTab][1];
  container.innerHTML = `<div style="padding:40px; text-align:center; color:#64748b;">Loading ${titles[state.currentTab][0]}...</div>`;

  try {
    if (state.currentTab === 'dashboard') await renderDashboard(container);
    else if (state.currentTab === 'datasources') await renderDataSources(container);
    else if (state.currentTab === 'scandata') await renderScan(container);
    else if (state.currentTab === 'inventory') await renderInventory(container);
    else if (state.currentTab === 'purposeretention') await renderMetadata(container);
    else if (state.currentTab === 'evidencegaps') await renderGaps(container);
    else if (state.currentTab === 'evaluation') await renderEvaluation(container);
    else if (state.currentTab === 'reviewcenter') await renderReviewCenter(container);
    else if (state.currentTab === 'settings') await renderSettings(container);
  } catch (err) {
    container.innerHTML = `<div class="card" style="border-color:#fecaca; background:#fef2f2; color:#991b1b; padding:20px;">
      <strong>Error loading view:</strong> ${err.message}
    </div>`;
  }
}

// 1. Dashboard View
async function renderDashboard(container) {
  const res = await fetch('/api/dashboard');
  const data = await res.json();
  state.dashboardData = data;

  const classColors = {
    person_name: '#6366f1',
    email_address: '#0ea5e9',
    phone_number: '#10b981',
    government_id: '#a855f7',
    date_of_birth: '#f59e0b'
  };

  const classLabels = {
    person_name: 'Person Name',
    email_address: 'Email Address',
    phone_number: 'Phone Number',
    government_id: 'Gov ID',
    date_of_birth: 'Date of Birth'
  };

  const maxVal = Math.max(...Object.values(data.class_counts), 1);

  container.innerHTML = `
    <!-- Top Welcome Banner -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border-radius:16px; padding:24px; color:white; margin-bottom:24px; box-shadow:0 10px 25px -5px rgba(15,23,42,0.3); display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span style="font-size:11px; font-weight:700; background:rgba(14,165,233,0.2); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); padding:2px 8px; border-radius:12px;">AIORI HACKATHON 3 • PS-019</span>
        <h2 style="font-size:20px; font-weight:800; margin-top:8px;">PrivacyLens Personal-Data Discovery & Evidence Inventory</h2>
        <p style="font-size:12px; color:#cbd5e1; max-width:650px; margin-top:4px;">Multi-signal evidence detection across CSVs and SQLite databases. Links candidate fields to declared purposes and retention periods for auditable human review.</p>
      </div>
      <div style="display:flex; gap:10px;">
        <button onclick="navigateTo('scandata')" class="btn btn-primary" style="padding:10px 18px;">${icons.scandata} Launch Scanner</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Datasets</div>
        <div class="kpi-val">${data.total_datasets}</div>
        <div style="font-size:11px; color:#64748b; margin-top:4px;">In repository</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Tables Inspected</div>
        <div class="kpi-val">${data.total_tables}</div>
        <div style="font-size:11px; color:#64748b; margin-top:4px;">Across all sources</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label" style="color:#0284c7;">Candidate PII</div>
        <div class="kpi-val" style="color:#0284c7;">${data.total_candidates}</div>
        <div style="font-size:11px; color:#64748b; margin-top:4px;">Discovered fields</div>
      </div>
      <div class="kpi-card" style="background:#fffbeb; border-color:#fde68a;">
        <div class="kpi-label" style="color:#b45309;">Missing Purpose</div>
        <div class="kpi-val" style="color:#b45309;">${data.missing_purpose}</div>
        <div style="font-size:11px; color:#b45309; margin-top:4px;">Needs declared use</div>
      </div>
      <div class="kpi-card" style="background:#fff7ed; border-color:#fed7aa;">
        <div class="kpi-label" style="color:#c2410c;">Missing Retention</div>
        <div class="kpi-val" style="color:#c2410c;">${data.missing_retention}</div>
        <div style="font-size:11px; color:#c2410c; margin-top:4px;">Indefinite storage</div>
      </div>
      <div class="kpi-card" style="background:#fef2f2; border-color:#fecaca;">
        <div class="kpi-label" style="color:#b91c1c;">Missing Both</div>
        <div class="kpi-val" style="color:#b91c1c;">${data.missing_both}</div>
        <div style="font-size:11px; color:#b91c1c; margin-top:4px;">Critical gap</div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; margin-bottom:24px;">
      <div class="card" style="margin-bottom:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h3 style="font-size:15px; font-weight:700;">Personal Data Class Distribution</h3>
            <p style="font-size:11px; color:#64748b;">Candidate fields discovered across the five required data classes</p>
          </div>
          <button onclick="navigateTo('inventory')" class="btn btn-secondary" style="font-size:11px;">View Inventory &rarr;</button>
        </div>

        <div style="height:200px; display:flex; align-items:flex-end; gap:16px; padding-bottom:8px; border-bottom:1px solid #e2e8f0;">
          ${Object.entries(data.class_counts).map(([k, count]) => {
            const h = Math.max((count / maxVal) * 160, count > 0 ? 16 : 4);
            const color = classColors[k] || '#94a3b8';
            return `
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
                <span style="font-size:11px; font-family:monospace; font-weight:700; color:#334155;">${count}</span>
                <div style="width:100%; max-width:44px; height:${h}px; background:${color}; border-radius:6px 6px 0 0;" title="${classLabels[k]}: ${count}"></div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display:flex; gap:16px; margin-top:8px;">
          ${Object.entries(data.class_counts).map(([k]) => `
            <div style="flex:1; text-align:center; font-size:10px; font-weight:600; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${classLabels[k]}">
              ${classLabels[k]}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card" style="margin-bottom:0;">
        <h3 style="font-size:15px; font-weight:700;">Confidence Distribution</h3>
        <p style="font-size:11px; color:#64748b; margin-bottom:20px;">Score spectrum from multi-signal engine</p>
        
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${Object.entries(data.confidence_distribution).map(([k, val]) => {
            const pct = data.total_candidates > 0 ? Math.round((val / data.total_candidates) * 100) : 0;
            const barCol = k.includes('Very') ? '#10b981' : k.includes('High') ? '#0284c7' : '#f59e0b';
            return `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                  <span style="font-weight:600; color:#334155;">${k}</span>
                  <span style="font-family:monospace; font-weight:700;">${val} (${pct}%)</span>
                </div>
                <div style="width:100%; height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden;">
                  <div style="width:${pct}%; height:100%; background:${barCol}; border-radius:4px;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:24px; padding:10px; background:#f8fafc; border-radius:8px; font-size:10px; color:#64748b; text-align:center;">
          Multi-signal weights: 40% Column, 45% Regex Ratio, 15% Domain Format
        </div>
      </div>
    </div>

    <!-- Recent Scans Table -->
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div>
          <h3 style="font-size:15px; font-weight:700;">Recent Scan Jobs</h3>
          <p style="font-size:11px; color:#64748b;">Auditable log of personal data discovery jobs</p>
        </div>
        <button onclick="navigateTo('scandata')" class="btn btn-secondary" style="font-size:11px;">New Scan &rarr;</button>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Dataset</th>
              <th>Type</th>
              <th>Status</th>
              <th>Columns</th>
              <th>Candidates Found</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            ${data.recent_scans && data.recent_scans.length > 0 ? data.recent_scans.map(s => `
              <tr>
                <td style="font-weight:700; color:#0f172a;">${s.dataset_name}</td>
                <td style="font-family:monospace; text-transform:uppercase; font-size:10px;">${s.source_type}</td>
                <td><span class="badge badge-confirmed">${s.status}</span></td>
                <td style="font-family:monospace;">${s.total_columns}</td>
                <td style="font-family:monospace; font-weight:700; color:#0284c7;">${s.candidate_count}</td>
                <td style="color:#64748b;">${new Date(s.started_at).toLocaleTimeString()}</td>
              </tr>
            `).join('') : `<tr><td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">No scans recorded yet.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 2. Data Sources View
async function renderDataSources(container) {
  const res = await fetch('/api/datasets');
  const datasets = await res.json();
  state.datasets = datasets;

  container.innerHTML = `
    <!-- Upload Cards -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:24px;">
      <div class="card" style="margin-bottom:0;">
        <h3 style="font-size:15px; font-weight:700; margin-bottom:4px;">Upload Delimited CSV Dataset</h3>
        <p style="font-size:11px; color:#64748b; margin-bottom:16px;">Supports UTF-8, Latin-1, with header deduplication</p>
        
        <label style="border:2px dashed #cbd5e1; border-radius:12px; padding:24px; display:flex; flex-direction:column; align-items:center; cursor:pointer; background:#f8fafc; transition:all 0.2s;" ondragover="event.preventDefault()">
          <span style="font-size:12px; font-weight:600; color:#0284c7;">Click to Select CSV File</span>
          <span style="font-size:10px; color:#94a3b8; margin-top:4px;">.csv format up to 50MB</span>
          <input type="file" accept=".csv" style="display:none;" onchange="uploadFile(event, 'csv')"/>
        </label>
      </div>

      <div class="card" style="margin-bottom:0;">
        <h3 style="font-size:15px; font-weight:700; margin-bottom:4px;">Upload SQLite Database</h3>
        <p style="font-size:11px; color:#64748b; margin-bottom:16px;">Discovers user tables and schemas in read-only mode</p>
        
        <label style="border:2px dashed #cbd5e1; border-radius:12px; padding:24px; display:flex; flex-direction:column; align-items:center; cursor:pointer; background:#f8fafc; transition:all 0.2s;">
          <span style="font-size:12px; font-weight:600; color:#6366f1;">Click to Select SQLite Database</span>
          <span style="font-size:10px; color:#94a3b8; margin-top:4px;">.db, .sqlite, .sqlite3 formats</span>
          <input type="file" accept=".db,.sqlite,.sqlite3" style="display:none;" onchange="uploadFile(event, 'sqlite')"/>
        </label>
      </div>
    </div>

    <!-- Datasets Table -->
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="font-size:15px; font-weight:700;">Available Data Sources (${datasets.length})</h3>
        <button onclick="renderActiveView()" class="btn btn-secondary" style="font-size:11px;">Refresh</button>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Dataset Name</th>
              <th>Type</th>
              <th>Tables</th>
              <th>Row Count</th>
              <th>Registered</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${datasets.map(ds => `
              <tr>
                <td style="font-weight:700; color:#0f172a;">${ds.name}</td>
                <td><span style="font-family:monospace; text-transform:uppercase; font-size:10px; padding:2px 6px; background:#f1f5f9; border-radius:4px;">${ds.source_type}</span></td>
                <td style="font-family:monospace;">${ds.table_count}</td>
                <td style="font-family:monospace;">${ds.row_count.toLocaleString()}</td>
                <td style="color:#64748b;">${new Date(ds.created_at).toLocaleDateString()}</td>
                <td style="text-align:right;">
                  <button onclick="inspectDatasetTables('${ds.id}')" class="btn btn-secondary" style="font-size:11px; padding:4px 8px;">Inspect</button>
                  <button onclick="triggerDirectScan('${ds.id}')" class="btn btn-primary" style="font-size:11px; padding:4px 10px;">Scan</button>
                  <button onclick="deleteDataset('${ds.id}', '${ds.name}')" class="btn btn-danger" style="font-size:11px; padding:4px 8px;">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="schema-inspector-box"></div>
  `;
}

async function uploadFile(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);

  const url = type === 'csv' ? '/api/datasets/csv' : '/api/datasets/sqlite';
  try {
    const res = await fetch(url, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    alert(`File "${file.name}" registered successfully!`);
    renderActiveView();
  } catch (err) {
    alert(`Upload error: ${err.message}`);
  }
}

async function deleteDataset(id, name) {
  if (!confirm(`Delete dataset "${name}"?`)) return;
  await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
  renderActiveView();
}

async function inspectDatasetTables(id) {
  const box = document.getElementById('schema-inspector-box');
  box.innerHTML = `<div class="card">Inspecting schema and safe sample values...</div>`;
  const res = await fetch(`/api/datasets/${id}/tables`);
  const tables = await res.json();

  box.innerHTML = `
    <div class="card" style="border-color:#0284c7;">
      <h3 style="font-size:15px; font-weight:700; margin-bottom:12px; color:#0284c7;">Schema & Sample Values Preview</h3>
      ${tables.map(t => `
        <div style="margin-bottom:20px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
          <div style="background:#f8fafc; padding:8px 12px; font-weight:700; font-size:11px; border-bottom:1px solid #e2e8f0;">
            Table: ${t.table_name} (${t.columns.length} columns, ${t.row_count} rows)
          </div>
          <table style="font-size:11px;">
            <thead>
              <tr><th>Column Name</th><th>Type</th><th>Non-Null</th><th>Sample Values (Sanitized)</th></tr>
            </thead>
            <tbody>
              ${t.columns.map(c => `
                <tr>
                  <td style="font-family:monospace; font-weight:700;">${c.name}</td>
                  <td style="font-family:monospace; color:#64748b;">${c.data_type}</td>
                  <td>${c.non_null_count}</td>
                  <td>${c.sample_values.slice(0, 3).map(v => `<span style="background:#f1f5f9; padding:2px 4px; border-radius:3px; font-family:monospace; margin-right:4px;">${v}</span>`).join('')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>
  `;
}

function triggerDirectScan(dsId) {
  state.selectedScanDatasetId = dsId;
  navigateTo('scandata');
}

// 3. Scan View
async function renderScan(container) {
  const res = await fetch('/api/datasets');
  const datasets = await res.json();

  container.innerHTML = `
    <div class="card" style="max-width:700px; margin:0 auto;">
      <h3 style="font-size:16px; font-weight:800; margin-bottom:6px;">Execute Personal-Data Discovery Scan</h3>
      <p style="font-size:12px; color:#64748b; margin-bottom:20px;">Examines column names, applies regex pattern ratios, and runs domain format validators to discover candidate personal data.</p>
      
      <div style="margin-bottom:16px;">
        <label style="font-size:11px; font-weight:700; text-transform:uppercase; color:#475569; display:block; margin-bottom:6px;">Select Dataset</label>
        <select id="scan-select-ds" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; font-size:13px;">
          ${datasets.map(ds => `
            <option value="${ds.id}" ${state.selectedScanDatasetId === ds.id ? 'selected' : ''}>
              ${ds.name} (${ds.source_type.toUpperCase()} • ${ds.row_count} rows)
            </option>
          `).join('')}
        </select>
      </div>

      <button id="btn-run-scan" onclick="executeScanJob()" class="btn btn-primary" style="width:100%; padding:12px; justify-content:center; font-size:14px;">
        ${icons.scandata} Execute Discovery Scan
      </button>

      <div id="scan-feedback-box" style="margin-top:20px;"></div>
    </div>
  `;
}

async function executeScanJob() {
  const dsId = document.getElementById('scan-select-ds').value;
  const btn = document.getElementById('btn-run-scan');
  const feedback = document.getElementById('scan-feedback-box');

  btn.disabled = true;
  btn.innerHTML = `Running Multi-Signal Scanner...`;
  feedback.innerHTML = `<div style="padding:12px; font-size:12px; color:#0284c7;">Scanning columns, computing signals, and generating technical evidence...</div>`;

  try {
    const res = await fetch('/api/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: dsId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Scan failed');
    }
    const result = await res.json();
    feedback.innerHTML = `
      <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:16px; color:#065f46;">
        <h4 style="font-size:14px; font-weight:800; margin-bottom:4px;">Scan Completed Successfully!</h4>
        <p style="font-size:12px; margin-bottom:12px;">Discovered <strong>${result.candidate_count} candidate personal data fields</strong> across ${result.total_columns} columns in ${result.dataset_name}.</p>
        <button onclick="navigateTo('inventory')" class="btn btn-primary" style="font-size:12px;">Open Evidence Inventory &rarr;</button>
      </div>
    `;
  } catch (err) {
    feedback.innerHTML = `
      <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:16px; color:#991b1b;">
        <strong>Scan Error:</strong> ${err.message}
      </div>
    `;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `${icons.scandata} Execute Discovery Scan`;
  }
}

// 4. Inventory View
async function renderInventory(container) {
  const res = await fetch('/api/inventory');
  const inventory = await res.json();
  state.inventory = inventory;

  container.innerHTML = `
    <!-- Top Action Bar -->
    <div class="card" style="margin-bottom:16px; padding:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; gap:10px; align-items:center;">
          <input type="text" id="inv-search" oninput="filterInventoryTable()" placeholder="Search column, table, or dataset..." style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:12px; width:260px;"/>
          <select id="inv-class-filter" onchange="filterInventoryTable()" style="padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:12px;">
            <option value="">All Data Classes</option>
            <option value="person_name">Person Name</option>
            <option value="email_address">Email Address</option>
            <option value="phone_number">Phone Number</option>
            <option value="government_id">Gov ID (Aadhaar/PAN)</option>
            <option value="date_of_birth">Date of Birth</option>
          </select>
          <select id="inv-meta-filter" onchange="filterInventoryTable()" style="padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:12px;">
            <option value="">All Metadata Statuses</option>
            <option value="Complete metadata">Complete</option>
            <option value="Missing purpose">Missing Purpose</option>
            <option value="Missing retention">Missing Retention</option>
            <option value="Missing both">Missing Both</option>
          </select>
        </div>

        <div class="btn-group">
          <a href="/api/reports/inventory.csv" download class="btn btn-secondary">Export CSV</a>
          <a href="/api/reports/inventory.pdf" target="_blank" class="btn btn-primary">Export PDF</a>
        </div>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="card">
      <div class="table-responsive">
        <table id="inv-table">
          <thead>
            <tr>
              <th>Dataset / Table</th>
              <th>Column Name</th>
              <th>Data Class</th>
              <th>Confidence</th>
              <th>Metadata Status</th>
              <th>Declared Purpose</th>
              <th>Retention Rule</th>
              <th>Review</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="inv-tbody">
            ${renderInventoryRows(inventory)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderInventoryRows(records) {
  if (records.length === 0) {
    return `<tr><td colspan="9" style="text-align:center; padding:20px; color:#94a3b8;">No candidate detections matched filter.</td></tr>`;
  }
  return records.map(r => `
    <tr>
      <td>
        <strong style="color:#0f172a; display:block;">${r.dataset_name}</strong>
        <span style="font-size:10px; font-family:monospace; color:#64748b;">${r.table_name || 'root table'}</span>
      </td>
      <td style="font-family:monospace; font-weight:700;">${r.column_name}</td>
      <td>${renderClassBadge(r.candidate_class)}</td>
      <td>${renderConfidenceBar(r.confidence_score)}</td>
      <td>${renderMetaBadge(r.metadata_status)}</td>
      <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.declared_purpose || ''}">
        ${r.declared_purpose || '<span style="color:#b45309; font-style:italic;">⚠️ Unspecified</span>'}
      </td>
      <td style="max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        ${r.retention_period || '<span style="color:#c2410c; font-style:italic;">⚠️ Unspecified</span>'}
      </td>
      <td>${renderReviewBadge(r.review_status)}</td>
      <td style="text-align:right; white-space:nowrap;">
        <button onclick="openEvidenceModal('${r.id}')" class="btn btn-secondary" style="font-size:11px; padding:4px 8px;">Evidence</button>
        <button onclick="openReviewModal('${r.id}')" class="btn btn-primary" style="font-size:11px; padding:4px 8px;">Review</button>
      </td>
    </tr>
  `).join('');
}

function filterInventoryTable() {
  const search = document.getElementById('inv-search').value.toLowerCase();
  const cls = document.getElementById('inv-class-filter').value;
  const meta = document.getElementById('inv-meta-filter').value;

  const filtered = state.inventory.filter(r => {
    const matchSearch = r.column_name.toLowerCase().includes(search) || r.dataset_name.toLowerCase().includes(search) || (r.table_name || '').toLowerCase().includes(search);
    const matchClass = !cls || r.candidate_class === cls;
    const matchMeta = !meta || r.metadata_status === meta;
    return matchSearch && matchClass && matchMeta;
  });

  document.getElementById('inv-tbody').innerHTML = renderInventoryRows(filtered);
}

// 5. Metadata Register View
async function renderMetadata(container) {
  const res = await fetch('/api/metadata');
  const metadata = await res.json();
  state.metadata = metadata;

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <h3 style="font-size:15px; font-weight:700;">Governance Register (${metadata.length} records)</h3>
          <p style="font-size:11px; color:#64748b;">Registers declared business purpose and retention rules mapped using compound identifiers</p>
        </div>
        <div class="btn-group">
          <button onclick="openNewMetadataModal()" class="btn btn-primary">+ New Metadata</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Dataset / Table</th>
              <th>Column Name</th>
              <th>Class</th>
              <th>Declared Purpose</th>
              <th>Retention Rule</th>
              <th>Owner</th>
              <th>Reviewed</th>
            </tr>
          </thead>
          <tbody>
            ${metadata.map(m => `
              <tr>
                <td><strong>${m.dataset_name || 'Global'}</strong> <span style="font-size:10px; color:#64748b; font-family:monospace;">${m.table_name || 'All'}</span></td>
                <td style="font-family:monospace; font-weight:700;">${m.column_name}</td>
                <td>${m.data_class ? renderClassBadge(m.data_class) : '—'}</td>
                <td>${m.declared_purpose || '<span style="color:#b45309; font-style:italic;">⚠️ Unspecified</span>'}</td>
                <td><span style="font-family:monospace;">${m.retention_period || '<span style="color:#c2410c; font-style:italic;">⚠️ Unspecified</span>'}</span></td>
                <td>${m.metadata_owner || 'Unassigned'}</td>
                <td style="font-family:monospace; color:#64748b;">${m.last_reviewed_date || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 6. Evidence Gaps View
async function renderGaps(container) {
  const res = await fetch('/api/gaps');
  const report = await res.json();
  state.gapsReport = report;
  const { statistics, gap_records, limitations } = report;

  container.innerHTML = `
    <!-- Legal Disclaimer -->
    <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:16px; margin-bottom:20px; color:#92400e; font-size:12px;">
      <strong>Technical Evidence Gap Analysis:</strong> Discrepancies between detected candidate personal data fields and declared governance metadata. Technical evidence does not constitute legal counsel or universal compliance certification under DPDP Act or GDPR.
    </div>

    <!-- Gap Stats -->
    <div class="kpi-grid">
      <div class="kpi-card" style="background:#fffbeb;">
        <div class="kpi-label" style="color:#b45309;">Missing Purpose</div>
        <div class="kpi-val" style="color:#b45309;">${statistics.missing_purpose_count}</div>
      </div>
      <div class="kpi-card" style="background:#fff7ed;">
        <div class="kpi-label" style="color:#c2410c;">Missing Retention</div>
        <div class="kpi-val" style="color:#c2410c;">${statistics.missing_retention_count}</div>
      </div>
      <div class="kpi-card" style="background:#fef2f2;">
        <div class="kpi-label" style="color:#b91c1c;">Missing Both</div>
        <div class="kpi-val" style="color:#b91c1c;">${statistics.missing_both_count}</div>
      </div>
      <div class="kpi-card" style="background:#f5f3ff;">
        <div class="kpi-label" style="color:#6b21a8;">Ambiguous Mapping</div>
        <div class="kpi-val" style="color:#6b21a8;">${statistics.ambiguous_mapping_count}</div>
      </div>
      <div class="kpi-card" style="background:#eff6ff;">
        <div class="kpi-label" style="color:#1d4ed8;">Unreviewed</div>
        <div class="kpi-val" style="color:#1d4ed8;">${statistics.unreviewed_candidate_count}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Borderline Conf (&lt;70%)</div>
        <div class="kpi-val">${statistics.low_confidence_count}</div>
      </div>
    </div>

    <!-- Gaps Table -->
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="font-size:15px; font-weight:700;">Identified Technical Gaps (${gap_records.length})</h3>
        <a href="/api/reports/gaps.csv" download class="btn btn-secondary">Download Gaps CSV</a>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Dataset / Table</th>
              <th>Column</th>
              <th>Class</th>
              <th>Confidence</th>
              <th>Evidence Gap</th>
              <th>Review Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${gap_records.map(r => `
              <tr>
                <td><strong>${r.dataset_name}</strong> <span style="font-size:10px; font-family:monospace; color:#64748b;">${r.table_name}</span></td>
                <td style="font-family:monospace; font-weight:700;">${r.column_name}</td>
                <td>${renderClassBadge(r.candidate_class)}</td>
                <td>${renderConfidenceBar(r.confidence_score)}</td>
                <td>${renderMetaBadge(r.metadata_status)}</td>
                <td>${renderReviewBadge(r.review_status)}</td>
                <td style="text-align:right;">
                  <button onclick="openEvidenceModal('${r.id}')" class="btn btn-secondary" style="font-size:11px; padding:3px 8px;">Evidence</button>
                  <button onclick="openReviewModal('${r.id}')" class="btn btn-primary" style="font-size:11px; padding:3px 8px;">Review</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Limitations -->
    <div class="card" style="background:#0f172a; color:#cbd5e1; border-color:#334155;">
      <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#38bdf8; margin-bottom:10px;">Documented Scanner Limitations</h4>
      <ul style="font-size:11px; line-height:1.8; margin-left:18px;">
        ${limitations.map(l => `<li>${l}</li>`).join('')}
      </ul>
    </div>
  `;
}

// 7. Evaluation View
async function renderEvaluation(container) {
  const res = await fetch('/api/evaluation');
  const history = await res.json();
  const latest = history[0];

  container.innerHTML = `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <div>
        <h3 style="font-size:16px; font-weight:800;">Accuracy & Performance Benchmark</h3>
        <p style="font-size:12px; color:#64748b;">Calculates precision, recall, and F1-score against the synthetic ground truth test dataset</p>
      </div>
      <button onclick="runLiveEvaluation()" id="btn-eval" class="btn btn-primary">
        ${icons.evaluation} Run Live Evaluation
      </button>
    </div>

    ${latest ? `
      <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr);">
        <div class="kpi-card">
          <div class="kpi-label">Samples Evaluated</div>
          <div class="kpi-val">${latest.total_evaluated}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label" style="color:#10b981;">Macro Precision</div>
          <div class="kpi-val" style="color:#10b981;">${(latest.overall_precision * 100).toFixed(1)}%</div>
          <div style="font-size:10px; color:#64748b;">TP / (TP + FP)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label" style="color:#0284c7;">Macro Recall</div>
          <div class="kpi-val" style="color:#0284c7;">${(latest.overall_recall * 100).toFixed(1)}%</div>
          <div style="font-size:10px; color:#64748b;">TP / (TP + FN)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label" style="color:#6366f1;">Macro F1-Score</div>
          <div class="kpi-val" style="color:#6366f1;">${(latest.overall_f1 * 100).toFixed(1)}%</div>
          <div style="font-size:10px; color:#64748b;">Harmonic mean</div>
        </div>
      </div>

      <div class="card">
        <h4 style="font-size:14px; font-weight:700; margin-bottom:12px;">Per-Class Performance (${latest.run_name})</h4>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Support</th>
                <th>TP</th>
                <th>FP</th>
                <th>FN</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-Score</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(latest.per_class_metrics).map(([cls, m]) => `
                <tr>
                  <td>${renderClassBadge(cls)}</td>
                  <td style="font-family:monospace;">${m.support}</td>
                  <td style="font-family:monospace; font-weight:700; color:#10b981;">${m.true_positives}</td>
                  <td style="font-family:monospace; color:#ef4444;">${m.false_positives}</td>
                  <td style="font-family:monospace; color:#f59e0b;">${m.false_negatives}</td>
                  <td style="font-family:monospace; font-weight:700;">${(m.precision * 100).toFixed(1)}%</td>
                  <td style="font-family:monospace; font-weight:700;">${(m.recall * 100).toFixed(1)}%</td>
                  <td style="font-family:monospace; font-weight:700; color:#6366f1;">${(m.f1_score * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : `
      <div class="card" style="text-align:center; padding:30px; color:#94a3b8;">
        Click "Run Live Evaluation" to evaluate against the ground truth benchmark.
      </div>
    `}
  `;
}

async function runLiveEvaluation() {
  const btn = document.getElementById('btn-eval');
  btn.disabled = true;
  btn.textContent = 'Evaluating benchmark...';
  try {
    await fetch('/api/evaluation', { method: 'POST' });
    renderActiveView();
  } catch (err) {
    alert(`Evaluation failed: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

// 8. Review Center View
async function renderReviewCenter(container) {
  const res = await fetch('/api/inventory');
  const allRecords = await res.json();
  const pending = allRecords.filter(r => r.review_status === 'PENDING');

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <h3 style="font-size:16px; font-weight:800; margin-bottom:4px;">Human Review Queue (${pending.length} Pending)</h3>
      <p style="font-size:12px; color:#64748b;">Inspect candidate personal data evidence and confirm or reject detections</p>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Field Identifier</th>
              <th>Dataset Source</th>
              <th>Candidate Class</th>
              <th>Confidence</th>
              <th>Technical Evidence</th>
              <th style="text-align:right;">Decision</th>
            </tr>
          </thead>
          <tbody>
            ${pending.length > 0 ? pending.map(r => `
              <tr>
                <td><strong>${r.column_name}</strong> <span style="font-size:10px; font-family:monospace; color:#64748b;">${r.table_name}</span></td>
                <td>${r.dataset_name}</td>
                <td>${renderClassBadge(r.candidate_class)}</td>
                <td>${renderConfidenceBar(r.confidence_score)}</td>
                <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.evidence_summary}">${r.evidence_summary}</td>
                <td style="text-align:right; white-space:nowrap;">
                  <button onclick="openEvidenceModal('${r.id}')" class="btn btn-secondary" style="font-size:11px; padding:3px 8px;">Evidence</button>
                  <button onclick="quickReview('${r.id}', 'CONFIRMED')" class="btn btn-primary" style="font-size:11px; padding:3px 8px; background:#047857;">Confirm</button>
                  <button onclick="quickReview('${r.id}', 'REJECTED')" class="btn btn-danger" style="font-size:11px; padding:3px 8px;">Reject</button>
                </td>
              </tr>
            `).join('') : `<tr><td colspan="6" style="text-align:center; padding:30px; color:#10b981; font-weight:600;">✓ Review queue empty! All candidate detections reviewed.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function quickReview(id, status) {
  await fetch(`/api/inventory/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_status: status, reviewer_notes: `Quick decision: ${status}` })
  });
  renderActiveView();
}

// 9. Settings View
async function renderSettings(container) {
  const res = await fetch('/api/rules');
  const data = await res.json();
  state.rulesConfig = data;

  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div>
          <h3 style="font-size:16px; font-weight:800;">Configurable YAML Detection Rules</h3>
          <p style="font-size:12px; color:#64748b;">Customize regex patterns, scoring weights, and candidate thresholds</p>
        </div>
        <button onclick="saveRulesYaml()" id="btn-save-rules" class="btn btn-primary">Save & Compile Rules</button>
      </div>

      <textarea id="rules-textarea" style="width:100%; height:420px; font-family:monospace; font-size:12px; padding:16px; background:#0f172a; color:#34d399; border-radius:8px; border:1px solid #334155; line-height:1.6;" spellcheck="false">${data.yaml_content}</textarea>

      <div style="margin-top:16px; padding:12px; background:#f8fafc; border-radius:8px; font-size:11px; color:#64748b;">
        <strong>Safety Guardrail:</strong> Syntax is strictly validated on the backend. No arbitrary code execution permitted.
      </div>
    </div>
  `;
}

async function saveRulesYaml() {
  const content = document.getElementById('rules-textarea').value;
  const btn = document.getElementById('btn-save-rules');
  btn.disabled = true;
  btn.textContent = 'Validating & Compiling...';

  try {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml_content: content })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Validation failed');
    }
    alert('Rules updated and compiled successfully!');
  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save & Compile Rules';
  }
}

// Evidence Modal
function openEvidenceModal(recordId) {
  const r = (state.inventory.find(i => i.id === recordId)) ||
            (state.gapsReport?.gap_records.find(i => i.id === recordId));
  if (!r) return;

  const modal = document.getElementById('modal-container');
  const sb = r.signals_breakdown || {};

  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div>
            <span style="font-size:10px; font-weight:700; color:#0284c7; text-transform:uppercase;">Technical Evidence Audit</span>
            <h3 style="font-size:16px; font-weight:800; color:#0f172a;">${r.column_name}</h3>
          </div>
          <button onclick="closeModal()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
        </div>

        <div class="modal-body" style="display:flex; flex-direction:column; gap:16px; font-size:12px;">
          <!-- Evidence Box -->
          <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:14px;">
            <strong style="color:#0369a1; display:block; margin-bottom:4px;">Detection Summary:</strong>
            <p style="color:#0c4a6e; font-weight:500;">${r.evidence_summary}</p>
          </div>

          <!-- Signal Breakdown -->
          <div style="border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
            <strong style="display:block; margin-bottom:8px; color:#334155;">Multi-Signal Breakdown:</strong>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>Column Match: <strong>${sb.column_matched ? '✓ Matched pattern' : '✗ No match'}</strong></div>
              <div>Negative Penalty: <strong>${sb.negative_column_match ? '⚠️ Applied' : 'None'}</strong></div>
              <div>Value Match Ratio: <strong>${Math.round((sb.value_match_ratio || 0) * 100)}%</strong></div>
              <div>Format Validator: <strong>${Math.round((sb.validator_pass_ratio || 0) * 100)}%</strong></div>
            </div>
          </div>

          <!-- Redacted Samples -->
          <div>
            <strong style="display:block; margin-bottom:6px; color:#334155;">Redacted Sample Values (Zero-Exposure):</strong>
            <div style="background:#0f172a; color:#34d399; font-family:monospace; padding:12px; border-radius:8px; font-size:11px;">
              ${r.sample_values_masked && r.sample_values_masked.length > 0
                ? r.sample_values_masked.map((v, i) => `<div>[${i+1}] ${v}</div>`).join('')
                : '<div>No samples available</div>'}
            </div>
          </div>

          <!-- Metadata -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px;">
            <strong style="display:block; margin-bottom:4px; color:#334155;">Declared Purpose & Retention:</strong>
            <div>Purpose: <strong>${r.declared_purpose || '⚠️ Missing'}</strong></div>
            <div>Retention: <strong>${r.retention_period || '⚠️ Missing'}</strong></div>
          </div>
        </div>

        <div class="modal-footer">
          <button onclick="closeModal()" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `;
}

// Review Modal
function openReviewModal(recordId) {
  const r = (state.inventory.find(i => i.id === recordId)) ||
            (state.gapsReport?.gap_records.find(i => i.id === recordId));
  if (!r) return;

  const modal = document.getElementById('modal-container');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3 style="font-size:16px; font-weight:800;">Review Candidate: ${r.column_name}</h3>
          <button onclick="closeModal()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
        </div>

        <div class="modal-body" style="display:flex; flex-direction:column; gap:16px; font-size:12px;">
          <div>
            <label style="font-weight:700; display:block; margin-bottom:6px;">Decision</label>
            <div style="display:flex; gap:10px;">
              <label style="cursor:pointer; display:flex; align-items:center; gap:6px;">
                <input type="radio" name="rev-decision" value="CONFIRMED" ${r.review_status === 'CONFIRMED' ? 'checked' : ''}/> Confirm PII
              </label>
              <label style="cursor:pointer; display:flex; align-items:center; gap:6px;">
                <input type="radio" name="rev-decision" value="REJECTED" ${r.review_status === 'REJECTED' ? 'checked' : ''}/> Reject (Not PII)
              </label>
              <label style="cursor:pointer; display:flex; align-items:center; gap:6px;">
                <input type="radio" name="rev-decision" value="PENDING" ${r.review_status === 'PENDING' ? 'checked' : ''}/> Keep Pending
              </label>
            </div>
          </div>

          <div>
            <label style="font-weight:700; display:block; margin-bottom:6px;">Reviewer Audit Notes</label>
            <textarea id="rev-notes" style="width:100%; height:70px; padding:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:12px;">${r.reviewer_notes || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
          <button onclick="submitReview('${r.id}')" class="btn btn-primary">Save Decision</button>
        </div>
      </div>
    </div>
  `;
}

async function submitReview(id) {
  const status = document.querySelector('input[name="rev-decision"]:checked').value;
  const notes = document.getElementById('rev-notes').value;

  await fetch(`/api/inventory/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_status: status, reviewer_notes: notes })
  });

  closeModal();
  renderActiveView();
}

function openNewMetadataModal() {
  const modal = document.getElementById('modal-container');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3 style="font-size:16px; font-weight:800;">Register Purpose & Retention Metadata</h3>
          <button onclick="closeModal()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
        </div>

        <div class="modal-body" style="display:flex; flex-direction:column; gap:12px; font-size:12px;">
          <div>
            <label style="font-weight:700; display:block; margin-bottom:4px;">Column Name *</label>
            <input type="text" id="m-col" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; font-family:monospace;" required/>
          </div>
          <div>
            <label style="font-weight:700; display:block; margin-bottom:4px;">Dataset Name</label>
            <input type="text" id="m-ds" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;" placeholder="e.g. synthetic_customers.csv"/>
          </div>
          <div>
            <label style="font-weight:700; display:block; margin-bottom:4px;">Table Name</label>
            <input type="text" id="m-tbl" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;" placeholder="e.g. customers"/>
          </div>
          <div>
            <label style="font-weight:700; display:block; margin-bottom:4px;">Declared Purpose</label>
            <textarea id="m-purp" style="width:100%; height:60px; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"></textarea>
          </div>
          <div>
            <label style="font-weight:700; display:block; margin-bottom:4px;">Retention Period</label>
            <input type="text" id="m-ret" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;" placeholder="e.g. 7 years post-closure"/>
          </div>
        </div>

        <div class="modal-footer">
          <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
          <button onclick="saveNewMetadata()" class="btn btn-primary">Save Metadata</button>
        </div>
      </div>
    </div>
  `;
}

async function saveNewMetadata() {
  const col = document.getElementById('m-col').value;
  if (!col.trim()) return alert('Column Name is required');

  await fetch('/api/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      column_name: col.trim(),
      dataset_name: document.getElementById('m-ds').value.trim(),
      table_name: document.getElementById('m-tbl').value.trim(),
      declared_purpose: document.getElementById('m-purp').value.trim(),
      retention_period: document.getElementById('m-ret').value.trim(),
      last_reviewed_date: new Date().toISOString().split('T')[0]
    })
  });

  closeModal();
  renderActiveView();
}

function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}

// Initial Launch
document.addEventListener('DOMContentLoaded', () => {
  renderActiveView();
});
