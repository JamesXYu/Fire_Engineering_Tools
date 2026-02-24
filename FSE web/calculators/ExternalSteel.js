// External Steel Temperature Calculator
// BS EN 1993-1-2 Annex B - External steel members (column and beam)
// Simplified implementation; full Annex B requires additional clause functions

const ExternalSteelMethodStorage = {};

// Simplified external steel temperature (approximation for fully engulfed)
// Full implementation requires BS EN 1991-1-2 Annex B and BS EN 1993-1-2 Annex B clause functions
function runExternalSteelColumn(inputs) {
  const {
    T_z = 900,
    T_o = 1000,
    T_f = 1200,
    d_1, d_2, w_t, h_eq, L_H, L_L,
    lambda_1 = 10, lambda_3 = 1,
    C_1 = 1, C_2 = 1, C_3 = 1, C_4 = 1,
    alpha = 25,
    is_forced_draught = false
  } = inputs;

  // Simplified: T_m ≈ weighted average of flame and opening temps (typical range)
  // Full Annex B uses view factors, emissivities, I_z, I_f, etc.
  const T_z_C = T_z - 273.15;
  const T_o_C = T_o - 273.15;
  const w_flame = 0.7;
  const w_open = 0.3;
  const T_m_C = w_flame * T_z_C + w_open * T_o_C;
  return { T_m: T_m_C + 273.15, T_m_C };
}

function runExternalSteelBeam(inputs) {
  const {
    T_z = 900,
    T_z_1 = 900,
    T_z_2 = 800,
    T_o = 1000,
    T_f = 1200,
    d_1, d_2, d_aw, w_t, h_eq, L_H, L_L,
    lambda_4 = 1,
    C_1 = 1, C_2 = 1, C_3 = 1, C_4 = 1,
    alpha = 25,
    is_forced_draught = false
  } = inputs;

  const T_z_avg = (T_z_1 + T_z_2) / 2;
  const T_z_C = (T_z_avg - 273.15);
  const T_o_C = (T_o - 273.15);
  const w_flame = 0.7;
  const w_open = 0.3;
  const T_m_C = w_flame * T_z_C + w_open * T_o_C;
  return { T_m: T_m_C + 273.15, T_m_C };
}

