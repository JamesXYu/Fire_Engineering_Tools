// Fractional Effective Dose (FED) — Radiant Heat Calculator
// Point-source radiation model along a multi-segment evacuation path near fire source O
// Supports up to 10 chained path segments (11 waypoints)

const FEDPointCount = {};
const POINT_LABELS = ['A','B','C','D','E','F','G','H','I','J','K'];
const FED_MIN_POINTS = 2;
const FED_MAX_POINTS = 11;

function runFEDCalculationMulti(inputs) {
  const { speed, dt, Q, chiRad, r, segments } = inputs;

  let globalTime = 0;
  let cumulativeFED = 0;
  let maxFlux = 0;
  let maxFluxTime = 0;
  const timeSeries = [];

  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const { dOA, dOB, L } = segments[segIdx];
    const cosA = (dOA * dOA + L * L - dOB * dOB) / (2 * dOA * L);
    const T_seg = L / speed;
    const N = Math.ceil(T_seg / dt);
    const startI = (segIdx === 0) ? 0 : 1;

    for (let i = startI; i <= N; i++) {
      let t_local = i * dt;
      if (t_local > T_seg) t_local = T_seg;

      const s = speed * t_local;
      const dSq = dOA * dOA + s * s - 2 * dOA * s * cosA;
      let d = Math.sqrt(Math.max(dSq, 0));
      if (d < 0.1) d = 0.1;

      const q = (chiRad * Q) / (4 * Math.PI * d * d);
      const currentTime = globalTime + t_local;

      let deltaFED = 0;
      if (q > 0 && timeSeries.length > 0) {
        const t_tol_sec = 60 * r / Math.pow(q, 1.33);
        const prevTime = timeSeries[timeSeries.length - 1].t;
        const delta_t = currentTime - prevTime;
        deltaFED = delta_t / t_tol_sec;
      }
      cumulativeFED += deltaFED;

      if (q > maxFlux) { maxFlux = q; maxFluxTime = currentTime; }

      timeSeries.push({ t: currentTime, d, q, FED: cumulativeFED, seg: segIdx + 1 });
      if (t_local >= T_seg) break;
    }
    globalTime += T_seg;
  }

  return { timeSeries, finalFED: cumulativeFED, maxFlux, maxFluxTime };
}

