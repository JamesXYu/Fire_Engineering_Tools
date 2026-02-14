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
      (totalFieldCount + 1) * formGap + dividerHeight + actionsHeight + 5;
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

  getHelpHTML(windowId) {
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 20px;">
        <h3 style="margin-bottom: 20px; color: var(--text-primary);">Fire Plume Help</h3>
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Description</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            Calculates fire plume centre-line temperature rise, region (flame/intermittent/plume), and visible plume diameter.
            Based on fse_plume.py and SFPE Handbook Chapter 51.
          </p>
        </div>
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Inputs</h4>
          <ul style="color: var(--text-secondary); line-height: 1.6; padding-left: 20px;">
            <li><strong>Convective HRR:</strong> Convective heat release rate (kW)</li>
            <li><strong>Height:</strong> Height above fire where plume is measured (m)</li>
            <li><strong>HRR Density:</strong> Heat release rate per unit area (kW/m²)</li>
            <li><strong>Ambient Temp:</strong> Ambient temperature (K), default 293.15</li>
          </ul>
        </div>
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Outputs</h4>
          <ul style="color: var(--text-secondary); line-height: 1.6; padding-left: 20px;">
            <li><strong>Temperature Rise:</strong> Centre-line excess temperature (K)</li>
            <li><strong>Region:</strong> Flame (z/Q^0.4 &lt; 0.08), Intermittent (0.08–0.2), Plume (&gt; 0.2)</li>
            <li><strong>Plume Diameter:</strong> Visible plume diameter at height z (m), SFPE Eq 51.54</li>
          </ul>
        </div>
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
