// Fire Growth Rate Calculator
// Q = α × t^n (t-squared fire: Q = α × t²)
// Two modes: Time → HRR (table + graph) or HRR → Time

const FireGrowthRateMethodStorage = {};

function runFireGrowthTime(inputs) {
  const { t_end = 3600, dt = 1, alpha, n = 2 } = inputs;
  const timeSeries = [];
  for (let t = 0; t <= t_end; t += dt) {
    const Q = alpha * Math.pow(t, n);
    timeSeries.push({ t, Q });
  }
  const peakHRR = alpha * Math.pow(t_end, n);
  return { timeSeries, peakHRR };
}

function runFireGrowthHRR(inputs) {
  const { Q, alpha, n = 2 } = inputs;
  if (Q <= 0 || alpha <= 0) return { t: null };
  const t = Math.pow(Q / alpha, 1 / n);
  return { t };
}

const FireGrowthRateCalculator = {
  type: 'FireGrowthRate',
  name: 'Fire Growth Rate',
  icon: '📈',
  hasTimeSeries: true,
  windowMethods: FireGrowthRateMethodStorage,

  getActiveMethod(windowId) {
    if (FireGrowthRateMethodStorage[windowId]) return FireGrowthRateMethodStorage[windowId];
    try {
      const saved = localStorage.getItem(`firegrowthrate_method_${windowId}`);
      if (saved === 'time' || saved === 'hrr') {
        FireGrowthRateMethodStorage[windowId] = saved;
        return saved;
      }
    } catch (e) {}
    return 'time';
  },

  setActiveMethod(windowId, method) {
    FireGrowthRateMethodStorage[windowId] = method;
    if (typeof window !== 'undefined' && window.localStorage) {
      try { localStorage.setItem(`firegrowthrate_method_${windowId}`, method); } catch (e) {}
    }
  },

  getInputCount() {
    return 5;
  },

  getOutputCount() {
    return 1;
  },

  getMinimumSize() {
    return { width: 420, height: 530 };
  },

  getHTML(windowId) {
    const activeMethod = this.getActiveMethod(windowId);
    const isTime = activeMethod === 'time';
    return `
      <div class="form-calculator" id="calc-${windowId}">
        <div class="method-selector" style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button class="method-btn ${isTime ? 'active' : ''}" data-window-id="${windowId}" data-method="time"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${isTime ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${isTime ? 'white' : 'var(--text-primary)'}; cursor: pointer;">
            Time → HRR
          </button>
          <button class="method-btn ${!isTime ? 'active' : ''}" data-window-id="${windowId}" data-method="hrr"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${!isTime ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${!isTime ? 'white' : 'var(--text-primary)'}; cursor: pointer;">
            HRR → Time
          </button>
        </div>
        <div class="calc-input-section">
          ${isTime ? `
          <div class="calc-section">
            <label class="calc-label">Time t (s)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="" min="1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Time step Δt (s)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="" min="0.1" step="0.1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Growth factor α (kW/sⁿ)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="" min="0" step="0.001" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Growth power n (-)</label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="2" min="0.1" step="0.1" data-window-id="${windowId}">
          </div>
          ` : `
          <div class="calc-section">
            <label class="calc-label">Heat release rate Q (kW)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Growth factor α (kW/sⁿ)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="" min="0" step="0.001" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Growth power n (-)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="2" min="0.1" step="0.1" data-window-id="${windowId}">
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
            <label class="calc-label">${isTime ? 'Peak HRR' : 'Time t'}</label>
            <div class="calc-output-wrapper">
              <input type="text" class="calc-output" id="result-${windowId}" placeholder="—" readonly>
              <span class="calc-output-unit">${isTime ? 'kW' : 's'}</span>
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
    const method = sourceWindowId ? this.getActiveMethod(sourceWindowId) : 'time';
    const isTime = method === 'time';
    const reportId = `firegrowthrate-report-${windowId}`;
    const copyBtnId = `firegrowthrate-copy-${windowId}`;

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

    let inputTable = '';
    let methodology = '';
    let workedExample = '';
    const outputVal = getOutput();

    if (isTime) {
      const inputLabels = [
        { id: 1, label: 'Time', unit: 's' },
        { id: 2, label: 'Time step', unit: 's' },
        { id: 3, label: 'Growth factor α', unit: 'kW/sⁿ' },
        { id: 4, label: 'Growth power n', unit: '-' }
      ];
      inputTable = inputLabels.map(i => `<tr><td>${i.label}</td><td>${fmt(getVal(i.id))}</td><td>${i.unit}</td></tr>`).join('');

      methodology = `
        <p><strong>Step 1: Mode — Time → HRR</strong></p>
        <p>Heat release rate vs time. t-squared fire when n = 2.</p>
        <p><strong>Step 2: Fire growth formula</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('Q = \\alpha \\times t^n')}</div>
        <p><em>Q = heat release rate (kW), α = growth factor (kW/sⁿ), t = time (s), n = growth power (n=2 for t-squared).</em></p>
        <p><strong>Step 3: Time series</strong></p>
        <p>At each time step t = 0, dt, 2dt, …: Q = α × tⁿ. Peak HRR at t_end.</p>`;

      const t_end = getVal(1);
      const alpha = getVal(3);
      const n = getVal(4) ?? 2;
      const hasKey = t_end != null && alpha != null && alpha > 0;
      if (hasKey) {
        const peakHRR = alpha * Math.pow(t_end, n);
        workedExample = `
          <p>Given: t = ${fmt(t_end)} s, α = ${fmt(alpha)} kW/sⁿ, n = ${fmt(n)}</p>
          <div style="${formulaBlockStyle}">${renderMath(`Q = \\alpha \\times t^n = ${fmt(alpha)} \\times ${fmt(t_end)}^{${fmt(n)}} = ${fmt(peakHRR)} \\text{ kW}`)}</div>
          <p><strong>Result:</strong> Peak HRR = ${outputVal} kW</p>`;
      } else {
        workedExample = '<p>Enter time and growth factor (α) to see worked example.</p>';
      }
    } else {
      const inputLabels = [
        { id: 1, label: 'Heat release rate Q', unit: 'kW' },
        { id: 2, label: 'Growth factor α', unit: 'kW/sⁿ' },
        { id: 3, label: 'Growth power n', unit: '-' }
      ];
      inputTable = inputLabels.map(i => `<tr><td>${i.label}</td><td>${fmt(getVal(i.id))}</td><td>${i.unit}</td></tr>`).join('');

      methodology = `
        <p><strong>Step 1: Mode — HRR → Time</strong></p>
        <p>Time to reach a given heat release rate.</p>
        <p><strong>Step 2: Invert fire growth formula</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('Q = \\alpha \\times t^n \\Rightarrow t = (Q / \\alpha)^{1/n}')}</div>
        <p><em>Solve for t given Q, α, and n.</em></p>`;

      const Q = getVal(1);
      const alpha = getVal(2);
      const n = getVal(3) ?? 2;
      const hasKey = Q != null && alpha != null && Q > 0 && alpha > 0;
      if (hasKey) {
        const t = Math.pow(Q / alpha, 1 / n);
        workedExample = `
          <p>Given: Q = ${fmt(Q)} kW, α = ${fmt(alpha)} kW/sⁿ, n = ${fmt(n)}</p>
          <div style="${formulaBlockStyle}">${renderMath(`t = (Q/\\alpha)^{1/n} = (${fmt(Q)}/${fmt(alpha)})^{1/${fmt(n)}} = ${fmt(t)} \\text{ s}`)}</div>
          <p><strong>Result:</strong> Time t = ${outputVal} s</p>`;
      } else {
        workedExample = '<p>Enter Q and α to see worked example.</p>';
      }
    }

    const resultsTable = `
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Results Summary</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Output</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
        <tr style="background:var(--button-hover);"><td style="padding:6px; border:1px solid var(--window-border);"><strong>${isTime ? 'Peak HRR' : 'Time t'}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${outputVal}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${isTime ? 'kW' : 's'}</strong></td></tr>
      </table>`;

    return `
      <div class="form-calculator help-detail" id="help-${windowId}" style="padding: 4px 0; gap: 4px;">
        <h4 style="color: var(--text-primary); margin: 0 0 6px 0; font-size: 14px; font-weight: 600;">Results (Chart &amp; Table)</h4>
        <div class="help-results-section" data-source-window="${sourceWindowId || ''}">
          <div class="calc-chart-container" style="margin: 4px 0 8px 0;">
            <canvas id="help-chart-${windowId}"></canvas>
          </div>
          <div class="calc-timeseries-table-wrapper">
            <table class="calc-timeseries-table" id="help-table-${windowId}">
              <thead><tr><th>t (s)</th><th>Q (kW)</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
        <div id="${reportId}" style="font-size: 12px; line-height: 1.4; color: var(--text-primary); margin-top: 12px;">
          <h3 style="margin: 12px 0 4px 0; font-size: 14px;">FIRE GROWTH RATE CALCULATION REPORT</h3>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary);">Reference: Q = α × tⁿ (t-squared fire when n = 2)</p>
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

    if (method === 'time') {
      const t_end = parseFloat(getEl('input1').value);
      const dt = parseFloat(getEl('input2').value) || 1;
      const alpha = parseFloat(getEl('input3').value);
      const n = parseFloat(getEl('input4').value) || 2;
      if (isNaN(alpha) || alpha <= 0) {
        resultEl.value = '';
        resultEl.placeholder = '—';
        this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
        this._lastTimeSeriesByWindow[windowId] = null;
        return;
      }
      const result = runFireGrowthTime({ t_end, dt, alpha, n });
      this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
      this._lastTimeSeriesByWindow[windowId] = result.timeSeries;
      resultEl.value = result.peakHRR.toFixed(2);
      resultEl.placeholder = '';
    } else {
      const Q = parseFloat(getEl('input1').value);
      const alpha = parseFloat(getEl('input2').value);
      const n = parseFloat(getEl('input3').value) || 2;
      if (isNaN(Q) || isNaN(alpha) || Q <= 0 || alpha <= 0) {
        resultEl.value = '';
        resultEl.placeholder = '—';
        return;
      }
      const result = runFireGrowthHRR({ Q, alpha, n });
      resultEl.value = result.t !== null ? result.t.toFixed(2) : '';
      resultEl.placeholder = result.t === null ? '—' : '';
      this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
      this._lastTimeSeriesByWindow[windowId] = null;
    }

    const helpWin = typeof window !== 'undefined' && window.state && window.state.windows &&
      window.state.windows.find(w => w.sourceWindowId === windowId && w.type === 'FireGrowthRate-help');
    if (helpWin && !helpWin.minimized) {
      setTimeout(() => this.updateHelpContent(helpWin.id, windowId), 0);
    }
  },

  updateHelpContent(helpWindowId, sourceWindowId) {
    const timeSeries = (this._lastTimeSeriesByWindow || {})[sourceWindowId];
    const tableBody = document.querySelector(`#help-table-${helpWindowId} tbody`);
    const chartCanvas = document.getElementById(`help-chart-${helpWindowId}`);

    if (!timeSeries || timeSeries.length === 0) {
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="2" style="color: var(--text-secondary); text-align: center;">Run the calculator first (Time → HRR mode)</td></tr>';
      if (chartCanvas && this._helpChartInstances && this._helpChartInstances[helpWindowId]) {
        this._helpChartInstances[helpWindowId].destroy();
        this._helpChartInstances[helpWindowId] = null;
      }
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = timeSeries.map(row => `<tr><td>${row.t}</td><td>${Number(row.Q).toFixed(2)}</td></tr>`).join('');
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
            label: 'HRR (kW)',
            data: timeSeries.map(d => d.Q),
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
            y: { title: { display: true, text: 'HRR (kW)', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } }
          }
        }
      });
    }
  },

  clear(windowId) {
    const method = this.getActiveMethod(windowId);
    if (method === 'time') {
      const i1 = document.getElementById(`input1-${windowId}`);
      if (i1) i1.value = '3600';
      const i2 = document.getElementById(`input2-${windowId}`);
      if (i2) i2.value = '1';
      const i3 = document.getElementById(`input3-${windowId}`);
      if (i3) i3.value = '';
      const i4 = document.getElementById(`input4-${windowId}`);
      if (i4) i4.value = '2';
    } else {
      [1, 2, 3].forEach(i => {
        const el = document.getElementById(`input${i}-${windowId}`);
        if (el) el.value = '';
      });
      const i3 = document.getElementById(`input3-${windowId}`);
      if (i3) i3.value = '2';
    }
    this._lastTimeSeriesByWindow = this._lastTimeSeriesByWindow || {};
    this._lastTimeSeriesByWindow[windowId] = null;
    this.calculate(windowId);
  },

  saveInputValues(windowId) {
    const saved = { method: this.getActiveMethod(windowId) };
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) saved[`input${i}`] = el.value;
    }
    return saved;
  },

  restoreInputValues(windowId, savedValues) {
    if (!savedValues) return;
    if (savedValues.method) this.setActiveMethod(windowId, savedValues.method);
    for (let i = 1; i <= 4; i++) {
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
