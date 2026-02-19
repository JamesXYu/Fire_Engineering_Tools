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
    const srcId = sourceWindowId || windowId;
    const method = sourceWindowId ? this.getActiveMethod(sourceWindowId) : 'temperature';
    const isTemp = method === 'temperature';
    const reportId = `stefanboltzmann-report-${windowId}`;
    const copyBtnId = `stefanboltzmann-copy-${windowId}`;

    const getVal = (n) => {
      const el = document.getElementById(`input${n}-${srcId}`);
      const raw = el?.value?.trim();
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

    const inputLabels = isTemp
      ? [
          { id: 1, label: 'Ambient T₂', unit: '°C' },
          { id: 2, label: 'Emissivity ε', unit: '-' },
          { id: 3, label: 'Surface T₁', unit: '°C' }
        ]
      : [
          { id: 1, label: 'Ambient T₂', unit: '°C' },
          { id: 2, label: 'Emissivity ε', unit: '-' },
          { id: 3, label: 'Heat flux P', unit: 'kW/m²' }
        ];
    const inputTable = inputLabels.map(i => `<tr><td>${i.label}</td><td>${fmt(getVal(i.id))}</td><td>${i.unit}</td></tr>`).join('');

    const methodology = `
      <p><strong>Step 1: Stefan-Boltzmann law</strong></p>
      <p>Radiative heat flux between two surfaces at different temperatures.</p>
      <p><strong>Step 2: Formula</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('P = \\varepsilon \\times \\sigma \\times (T_1^4 - T_2^4)')}</div>
      <p><em>P = heat flux (W/m²), ε = emissivity, σ = 5.670374×10⁻⁸ W/(m²·K⁴), T₁ and T₂ in Kelvin.</em></p>
      <p><strong>Step 3: Temperature conversion</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('T \\text{ (K)} = T \\text{ (°C)} + 273.15')}</div>
      <p><strong>Step 4: Output</strong></p>
      <p><em>Temperature mode: P (kW/m²) = result / 1000. Heat flux mode: T₁⁴ = P/(ε×σ) + T₂⁴, solve for T₁.</em></p>`;

    const T2 = getVal(1) ?? 20;
    const epsilon = getVal(2) ?? 1;
    const T1_or_P = getVal(3);
    const outputVal = getOutput();

    let workedExample = '';
    if (isTemp && T1_or_P != null) {
      const T1_K = T1_or_P + 273.15;
      const T2_K = T2 + 273.15;
      const P_W = epsilon * 5.670374419e-8 * (Math.pow(T1_K, 4) - Math.pow(T2_K, 4));
      const P_kW = P_W / 1000;
      workedExample = `
        <p>Given: T₂ = ${fmt(T2)} °C, ε = ${fmt(epsilon)}, T₁ = ${fmt(T1_or_P)} °C</p>
        <div style="${formulaBlockStyle}">${renderMath(`T_1 = ${fmt(T1_or_P)} + 273.15 = ${fmt(T1_K)} \\text{ K}`)}</div>
        <div style="${formulaBlockStyle}">${renderMath(`T_2 = ${fmt(T2)} + 273.15 = ${fmt(T2_K)} \\text{ K}`)}</div>
        <div style="${formulaBlockStyle}">${renderMath(`P = \\varepsilon \\times \\sigma \\times (T_1^4 - T_2^4) = ${fmt(P_kW)} \\text{ kW/m}^2`)}</div>
        <p><strong>Result:</strong> Heat flux P = ${outputVal} kW/m²</p>`;
    } else if (!isTemp && T1_or_P != null && T1_or_P >= 0) {
      const P_W = T1_or_P * 1000;
      const T2_K = T2 + 273.15;
      const T1_4 = P_W / (epsilon * 5.670374419e-8) + Math.pow(T2_K, 4);
      const T1_K = Math.pow(T1_4, 0.25);
      const T1_C = T1_K - 273.15;
      workedExample = `
        <p>Given: T₂ = ${fmt(T2)} °C, ε = ${fmt(epsilon)}, P = ${fmt(T1_or_P)} kW/m²</p>
        <div style="${formulaBlockStyle}">${renderMath('P = \\varepsilon \\times \\sigma \\times (T_1^4 - T_2^4) \\Rightarrow T_1^4 = P/(\\varepsilon \\times \\sigma) + T_2^4')}</div>
        <div style="${formulaBlockStyle}">${renderMath(`T_1 = ${fmt(T1_C)} \\text{ °C}`)}</div>
        <p><strong>Result:</strong> Surface T₁ = ${outputVal} °C</p>`;
    } else {
      workedExample = '<p>Enter all input values to see worked example.</p>';
    }

    const resultsTable = `
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Results Summary</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Output</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
        <tr style="background:var(--button-hover);"><td style="padding:6px; border:1px solid var(--window-border);"><strong>${isTemp ? 'Heat flux P' : 'Surface T₁'}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${outputVal}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${isTemp ? 'kW/m²' : '°C'}</strong></td></tr>
      </table>`;

    return `
      <div class="form-calculator window-content-help" id="help-${windowId}" style="padding: 8px 12px; gap: 4px;">
        <div id="${reportId}" style="font-size: 12px; line-height: 1.4; color: var(--text-primary);">
          <h3 style="margin: 0 0 4px 0; font-size: 14px;">STEFAN-BOLTZMANN LAW CALCULATION REPORT</h3>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary);">Reference: P = ε × σ × (T₁⁴ − T₂⁴), σ = 5.670374×10⁻⁸ W/(m²·K⁴)</p>
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
