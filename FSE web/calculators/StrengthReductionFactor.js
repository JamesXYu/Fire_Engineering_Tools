// Strength Reduction Factor Calculator
// BS EN 1993-1-2:2005 Table 3.1 - k_y,θ (reduction factor for yield strength at temperature θ_a)

// Table 3.1: θ_a (°C) -> k_y,θ
const KY_THETA_TABLE = [
  [20, 1.000], [100, 1.000], [200, 1.000], [300, 1.000], [400, 1.000],
  [500, 0.780], [600, 0.470], [700, 0.230], [800, 0.110], [900, 0.060],
  [1000, 0.040], [1100, 0.020], [1200, 0.000]
];

function k_y_theta(theta_a) {
  if (theta_a <= 20) return 1.0;
  if (theta_a >= 1200) return 0.0;
  for (let i = 0; i < KY_THETA_TABLE.length - 1; i++) {
    const [t0, k0] = KY_THETA_TABLE[i];
    const [t1, k1] = KY_THETA_TABLE[i + 1];
    if (theta_a >= t0 && theta_a <= t1) {
      return k0 + (k1 - k0) * (theta_a - t0) / (t1 - t0);
    }
  }
  return 0;
}

const StrengthReductionFactorCalculator = {
  type: 'StrengthReductionFactor',
  name: 'Strength Reduction Factor',
  icon: '📐',

  getInputCount() {
    return 1;
  },

  getOutputCount() {
    return 1;
  },

  getMinimumSize() {
    return { width: 400, height: 280 };
  },

  getHTML(windowId) {
    return `
      <div class="form-calculator" id="calc-${windowId}">
        <div class="calc-input-section">
          <div class="calc-section">
            <label class="calc-label">Steel temperature θ<sub>a</sub> (°C)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="—" min="0" max="1200" step="1" data-window-id="${windowId}">
          </div>
        </div>
        <div class="calc-divider">
          <div class="divider-line"></div>
          <div class="divider-label">Results</div>
          <div class="divider-line"></div>
        </div>
        <div class="calc-output-section">
          <div class="calc-section">
            <label class="calc-label">k<sub>y,θ</sub></label>
            <div class="calc-output-wrapper">
              <input type="text" class="calc-output" id="result-${windowId}" placeholder="—" readonly>
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
    let theta_val = null;
    let k_val = null;
    if (sourceWindowId) {
      const inputEl = document.getElementById(`input1-${sourceWindowId}`);
      const resultEl = document.getElementById(`result-${sourceWindowId}`);
      theta_val = inputEl && inputEl.value ? parseFloat(inputEl.value) : null;
      k_val = resultEl && resultEl.value ? parseFloat(resultEl.value) : null;
    }
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 4px 0; gap: 4px;">
        <p style="color: var(--text-secondary); line-height: 1.3; margin: 0; font-size: 13px;">
          BS EN 1993-1-2:2005 Table 3.1 — Reduction factor k<sub>y,θ</sub> for yield strength of carbon steel at uniform temperature θ<sub>a</sub>.
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 1px 0; font-size: 14px; font-weight: 600;">Step 1: Input data</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0 0 4px 0; font-size: 13px;">
          <strong>θ<sub>a</sub></strong> (Steel temperature, °C) = ${theta_val != null ? theta_val : '—'}
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 2: Formula</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0 0 4px 0; font-size: 13px;">
          k<sub>y,θ</sub> is obtained by linear interpolation from Table 3.1 (θ<sub>a</sub> in °C vs k<sub>y,θ</sub>).
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 3: Conclusion</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0; font-size: 13px;">
          ${k_val != null ? `<strong>k<sub>y,θ</sub> = ${k_val.toFixed(3)}</strong>` : 'Enter steel temperature to see the result.'}
        </p>
      </div>
    `;
  },

  calculate(windowId) {
    const inputEl = document.getElementById(`input1-${windowId}`);
    const resultEl = document.getElementById(`result-${windowId}`);
    if (!inputEl || !resultEl) return;

    const theta_a = parseFloat(inputEl.value);
    if (isNaN(theta_a) || theta_a < 0) {
      resultEl.value = '';
      resultEl.placeholder = '—';
      return;
    }

    const k = k_y_theta(theta_a);
    resultEl.value = k.toFixed(3);
    resultEl.placeholder = '';
  },

  clear(windowId) {
    const el = document.getElementById(`input1-${windowId}`);
    if (el) el.value = '';
    this.calculate(windowId);
  },

  saveInputValues(windowId) {
    const el = document.getElementById(`input1-${windowId}`);
    return { input1: el ? el.value : '' };
  },

  restoreInputValues(windowId, savedValues) {
    if (!savedValues) return;
    const el = document.getElementById(`input1-${windowId}`);
    if (el && savedValues.input1 !== undefined) {
      el.value = savedValues.input1;
      this.calculate(windowId);
    }
  },

  attachEvents() {}
};
