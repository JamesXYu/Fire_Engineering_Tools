// Parametric Fire Calculator
// BS EN 1991-1-2 Appendix A (Eurocode) and DIN EN 1991-1-2/NA Appendix AA (German Annex)

const heatStorageOptions = [
  { value: '2500', label: 'Group 1: 2500' },
  { value: '1500', label: 'Group 2: 1500' },
  { value: '750', label: 'Group 3: 750' }
];

const ParametricFireMethodStorage = {};

// ========== BS EN 1991-1-2 Appendix A ==========
function eq_3_12_T_g(t_star, T_0) {
  return 1325 * (1 - 0.324 * Math.exp(-0.2 * t_star) - 0.204 * Math.exp(-1.7 * t_star) - 0.472 * Math.exp(-19 * t_star)) + T_0;
}

function eq_3_16_T_g(t_star_max, T_max, t_star) {
  if (t_star_max <= 0.5) return T_max - 625 * (t_star - t_star_max);
  if (t_star_max < 2.0) return T_max - 250 * (3 - t_star_max) * (t_star - t_star_max);
  return T_max - 250 * (t_star - t_star_max);
}

function eq_3_22_T_g(t_star_max, T_max, t_star, Gamma, t_lim_hr) {
  const term = Gamma * t_lim_hr;
  if (t_star_max <= 0.5) return T_max - 625 * (t_star - term);
  if (t_star_max < 2.0) return T_max - 250 * (3 - t_star_max) * (t_star - term);
  return T_max - 250 * (t_star - term);
}

function runParametricFireBSEN(inputs) {
  const { t_end = 3600, dt = 60, A_t, A_f, A_v, h_eq, q_fd_MJ, lbd, rho, c, t_lim, T_0_C = 20 } = inputs;
  const q_fd = q_fd_MJ * 1e6;
  const t_lim_hr = (t_lim || t_end) / 3600;
  const T_0 = T_0_C;

  const b = Math.sqrt(lbd * rho * c);
  const O = (A_v * Math.sqrt(h_eq)) / A_t;
  const q_td = (q_fd / 1e6) * A_f / A_t;
  const Gamma = Math.pow((O / 0.04) / (b / 1160), 2);
  const t_max_hr = 0.0002 * q_td / O;

  const t_arr = [];
  for (let ti = 0; ti <= t_end; ti += dt) t_arr.push(ti);

  const T_arr = [];
  for (let i = 0; i < t_arr.length; i++) {
    const t_s = t_arr[i];
    const t_hr = t_s / 3600;
    const t_star = Gamma * t_hr;
    const t_star_max = Gamma * t_max_hr;

    let T_g_heating, T_g_cooling;
    if (t_max_hr >= t_lim_hr) {
      const T_max = eq_3_12_T_g(t_star_max, T_0);
      T_g_heating = eq_3_12_T_g(t_star, T_0);
      T_g_cooling = eq_3_16_T_g(t_star_max, T_max, t_star);
    } else {
      const O_lim = 0.0001 * q_td / t_lim_hr;
      let Gamma_lim = Math.pow((O_lim / 0.04) / (b / 1160), 2);
      if (O > 0.04 && q_td < 75 && b < 1160) {
        const k = 1 + ((O - 0.04) / 0.04) * ((q_td - 75) / 75) * ((1160 - b) / 1160);
        Gamma_lim *= k;
      }
      const t_star_f = Gamma_lim * t_hr;
      const t_star_max_f = Gamma_lim * t_lim_hr;
      const T_max = eq_3_12_T_g(t_star_max_f, T_0);
      T_g_heating = eq_3_12_T_g(t_star_f, T_0);
      T_g_cooling = eq_3_22_T_g(t_star_max, T_max, t_star, Gamma, t_lim_hr);
    }
    let T_g = Math.min(T_g_heating, T_g_cooling);
    if (T_g < T_0) T_g = T_0;
    T_arr.push(T_g);
  }

  const timeSeries = t_arr.map((t, i) => ({ t, T: T_arr[i] }));
  return { timeSeries, peakTemperature: Math.max(...T_arr), fireType: 'parametric' };
}

