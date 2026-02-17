// Fire Plume Calculator
// Based on external lib/fse_plume.py

// Equation 10: Virtual fire origin (PD 7974)
function eq_10_virtual_origin(D, Q_dot_kW) {
  return -1.02 * D + 0.083 * Math.pow(Q_dot_kW, 2 / 5);
}

// Fire plume region: 0=flame, 1=intermittent, 2=plume
function fire_plume_region(Q_dot_conv_kW, z) {
  const region_check = z / Math.pow(Q_dot_conv_kW, 2 / 5);
  if (region_check < 0.08) return 0;
  if (region_check > 0.2) return 2;
  return 1;
}

// Centre-line temperature rise (K)
function fire_plume_temperature_rise_centreline(Q_dot_conv_kW, z, region, T_0) {
  const C = 0.9;
  let k, nu;
  if (region === 0) { k = 6.8; nu = 1 / 2; }
  else if (region === 1) { k = 1.9; nu = 0; }
  else if (region === 2) { k = 1.1; nu = -1 / 3; }
  else return 0;

  const z_Q_c_factor = z / Math.pow(Q_dot_conv_kW, 2 / 5);
  const delta_T = (Math.pow(k / C, 2) * Math.pow(z_Q_c_factor, 2 * nu - 1) * T_0) / (2 * 9.81);
  return delta_T;
}

// Plume diameter at height z (SFPE Handbook)
function __plume_diameter(Q_dot_kW, Q_dot_dd_kW_m2, z, T_c, coeff, T_0) {
  const r = Math.sqrt((Q_dot_kW / Q_dot_dd_kW_m2) / Math.PI);
  const z_0 = eq_10_virtual_origin(2 * r, Q_dot_kW);
  return coeff * Math.sqrt(T_c / T_0) * (z - z_0);
}

function plume_diameter_visible(Q_dot_kW, Q_dot_dd_kW_m2, z, T_c, T_0) {
  return __plume_diameter(Q_dot_kW, Q_dot_dd_kW_m2, z, T_c, 0.48, T_0);
}

