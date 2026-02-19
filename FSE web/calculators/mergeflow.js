// Merge Flow Calculator
// ADB Merging Flow Calculation based on Approved Document B

const MergeFlowCalculator = {
  // Calculator metadata
  type: 'mergeflow',
  name: 'ADB Merging Flow',
  icon: '🔄',
  
  // Get number of inputs
  getInputCount() {
    return 3; // Number of People, Size of Stair
  },
  
  // Get number of outputs
  getOutputCount() {
    return 1; // Merging Flow Result, Effective Width, Flow Rate
  },
  
  // Get minimum window size
  getMinimumSize() {
    const titleBarHeight = 40;
    const windowContentPadding = 32;
    const formGap = 15;
    const inputSectionHeight = 44;
    const outputSectionHeight = 44;
    const dividerHeight = 7;
    const actionsHeight = 64;
    
    const inputCount = this.getInputCount();
    const outputCount = this.getOutputCount();
    const totalFieldCount = inputCount + outputCount;
    
    const inputSectionsHeight = inputCount * inputSectionHeight;
    const outputSectionsHeight = outputCount * outputSectionHeight;
    const totalSectionsHeight = inputSectionsHeight + outputSectionsHeight;
    const gapsHeight = (totalFieldCount + 1) * formGap;
    const minHeight = titleBarHeight + windowContentPadding + totalSectionsHeight + gapsHeight + dividerHeight + actionsHeight + 5;
    
    return { width: 400, height: minHeight };
  },
  
  // Get calculator HTML
  getHTML(windowId) {
    return `
      <div class="form-calculator" id="calc-${windowId}">
        <div class="calc-input-section">
          <div class="calc-section">
            <label class="calc-label">Number of People</label>
            <input type="number" class="calc-input" id="people-${windowId}"  min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Stair Width (mm)</label>
            <input type="number" class="calc-input" id="stair-${windowId}"  min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Distance (m)</label>
            <input type="number" class="calc-input" id="distance-${windowId}"  min="0" data-window-id="${windowId}">
          </div>
        </div>
        
        <div class="calc-divider">
          <div class="divider-line"></div>
          <div class="divider-label">Results</div>
          <div class="divider-line"></div>
        </div>
        
        <div class="calc-output-section">
          <div class="calc-section">
            <label class="calc-label">Effective Width</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-output-wrapper">
                <input type="text" class="calc-output" id="effective-width-${windowId}"  readonly>
                <span class="calc-output-unit">mm</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="calc-actions" style="position: relative; display: flex; justify-content: space-between; gap: 8px;">
          <button class="action-btn clear-btn" data-window-id="${windowId}">Clear</button>
          <button class="action-btn export-btn" data-window-id="${windowId}">Export</button>
          <button class="action-btn import-btn" data-window-id="${windowId}">Import</button>
          <button class="action-btn help-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Detail</button>
        </div>
      </div>
    `;
  },
  
  // Get help window HTML - ADB Merge Flow Calculation Report
  getHelpHTML(windowId, sourceWindowId) {
    const srcId = sourceWindowId || windowId;
    const reportId = `mergeflow-report-${windowId}`;
    const copyBtnId = `mergeflow-copy-${windowId}`;

    const getVal = (id) => {
      const el = document.getElementById(`${id}-${srcId}`);
      const v = el ? parseFloat(el.value) : NaN;
      return isNaN(v) ? null : v;
    };
    const getResult = () => {
      const el = document.getElementById(`effective-width-${srcId}`);
      return el && el.value ? el.value : '—';
    };
    const fmt = (x) => (typeof x === 'number' && !isNaN(x) ? x.toLocaleString('en-US', { maximumFractionDigits: 2 }) : String(x));

    const P = getVal('people');
    const W = getVal('stair');
    const D = getVal('distance');
    const hasAll = P != null && W != null && D != null;

    let baseCalc = null;
    let effectiveWidth = getResult();
    let ruleApplied = '—';
    let workedExample = '';

    if (hasAll) {
      baseCalc = ((P / 2.5) + (W * 0.06)) / 80 * 1000;
      if (P < 60) {
        effectiveWidth = baseCalc.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        ruleApplied = 'P < 60 — base formula';
      } else if (D >= 2) {
        effectiveWidth = baseCalc.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        ruleApplied = 'P ≥ 60, D ≥ 2 m — base formula';
      } else {
        const result = Math.max(W, baseCalc);
        effectiveWidth = result.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        ruleApplied = 'P ≥ 60, D < 2 m — max(stair width, base formula)';
      }
    }

    const inputTable = `
      <tr><td>Number of People (P)</td><td>${fmt(P)}</td><td>persons</td></tr>
      <tr><td>Stair Width (W)</td><td>${fmt(W)}</td><td>mm</td></tr>
      <tr><td>Travel Distance (D)</td><td>${fmt(D)}</td><td>m</td></tr>`;

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
      <p><strong>Step 1: Base Formula</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('E = \\frac{(P/2.5) + (W \\times 0.06)}{80} \\times 1000 \\text{ mm}')}</div>
      <p><strong>Step 2: Rule Selection</strong></p>
      <ul>
        <li><strong>P &lt; 60:</strong> Effective width = base formula result</li>
        <li><strong>P ≥ 60 and D ≥ 2 m:</strong> Effective width = base formula result</li>
        <li><strong>P ≥ 60 and D &lt; 2 m:</strong> Effective width = max(stair width W, base formula result)</li>
      </ul>`;

    if (hasAll) {
      const isThirdRule = P >= 60 && D < 2;
      workedExample = `
        <p>Given: P = ${fmt(P)}, W = ${fmt(W)} mm, D = ${fmt(D)} m</p>
        <div style="${formulaBlockStyle}">${renderMath(`E = \\frac{(${fmt(P)}/2.5) + (${fmt(W)} \\times 0.06)}{80} \\times 1000 = ${fmt(baseCalc)} \\text{ mm}`)}</div>
        <p>Since ${ruleApplied}:</p>
        <div style="${formulaBlockStyle}">${renderMath(`\\text{Effective width} = ${isThirdRule ? `\\max(${fmt(W)}, ${fmt(baseCalc)}) = ${effectiveWidth}` : effectiveWidth} \\text{ mm}`)}</div>`;
    } else {
      workedExample = '<p>Enter all input values to see worked example.</p>';
    }

    const resultsTable = `
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Results Summary</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Calculation Step</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
        <tr><td style="padding:6px; border:1px solid var(--window-border);">Base Formula Result</td><td style="padding:6px; border:1px solid var(--window-border);">${hasAll ? fmt(baseCalc) : '—'}</td><td style="padding:6px; border:1px solid var(--window-border);">mm</td></tr>
        <tr><td style="padding:6px; border:1px solid var(--window-border);">Rule Applied</td><td style="padding:6px; border:1px solid var(--window-border);">${ruleApplied}</td><td style="padding:6px; border:1px solid var(--window-border);">-</td></tr>
        <tr style="background:var(--button-hover);"><td style="padding:6px; border:1px solid var(--window-border);"><strong>Effective Width</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${effectiveWidth}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>mm</strong></td></tr>
      </table>`;

    return `
      <div class="form-calculator window-content-help" id="help-${windowId}" style="padding: 8px 12px; gap: 4px;">
        <div id="${reportId}" style="font-size: 12px; line-height: 1.4; color: var(--text-primary);">
          <h3 style="margin: 0 0 4px 0; font-size: 14px;">ADB MERGE FLOW CALCULATION REPORT</h3>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary);">Reference: Approved Document B</p>
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
  
  // Calculate function
  calculate(windowId) {
    const peopleEl = document.getElementById(`people-${windowId}`);
    const stairEl = document.getElementById(`stair-${windowId}`);
    const effectiveWidthEl = document.getElementById(`effective-width-${windowId}`);
    const distanceEl = document.getElementById(`distance-${windowId}`);

    if (!peopleEl || !stairEl || !effectiveWidthEl || !distanceEl) return;
    
    const numberOfPeople = parseFloat(peopleEl.value) || 0;
    const stairWidth = parseFloat(stairEl.value) || 0;
    const distance = parseFloat(distanceEl.value) || 0;
    // Always show output fields, but with placeholder if no input
    if (!numberOfPeople || !stairWidth || !distance) {
      effectiveWidthEl.value = '';
      effectiveWidthEl.placeholder = '—';
      return;
    }
    
    // ADB Merging Flow calculation
    let effectiveWidth;
    if(numberOfPeople < 60 ){
      effectiveWidth = ((numberOfPeople / 2.5) + (stairWidth * 0.06))/80*1000;
    }
    else{
      if(distance >= 2){
        effectiveWidth = ((numberOfPeople / 2.5) + (stairWidth * 0.06))/80*1000;
      }
      else{
        effectiveWidth = Math.max(stairWidth, ((numberOfPeople / 2.5) + (stairWidth * 0.06))/80*1000);
      }
    }
    
    // Update output fields
    effectiveWidthEl.value = effectiveWidth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    effectiveWidthEl.placeholder = '-';

  },
  
  // Clear function
  clear(windowId) {
    const peopleEl = document.getElementById(`people-${windowId}`);
    const stairEl = document.getElementById(`stair-${windowId}`);
    const distanceEl = document.getElementById(`distance-${windowId}`);
    if (peopleEl) peopleEl.value = '';
    if (stairEl) stairEl.value = '';
    if (distanceEl) distanceEl.value = '';
    this.calculate(windowId);
  },
  
  // Save input values before re-rendering
  saveInputValues(windowId) {
    const savedValues = {};
    const peopleEl = document.getElementById(`people-${windowId}`);
    const stairEl = document.getElementById(`stair-${windowId}`);
    const distanceEl = document.getElementById(`distance-${windowId}`);
    if (peopleEl) savedValues.people = peopleEl.value;
    if (stairEl) savedValues.stair = stairEl.value;
    if (distanceEl) savedValues.distance = distanceEl.value;
    return savedValues;
  },
  
  // Restore input values after re-rendering
  restoreInputValues(windowId, savedValues) {
    const peopleEl = document.getElementById(`people-${windowId}`);
    const stairEl = document.getElementById(`stair-${windowId}`);
    const distanceEl = document.getElementById(`distance-${windowId}`);
    if (peopleEl && savedValues.people !== undefined) {
      peopleEl.value = savedValues.people;
      if (savedValues.people) this.calculate(windowId);
    }
    if (stairEl && savedValues.stair !== undefined) {
      stairEl.value = savedValues.stair;
      if (savedValues.stair) this.calculate(windowId);
    }
    if (distanceEl && savedValues.distance !== undefined) {
      distanceEl.value = savedValues.distance;
      if (savedValues.distance) this.calculate(windowId);
    }
  },
  
  // Attach calculator-specific event handlers
  attachEvents(windowId) {
    // Input events are handled globally, but you can add calculator-specific handlers here
  }
};