// ========== DIN EN 1991-1-2/NA Appendix AA ==========
// AA.26 - AA.28: Temperature vs time
function T_t(t, t_1, t_2_x, t_3_x, T_1, T_2_x, T_3_x, T_0) {
  T_0 = T_0 ?? 20;
  const T = [];
  for (let i = 0; i < t.length; i++) {
    const ti = t[i];
    let val;
    if (0 <= ti && ti <= t_1) {
      val = ((T_1 - 20) / (t_1 * t_1)) * ti * ti + 20;
    } else if (t_1 <= ti && ti <= t_2_x) {
      val = (T_2_x - T_1) * Math.pow((ti - t_1) / (t_2_x - t_1), 0.5) + T_1;
    } else if (ti > t_2_x) {
      val = (T_3_x - T_2_x) * Math.pow((ti - t_2_x) / (t_3_x - t_2_x), 0.5) + T_2_x;
    } else {
      val = T_0;
    }
    T.push(Math.max(val, T_0));
  }
  return T;
}

function runParametricFireDIN(inputs) {
  const {
    t_end = 3600,
    dt = 60,
    A_w,
    h_w,
    A_t,
    A_f,
    t_alpha = 300,
    b,
    q_x_d,
    gamma_fi_Q = 1.0,
    q_ref = 1300e6,
    rho_Q_dot = 0.25e6
  } = inputs;

  let q_x_d_MJ = q_x_d / 1e6;
  let rho_Q_dot_MW = rho_Q_dot / 1e6;
  let q_ref_MJ = q_ref / 1e6;

  // AA.1
  const Q_max_v_k = 1.21 * A_w * Math.sqrt(h_w);

  // AA.2
  const Q_max_f_k = rho_Q_dot_MW * A_f;

  // AA.3
  const Q_max_k = Math.min(Q_max_f_k, Q_max_v_k);

  // AA.5, AA.6
  const Q_max_v_d = gamma_fi_Q * Q_max_v_k;
  const Q_max_f_d = gamma_fi_Q * Q_max_f_k;
  const Q_max_d = gamma_fi_Q * Q_max_k;

  const fire_type = Q_max_v_k === Q_max_k ? 0 : 1; // 0 = ventilation, 1 = fuel

  const O = (A_w * Math.pow(h_w, 0.5)) / A_t;
  const Q_d = q_ref_MJ * A_f;
  const Q_x_d = q_x_d_MJ * A_f;

  let t_1, t_2, t_2_x, t_3_x, t_3, T_1, T_2_x, T_3_x, T_3;

  if (fire_type === 0) {
    t_1 = t_alpha * Math.sqrt(Q_max_v_d);
    const T_1_v = -8.75 / O - 0.1 * b + 1175;
    let Q_1 = (t_1 * t_1 * t_1) / (3 * t_alpha * t_alpha);
    const Q_2 = 0.7 * Q_d - Q_1;
    t_2 = t_1 + Q_2 / Q_max_v_d;
    const T_2_v = Math.min(1340, (0.004 * b - 17) / O - 0.4 * b + 2175);
    const Q_3 = 0.3 * Q_d;
    t_3 = t_2 + (2 * Q_3) / Q_max_v_d;
    T_3 = -5.0 / O - 0.16 * b + 1060;
    T_1 = T_1_v;
    T_2_x = T_2_v;
    T_3_x = T_3;
  } else {
    const k = Math.pow((Q_max_f_d * Q_max_f_d) / (A_w * Math.pow(h_w, 0.5) * (A_t - A_w) * b), 1 / 3);
    t_1 = t_alpha * Math.pow(Q_max_f_d, 0.5);
    let Q_1 = (t_1 * t_1 * t_1) / (3 * t_alpha * t_alpha);
    const Q_2 = 0.7 * Q_d - Q_1;
    t_2 = t_1 + Q_2 / Q_max_f_d;
    const T_1_f = Math.min(980, 24000 * k + 20);
    const T_2_f = Math.min(1340, 33000 * k + 20);
    t_3 = t_2 + (2 * (0.3 * Q_d)) / Q_max_f_d;
    T_3 = Math.min(660, 16000 * k + 20);
    T_1 = T_1_f;
    T_2_x = T_2_f;
    T_3_x = T_3;
  }

  let Q_1 = (t_1 * t_1 * t_1) / (3 * t_alpha * t_alpha);

  if (Q_1 < 0.7 * Q_x_d) {
    t_2_x = t_1 + (0.7 * Q_x_d - Q_1) / Q_max_d;
    T_2_x = (T_2_x - T_1) * Math.pow((t_2_x - t_1) / (t_2 - t_1), 0.5) + T_1;
  } else {
    t_2_x = Math.pow(0.7 * Q_x_d * 3 * t_alpha * t_alpha, 1 / 3);
    T_2_x = ((T_1 - 20) / (t_1 * t_1)) * t_2_x * t_2_x + 20;
  }

  t_3_x = 0.6 * Q_x_d / Q_max_d + t_2_x;
  T_3_x = T_3 * Math.log10(t_3_x / 60 + 1) / Math.log10(t_3 / 60 + 1);

  // Flashover check AA.29, AA.30
  const Q_fo = 0.0078 * A_t + 0.378 * A_w * Math.pow(h_w, 0.5);
  const t_1_fo = Math.sqrt(t_alpha * t_alpha * Q_fo);
  t_1 = Math.min(t_1, t_1_fo);

  // Generate time array
  const t_arr = [];
  for (let ti = 0; ti <= t_end; ti += dt) {
    t_arr.push(ti);
  }

  const T_arr = T_t(t_arr, t_1, t_2_x, t_3_x, T_1, T_2_x, T_3_x, 20);

  const timeSeries = t_arr.map((ti, i) => ({
    t: ti,
    T: T_arr[i]
  }));

  const peakTemperature = Math.max(...T_arr);

  return {
    timeSeries,
    peakTemperature,
    fireType: fire_type === 0 ? 'ventilation' : 'fuel'
  };
}