const ExternalSteelCalculator = {
  type: 'ExternalSteel',
  name: 'External Steel Temperature',
  icon: '🏗️',
  windowMethods: ExternalSteelMethodStorage,

  getActiveMethod(windowId) {
    if (ExternalSteelMethodStorage[windowId]) return ExternalSteelMethodStorage[windowId];
    try {
      const saved = localStorage.getItem(`externalsteel_method_${windowId}`);
      if (saved === 'column' || saved === 'beam') {
        ExternalSteelMethodStorage[windowId] = saved;
        return saved;
      }
    } catch (e) {}
    return 'column';
  },

  setActiveMethod(windowId, method) {
    ExternalSteelMethodStorage[windowId] = method;
    if (typeof window !== 'undefined' && window.localStorage) {
      try { localStorage.setItem(`externalsteel_method_${windowId}`, method); } catch (e) {}
    }
  },

  getInputCount() {
    return 12;
  },

  getOutputCount() {
    return 1;
  },

  getMinimumSize() {
    return { width: 420, height: 1030 };
  },

  getHTML(windowId) {
    const activeMethod = this.getActiveMethod(windowId);
    const isColumn = activeMethod === 'column';
    return `
      <div class="form-calculator" id="calc-${windowId}">
        <div class="method-selector" style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button class="method-btn ${isColumn ? 'active' : ''}" data-window-id="${windowId}" data-method="column"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${isColumn ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${isColumn ? 'white' : 'var(--text-primary)'}; cursor: pointer;">
            Column
          </button>
          <button class="method-btn ${!isColumn ? 'active' : ''}" data-window-id="${windowId}" data-method="beam"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${!isColumn ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${!isColumn ? 'white' : 'var(--text-primary)'}; cursor: pointer;">
            Beam
          </button>
        </div>
        <div class="calc-input-section">
          <div class="calc-section">
            <label class="calc-label">Forced draught mode (-)</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-input-wrapper">
                <select class="calc-input calc-dropdown" id="input12-${windowId}" data-window-id="${windowId}">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
          </div>
          <div class="calc-section">
            <label class="calc-label">Flame temperature T<sub>f</sub> (K)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="958" min="273" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Opening temperature T<sub>o</sub> (K)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="973" min="273" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Distance d<sub>1</sub> (m)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="0.8" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Distance d<sub>2</sub> (m)</label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="0.42" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Window width w (m)</label>
            <input type="number" class="calc-input" id="input5-${windowId}" placeholder="20.88" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Equivalent height h<sub>eq</sub> (m)</label>
            <input type="number" class="calc-input" id="input6-${windowId}" placeholder="3.3" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Horizontal length L<sub>h</sub> (m)</label>
            <input type="number" class="calc-input" id="input7-${windowId}" placeholder="6.17" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Vertical length L<sub>v</sub> (m)</label>
            <input type="number" class="calc-input" id="input8-${windowId}" placeholder="2.7" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          ${!isColumn ? `
          <div class="calc-section">
            <label class="calc-label">Distance d<sub>aw</sub> (m)</label>
            <input type="number" class="calc-input" id="input9-${windowId}" placeholder="0" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Flame thickness λ<sub>4</sub> (m)</label>
            <input type="number" class="calc-input" id="input10-${windowId}" placeholder="1" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          ` : `
          <div class="calc-section">
            <label class="calc-label">Flame thickness λ<sub>1</sub> (m)</label>
            <input type="number" class="calc-input" id="input9-${windowId}" placeholder="10" min="0" step="0.1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Flame thickness λ<sub>3</sub> (m)</label>
            <input type="number" class="calc-input" id="input10-${windowId}" placeholder="1" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          `}
          <div class="calc-section">
            <label class="calc-label">Convection coefficient α<sub>c</sub> (W/m²K)</label>
            <input type="number" class="calc-input" id="input11-${windowId}" placeholder="25" min="0" data-window-id="${windowId}">
          </div>
        </div>
        <div class="calc-divider">
          <div class="divider-line"></div>
          <div class="divider-label">Results</div>
          <div class="divider-line"></div>
        </div>
        <div class="calc-output-section">
          <div class="calc-section">
            <label class="calc-label">Member temperature</label>
            <div class="calc-output-wrapper">
              <input type="text" class="calc-output" id="result-${windowId}" placeholder="—" readonly>
              <span class="calc-output-unit">°C</span>
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
    const method = sourceWindowId ? this.getActiveMethod(sourceWindowId) : 'column';
    const isColumn = method === 'column';
    const reportId = `externalsteel-report-${windowId}`;
    const copyBtnId = `externalsteel-copy-${windowId}`;

    const getVal = (n) => {
      const el = document.getElementById(`input${n}-${srcId}`);
      const raw = el?.value?.trim();
      if (el?.tagName === 'SELECT') return raw || null;
      const v = parseFloat(raw);
      return isNaN(v) ? null : v;
    };
    const getOutput = () => {
      const el = document.getElementById(`result-${srcId}`);
      return el && el.value ? el.value : '—';
    };
    const fmt = (x) => (typeof x === 'number' && !isNaN(x) ? x.toLocaleString('en-US', { maximumFractionDigits: 4 }) : (x != null ? String(x) : '—'));

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

    const inputLabels = isColumn
      ? [
          { id: 12, label: 'Forced draught', unit: '-' },
          { id: 1, label: 'Flame temperature T_z', unit: 'K' },
          { id: 2, label: 'Opening temperature T_o', unit: 'K' },
          { id: 3, label: 'Distance d_1', unit: 'm' },
          { id: 4, label: 'Distance d_2', unit: 'm' },
          { id: 5, label: 'Window width w_t', unit: 'm' },
          { id: 6, label: 'Equivalent height h_eq', unit: 'm' },
          { id: 7, label: 'Horizontal length L_H', unit: 'm' },
          { id: 8, label: 'Vertical length L_L', unit: 'm' },
          { id: 9, label: 'Flame thickness λ_1', unit: 'm' },
          { id: 10, label: 'Flame thickness λ_3', unit: 'm' },
          { id: 11, label: 'Convection coefficient α', unit: 'W/m²K' }
        ]
      : [
          { id: 12, label: 'Forced draught', unit: '-' },
          { id: 1, label: 'Flame temperature T_z', unit: 'K' },
          { id: 2, label: 'Opening temperature T_o', unit: 'K' },
          { id: 3, label: 'Distance d_1', unit: 'm' },
          { id: 4, label: 'Distance d_2', unit: 'm' },
          { id: 5, label: 'Window width w_t', unit: 'm' },
          { id: 6, label: 'Equivalent height h_eq', unit: 'm' },
          { id: 7, label: 'Horizontal length L_H', unit: 'm' },
          { id: 8, label: 'Vertical length L_L', unit: 'm' },
          { id: 9, label: 'Distance d_aw', unit: 'm' },
          { id: 10, label: 'Flame thickness λ_4', unit: 'm' },
          { id: 11, label: 'Convection coefficient α', unit: 'W/m²K' }
        ];

    const inputTable = inputLabels.map(i => `<tr><td>${i.label}</td><td>${fmt(getVal(i.id))}</td><td>${i.unit}</td></tr>`).join('');

    const methodology = isColumn
      ? `
        <p><strong>Step 1: Mode — Column (Clause B.4)</strong></p>
        <p>External steel column fully or partially engulfed in flame.</p>
        <p><strong>Step 2: Temperature conversion</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('T_{z,C} = T_z - 273.15 \\text{ (°C)}')}</div>
        <div style="${formulaBlockStyle}">${renderMath('T_{o,C} = T_o - 273.15 \\text{ (°C)}')}</div>
        <p><strong>Step 3: Member temperature (simplified approximation)</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('T_m = 0.7 \\times T_{z,C} + 0.3 \\times T_{o,C}')}</div>
        <p><em>Weighted combination of flame and opening temperatures. Full BS EN 1993-1-2 Annex B uses view factors, emissivities (I_z, I_f), and configuration factors for improved accuracy.</em></p>`
      : `
        <p><strong>Step 1: Mode — Beam (Clause B.5)</strong></p>
        <p>External steel beam fully or partially engulfed in flame.</p>
        <p><strong>Step 2: Average flame temperature</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('T_{z,avg} = \\frac{T_{z,1} + T_{z,2}}{2}')}</div>
        <p><em>T_z,1 = flame temp at upper level, T_z,2 = flame temp at lower level.</em></p>
        <p><strong>Step 3: Temperature conversion</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('T_{z,C} = T_{z,avg} - 273.15 \\text{ (°C)}')}</div>
        <div style="${formulaBlockStyle}">${renderMath('T_{o,C} = T_o - 273.15 \\text{ (°C)}')}</div>
        <p><strong>Step 4: Member temperature (simplified approximation)</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('T_m = 0.7 \\times T_{z,C} + 0.3 \\times T_{o,C}')}</div>
        <p><em>Weighted combination of flame and opening temperatures. Full Annex B uses view factors and emissivities.</em></p>`;

    const T_z = getVal(1);
    const T_o = getVal(2);
    const memberTemp = getOutput();
    let workedExample = '';

    if (T_z != null && T_o != null && T_z >= 273 && T_o >= 273) {
      if (isColumn) {
        const T_z_C = T_z - 273.15;
        const T_o_C = T_o - 273.15;
        const T_m_C = 0.7 * T_z_C + 0.3 * T_o_C;
        workedExample = `
          <p>Given: T_z = ${fmt(T_z)} K, T_o = ${fmt(T_o)} K</p>
          <div style="${formulaBlockStyle}">${renderMath(`T_{z,C} = ${fmt(T_z)} - 273.15 = ${fmt(T_z_C)} \\text{ °C}`)}</div>
          <div style="${formulaBlockStyle}">${renderMath(`T_{o,C} = ${fmt(T_o)} - 273.15 = ${fmt(T_o_C)} \\text{ °C}`)}</div>
          <div style="${formulaBlockStyle}">${renderMath(`T_m = 0.7 \\times ${fmt(T_z_C)} + 0.3 \\times ${fmt(T_o_C)} = ${fmt(T_m_C)} \\text{ °C}`)}</div>
          <p><strong>Result:</strong> Member temperature = ${memberTemp} °C</p>`;
      } else {
        const T_z_2 = T_z * 0.9;
        const T_z_avg = (T_z + T_z_2) / 2;
        const T_z_C = T_z_avg - 273.15;
        const T_o_C = T_o - 273.15;
        const T_m_C = 0.7 * T_z_C + 0.3 * T_o_C;
        workedExample = `
          <p>Given: T_z,1 = ${fmt(T_z)} K, T_z,2 = 0.9 × T_z = ${fmt(T_z_2)} K, T_o = ${fmt(T_o)} K</p>
          <div style="${formulaBlockStyle}">${renderMath(`T_{z,avg} = \\frac{${fmt(T_z)} + ${fmt(T_z_2)}}{2} = ${fmt(T_z_avg)} \\text{ K}`)}</div>
          <div style="${formulaBlockStyle}">${renderMath(`T_{z,C} = ${fmt(T_z_avg)} - 273.15 = ${fmt(T_z_C)} \\text{ °C}`)}</div>
          <div style="${formulaBlockStyle}">${renderMath(`T_{o,C} = ${fmt(T_o)} - 273.15 = ${fmt(T_o_C)} \\text{ °C}`)}</div>
          <div style="${formulaBlockStyle}">${renderMath(`T_m = 0.7 \\times ${fmt(T_z_C)} + 0.3 \\times ${fmt(T_o_C)} = ${fmt(T_m_C)} \\text{ °C}`)}</div>
          <p><strong>Result:</strong> Member temperature = ${memberTemp} °C</p>`;
      }
    } else {
      workedExample = '<p>Enter flame temperature (T_z) and opening temperature (T_o) to see worked example.</p>';
    }

    const resultsTable = `
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Results Summary</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Output</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
        <tr style="background:var(--button-hover);"><td style="padding:6px; border:1px solid var(--window-border);"><strong>Member Temperature (T_m)</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${memberTemp}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>°C</strong></td></tr>
      </table>`;

    return `
      <div class="form-calculator window-content-help" id="help-${windowId}" style="padding: 8px 12px; gap: 4px;">
        <div id="${reportId}" style="font-size: 12px; line-height: 1.4; color: var(--text-primary);">
          <h3 style="margin: 0 0 4px 0; font-size: 14px;">EXTERNAL STEEL TEMPERATURE CALCULATION REPORT</h3>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary);">Reference: BS EN 1993-1-2 Annex B — External steel members (column B.4, beam B.5)</p>
          <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Input Parameters</h4>
          <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
            <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Parameter</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
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

  calculate(windowId) {
    const method = this.getActiveMethod(windowId);
    const getEl = (id) => document.getElementById(`${id}-${windowId}`);
    const resultEl = getEl('result');
    if (!resultEl) return;

    const T_z = parseFloat(getEl('input1').value) || 958;
    const T_o = parseFloat(getEl('input2').value) || 973;
    const d_1 = parseFloat(getEl('input3').value) || 0.8;
    const d_2 = parseFloat(getEl('input4').value) || 0.42;
    const w_t = parseFloat(getEl('input5').value) || 20.88;
    const h_eq = parseFloat(getEl('input6').value) || 3.3;
    const L_H = parseFloat(getEl('input7').value) || 6.17;
    const L_L = parseFloat(getEl('input8').value) || 2.7;
    const lambda_1 = parseFloat(getEl('input9').value) || 10;
    const lambda_3_or_4 = parseFloat(getEl('input10').value) || 1;
    const alpha = parseFloat(getEl('input11').value) || 25;
    const is_forced_draught = getEl('input12') && getEl('input12').value === 'true';

    let result;
    if (method === 'column') {
      result = runExternalSteelColumn({
        T_z, T_o, d_1, d_2, w_t, h_eq, L_H, L_L,
        lambda_1, lambda_3: lambda_3_or_4, alpha, is_forced_draught
      });
    } else {
      const d_aw = parseFloat(getEl('input9').value) || 0;
      const lambda_4 = parseFloat(getEl('input10').value) || 1;
      result = runExternalSteelBeam({
        T_z, T_o, d_1, d_2, d_aw, w_t, h_eq, L_H, L_L,
        lambda_4, T_z_1: T_z, T_z_2: T_z * 0.9, alpha, is_forced_draught
      });
    }

    resultEl.value = result.T_m_C.toFixed(1);
    resultEl.placeholder = '';
  },

  clear(windowId) {
    for (let i = 1; i <= 12; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) {
        if (i === 12) el.value = 'false';
        else el.value = '';
      }
    }
    this.calculate(windowId);
  },

  saveInputValues(windowId) {
    const saved = { method: this.getActiveMethod(windowId) };
    for (let i = 1; i <= 12; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) saved[`input${i}`] = el.value;
    }
    return saved;
  },

  restoreInputValues(windowId, savedValues) {
    if (!savedValues) return;
    if (savedValues.method) this.setActiveMethod(windowId, savedValues.method);
    for (let i = 1; i <= 12; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el && savedValues[`input${i}`] !== undefined) el.value = savedValues[`input${i}`];
    }
    this.calculate(windowId);
  },

  restoreStateBeforeRender(windowId, savedValues) {
    if (savedValues && savedValues.method) this.setActiveMethod(windowId, savedValues.method);
  },

  attachEvents(windowId) {
    document.querySelectorAll(`.method-btn[data-window-id="${windowId}"]`).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setActiveMethod(windowId, btn.getAttribute('data-method'));
        if (typeof window !== 'undefined' && window.renderWindows) window.renderWindows();
      });
    });
    const forcedDraughtSelect = document.getElementById(`input12-${windowId}`);
    if (forcedDraughtSelect && forcedDraughtSelect.tagName === 'SELECT') {
      forcedDraughtSelect.addEventListener('change', () => this.calculate(windowId));
    }
  }
};
