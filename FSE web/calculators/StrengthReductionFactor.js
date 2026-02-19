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
    const srcId = sourceWindowId || windowId;
    const reportId = `strengthreduction-report-${windowId}`;
    const copyBtnId = `strengthreduction-copy-${windowId}`;

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

    const theta_a = getVal(1);
    const kOutput = getOutput();

    const inputTable = `
      <tr><td>Steel temperature θ<sub>a</sub></td><td>${fmt(theta_a)}</td><td>°C</td></tr>`;

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
      <p><strong>Step 1: Table 3.1 — Reduction factor for yield strength</strong></p>
      <p>k<sub>y,θ</sub> = f<sub>y,θ</sub> / f<sub>y</sub> — ratio of yield strength at temperature θ<sub>a</sub> to yield strength at 20°C.</p>
      <p><strong>Step 2: Table values (BS EN 1993-1-2 Table 3.1)</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('\\theta_a \\text{ (°C): } 20, 100, 200, 300, 400 \\Rightarrow k_{y,\\theta} = 1.000')}</div>
      <div style="${formulaBlockStyle}">${renderMath('500 \\rightarrow 0.780; \\quad 600 \\rightarrow 0.470; \\quad 700 \\rightarrow 0.230; \\quad 800 \\rightarrow 0.110; \\quad 900 \\rightarrow 0.060')}</div>
      <div style="${formulaBlockStyle}">${renderMath('1000 \\rightarrow 0.040; \\quad 1100 \\rightarrow 0.020; \\quad 1200 \\rightarrow 0.000')}</div>
      <p><strong>Step 3: Linear interpolation</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('\\text{For } \\theta_a \\text{ between } t_0 \\text{ and } t_1: \\quad k_{y,\\theta} = k_0 + (k_1 - k_0) \\times \\frac{\\theta_a - t_0}{t_1 - t_0}')}</div>
      <p><em>θ<sub>a</sub> ≤ 20°C: k<sub>y,θ</sub> = 1.0; θ<sub>a</sub> ≥ 1200°C: k<sub>y,θ</sub> = 0.0</em></p>`;

    let workedExample = '';
    if (theta_a != null && theta_a >= 0) {
      workedExample = `
        <p>Given: θ<sub>a</sub> = ${fmt(theta_a)} °C</p>
        <p>Locate θ<sub>a</sub> in Table 3.1. For θ<sub>a</sub> between two table entries, apply linear interpolation.</p>
        <div style="${formulaBlockStyle}">${renderMath(`k_{y,\\theta} = ${kOutput}`)}</div>
        <p><strong>Result:</strong> f<sub>y,θ</sub> = k<sub>y,θ</sub> × f<sub>y</sub> — effective yield strength at this temperature.</p>`;
    } else {
      workedExample = '<p>Enter steel temperature (θ<sub>a</sub>) to see worked example.</p>';
    }

    const resultsTable = `
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Results Summary</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Output</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
        <tr style="background:var(--button-hover);"><td style="padding:6px; border:1px solid var(--window-border);"><strong>k<sub>y,θ</sub></strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${kOutput}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>-</strong></td></tr>
      </table>`;

    return `
      <div class="form-calculator window-content-help" id="help-${windowId}" style="padding: 8px 12px; gap: 4px;">
        <div id="${reportId}" style="font-size: 12px; line-height: 1.4; color: var(--text-primary);">
          <h3 style="margin: 0 0 4px 0; font-size: 14px;">STRENGTH REDUCTION FACTOR CALCULATION REPORT</h3>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary);">Reference: BS EN 1993-1-2:2005 Table 3.1 — Reduction factor k<sub>y,θ</sub> for yield strength of carbon steel</p>
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