const FEDCalculator = {
  type: 'FED',
  name: 'Fractional Effective Dose',
  icon: '☢️',
  hasTimeSeries: true,

  getPointCount(windowId) {
    if (FEDPointCount[windowId] != null) return FEDPointCount[windowId];
    return FED_MIN_POINTS;
  },

  setPointCount(windowId, n) {
    FEDPointCount[windowId] = Math.max(FED_MIN_POINTS, Math.min(FED_MAX_POINTS, n));
  },

  getInputCount() { return 5; },
  getOutputCount() { return 2; },

  getMinimumSize() {
    return { width: 480, height: 800 };
  },

  _buildPathTableHTML(windowId, pointCount) {
    const pc = pointCount || this.getPointCount(windowId);
    const cellStyle = 'padding: 4px 6px; border: 1px solid var(--window-border); white-space: nowrap;';
    const inputStyle = 'width: 100%; min-width: 70px; box-sizing: border-box; background: var(--window-bg); color: var(--text-primary); border: 1px solid var(--window-border); border-radius: 3px; padding: 5px 6px; font-size: 12px; text-align: center;';
    let rows = '';
    for (let p = 0; p < pc; p++) {
      const label = POINT_LABELS[p];
      const isLast = (p === pc - 1);
      rows += `<tr>
        <td style="${cellStyle} text-align: center; font-weight: 600;">${label}</td>
        <td style="${cellStyle}"><input type="number" class="calc-input" id="fed-dist-${windowId}-${p}" placeholder="—" min="0" step="0.1" style="${inputStyle}" data-window-id="${windowId}"></td>
        <td style="${cellStyle}">${isLast
          ? '<span style="color: var(--text-secondary); font-size: 11px; display:block; text-align:center;">—</span>'
          : `<input type="number" class="calc-input" id="fed-len-${windowId}-${p}" placeholder="—" min="0" step="0.1" style="${inputStyle}" data-window-id="${windowId}">`
        }</td>
      </tr>`;
    }
    return rows;
  },

  getHTML(windowId) {
    const pc = this.getPointCount(windowId);
    const thStyle = 'padding: 5px 6px; border: 1px solid var(--window-border); font-size: 11px; font-weight: 600; background: var(--button-hover); text-align: center;';
    return `
      <div class="form-calculator form-calculator-timeseries" id="calc-${windowId}" style="min-width: 380px;">
        <div class="calc-input-section">
          <div class="calc-section">
            <label class="calc-label">Walking speed (m/s)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="1.2" min="0.01" step="0.1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Time step dt (s)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="0.1" min="0.01" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">HRR Q (kW)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="—" min="0" step="1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Radiative fraction χ<sub>rad</sub></label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="0.4" min="0" max="1" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Endpoint dose r (kW/m²)<sup>1.33</sup>·min</label>
            <input type="number" class="calc-input" id="input5-${windowId}" placeholder="1.67" min="0" step="0.01" data-window-id="${windowId}">
          </div>
        </div>

        <div style="margin: 10px 0 6px 0; display: flex; justify-content: space-between; align-items: center;">
          <label style="font-size: 12px; font-weight: 600; color: var(--text-primary);">Evacuation Path (${pc - 1} segment${pc - 1 > 1 ? 's' : ''})</label>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="fed-remove-pt-btn" data-window-id="${windowId}" style="width: 28px; height: 28px; font-size: 16px; font-weight: 700; line-height: 1; display: flex; align-items: center; justify-content: center; border: 1px solid var(--window-border); border-radius: 4px; background: var(--window-bg); color: var(--text-primary); cursor: pointer; flex-shrink: 0;${pc <= FED_MIN_POINTS ? ' opacity:0.35; cursor:default;' : ''}" ${pc <= FED_MIN_POINTS ? 'disabled' : ''}>−</button>
            <button class="fed-add-pt-btn" data-window-id="${windowId}" style="width: 115px; padding: 6px 14px; font-size: 13px; font-weight: 700; line-height: 1.4; border: 1px solid var(--window-border); border-radius: 4px; background: var(--primary-color); color: white; cursor: pointer;${pc >= FED_MAX_POINTS ? ' opacity:0.35; cursor:default;' : ''}" ${pc >= FED_MAX_POINTS ? 'disabled' : ''}>+ Add Point</button>
          </div>
        </div>

        <div style="margin-bottom: 10px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;" id="fed-path-table-${windowId}">
            <colgroup>
              <col style="width: 40px;">
              <col>
              <col>
            </colgroup>
            <thead>
              <tr>
                <th style="${thStyle}">Pt</th>
                <th style="${thStyle}">Distance to fire D (m)</th>
                <th style="${thStyle}">Segmented travel distance (m)</th>
              </tr>
            </thead>
            <tbody id="fed-path-body-${windowId}">
              ${this._buildPathTableHTML(windowId, pc)}
            </tbody>
          </table>
        </div>

        <div id="fed-warning-${windowId}" style="display: none; margin: 6px 0; padding: 8px 10px; border-radius: 4px; font-size: 11px; line-height: 1.5;"></div>

        <div class="calc-divider">
          <div class="divider-line"></div>
          <div class="divider-label">Results</div>
          <div class="divider-line"></div>
        </div>

        <div class="calc-output-section">
          <div class="calc-section">
            <label class="calc-label">Final FED</label>
            <div class="calc-output-wrapper">
              <input type="text" class="calc-output" id="result-${windowId}" placeholder="—" readonly>
              <span class="calc-output-unit">—</span>
            </div>
          </div>
          <div class="calc-section">
            <label class="calc-label">Max radiation flux</label>
            <div class="calc-output-wrapper">
              <input type="text" class="calc-output" id="result2-${windowId}" placeholder="—" readonly>
              <span class="calc-output-unit">kW/m²</span>
            </div>
          </div>
        </div>

        <div class="calc-actions">
          <button class="action-btn clear-btn" data-window-id="${windowId}">Clear</button>
          <button class="action-btn export-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Export</button>
          <button class="action-btn import-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Import</button>
          <button class="action-btn help-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Detail</button>
        </div>
      </div>
    `;
  },

  getHelpHTML(windowId, sourceWindowId) {
    const srcId = sourceWindowId || windowId;
    const reportId = `fed-report-${windowId}`;
    const copyBtnId = `fed-copy-${windowId}`;

    const getVal = (n) => {
      const el = document.getElementById(`input${n}-${srcId}`);
      const raw = el?.value?.trim();
      const v = parseFloat(raw);
      return isNaN(v) ? null : v;
    };
    const getOutput = (id) => {
      const el = document.getElementById(`${id}-${srcId}`);
      return el && el.value ? el.value : '—';
    };
    const fmt = (x, digits) => (typeof x === 'number' && !isNaN(x) ? x.toLocaleString('en-US', { maximumFractionDigits: digits ?? 4 }) : (x != null ? String(x) : '—'));

    const formulaBlockStyle = 'margin: 6px 0; padding: 8px 12px; background: var(--result-card-bg); border: 1px solid var(--window-border); border-radius: 4px; font-size: 12px; overflow-x: auto;';

    const renderMath = (latex) => {
      if (typeof katex !== 'undefined') {
        try {
          return katex.renderToString(latex, { throwOnError: false, displayMode: true });
        } catch (e) {
          return '<span style="color: var(--text-secondary);">' + latex + '</span>';
        }
      }
      return '<span style="color: var(--text-secondary);">' + latex + '</span>';
    };

    // Global params table
    const globalLabels = [
      { id: 1, label: 'Walking speed', unit: 'm/s' },
      { id: 2, label: 'Time step dt', unit: 's' },
      { id: 3, label: 'HRR Q', unit: 'kW' },
      { id: 4, label: 'Radiative fraction χ_rad', unit: '—' },
      { id: 5, label: 'Endpoint dose r', unit: '(kW/m²)^1.33·min' },
    ];
    const bdr = 'padding:6px; border:1px solid var(--window-border);';
    let inputTable = globalLabels.map(i => `<tr><td style="${bdr}">${i.label}</td><td style="${bdr}">${fmt(getVal(i.id))}</td><td style="${bdr}">${i.unit}</td></tr>`).join('');

    // Path table for report
    const pc = this.getPointCount(srcId);
    const segments = this._readSegments(srcId);
    let pathTable = '';
    for (let p = 0; p < pc; p++) {
      const distEl = document.getElementById(`fed-dist-${srcId}-${p}`);
      const lenEl = document.getElementById(`fed-len-${srcId}-${p}`);
      const dVal = distEl ? parseFloat(distEl.value) : NaN;
      const lVal = lenEl ? parseFloat(lenEl.value) : NaN;
      pathTable += `<tr><td style="${bdr} text-align:center; font-weight:600;">${POINT_LABELS[p]}</td><td style="${bdr} text-align:center;">${isNaN(dVal) ? '—' : fmt(dVal)}</td><td style="${bdr} text-align:center;">${p < pc - 1 ? (isNaN(lVal) ? '—' : fmt(lVal)) : '—'}</td></tr>`;
    }
    inputTable += `</table>
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Evacuation Path (${pc - 1} segment${pc - 1 > 1 ? 's' : ''})</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
        <tr style="background:var(--button-hover);"><th style="text-align:center; ${bdr}">Point</th><th style="${bdr}">d from O (m)</th><th style="${bdr}">L to next (m)</th></tr>
        ${pathTable}
    `;

    const methodology = `
      <p><strong>Step 1: Geometry — distance from any path point to fire source</strong></p>
      <p style="color: var(--text-secondary); font-size: 12px;">For each segment between waypoints P<sub>i</sub> and P<sub>i+1</sub>, the triangle OP<sub>i</sub>P<sub>i+1</sub> has known sides d<sub>i</sub>, d<sub>i+1</sub>, L<sub>i</sub>. Compute angle at P<sub>i</sub>:</p>
      <div style="${formulaBlockStyle}">${renderMath('\\cos \\alpha_i = \\frac{d_i^2 + L_i^2 - d_{i+1}^2}{2 \\cdot d_i \\cdot L_i}')}</div>
      <p style="color: var(--text-secondary); font-size: 12px;">Distance to O at travel distance s along segment i:</p>
      <div style="${formulaBlockStyle}">${renderMath('d(s) = \\sqrt{d_i^2 + s^2 - 2 \\cdot d_i \\cdot s \\cdot \\cos \\alpha_i}')}</div>

      <p><strong>Step 2: Point-source radiation flux</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('\\dot{q}\'\'= \\frac{\\chi_{rad} \\cdot Q}{4 \\pi \\cdot d^2}')}</div>

      <p><strong>Step 3: Tolerance time</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('t_{tol} = \\frac{r}{\\dot{q}\'\'^{\\,1.33}} \\quad \\text{(min)}')}</div>

      <p><strong>Step 4: Cumulative FED across all segments</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('\\Delta \\text{FED}_i = \\frac{\\Delta t}{t_{tol,i} \\times 60}')}</div>
      <div style="${formulaBlockStyle}">${renderMath('\\text{FED}_{total} = \\sum_{\\text{all segments}} \\sum_{i} \\Delta \\text{FED}_i')}</div>
      <p style="color: var(--text-secondary); font-size: 12px;">FED ≥ 1 indicates the injury endpoint has been reached. Time and FED accumulate continuously across consecutive segments.</p>
    `;

    const speed = getVal(1);
    const hasKey = speed && segments && segments.length > 0;
    let workedExample = '';
    if (hasKey && segments.length > 0) {
      const seg0 = segments[0];
      const cosA = (seg0.dOA * seg0.dOA + seg0.L * seg0.L - seg0.dOB * seg0.dOB) / (2 * seg0.dOA * seg0.L);
      const q0 = ((getVal(4) || 0.4) * (getVal(3) || 0)) / (4 * Math.PI * seg0.dOA * seg0.dOA);
      workedExample = `
        <p>Showing first segment ${POINT_LABELS[0]}→${POINT_LABELS[1]}: d<sub>O,${POINT_LABELS[0]}</sub> = ${fmt(seg0.dOA)} m, d<sub>O,${POINT_LABELS[1]}</sub> = ${fmt(seg0.dOB)} m, L = ${fmt(seg0.L)} m</p>
        <div style="${formulaBlockStyle}">${renderMath(`\\cos \\alpha = \\frac{${fmt(seg0.dOA)}^2 + ${fmt(seg0.L)}^2 - ${fmt(seg0.dOB)}^2}{2 \\times ${fmt(seg0.dOA)} \\times ${fmt(seg0.L)}} = ${fmt(cosA, 6)}`)}</div>
        <p style="color: var(--text-secondary); font-size: 12px;">At t = 0 (point ${POINT_LABELS[0]}), d = ${fmt(seg0.dOA)} m, q = ${fmt(q0, 4)} kW/m²</p>
        <p><strong>Result (all ${segments.length} segment${segments.length > 1 ? 's' : ''}):</strong> Final FED = ${getOutput('result')}, Max flux = ${getOutput('result2')} kW/m²</p>
      `;
    } else {
      workedExample = '<p>Enter all required input values and run the calculation to see results.</p>';
    }

    const finalFED = getOutput('result');
    const maxFlux = getOutput('result2');
    const resultsTable = `
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Results Summary</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr style="background:var(--button-hover);"><th style="text-align:left; ${bdr}">Output</th><th style="${bdr}">Value</th><th style="${bdr}">Unit</th></tr>
        <tr style="background:var(--button-hover);"><td style="${bdr}"><strong>Final FED</strong></td><td style="${bdr}"><strong>${finalFED}</strong></td><td style="${bdr}">—</td></tr>
        <tr><td style="${bdr}">Max Radiation Flux</td><td style="${bdr}">${maxFlux}</td><td style="${bdr}">kW/m²</td></tr>
      </table>`;

    return `
      <div class="form-calculator help-detail" id="help-${windowId}" style="padding: 4px 0; gap: 4px;">
        <h4 style="color: var(--text-primary); margin: 0 0 6px 0; font-size: 14px; font-weight: 600;">Results (Chart &amp; Table)</h4>
        <div class="help-results-section" data-source-window="${sourceWindowId || ''}">
          <div class="calc-chart-container" style="margin: 4px 0 8px 0;">
            <canvas id="help-chart-${windowId}"></canvas>
          </div>
          <div class="calc-timeseries-table-wrapper">
            <table class="calc-timeseries-table" id="help-table-${windowId}">
              <thead><tr><th>Seg</th><th>t (s)</th><th>d (m)</th><th>q (kW/m²)</th><th>FED</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
        <div id="${reportId}" style="font-size: 12px; line-height: 1.4; color: var(--text-primary); margin-top: 12px;">
          <h3 style="margin: 12px 0 4px 0; font-size: 14px;">FED RADIATION CALCULATION REPORT</h3>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary);">Reference: Point-source radiation model — Fractional Effective Dose (ISO 13571 / SFPE Handbook)</p>
          <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Input Parameters</h4>
          <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
            <tr style="background:var(--button-hover);"><th style="text-align:left; ${bdr}">Parameter</th><th style="${bdr}">Value</th><th style="${bdr}">Unit</th></tr>
            ${inputTable}
          </table>
          <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Calculation Methodology</h4>
          <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">${methodology}</div>
          <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Worked Example</h4>
          <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">${workedExample}</div>
          ${resultsTable}
        </div>
        <div style="margin-top: 8px; display: flex; justify-content: flex-end;"><button id="${copyBtnId}" class="action-btn" style="padding: 6px 14px; background: var(--primary-color); color: white;" onclick="var r=document.getElementById('${reportId}');var b=event.target;if(r&&navigator.clipboard)navigator.clipboard.writeText(r.innerText||r.textContent).then(function(){b.textContent='Copied!';setTimeout(function(){b.textContent='Copy Report to Clipboard';},2000);});">Copy Report to Clipboard</button></div>
      </div>
    `;
  },

  _checkTriangle(a, b, c) {
    return (a + b > c) && (a + c > b) && (b + c > a);
  },

  _readSegments(windowId) {
    const pc = this.getPointCount(windowId);
    const segments = [];
    for (let p = 0; p < pc - 1; p++) {
      const distA = document.getElementById(`fed-dist-${windowId}-${p}`);
      const distB = document.getElementById(`fed-dist-${windowId}-${p + 1}`);
      const lenEl = document.getElementById(`fed-len-${windowId}-${p}`);
      const dOA = distA ? parseFloat(distA.value) : NaN;
      const dOB = distB ? parseFloat(distB.value) : NaN;
      const L = lenEl ? parseFloat(lenEl.value) : NaN;
      if (isNaN(dOA) || isNaN(dOB) || isNaN(L) || dOA <= 0 || dOB <= 0 || L <= 0) return null;
      if (!this._checkTriangle(dOA, dOB, L)) {
        return { error: true, segment: p, labels: [POINT_LABELS[p], POINT_LABELS[p + 1]], sides: [dOA, dOB, L] };
      }
      segments.push({ dOA, dOB, L });
    }
    return segments;
  },

  calculate(windowId) {
    const getEl = (id) => document.getElementById(`${id}-${windowId}`);
    const resultEl = getEl('result');
    const result2El = getEl('result2');
    if (!resultEl) return;

    const speed = parseFloat(getEl('input1')?.value) || 1.2;
    const dt = parseFloat(getEl('input2')?.value) || 0.1;
    const Q = parseFloat(getEl('input3')?.value);
    const chiRad = parseFloat(getEl('input4')?.value) || 0.4;
    const r = parseFloat(getEl('input5')?.value) || 1.67;

    if (isNaN(Q) || Q <= 0) {
      resultEl.value = ''; resultEl.placeholder = '—';
      if (result2El) { result2El.value = ''; result2El.placeholder = '—'; }
      this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
      this._lastTimeSeriesByWindow[windowId] = null;
      return;
    }

    // Clear any previous warning
    const warnEl = document.getElementById(`fed-warning-${windowId}`);
    if (warnEl) warnEl.style.display = 'none';

    const segments = this._readSegments(windowId);

    if (segments && segments.error) {
      resultEl.value = ''; resultEl.placeholder = '—';
      if (result2El) { result2El.value = ''; result2El.placeholder = '—'; }
      this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
      this._lastTimeSeriesByWindow[windowId] = null;
      if (warnEl) {
        const s = segments.sides;
        const app = document.getElementById('app');
        const dark = app && (app.classList.contains('theme-dark') || !app.classList.contains('theme-light'));
        warnEl.style.background = dark ? '#2a2a2a' : '#fff3cd';
        warnEl.style.color = dark ? '#cccccc' : '#856404';
        warnEl.style.border = dark ? '1px solid #444444' : '1px solid #ffc107';
        warnEl.textContent = `⚠ Segment ${segments.labels[0]}→${segments.labels[1]}: sides ${s[0]}, ${s[1]}, ${s[2]} do not form a valid triangle (each side must be less than the sum of the other two).`;
        warnEl.style.display = 'block';
      }
      return;
    }

    if (!segments || segments.length === 0) {
      resultEl.value = ''; resultEl.placeholder = '—';
      if (result2El) { result2El.value = ''; result2El.placeholder = '—'; }
      this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
      this._lastTimeSeriesByWindow[windowId] = null;
      return;
    }

    const result = runFEDCalculationMulti({ speed, dt, Q, chiRad, r, segments });

    this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
    this._lastTimeSeriesByWindow[windowId] = result.timeSeries;

    resultEl.value = result.finalFED.toFixed(4);
    resultEl.placeholder = '';
    if (result2El) {
      result2El.value = result.maxFlux.toFixed(4);
      result2El.placeholder = '';
    }

    if (typeof window !== 'undefined' && window.state && window.state.windows) {
      const helpWin = window.state.windows.find(w => w.sourceWindowId === windowId && w.type === 'FED-help');
      if (helpWin && !helpWin.minimized) {
        setTimeout(() => this.updateHelpContent(helpWin.id, windowId), 0);
      }
    }
  },

  updateHelpContent(helpWindowId, sourceWindowId) {
    const timeSeries = (this._lastTimeSeriesByWindow || {})[sourceWindowId];
    const tableBody = document.querySelector(`#help-table-${helpWindowId} tbody`);
    const chartCanvas = document.getElementById(`help-chart-${helpWindowId}`);

    if (!timeSeries || timeSeries.length === 0) {
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="color: var(--text-secondary); text-align: center;">Run the calculator first to see results</td></tr>';
      if (chartCanvas && this._helpChartInstances && this._helpChartInstances[helpWindowId]) {
        this._helpChartInstances[helpWindowId].destroy();
        this._helpChartInstances[helpWindowId] = null;
      }
      return;
    }

    const maxRows = 500;
    const step = timeSeries.length > maxRows ? Math.ceil(timeSeries.length / maxRows) : 1;
    const sampled = timeSeries.filter((_, i) => i % step === 0 || i === timeSeries.length - 1);

    if (tableBody) {
      tableBody.innerHTML = sampled.map(row =>
        `<tr><td>${row.seg}</td><td>${Number(row.t).toFixed(2)}</td><td>${Number(row.d).toFixed(3)}</td><td>${Number(row.q).toFixed(4)}</td><td>${Number(row.FED).toFixed(6)}</td></tr>`
      ).join('');
    }

    if (chartCanvas && typeof Chart !== 'undefined') {
      if (this._helpChartInstances && this._helpChartInstances[helpWindowId]) {
        this._helpChartInstances[helpWindowId].destroy();
      }
      this._helpChartInstances = this._helpChartInstances || {};
      const app = document.getElementById('app');
      const isDark = app && (app.classList.contains('theme-dark') || !app.classList.contains('theme-light'));
      const textColor = isDark ? '#cccccc' : '#1e1e1e';
      const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

      const chartSampled = sampled;

      this._helpChartInstances[helpWindowId] = new Chart(chartCanvas, {
        type: 'line',
        data: {
          labels: chartSampled.map(d => Number(d.t).toFixed(1)),
          datasets: [
            {
              label: 'Radiation flux (kW/m²)',
              data: chartSampled.map(d => d.q),
              borderColor: 'rgb(255, 99, 71)',
              backgroundColor: 'rgba(255, 99, 71, 0.1)',
              fill: false,
              tension: 0.2,
              yAxisID: 'y'
            },
            {
              label: 'Cumulative FED',
              data: chartSampled.map(d => d.FED),
              borderColor: 'rgb(0, 161, 155)',
              backgroundColor: 'rgba(0, 161, 155, 0.1)',
              fill: false,
              tension: 0.2,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, labels: { color: textColor, font: { size: 11 } } }
          },
          scales: {
            x: {
              title: { display: true, text: 'Time (s)', color: textColor },
              ticks: { color: textColor, maxTicksLimit: 12 },
              grid: { color: gridColor }
            },
            y: {
              type: 'linear',
              position: 'left',
              title: { display: true, text: 'Flux (kW/m²)', color: textColor },
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            y1: {
              type: 'linear',
              position: 'right',
              title: { display: true, text: 'FED', color: textColor },
              ticks: { color: textColor },
              grid: { drawOnChartArea: false }
            }
          }
        }
      });
    }
  },

  clear(windowId) {
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) el.value = '';
    }
    const pc = this.getPointCount(windowId);
    for (let p = 0; p < pc; p++) {
      const d = document.getElementById(`fed-dist-${windowId}-${p}`);
      const l = document.getElementById(`fed-len-${windowId}-${p}`);
      if (d) d.value = '';
      if (l) l.value = '';
    }
    this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
    this._lastTimeSeriesByWindow[windowId] = null;
    this.calculate(windowId);
  },

  saveInputValues(windowId) {
    const saved = { pointCount: this.getPointCount(windowId) };
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) saved[`input${i}`] = el.value;
    }
    const pc = saved.pointCount;
    saved.distances = [];
    saved.lengths = [];
    for (let p = 0; p < pc; p++) {
      const d = document.getElementById(`fed-dist-${windowId}-${p}`);
      const l = document.getElementById(`fed-len-${windowId}-${p}`);
      saved.distances.push(d ? d.value : '');
      saved.lengths.push(l ? l.value : '');
    }
    return saved;
  },

  restoreInputValues(windowId, savedValues) {
    if (!savedValues) return;
    if (savedValues.pointCount) this.setPointCount(windowId, savedValues.pointCount);
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el && savedValues[`input${i}`] !== undefined) el.value = savedValues[`input${i}`];
    }
    const pc = this.getPointCount(windowId);
    if (savedValues.distances) {
      for (let p = 0; p < pc && p < savedValues.distances.length; p++) {
        const d = document.getElementById(`fed-dist-${windowId}-${p}`);
        if (d) d.value = savedValues.distances[p];
      }
    }
    if (savedValues.lengths) {
      for (let p = 0; p < pc && p < savedValues.lengths.length; p++) {
        const l = document.getElementById(`fed-len-${windowId}-${p}`);
        if (l) l.value = savedValues.lengths[p];
      }
    }
    this.calculate(windowId);
  },

  restoreStateBeforeRender(windowId, savedValues) {
    if (savedValues && savedValues.pointCount) {
      this.setPointCount(windowId, savedValues.pointCount);
    }
  },

  attachEvents(windowId) {
    const addBtn = document.querySelector(`.fed-add-pt-btn[data-window-id="${windowId}"]`);
    const removeBtn = document.querySelector(`.fed-remove-pt-btn[data-window-id="${windowId}"]`);

    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pc = this.getPointCount(windowId);
        if (pc >= FED_MAX_POINTS) return;
        this.setPointCount(windowId, pc + 1);
        if (typeof window !== 'undefined' && window.renderWindows) window.renderWindows();
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pc = this.getPointCount(windowId);
        if (pc <= FED_MIN_POINTS) return;
        this.setPointCount(windowId, pc - 1);
        if (typeof window !== 'undefined' && window.renderWindows) window.renderWindows();
      });
    }
  }
};