const ParametricFireCalculator = {
  type: 'ParametricFire',
  name: 'Parametric Fire',
  icon: '🔥',
  hasTimeSeries: true,
  windowMethods: ParametricFireMethodStorage,

  getActiveMethod(windowId) {
    if (ParametricFireMethodStorage[windowId]) return ParametricFireMethodStorage[windowId];
    try {
      const saved = localStorage.getItem(`parametricfire_method_${windowId}`);
      if (saved === 'BSEN' || saved === 'DINEN') {
        ParametricFireMethodStorage[windowId] = saved;
        return saved;
      }
    } catch (e) {}
    return 'BSEN';
  },

  setActiveMethod(windowId, method) {
    ParametricFireMethodStorage[windowId] = method;
    if (typeof window !== 'undefined' && window.localStorage) {
      try { localStorage.setItem(`parametricfire_method_${windowId}`, method); } catch (e) {}
    }
  },

  getInputCount() {
    return 12;
  },

  getOutputCount() {
    return 1;
  },

  getMinimumSize() {
    const titleBarHeight = 40;
    const windowContentPadding = 32;
    const formGap = 15;
    const inputSectionHeight = 44;
    const outputSectionHeight = 44;
    const dividerHeight = 7;
    const actionsHeight = 64;
    const methodButtonHeight = 50;
    const maxInputCount = 12;
    const outputCount = 1;
    const totalFieldCount = maxInputCount + outputCount;
    const inputSectionsHeight = maxInputCount * inputSectionHeight;
    const outputSectionsHeight = outputCount * outputSectionHeight;
    const totalSectionsHeight = inputSectionsHeight + outputSectionsHeight;
    const gapsHeight = (totalFieldCount + 1) * formGap;
    const minHeight = titleBarHeight + windowContentPadding + methodButtonHeight + totalSectionsHeight + gapsHeight + dividerHeight + actionsHeight + 90;
    return { width: 480, height: minHeight };
  },

  getHTML(windowId) {
    const activeMethod = this.getActiveMethod(windowId);
    const isBSEN = activeMethod === 'BSEN';
    return `
      <div class="form-calculator form-calculator-timeseries" id="calc-${windowId}">
        <div class="method-selector" style="display: flex; gap: 8px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--window-border);">
          <button class="method-btn ${isBSEN ? 'active' : ''}" data-window-id="${windowId}" data-method="BSEN"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${isBSEN ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${isBSEN ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500;">
            BS EN
          </button>
          <button class="method-btn ${!isBSEN ? 'active' : ''}" data-window-id="${windowId}" data-method="DINEN"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${!isBSEN ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${!isBSEN ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500;">
            DIN EN
          </button>
        </div>
        <div class="calc-input-section">
          <div class="calc-section">
            <label class="calc-label">Duration (s)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="3600" min="1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Time step (s)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="60" min="1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Total surface A<sub>t</sub> (m²)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="—" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Floor area A<sub>f</sub> (m²)</label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="—" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          ${isBSEN ? `
          <div class="calc-section">
            <label class="calc-label">Opening area A<sub>v</sub> (m²)</label>
            <input type="number" class="calc-input" id="input5-${windowId}" placeholder="—" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Opening height h<sub>eq</sub> (m)</label>
            <input type="number" class="calc-input" id="input6-${windowId}" placeholder="—" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Fire load q<sub>fd</sub> (MJ/m²)</label>
            <input type="number" class="calc-input" id="input7-${windowId}" placeholder="—" min="0" step="1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Lining λ (W/mK)</label>
            <input type="number" class="calc-input" id="input8-${windowId}" placeholder="—" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Lining ρ (kg/m³)</label>
            <input type="number" class="calc-input" id="input9-${windowId}" placeholder="—" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Lining c (J/kgK)</label>
            <input type="number" class="calc-input" id="input10-${windowId}" placeholder="—" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Limiting time t<sub>lim</sub> (s)</label>
            <input type="number" class="calc-input" id="input11-${windowId}" placeholder="3600" min="1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Ambient T<sub>0</sub> (°C)</label>
            <input type="number" class="calc-input" id="input12-${windowId}" placeholder="20" data-window-id="${windowId}">
          </div>
          ` : `
          <div class="calc-section">
            <label class="calc-label">Window area A<sub>w</sub> (m²)</label>
            <input type="number" class="calc-input" id="input5-${windowId}" placeholder="—" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Window height h<sub>w</sub> (m)</label>
            <input type="number" class="calc-input" id="input6-${windowId}" placeholder="—" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Fire growth t<sub>α</sub> (s)</label>
            <input type="number" class="calc-input" id="input7-${windowId}" placeholder="300" min="1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Heat storage b (J/m²/√s/K)</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-input-wrapper">
                <select class="calc-input calc-dropdown" id="input8-${windowId}" data-window-id="${windowId}">
                  ${heatStorageOptions.map(opt =>
                    `<option value="${opt.value}">${opt.label}</option>`
                  ).join('')}
                </select>
              </div>
            </div>
          </div>
          <div class="calc-section">
            <label class="calc-label">Fire load q<sub>x,d</sub> (MJ/m²)</label>
            <input type="number" class="calc-input" id="input9-${windowId}" placeholder="—" min="100" max="1300" step="1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">γ<sub>fi,Q</sub></label>
            <input type="number" class="calc-input" id="input10-${windowId}" placeholder="1.0" min="0.1" step="0.1" data-window-id="${windowId}">
          </div>
          `}
        </div>

        <div class="calc-divider">
          <div class="divider-line"></div>
          <div class="divider-label">Results</div>
          <div class="divider-line"></div>
        </div>

        <div class="calc-output-section">
          <div class="calc-section">
            <label class="calc-label">Peak temperature</label>
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
    const method = sourceWindowId ? this.getActiveMethod(sourceWindowId) : 'BSEN';
    const isBSEN = method === 'BSEN';
    const refText = isBSEN
      ? 'BS EN 1991-1-2 Appendix A – Parametric temperature-time curves (Eurocode 1).'
      : 'DIN EN 1991-1-2/NA:2010-12 Appendix AA – Simplified natural fire model (German Annex).';
    const limitsHtml = isBSEN
      ? '<li>q_td typically 50–1000 MJ/m²</li>'
      : '<li>Fire load: 100–1300 MJ/m²</li><li>Floor area: max 400 m²</li><li>Ceiling height: max 5 m</li><li>Vent opening / floor area: 12.5–50%</li>';
    const inputsHtml = isBSEN
      ? '<li><strong>A<sub>v</sub>, h<sub>eq</sub>:</strong> Opening area and height</li><li><strong>q<sub>fd</sub>:</strong> Fire load density (MJ/m²)</li><li><strong>λ, ρ, c:</strong> Lining thermal conductivity, density, specific heat</li>'
      : '<li><strong>A<sub>w</sub>, h<sub>w</sub>:</strong> Window area and height</li><li><strong>t<sub>α</sub>:</strong> Fire growth factor</li><li><strong>b:</strong> Heat storage capacity (Table AA.1)</li><li><strong>q<sub>x,d</sub>:</strong> Design fire load density (MJ/m²)</li>';
    return `
      <div class="form-calculator help-detail" id="help-${windowId}" style="padding: 20px;">
        <h3 style="margin-bottom: 16px; color: var(--text-primary);">Parametric Fire – Detail (${method})</h3>
        <div class="help-results-section" data-source-window="${sourceWindowId || ''}">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Results</h4>
          <div class="calc-chart-container" style="margin-bottom: 12px;">
            <canvas id="help-chart-${windowId}"></canvas>
          </div>
          <div class="calc-timeseries-table-wrapper">
            <table class="calc-timeseries-table" id="help-table-${windowId}">
              <thead><tr><th>t (s)</th><th>T (°C)</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
        <div class="help-formula-section" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--window-border);">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Reference</h4>
          <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">${refText}</p>
          <h5 style="color: var(--text-primary); margin: 12px 0 6px;">Limitations</h5>
          <ul style="color: var(--text-secondary); line-height: 1.6; padding-left: 20px; margin-bottom: 12px;">${limitsHtml}</ul>
          <h5 style="color: var(--text-primary); margin: 12px 0 6px;">Inputs</h5>
          <ul style="color: var(--text-secondary); line-height: 1.6; padding-left: 20px;">${inputsHtml}</ul>
        </div>
      </div>
    `;
  },

  calculate(windowId) {
    const getEl = (id) => document.getElementById(`${id}-${windowId}`);
    const resultEl = getEl('result');
    if (!resultEl) return;

    const method = this.getActiveMethod(windowId);
    const t_end = parseFloat(getEl('input1').value) || 3600;
    const dt = parseFloat(getEl('input2').value) || 60;
    const A_t = parseFloat(getEl('input3').value);
    const A_f = parseFloat(getEl('input4').value);

    let result;
    if (method === 'BSEN') {
      const A_v = parseFloat(getEl('input5').value);
      const h_eq = parseFloat(getEl('input6').value);
      const q_fd_MJ = parseFloat(getEl('input7').value);
      const lbd = parseFloat(getEl('input8').value);
      const rho = parseFloat(getEl('input9').value);
      const c = parseFloat(getEl('input10').value);
      const t_lim = parseFloat(getEl('input11').value) || t_end;
      const T_0_C = parseFloat(getEl('input12').value) || 20;
      const required = [A_t, A_f, A_v, h_eq, q_fd_MJ, lbd, rho, c];
      if (required.some(v => isNaN(v) || v <= 0)) {
        resultEl.value = '';
        resultEl.placeholder = '—';
        this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
        this._lastTimeSeriesByWindow[windowId] = null;
        return;
      }
      result = runParametricFireBSEN({ t_end, dt, A_t, A_f, A_v, h_eq, q_fd_MJ, lbd, rho, c, t_lim, T_0_C });
    } else {
      const A_w = parseFloat(getEl('input5').value);
      const h_w = parseFloat(getEl('input6').value);
      const t_alpha = parseFloat(getEl('input7').value) || 300;
      const b = parseFloat(getEl('input8').value) || 2500;
      const q_x_d_MJ = parseFloat(getEl('input9').value);
      const gamma_fi_Q = parseFloat(getEl('input10').value) || 1.0;
      const required = [A_t, A_f, A_w, h_w, q_x_d_MJ];
      if (required.some(v => isNaN(v) || v <= 0)) {
        resultEl.value = '';
        resultEl.placeholder = '—';
        this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
        this._lastTimeSeriesByWindow[windowId] = null;
        return;
      }
      result = runParametricFireDIN({
        t_end, dt, A_w, h_w, A_t, A_f, t_alpha, b,
        q_x_d: q_x_d_MJ * 1e6, gamma_fi_Q
      });
    }

    this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
    this._lastTimeSeriesByWindow[windowId] = result.timeSeries;
    resultEl.value = result.peakTemperature.toFixed(1);
    resultEl.placeholder = '';

    if (typeof window !== 'undefined' && window.state && window.state.windows) {
      const helpWin = window.state.windows.find(w => w.sourceWindowId === windowId && w.type === 'ParametricFire-help');
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
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="2" style="color: var(--text-secondary); text-align: center;">Run the calculator first to see results</td></tr>';
      if (chartCanvas && this._helpChartInstances && this._helpChartInstances[helpWindowId]) {
        this._helpChartInstances[helpWindowId].destroy();
        this._helpChartInstances[helpWindowId] = null;
      }
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = timeSeries.map(row =>
        `<tr><td>${row.t}</td><td>${Number(row.T).toFixed(1)}</td></tr>`
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
      this._helpChartInstances[helpWindowId] = new Chart(chartCanvas, {
        type: 'line',
        data: {
          labels: timeSeries.map(d => d.t),
          datasets: [{
            label: 'Gas temperature (°C)',
            data: timeSeries.map(d => d.T),
            borderColor: 'rgb(0, 161, 155)',
            backgroundColor: 'rgba(0, 161, 155, 0.1)',
            fill: true,
            tension: 0.2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              title: { display: true, text: 'Time (s)', color: textColor },
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            y: {
              title: { display: true, text: 'Temperature (°C)', color: textColor },
              ticks: { color: textColor },
              grid: { color: gridColor }
            }
          }
        }
      });
    }
  },

  clear(windowId) {
    for (let i = 1; i <= 12; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) {
        if (i === 8 && el.tagName === 'SELECT') el.value = '2500';
        else el.value = '';
      }
    }
    const i11 = document.getElementById(`input11-${windowId}`);
    if (i11) i11.value = '3600';
    const i12 = document.getElementById(`input12-${windowId}`);
    if (i12) i12.value = '20';
    this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
    this._lastTimeSeriesByWindow[windowId] = null;
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
    else this.getActiveMethod(windowId);
  },

  attachEvents(windowId) {
    document.querySelectorAll(`.method-btn[data-window-id="${windowId}"]`).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setActiveMethod(windowId, btn.getAttribute('data-method'));
        if (typeof window !== 'undefined' && window.renderWindows) window.renderWindows();
      });
    });
    const select = document.getElementById(`input8-${windowId}`);
    if (select && select.tagName === 'SELECT') {
      select.addEventListener('change', () => this.calculate(windowId));
    }
  }
};
