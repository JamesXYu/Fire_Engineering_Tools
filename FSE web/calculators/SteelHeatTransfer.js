// Steel Heat Transfer Calculator
// BS EN 1993-1-2:2005 - Unprotected and Protected steel members
// Based on fse_bs_en_1993_1_2_unprotected_heat_transfer.py and fse_bs_en_1993_1_2_heat_transfer.py

function c_steel_T(T_K) {
  const T = T_K - 273.15;
  if (T < 20) return 425 + 0.773 * 20 - 1.69e-3 * 400 + 2.22e-6 * 8000;
  if (T < 600) return 425 + 0.773 * T - 1.69e-3 * T * T + 2.22e-6 * T * T * T;
  if (T < 735) return 666 + 13002 / (738 - T);
  if (T < 900) return 545 + 17820 / (T - 731);
  if (T <= 1200) return 650;
  return 650;
}

// ISO 834 standard fire: T_g (°C) = 20 + 345 * log10(8*t + 1)
function standardFireTemperature(t) {
  return 20 + 345 * Math.log10(8 * t + 1);
}

function runUnprotectedSteelHeatTransfer(inputs) {
  const {
    t_end = 3600,
    dt = 30,
    k_sh = 1,
    A_m,
    V,
    epsilon_m = 0.7,
    alpha_c = 25,
    rho_a = 7850
  } = inputs;

  const sigma = 56.7e-9;
  const epsilon_f = 1.0;
  const Phi = 1.0;

  const t_arr = [];
  const T_g_arr = [];
  for (let ti = 0; ti <= t_end; ti += dt) {
    t_arr.push(ti);
    T_g_arr.push(standardFireTemperature(ti) + 273.15);
  }

  const T_a = [T_g_arr[0]];
  for (let i = 1; i < t_arr.length; i++) {
    const h_net_c = alpha_c * (T_g_arr[i] - T_a[i - 1]);
    const h_net_r = Phi * epsilon_m * epsilon_f * sigma * (Math.pow(T_g_arr[i], 4) - Math.pow(T_a[i - 1], 4));
    const h_net_d = h_net_c + h_net_r;
    const const_ = (A_m / V) / rho_a / c_steel_T(T_a[i - 1]);
    const dt_val = t_arr[i] - t_arr[i - 1];
    const T_a_i = k_sh * const_ * h_net_d * dt_val;
    T_a.push(T_a[i - 1] + T_a_i);
  }

  const timeSeries = t_arr.map((t, i) => ({
    t,
    T: T_a[i] - 273.15
  }));

  return {
    timeSeries,
    peakTemperature: Math.max(...T_a) - 273.15
  };
}

function runProtectedSteelHeatTransfer(inputs) {
  const {
    t_end = 3600,
    dt = 30,
    beam_rho = 7850,
    beam_cross_section_area,
    protection_k,
    protection_rho,
    protection_c,
    protection_thickness,
    protection_protected_perimeter
  } = inputs;

  const V = beam_cross_section_area;
  const rho_a = beam_rho;
  const lambda_p = protection_k;
  const rho_p = protection_rho;
  const d_p = protection_thickness;
  const A_p = protection_protected_perimeter;
  const c_p = protection_c;

  const fire_time = [];
  const fire_temperature = [];
  for (let ti = 0; ti <= t_end; ti += dt) {
    fire_time.push(ti);
    fire_temperature.push(standardFireTemperature(ti) + 273.15);
  }

  const T_a = [fire_temperature[0]];
  for (let i = 1; i < fire_time.length; i++) {
    const c_a = c_steel_T(T_a[i - 1]);
    const phi = (c_p * rho_p / c_a / rho_a) * d_p * A_p / V;
    const a = (lambda_p * A_p / V) / (d_p * c_a * rho_a);
    const b = (fire_temperature[i] - T_a[i - 1]) / (1.0 + phi / 3.0);
    const c = (Math.pow(2.718, phi / 10.0) - 1.0) * (fire_temperature[i] - fire_temperature[i - 1]);
    const d = fire_time[i] - fire_time[i - 1];
    let dT_a = (a * b * d - c) / d;
    if (dT_a < 0 && (fire_temperature[i] - fire_temperature[i - 1]) > 0) dT_a = 0;
    T_a.push(T_a[i - 1] + dT_a * d);
  }

  const timeSeries = fire_time.map((t, i) => ({
    t,
    T: T_a[i] - 273.15
  }));

  return {
    timeSeries,
    peakTemperature: Math.max(...T_a) - 273.15
  };
}

const SteelHeatTransferMethodStorage = {};

