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
            <label class="calc-label">Convective HRR Q<sub>c</sub> (kW)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Height z (m)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">HRR Density q̇ (kW/m²)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Ambient Temp T<sub>∞</sub> (K)</label>
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
    const srcId = sourceWindowId || windowId;
    const reportId = `fireplume-report-${windowId}`;
    const copyBtnId = `fireplume-copy-${windowId}`;

    const getVal = (n) => {
      const el = document.getElementById(`input${n}-${srcId}`);
      const raw = el?.value?.trim();
      if (n === 4 && (raw === '' || !raw)) return 293.15;
      const v = parseFloat(raw);
      return isNaN(v) ? null : v;
    };
    const getOutput = (n) => {
      const el = document.getElementById(`result${n}-${srcId}`);
      return el && el.value ? el.value : '—';
    };
    const fmt = (x) => (typeof x === 'number' && !isNaN(x) ? x.toLocaleString('en-US', { maximumFractionDigits: 4 }) : String(x));

    const Q = getVal(1);
    const z = getVal(2);
    const Qdd = getVal(3);
    const T0 = getVal(4) ?? 293.15;
    const hasAll = Q != null && Q > 0 && z != null && z > 0 && Qdd != null && Qdd > 0;

    const inputTable = `
      <tr><td>Convective HRR (Q̇_c)</td><td>${fmt(Q)}</td><td>kW</td></tr>
      <tr><td>Height (z)</td><td>${fmt(z)}</td><td>m</td></tr>
      <tr><td>HRR Density</td><td>${fmt(Qdd)}</td><td>kW/m²</td></tr>
      <tr><td>Ambient Temperature (T₀)</td><td>${fmt(T0)}</td><td>K</td></tr>`;

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

    const methodology = `
      <p><strong>Step 1: Region Selection</strong></p>
      <p>z / Q̇_c^(2/5) determines the plume region:</p>
      <div style="${formulaBlockStyle}">${renderMath('z / \\dot{Q}_c^{0.4} < 0.08 \\Rightarrow \\text{Flame (region 0)}')}</div>
      <div style="${formulaBlockStyle}">${renderMath('0.08 \\leq z / \\dot{Q}_c^{0.4} \\leq 0.2 \\Rightarrow \\text{Intermittent (region 1)}')}</div>
      <div style="${formulaBlockStyle}">${renderMath('z / \\dot{Q}_c^{0.4} > 0.2 \\Rightarrow \\text{Plume (region 2)}')}</div>
      <p><strong>Step 2: Centre-Line Temperature Rise</strong></p>
      <p>Region-specific coefficients (k, ν): Flame k=6.8 ν=½; Intermittent k=1.9 ν=0; Plume k=1.1 ν=−⅓</p>
      <div style="${formulaBlockStyle}">${renderMath('\\Delta T = \\frac{k^2}{C^2} \\cdot \\left(\\frac{z}{\\dot{Q}_c^{2/5}}\\right)^{2\\nu-1} \\cdot \\frac{T_0}{2g}')}</div>
      <p><em>C = 0.9, g = 9.81 m/s²</em></p>
      <p><strong>Step 3: Virtual Fire Origin (PD 7974 Eq 10)</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('z_0 = -1.02 \\times D + 0.083 \\times \\dot{Q}^{2/5}')}</div>
      <p><em>${renderMath('D = 2 \\times \\sqrt{\\dot{Q}_c / (\\pi \\times \\text{HRR}_{\\text{density}})}')}</em></p>
      <p><strong>Step 4: Visible Plume Diameter (SFPE Eq 51.54)</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('d = 0.48 \\times \\sqrt{T_c/T_0} \\times (z - z_0)')}</div>
      <p><em>T_c = T₀ + ΔT. Only when z &gt; z₀.</em></p>`;

    let tempRise = getOutput(1);
    let region = getOutput(2);
    let diameter = getOutput(3);
    let workedExample = '';

    if (hasAll) {
      const zQFactor = z / Math.pow(Q, 2/5);
      let regNum = 2;
      if (zQFactor < 0.08) regNum = 0;
      else if (zQFactor <= 0.2) regNum = 1;
      const regionNames = ['Flame', 'Intermittent', 'Plume'];
      region = regionNames[regNum];

      const C = 0.9;
      const g = 9.81;
      const k = regNum === 0 ? 6.8 : regNum === 1 ? 1.9 : 1.1;
      const nu = regNum === 0 ? 1/2 : regNum === 1 ? 0 : -1/3;
      const deltaT = (Math.pow(k/C, 2) * Math.pow(zQFactor, 2*nu - 1) * T0) / (2 * g);
      tempRise = fmt(deltaT);

      const r = Math.sqrt((Q / Qdd) / Math.PI);
      const D = 2 * r;
      const z0 = -1.02 * D + 0.083 * Math.pow(Q, 2/5);
      const Tc = T0 + deltaT;
      const diam = z > z0 ? 0.48 * Math.sqrt(Tc/T0) * (z - z0) : 0;
      diameter = fmt(Math.max(0, diam));

      workedExample = `
        <p>Given: Q̇_c = ${fmt(Q)} kW, z = ${fmt(z)} m, HRR_density = ${fmt(Qdd)} kW/m², T₀ = ${fmt(T0)} K</p>
        <div style="${formulaBlockStyle}">${renderMath(`z / \\dot{Q}_c^{0.4} = ${fmt(z)} / ${fmt(Math.pow(Q, 0.4))} = ${fmt(zQFactor)} \\Rightarrow \\text{Region: } ${region}`)}</div>
        <div style="${formulaBlockStyle}">${renderMath(`\\Delta T = ${tempRise} \\text{ K}`)}</div>
        <p>${renderMath(`D = 2\\sqrt{${fmt(Q)}/(\\pi \\times ${fmt(Qdd)})} = ${fmt(D)} \\text{ m}; \\quad z_0 = ${fmt(z0)} \\text{ m}`)}</p>
        <div style="${formulaBlockStyle}">${renderMath(`\\text{Plume diameter} = 0.48 \\times \\sqrt{${fmt(Tc)}/${fmt(T0)}} \\times (${fmt(z)} - ${fmt(z0)}) = ${diameter} \\text{ m}`)}</div>`;
    } else {
      workedExample = '<p>Enter all input values (Q̇_c, z, HRR density) to see worked example.</p>';
    }

    const resultsTable = `
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Results Summary</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Output</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
        <tr><td style="padding:6px; border:1px solid var(--window-border);">Temperature Rise</td><td style="padding:6px; border:1px solid var(--window-border);">${tempRise}</td><td style="padding:6px; border:1px solid var(--window-border);">K</td></tr>
        <tr><td style="padding:6px; border:1px solid var(--window-border);">Region</td><td style="padding:6px; border:1px solid var(--window-border);">${region}</td><td style="padding:6px; border:1px solid var(--window-border);">-</td></tr>
        <tr style="background:var(--button-hover);"><td style="padding:6px; border:1px solid var(--window-border);"><strong>Plume Diameter</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${diameter}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>m</strong></td></tr>
      </table>`;

    return `
      <div class="form-calculator window-content-help" id="help-${windowId}" style="padding: 8px 12px; gap: 4px;">
        <div id="${reportId}" style="font-size: 12px; line-height: 1.4; color: var(--text-primary);">
          <h3 style="margin: 0 0 4px 0; font-size: 14px;">FIRE PLUME CALCULATION REPORT</h3>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary);">Reference: SFPE Handbook Chapter 51, PD 7974 Eq 10</p>
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