const FirePlumeCalculator = {
  type: 'FirePlume',
  name: 'Fire Plume',
  icon: '🔥',

  getInputCount() { return 4; },
  getOutputCount() { return 3; },

  getMinimumSize() {
    const titleBarHeight = 40, windowContentPadding = 32, formGap = 15;
    const inputSectionHeight = 44, outputSectionHeight = 44, dividerHeight = 7, actionsHeight = 64;
    const inputCount = 4, outputCount = 3, totalFieldCount = inputCount + outputCount;
    const minHeight = titleBarHeight + windowContentPadding +
      inputCount * inputSectionHeight + outputCount * outputSectionHeight +
      (totalFieldCount + 1) * formGap + dividerHeight + actionsHeight + 15;
    return { width: 400, height: minHeight };
  },

  getHTML(windowId) {
    return `
      <div class="form-calculator" id="calc-${windowId}">
        <div class="calc-input-section">
          <div class="calc-section">
            <label class="calc-label">Convective HRR (kW)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Height (m)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">HRR Density (kW/m²)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Ambient Temp (K)</label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="293.15" min="0" data-window-id="${windowId}">
          </div>
        </div>
        <div class="calc-divider">
          <div class="divider-line"></div>
          <div class="divider-label">Results</div>
          <div class="divider-line"></div>
        </div>
        <div class="calc-output-section">
          <div class="calc-section">
            <label class="calc-label">Temperature Rise</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-output-wrapper">
                <input type="text" class="calc-output" id="result1-${windowId}" placeholder="—" readonly>
                <span class="calc-output-unit">K</span>
              </div>
            </div>
          </div>
          <div class="calc-section">
            <label class="calc-label">Region</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-output-wrapper">
                <input type="text" class="calc-output" id="result2-${windowId}" placeholder="—" readonly>
              </div>
            </div>
          </div>
          <div class="calc-section">
            <label class="calc-label">Plume Diameter (m)</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-output-wrapper">
                <input type="text" class="calc-output" id="result3-${windowId}" placeholder="—" readonly>
                <span class="calc-output-unit">m</span>
              </div>
            </div>
          </div>
        </div>
        <div class="calc-actions" style="position: relative; display: flex; justify-content: space-between; gap: 8px;">
          <button class="action-btn clear-btn" data-window-id="${windowId}">Clear</button>
          <button class="action-btn export-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Export</button>
          <button class="action-btn import-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Import</button>
          <button class="action-btn help-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Detail</button>
        </div>
      </div>
    `;
  },

  getHelpHTML(windowId, sourceWindowId) {
    let Q = null, z = null, Qdd = null, T0 = null;
    if (sourceWindowId) {
      const g = (id) => document.getElementById(`${id}-${sourceWindowId}`);
      Q = g('input1')?.value ? parseFloat(g('input1').value) : null;
      z = g('input2')?.value ? parseFloat(g('input2').value) : null;
      Qdd = g('input3')?.value ? parseFloat(g('input3').value) : null;
      T0 = g('input4')?.value ? parseFloat(g('input4').value) : null;
    }
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 4px 0; gap: 4px;">
        <p style="color: var(--text-secondary); line-height: 1.3; margin: 0; font-size: 13px;">
          SFPE Handbook Chapter 51 — Centre-line temperature rise, plume region, and visible plume diameter.
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 1px 0; font-size: 14px; font-weight: 600;">Step 1: Input data</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0 0 4px 0; font-size: 13px;">
          <strong>Q</strong> (Convective HRR, kW) = ${Q != null ? Q : '—'}<br>
          <strong>z</strong> (Height, m) = ${z != null ? z : '—'}<br>
          <strong>HRR density</strong> (kW/m²) = ${Qdd != null ? Qdd : '—'}<br>
          <strong>T₀</strong> (Ambient, K) = ${T0 != null ? T0 : '—'}
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 2: Region</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0 0 4px 0; font-size: 13px;">
          <strong>Flame:</strong> z/Q^0.4 &lt; 0.08. <strong>Intermittent:</strong> 0.08–0.2. <strong>Plume:</strong> &gt; 0.2.
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 3: Outputs</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0; font-size: 13px;">
          Temperature rise (K), region, visible plume diameter (m) — SFPE Eq 51.54.
        </p>
      </div>
    `;
  },

  calculate(windowId) {
    const r1 = document.getElementById(`result1-${windowId}`);
    const r2 = document.getElementById(`result2-${windowId}`);
    const r3 = document.getElementById(`result3-${windowId}`);
    if (!r1 || !r2 || !r3) return;

    const Q_dot_conv_kW = parseFloat(document.getElementById(`input1-${windowId}`).value);
    const z = parseFloat(document.getElementById(`input2-${windowId}`).value);
    const Q_dot_dd_kW_m2 = parseFloat(document.getElementById(`input3-${windowId}`).value);
    const T_0 = document.getElementById(`input4-${windowId}`).value.trim() === '' ? 293.15 : parseFloat(document.getElementById(`input4-${windowId}`).value) || 293.15;

    if (isNaN(Q_dot_conv_kW) || isNaN(z) || isNaN(Q_dot_dd_kW_m2) || Q_dot_conv_kW <= 0 || z <= 0 || Q_dot_dd_kW_m2 <= 0) {
      r1.value = r2.value = r3.value = '';
      r1.placeholder = r2.placeholder = r3.placeholder = '—';
      return;
    }

    const region = fire_plume_region(Q_dot_conv_kW, z);
    const regionNames = ['Flame', 'Intermittent', 'Plume'];
    const delta_T = fire_plume_temperature_rise_centreline(Q_dot_conv_kW, z, region, T_0);
    const T_c = T_0 + delta_T;

    let diameter = 0;
    if (z > 0) {
      const r = Math.sqrt((Q_dot_conv_kW / Q_dot_dd_kW_m2) / Math.PI);
      const z_0 = eq_10_virtual_origin(2 * r, Q_dot_conv_kW);
      if (z > z_0) {
        diameter = plume_diameter_visible(Q_dot_conv_kW, Q_dot_dd_kW_m2, z, T_c, T_0);
        if (diameter < 0) diameter = 0;
      }
    }

    r1.value = delta_T.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    r2.value = regionNames[region];
    r3.value = diameter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    r1.placeholder = r2.placeholder = r3.placeholder = '';
  },

  clear(windowId) {
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) el.value = '';
    }
    this.calculate(windowId);
  },

  saveInputValues(windowId) {
    const saved = {};
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) saved[`input${i}`] = el.value;
    }
    return saved;
  },

  restoreInputValues(windowId, savedValues) {
    if (!savedValues) return;
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el && savedValues[`input${i}`] !== undefined) el.value = savedValues[`input${i}`];
    }
    this.calculate(windowId);
  },

  attachEvents(windowId) {}
};
