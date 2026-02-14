// Stefan-Boltzmann Law Calculator
// P = ε × σ × (T1⁴ - T2⁴)
// P: heat flux (kW/m²), ε: emissivity, σ: Stefan-Boltzmann constant, T1/T2: temperatures (K)

const SIGMA = 5.670374419e-8; // W/(m²·K⁴)

const StefanBoltzmannMethodStorage = {};

function runStefanBoltzmannTemperature(inputs) {
  const { T1_K, T2_K, epsilon = 1 } = inputs;
  const P = epsilon * SIGMA * (Math.pow(T1_K, 4) - Math.pow(T2_K, 4));
  return { heatFlux: P };
}

function runStefanBoltzmannHeatFlux(inputs) {
  const { P_kW, T2_K, epsilon = 1 } = inputs;
  if (P_kW <= 0 || epsilon <= 0) return { T1_K: null };
  const P = P_kW * 1000; // kW/m² → W/m² for formula
  const T1_4 = P / (epsilon * SIGMA) + Math.pow(T2_K, 4);
  if (T1_4 < 0) return { T1_K: null };
  const T1_K = Math.pow(T1_4, 0.25);
  return { T1_K };
}

const StefanBoltzmannCalculator = {
  type: 'StefanBoltzmann',
  name: 'Stefan-Boltzmann Law',
  icon: '☀️',
  windowMethods: StefanBoltzmannMethodStorage,

  getActiveMethod(windowId) {
    if (StefanBoltzmannMethodStorage[windowId]) return StefanBoltzmannMethodStorage[windowId];
    try {
      const saved = localStorage.getItem(`stefanboltzmann_method_${windowId}`);
      if (saved === 'temperature' || saved === 'heatflux') {
        StefanBoltzmannMethodStorage[windowId] = saved;
        return saved;
      }
    } catch (e) {}
    return 'temperature';
  },

  setActiveMethod(windowId, method) {
    StefanBoltzmannMethodStorage[windowId] = method;
    if (typeof window !== 'undefined' && window.localStorage) {
      try { localStorage.setItem(`stefanboltzmann_method_${windowId}`, method); } catch (e) {}
    }
  },

  getInputCount() {
    return 4;
  },

  getOutputCount() {
    return 1;
  },

  getMinimumSize() {
    return { width: 420, height: 470 };
  },

  getHTML(windowId) {
    const activeMethod = this.getActiveMethod(windowId);
    const isTemperature = activeMethod === 'temperature';
    return `
      <div class="form-calculator" id="calc-${windowId}">
        <div class="method-selector" style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button class="method-btn ${isTemperature ? 'active' : ''}" data-window-id="${windowId}" data-method="temperature"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${isTemperature ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${isTemperature ? 'white' : 'var(--text-primary)'}; cursor: pointer;">
            Temperature → Heat flux
          </button>
          <button class="method-btn ${!isTemperature ? 'active' : ''}" data-window-id="${windowId}" data-method="heatflux"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${!isTemperature ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${!isTemperature ? 'white' : 'var(--text-primary)'}; cursor: pointer;">
            Heat flux → Temperature
          </button>
        </div>
        <div class="calc-input-section">
          <div class="calc-section">
            <label class="calc-label">Ambient T<sub>2</sub> (°C)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="20" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Emissivity ε</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="1.0" min="0" max="1" step="0.01" data-window-id="${windowId}">
          </div>
          ${isTemperature ? `
          <div class="calc-section">
            <label class="calc-label">Surface T<sub>1</sub> (°C)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="—" data-window-id="${windowId}">
          </div>
          ` : `
          <div class="calc-section">
            <label class="calc-label">Heat flux P (kW/m²)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="—" min="0" data-window-id="${windowId}">
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
            <label class="calc-label">${isTemperature ? 'Heat flux P' : 'Surface T₁'}</label>
            <div class="calc-output-wrapper">
              <input type="text" class="calc-output" id="result-${windowId}" placeholder="—" readonly>
              <span class="calc-output-unit">${isTemperature ? 'kW/m²' : '°C'}</span>
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
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 20px;">
        <h3 style="margin-bottom: 16px; color: var(--text-primary);">Stefan-Boltzmann Law – Detail</h3>
        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
          P = ε × σ × (T₁⁴ − T₂⁴)
        </p>
        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
          <strong>P</strong> heat flux (kW/m²), <strong>ε</strong> emissivity, <strong>σ</strong> = 5.67×10⁻⁸ W/(m²·K⁴), <strong>T₁, T₂</strong> temperatures (K).
        </p>
      </div>
    `;
  },

  calculate(windowId) {
    const getEl = (id) => document.getElementById(`${id}-${windowId}`);
    const resultEl = getEl('result');
    if (!resultEl) return;

    const method = this.getActiveMethod(windowId);
    const T2_C = parseFloat(getEl('input1').value) || 20;
    const epsilon = parseFloat(getEl('input2').value) || 1;
    const T2_K = T2_C + 273.15;

    if (method === 'temperature') {
      const T1_C = parseFloat(getEl('input3').value);
      if (isNaN(T1_C)) {
        resultEl.value = '';
        resultEl.placeholder = '—';
        return;
      }
      const T1_K = T1_C + 273.15;
      const result = runStefanBoltzmannTemperature({ T1_K, T2_K, epsilon });
      resultEl.value = (result.heatFlux / 1000).toFixed(2);
      resultEl.placeholder = '';
    } else {
      const P_kW = parseFloat(getEl('input3').value);
      if (isNaN(P_kW) || P_kW < 0) {
        resultEl.value = '';
        resultEl.placeholder = '—';
        return;
      }
      const result = runStefanBoltzmannHeatFlux({ P_kW, T2_K, epsilon });
      if (result.T1_K === null) {
        resultEl.value = '';
        resultEl.placeholder = '—';
        return;
      }
      resultEl.value = (result.T1_K - 273.15).toFixed(1);
      resultEl.placeholder = '';
    }
  },

  clear(windowId) {
    ['input1', 'input2', 'input3'].forEach(id => {
      const el = document.getElementById(`${id}-${windowId}`);
      if (el) el.value = '';
    });
    const i1 = document.getElementById(`input1-${windowId}`);
    if (i1) i1.value = '20';
    const i2 = document.getElementById(`input2-${windowId}`);
    if (i2) i2.value = '1';
    this.calculate(windowId);
  },

  saveInputValues(windowId) {
    const saved = { method: this.getActiveMethod(windowId) };
    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) saved[`input${i}`] = el.value;
    }
    return saved;
  },

  restoreInputValues(windowId, savedValues) {
    if (!savedValues) return;
    if (savedValues.method) this.setActiveMethod(windowId, savedValues.method);
    for (let i = 1; i <= 3; i++) {
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
  }
};