const SteelHeatTransferCalculator = {
  type: 'SteelHeatTransfer',
  name: 'Steel Heat Transfer',
  icon: '🔥',
  hasTimeSeries: true,
  windowMethods: SteelHeatTransferMethodStorage,

  getActiveMethod(windowId) {
    if (SteelHeatTransferMethodStorage[windowId]) return SteelHeatTransferMethodStorage[windowId];
    try {
      const saved = localStorage.getItem(`steelheattransfer_method_${windowId}`);
      if (saved === 'unprotected' || saved === 'protected') {
        SteelHeatTransferMethodStorage[windowId] = saved;
        return saved;
      }
    } catch (e) {}
    return 'unprotected';
  },

  setActiveMethod(windowId, method) {
    SteelHeatTransferMethodStorage[windowId] = method;
    if (typeof window !== 'undefined' && window.localStorage) {
      try { localStorage.setItem(`steelheattransfer_method_${windowId}`, method); } catch (e) {}
    }
  },

  getInputCount() {
    return 10;
  },

  getOutputCount() {
    return 1;
  },

  getMinimumSize() {
    return { width: 480, height: 660 };
  },

  getHTML(windowId) {
    const activeMethod = this.getActiveMethod(windowId);
    const isUnprotected = activeMethod === 'unprotected';
    return `
      <div class="form-calculator" id="calc-${windowId}">
        <div class="method-selector" style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button class="method-btn ${isUnprotected ? 'active' : ''}" data-window-id="${windowId}" data-method="unprotected"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${isUnprotected ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${isUnprotected ? 'white' : 'var(--text-primary)'}; cursor: pointer;">
            Unprotected
          </button>
          <button class="method-btn ${!isUnprotected ? 'active' : ''}" data-window-id="${windowId}" data-method="protected"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${!isUnprotected ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${!isUnprotected ? 'white' : 'var(--text-primary)'}; cursor: pointer;">
            Protected
          </button>
        </div>
        <div class="calc-input-section">
          <div class="calc-section">
            <label class="calc-label">Duration (s)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="3600" min="1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Time step (s)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="30" min="1" data-window-id="${windowId}">
          </div>
          ${isUnprotected ? `
          <div class="calc-section">
            <label class="calc-label">Section factor A<sub>m</sub>/V (m⁻¹)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="—" min="0" step="0.1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Shadow factor k<sub>sh</sub></label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="1.0" min="0" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Emissivity ε<sub>m</sub></label>
            <input type="number" class="calc-input" id="input5-${windowId}" placeholder="0.7" min="0" max="1" step="0.01" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Convection α<sub>c</sub> (W/m²K)</label>
            <input type="number" class="calc-input" id="input6-${windowId}" placeholder="25" min="0" data-window-id="${windowId}">
          </div>
          ` : `
          <div class="calc-section">
            <label class="calc-label">Steel area A (m²)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="—" min="0" step="0.0001" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Protection k (W/mK)</label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="—" min="0" step="0.001" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Protection ρ (kg/m³)</label>
            <input type="number" class="calc-input" id="input5-${windowId}" placeholder="—" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Protection c (J/kgK)</label>
            <input type="number" class="calc-input" id="input6-${windowId}" placeholder="—" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Protection thickness (m)</label>
            <input type="number" class="calc-input" id="input7-${windowId}" placeholder="—" min="0" step="0.001" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Protected perimeter (m)</label>
            <input type="number" class="calc-input" id="input8-${windowId}" placeholder="—" min="0" step="0.01" data-window-id="${windowId}">
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
            <label class="calc-label">Peak steel temperature</label>
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
    const method = sourceWindowId ? this.getActiveMethod(sourceWindowId) : 'unprotected';
    const isUnprotected = method === 'unprotected';

    return `
      <div class="form-calculator help-detail" id="help-${windowId}" style="padding: 4px 0; gap: 4px;">
        <p style="color: var(--text-secondary); line-height: 1.3; margin: 0; font-size: 13px;">
          BS EN 1993-1-2:2005 — Steel member temperature rise. Gas temperature: ISO 834 standard fire curve.
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 1px 0; font-size: 14px; font-weight: 600;">Step 1: Mode</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0 0 4px 0; font-size: 13px;">
          ${isUnprotected ? 'Unprotected steel (Eq. 4.25)' : 'Protected steel (Eq. 4.27, Clauses 4.2.5.2)'}
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 2: Results</h4>
        <div class="help-results-section" data-source-window="${sourceWindowId || ''}">
          <div class="calc-chart-container" style="margin: 4px 0 8px 0;">
            <canvas id="help-chart-${windowId}"></canvas>
          </div>
          <div class="calc-timeseries-table-wrapper">
            <table class="calc-timeseries-table" id="help-table-${windowId}">
              <thead><tr><th>t (s)</th><th>T (°C)</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 3: Inputs</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0; font-size: 13px;">
          ${isUnprotected ? 'Section factor (A_m/V), shadow factor, emissivity, convection coefficient.' : 'Section area, protection properties (k, ρ, c, thickness), protected perimeter.'}
        </p>
      </div>
    `;
  },

  calculate(windowId) {
    const method = this.getActiveMethod(windowId);
    const getEl = (id) => document.getElementById(`${id}-${windowId}`);
    const resultEl = getEl('result');
    if (!resultEl) return;

    const t_end = parseFloat(getEl('input1').value) || 3600;
    const dt = parseFloat(getEl('input2').value) || 30;

    let result;
    if (method === 'unprotected') {
      const A_m_over_V = parseFloat(getEl('input3').value);
      const k_sh = parseFloat(getEl('input4').value) || 1;
      const epsilon_m = parseFloat(getEl('input5').value) || 0.7;
      const alpha_c = parseFloat(getEl('input6').value) || 25;
      if (isNaN(A_m_over_V) || A_m_over_V <= 0) {
        resultEl.value = '';
        resultEl.placeholder = '—';
        this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
        this._lastTimeSeriesByWindow[windowId] = null;
        return;
      }
      result = runUnprotectedSteelHeatTransfer({
        t_end, dt, k_sh, A_m: A_m_over_V, V: 1, epsilon_m, alpha_c
      });
    } else {
      const A = parseFloat(getEl('input3').value);
      const protection_k = parseFloat(getEl('input4').value);
      const protection_rho = parseFloat(getEl('input5').value);
      const protection_c = parseFloat(getEl('input6').value);
      const protection_thickness = parseFloat(getEl('input7').value);
      const protection_protected_perimeter = parseFloat(getEl('input8').value);
      const required = [A, protection_k, protection_rho, protection_c, protection_thickness, protection_protected_perimeter];
      if (required.some(v => isNaN(v) || v <= 0)) {
        resultEl.value = '';
        resultEl.placeholder = '—';
        this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
        this._lastTimeSeriesByWindow[windowId] = null;
        return;
      }
      result = runProtectedSteelHeatTransfer({
        t_end, dt, beam_cross_section_area: A,
        protection_k, protection_rho, protection_c, protection_thickness, protection_protected_perimeter
      });
    }

    this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
    this._lastTimeSeriesByWindow[windowId] = result.timeSeries;
    resultEl.value = result.peakTemperature.toFixed(1);
    resultEl.placeholder = '';

    const helpWin = typeof window !== 'undefined' && window.state && window.state.windows &&
      window.state.windows.find(w => w.sourceWindowId === windowId && w.type === 'SteelHeatTransfer-help');
    if (helpWin && !helpWin.minimized) {
      setTimeout(() => this.updateHelpContent(helpWin.id, windowId), 0);
    }
  },

  updateHelpContent(helpWindowId, sourceWindowId) {
    const timeSeries = (this._lastTimeSeriesByWindow || {})[sourceWindowId];
    const tableBody = document.querySelector(`#help-table-${helpWindowId} tbody`);
    const chartCanvas = document.getElementById(`help-chart-${helpWindowId}`);

    if (!timeSeries || timeSeries.length === 0) {
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="2" style="color: var(--text-secondary); text-align: center;">Run the calculator first</td></tr>';
      if (chartCanvas && this._helpChartInstances && this._helpChartInstances[helpWindowId]) {
        this._helpChartInstances[helpWindowId].destroy();
        this._helpChartInstances[helpWindowId] = null;
      }
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = timeSeries.map(row => `<tr><td>${row.t}</td><td>${Number(row.T).toFixed(1)}</td></tr>`).join('');
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
            label: 'Steel temperature (°C)',
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
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'Time (s)', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } },
            y: { title: { display: true, text: 'Temperature (°C)', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } }
          }
        }
      });
    }
  },

  clear(windowId) {
    const method = this.getActiveMethod(windowId);
    ['input1', 'input2'].forEach(id => {
      const el = document.getElementById(`${id}-${windowId}`);
      if (el) el.value = '';
    });
    if (method === 'unprotected') {
      [3, 4, 5, 6].forEach(i => { const el = document.getElementById(`input${i}-${windowId}`); if (el) el.value = ''; });
      const i4 = document.getElementById(`input4-${windowId}`); if (i4) i4.value = '1';
      const i5 = document.getElementById(`input5-${windowId}`); if (i5) i5.value = '0.7';
      const i6 = document.getElementById(`input6-${windowId}`); if (i6) i6.value = '25';
    } else {
      [3, 4, 5, 6, 7, 8].forEach(i => { const el = document.getElementById(`input${i}-${windowId}`); if (el) el.value = ''; });
    }
    this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
    this._lastTimeSeriesByWindow[windowId] = null;
    this.calculate(windowId);
  },

  saveInputValues(windowId) {
    const saved = { method: this.getActiveMethod(windowId) };
    for (let i = 1; i <= 8; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) saved[`input${i}`] = el.value;
    }
    return saved;
  },

  restoreInputValues(windowId, savedValues) {
    if (!savedValues) return;
    if (savedValues.method) this.setActiveMethod(windowId, savedValues.method);
    for (let i = 1; i <= 8; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el && savedValues[`input${i}`] !== undefined) el.value = savedValues[`input${i}`];
    }
    this.calculate(windowId);
  },

  restoreStateBeforeRender(windowId, savedValues) {
    if (savedValues && savedValues.method) {
      this.setActiveMethod(windowId, savedValues.method);
    } else {
      this.getActiveMethod(windowId);
    }
  },

  attachEvents(windowId) {
    document.querySelectorAll(`.method-btn[data-window-id="${windowId}"]`).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setActiveMethod(windowId, btn.getAttribute('data-method'));
        if (typeof window !== 'undefined' && window.renderWindows) window.renderWindows();
      });
    });
  }
};
