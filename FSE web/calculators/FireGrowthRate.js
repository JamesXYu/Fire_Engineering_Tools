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
            <label class="calc-label">Time (s)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="—" min="1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Time step (s)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="1" min="0.1" step="0.1" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Growth factor α (kW/sⁿ)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="—" min="0" step="0.001" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Growth power n</label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="2" min="0.1" step="0.1" data-window-id="${windowId}">
          </div>
          ` : `
          <div class="calc-section">
            <label class="calc-label">Heat release rate Q (kW)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="—" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Growth factor α (kW/sⁿ)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="—" min="0" step="0.001" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Growth power n</label>
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
    const timeSeries = (this._lastTimeSeriesByWindow || {})[sourceWindowId];
    const method = sourceWindowId ? this.getActiveMethod(sourceWindowId) : 'time';
    const isTime = method === 'time';

    return `
      <div class="form-calculator help-detail" id="help-${windowId}" style="padding: 4px 0; gap: 4px;">
        <p style="color: var(--text-secondary); line-height: 1.3; margin: 0; font-size: 13px;">
          Fire growth: heat release rate vs time. Two modes: Time → HRR (table and graph) or HRR → Time.
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 1px 0; font-size: 14px; font-weight: 600;">Step 1: Results</h4>
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
        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 2: Formula</h4>
        <div style="text-align: center; margin: 4px 0 8px 0; padding: 8px 12px; background: var(--result-card-bg); border: 1px solid var(--window-border); border-radius: 4px;">
          \\( Q = \\alpha \\times t^n \\) (t-squared when n = 2)
        </div>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0; font-size: 13px;">
          <strong>Q</strong> heat release rate (kW), <strong>α</strong> growth factor (kW/sⁿ), <strong>t</strong> time (s), <strong>n</strong> growth power.
        </p>
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
