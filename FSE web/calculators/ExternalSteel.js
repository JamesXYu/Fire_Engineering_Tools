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
            <label class="calc-label">Forced draught</label>
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
            <label class="calc-label">Flame temperature (K)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="958" min="273" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Opening temperature (K)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="973" min="273" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Distance 1 (m)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="0.8" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Distance 2 (m)</label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="0.42" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Window width (m)</label>
            <input type="number" class="calc-input" id="input5-${windowId}" placeholder="20.88" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Equivalent height (m)</label>
            <input type="number" class="calc-input" id="input6-${windowId}" placeholder="3.3" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Horizontal length (m)</label>
            <input type="number" class="calc-input" id="input7-${windowId}" placeholder="6.17" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Vertical length (m)</label>
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
            <label class="calc-label">Convection coefficient (W/m²K)</label>
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
    const method = sourceWindowId ? this.getActiveMethod(sourceWindowId) : 'column';
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 20px;">
        <h3 style="margin-bottom: 16px; color: var(--text-primary);">External Steel Temperature – Detail</h3>
        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
          BS EN 1993-1-2 Annex B – Temperature of external steel members fully or partially engulfed in flame.
        </p>
        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
          <strong>Note:</strong> This calculator uses a simplified approximation. Full accuracy requires the complete Annex B clause functions from BS EN 1991-1-2 and BS EN 1993-1-2 (view factors, emissivities, radiative heat flux I_z, I_f, etc.).
        </p>
        <h4 style="color: var(--text-primary); margin-bottom: 8px;">${method === 'column' ? 'Column' : 'Beam'} – Clause B.${method === 'column' ? '4' : '5'}</h4>
        <p style="color: var(--text-secondary); line-height: 1.6;">
          Inputs: T_z (flame temp), T_o (opening temp), member dimensions (d_1, d_2), window geometry (w_t, h_eq), flame dimensions (L_H, L_L), view factor coefficients (C_1–C_4), λ (flame thickness).
        </p>
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
