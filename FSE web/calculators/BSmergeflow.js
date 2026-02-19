// BS 9999 Merge Flow Calculator
// Three different calculation methods integrated into one calculator
//
// IMPORTANT: This file contains PSEUDO CALCULATIONS marked with comments like:
//   [PSEUDO CALCULATION - REPLACE WITH ACTUAL FORMULA]
// 
// You need to replace these with your actual BS 9999 formulas:
//   - Method 1: 2 inputs (currently: Width × Flow Rate)
//   - Method 2: 3 inputs (currently: Length × Width × Occupancy Density)
//   - Method 3: 4 inputs (currently: (A + B) × (C / D))
//
// To use this calculator:
//   1. Replace the pseudo calculations with actual formulas
//   2. Update input labels and placeholders to match your needs
//   3. Add the script tag to calculator-desktop.html: <script src="calculators/BSmergeflow.js"></script>
//   4. Register it: CalculatorRegistry.register(BS9999MergeFlowCalculator);
//   5. Add it to a category in script.js categories array

// Persistent storage for method selection - stored at module level to survive re-renders
const BS9999MergeFlowMethodStorage = {};

const BS9999MergeFlowCalculator = {
  // Required: Unique identifier for this calculator
  type: 'BSmergeflow',
  
  // Required: Display name
  name: 'BS 9999 Merge Flow',
  
  // Required: Icon (emoji or text)
  icon: '🔢',
  
  // Store active method for each window (method1, method2, or method3)
  // Using module-level storage for better persistence
  windowMethods: BS9999MergeFlowMethodStorage,
  
  // Get the active method for a window (default to method1)
  // Uses module-level storage for persistence across re-renders
  getActiveMethod(windowId) {
    // Priority 1: Check module-level storage (persists across re-renders)
    if (BS9999MergeFlowMethodStorage[windowId]) {
      return BS9999MergeFlowMethodStorage[windowId];
    }
    
    // Priority 2: Check localStorage as backup
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedMethod = localStorage.getItem(`bsmergeflow_method_${windowId}`);
        if (savedMethod && (savedMethod === 'method1' || savedMethod === 'method2' || savedMethod === 'method3')) {
          // Restore from localStorage to module-level storage
          BS9999MergeFlowMethodStorage[windowId] = savedMethod;
          return savedMethod;
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    
    // Default to method1
    return 'method1';
  },
  
  // Set the active method for a window
  setActiveMethod(windowId, method) {
    // Store in module-level storage (persists across re-renders)
    BS9999MergeFlowMethodStorage[windowId] = method;
    // Also update the object property for consistency
    this.windowMethods[windowId] = method;
    // Also store in localStorage as backup
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`bsmergeflow_method_${windowId}`, method);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  },
  
  // Required: Get number of input fields (based on active method)
  // If windowId is provided, returns count for that window's active method
  // Otherwise returns maximum count (for minimum size calculation)
  getInputCount(windowId) {
    if (windowId) {
      const method = this.getActiveMethod(windowId);
      if (method === 'method1') return 5;
      if (method === 'method2') return 5;
      if (method === 'method3') return 7;
    }
    // Return maximum for minimum size calculation
    return 7;
  },
  
  // Required: Get number of output fields
  getOutputCount() {
    return 1; // Same for all methods
  },
  
  // Required: Get minimum window size (use maximum to accommodate all methods)
  getMinimumSize() {
    const titleBarHeight = 40;
    const windowContentPadding = 32;
    const formGap = 15;
    const inputSectionHeight = 44;
    const outputSectionHeight = 44;
    const dividerHeight = 7;
    const actionsHeight = 64;
    const methodButtonGroupHeight = 50; // Height for method selector buttons
    
    // Use maximum input count (method3 has 4 inputs)
    const maxInputCount = 6;
    const outputCount = this.getOutputCount();
    const totalFieldCount = maxInputCount + outputCount;
    
    const inputSectionsHeight = maxInputCount * inputSectionHeight;
    const outputSectionsHeight = outputCount * outputSectionHeight;
    const totalSectionsHeight = inputSectionsHeight + outputSectionsHeight;
    const gapsHeight = (totalFieldCount + 1) * formGap;
    const minHeight = titleBarHeight + windowContentPadding + methodButtonGroupHeight + totalSectionsHeight + gapsHeight + dividerHeight + actionsHeight + 130;
    
    return { width: 400, height: minHeight + 15};
  },
  
  // Required: Get calculator HTML
  getHTML(windowId) {
    // Get the active method - ALWAYS read directly from module-level storage first
    // This ensures we get the most up-to-date value, even if restoreStateBeforeRender hasn't run yet
    let activeMethod = BS9999MergeFlowMethodStorage[windowId] || this.getActiveMethod(windowId);
    
    return `
      <div class="form-calculator" id="calc-${windowId}">
        <!-- Method Selector Buttons -->
        <div class="method-selector" style="display: flex; gap: 8px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--window-border);">
          <button class="method-btn ${activeMethod === 'method1' ? 'active' : ''}" 
                  data-window-id="${windowId}" 
                  data-method="method1"
                  style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${activeMethod === 'method1' ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${activeMethod === 'method1' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
            Upper Level
          </button>
          <button class="method-btn ${activeMethod === 'method2' ? 'active' : ''}" 
                  data-window-id="${windowId}" 
                  data-method="method2"
                  style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${activeMethod === 'method2' ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${activeMethod === 'method2' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
            Basement Level
          </button>
          <button class="method-btn ${activeMethod === 'method3' ? 'active' : ''}" 
                  data-window-id="${windowId}" 
                  data-method="method3"
                  style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${activeMethod === 'method3' ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${activeMethod === 'method3' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
            Multi-Level
          </button>
        </div>
        
        <div class="calc-input-section">
          <!-- Method 1: 5 inputs -->
          ${activeMethod === 'method1' ? `
            <div class="calc-section">
              <label class="calc-label">Number of People</label>
              <input type="number" class="calc-input" id="method1-input1-${windowId}" min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label">Stair Width (mm)</label>
              <input type="number" class="calc-input" id="method1-input2-${windowId}"  min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label">Distance (m)</label>
              <input type="number" class="calc-input" id="method1-input3-${windowId}" min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label"> Storey Exit Width (mm)</label>
              <input type="number" class="calc-input" id="method1-input4-${windowId}"  min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label"> Door Width Per Person (mm)</label>
              <input type="number" class="calc-input" id="method1-input5-${windowId}"  min="0" data-window-id="${windowId}">
            </div>
          ` : ''}
          
          <!-- Method 2: 5 inputs -->
          ${activeMethod === 'method2' ? `
            <div class="calc-section">
              <label class="calc-label">Number of People</label>
              <input type="number" class="calc-input" id="method2-input1-${windowId}" min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label">Stair Width Up (mm)</label>
              <input type="number" class="calc-input" id="method2-input2-${windowId}"  min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label">Distance (m)</label>
              <input type="number" class="calc-input" id="method2-input3-${windowId}" min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label"> Stair Width Down (mm)</label>
              <input type="number" class="calc-input" id="method2-input4-${windowId}"  min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label">  Door Width Per Person (mm)</label>
              <input type="number" class="calc-input" id="method2-input5-${windowId}"  min="0" data-window-id="${windowId}">
            </div>
          ` : ''}
          
          <!-- Method 3: 7 inputs -->
          ${activeMethod === 'method3' ? `
            <div class="calc-section">
              <label class="calc-label">Upper Level Occupancy</label>
              <input type="number" class="calc-input" id="method3-input1-${windowId}" min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label">Basement Level Occupancy</label>
              <input type="number" class="calc-input" id="method3-input2-${windowId}"  min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label">Stair Width Up (mm)</label>
              <input type="number" class="calc-input" id="method3-input3-${windowId}" min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label">Stair Width Down (mm)</label>
              <input type="number" class="calc-input" id="method3-input4-${windowId}" min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label">Storey Exit Width (mm)</label>
              <input type="number" class="calc-input" id="method3-input5-${windowId}" min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label">Distance (m)</label>
              <input type="number" class="calc-input" id="method3-input6-${windowId}" min="0" data-window-id="${windowId}">
            </div>
            <div class="calc-section">
              <label class="calc-label"> Door Width Per Person (mm)</label>
              <input type="number" class="calc-input" id="method3-input7-${windowId}" min="0" data-window-id="${windowId}">
            </div>
          ` : ''}
        </div>
        
        <div class="calc-divider">
          <div class="divider-line"></div>
          <div class="divider-label">Results</div>
          <div class="divider-line"></div>
        </div>
        
        <div class="calc-output-section">
          <div class="calc-section">
            <label class="calc-label">Minimum Final Exit Width</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-output-wrapper">
                <input type="text" class="calc-output" id="result-${windowId}"  readonly>
                <span class="calc-output-unit"> mm </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="calc-actions" style="position: relative; display: flex; justify-content: space-between; gap: 8px;">
          <button class="action-btn clear-btn" data-window-id="${windowId}">Clear</button>
          <button class="action-btn export-btn" data-window-id="${windowId}" >Export</button>
          <button class="action-btn import-btn" data-window-id="${windowId}" >Import</button>
          <button class="action-btn help-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Detail</button>
        </div>
      </div>
    `;
  },
  
  // Required: Get help window HTML - BS 9999 Merge Flow Calculation Report
  getHelpHTML(windowId, sourceWindowId) {
    const srcId = sourceWindowId || windowId;
    const activeMethod = this.getActiveMethod(srcId);
    const reportId = `bsmergeflow-report-${windowId}`;
    const copyBtnId = `bsmergeflow-copy-${windowId}`;

    // Helper to get input value
    const getVal = (method, inputNum) => {
      const el = document.getElementById(`${method}-input${inputNum}-${srcId}`);
      const v = el ? parseFloat(el.value) : NaN;
      return isNaN(v) ? '—' : v;
    };
    const getResult = () => {
      const el = document.getElementById(`result-${srcId}`);
      return el && el.value ? el.value : '—';
    };

    const fmt = (x) => (typeof x === 'number' && !isNaN(x) ? x.toLocaleString('en-US', { maximumFractionDigits: 2 }) : String(x));

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
    let qMerge = '—';
    let wFinal = getResult();
    let safetyFactor = '1.0';
    let existingExit = '—';

    if (activeMethod === 'method1') {
      const P = parseFloat(getVal('method1', 1));
      const Ws = parseFloat(getVal('method1', 2));
      const D = parseFloat(getVal('method1', 3));
      const We = parseFloat(getVal('method1', 4));
      const Wp = parseFloat(getVal('method1', 5));
      const hasAll = !isNaN(P) && !isNaN(Ws) && !isNaN(D) && !isNaN(We) && !isNaN(Wp);
      const dLess2 = hasAll && D < 2;
      const coeff = dLess2 ? 0.75 : 0.50;
      const qCalc = hasAll ? (P * Wp) + (coeff * Ws) : null;
      qMerge = qCalc != null ? fmt(qCalc) : '—';
      const wCalc = hasAll ? Math.max(qCalc, We) : null;
      wFinal = wCalc != null ? fmt(wCalc) : wFinal;
      safetyFactor = '1.0';
      existingExit = hasAll ? fmt(We) : '—';

      inputTable = `
        <tr><td>Number of People (P)</td><td>${fmt(P)}</td><td>persons</td></tr>
        <tr><td>Stair Width (Wₛ)</td><td>${fmt(Ws)}</td><td>mm</td></tr>
        <tr><td>Travel Distance (D)</td><td>${fmt(D)}</td><td>m</td></tr>
        <tr><td>Storey Exit Width (Wₑ)</td><td>${fmt(We)}</td><td>mm</td></tr>
        <tr><td>Door Width per Person (Wₚ)</td><td>${fmt(Wp)}</td><td>mm/person</td></tr>`;

      const formulaBlockStyle = 'margin: 6px 0; padding: 8px 12px; background: var(--result-card-bg); border: 1px solid var(--window-border); border-radius: 4px; font-size: 12px; overflow-x: auto;';
      methodology = `
        <p><strong>Step 1: Travel Distance Assessment</strong></p>
        <ul><li>If D &lt; 2 m: Occupants reach stair quickly, merge before stair flow is fully established</li>
        <li>If D ≥ 2 m: Occupants take longer to reach stair, allowing stair flow to partially establish</li></ul>
        <p><strong>Step 2: Merge Flow Formulas</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('D < 2 \\text{ m: } Q_{merge} = (P \\times W_p) + (0.75 \\times W_s)')}</div>
        <div style="${formulaBlockStyle}">${renderMath('D \\geq 2 \\text{ m: } Q_{merge} = (P \\times W_p) + (0.50 \\times W_s)')}</div>
        <p><strong>Step 3: Final Exit Width</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('W_{final} = \\max(Q_{merge}, W_e)')}</div>`;

      if (hasAll) {
        workedExample = `
        <p>Given: P = ${fmt(P)}, Wₛ = ${fmt(Ws)} mm, D = ${fmt(D)} m, Wₑ = ${fmt(We)} mm, Wₚ = ${fmt(Wp)} mm/person</p>
        <p>Since D ${dLess2 ? '<' : '≥'} 2 m:</p>
        <div style="${formulaBlockStyle}">${renderMath(`Q_{merge} = (${fmt(P)} \\times ${fmt(Wp)}) + (${coeff} \\times ${fmt(Ws)}) = ${qMerge} \\text{ mm}`)}</div>
        <div style="${formulaBlockStyle}">${renderMath(`W_{final} = \\max(${qMerge}, ${fmt(We)}) = ${wFinal} \\text{ mm}`)}</div>`;
      } else {
        workedExample = '<p>Enter all input values to see worked example.</p>';
      }
    } else if (activeMethod === 'method2') {
      const P = parseFloat(getVal('method2', 1));
      const Wu = parseFloat(getVal('method2', 2));
      const D = parseFloat(getVal('method2', 3));
      const Wd = parseFloat(getVal('method2', 4));
      const Wp = parseFloat(getVal('method2', 5));
      const hasAll = !isNaN(P) && !isNaN(Wu) && !isNaN(D) && !isNaN(Wd) && !isNaN(Wp);
      const wEff = hasAll ? Math.min(Wu, Wd) * 0.85 : null;
      const dLess2 = hasAll && D < 2;
      const coeff = dLess2 ? 0.85 : 0.60;
      const qCalc = hasAll ? (P * Wp) + (coeff * wEff) : null;
      qMerge = qCalc != null ? fmt(qCalc) : '—';
      const wCalc = hasAll ? qCalc * 1.10 : null;
      wFinal = wCalc != null ? fmt(wCalc) : wFinal;
      safetyFactor = '1.10';
      existingExit = '—';

      inputTable = `
        <tr><td>Number of People (P)</td><td>${fmt(P)}</td><td>persons</td></tr>
        <tr><td>Stair Width Up (Wᵤ)</td><td>${fmt(Wu)}</td><td>mm</td></tr>
        <tr><td>Travel Distance (D)</td><td>${fmt(D)}</td><td>m</td></tr>
        <tr><td>Stair Width Down (W_d)</td><td>${fmt(Wd)}</td><td>mm</td></tr>
        <tr><td>Door Width per Person (Wₚ)</td><td>${fmt(Wp)}</td><td>mm/person</td></tr>`;

      const formulaBlockStyle = 'margin: 6px 0; padding: 8px 12px; background: var(--result-card-bg); border: 1px solid var(--window-border); border-radius: 4px; font-size: 12px; overflow-x: auto;';
      methodology = `
        <p><strong>Step 1: Effective Stair Width</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('W_{eff} = \\min(W_u, W_d) \\times 0.85')}</div>
        <p><strong>Step 2: Merge Flow Formulas</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('D < 2 \\text{ m: } Q_{merge} = (P \\times W_p) + (0.85 \\times W_{eff})')}</div>
        <div style="${formulaBlockStyle}">${renderMath('D \\geq 2 \\text{ m: } Q_{merge} = (P \\times W_p) + (0.60 \\times W_{eff})')}</div>
        <p><strong>Step 3: Basement Safety Factor</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('W_{final} = Q_{merge} \\times 1.10')}</div>`;

      if (hasAll) {
        workedExample = `
        <div style="${formulaBlockStyle}">${renderMath(`W_{eff} = \\min(${fmt(Wu)}, ${fmt(Wd)}) \\times 0.85 = ${fmt(wEff)} \\text{ mm}`)}</div>
        <p>Since D ${dLess2 ? '<' : '≥'} 2 m:</p>
        <div style="${formulaBlockStyle}">${renderMath(`Q_{merge} = (${fmt(P)} \\times ${fmt(Wp)}) + (${coeff} \\times ${fmt(wEff)}) = ${qMerge} \\text{ mm}`)}</div>
        <div style="${formulaBlockStyle}">${renderMath(`W_{final} = ${qMerge} \\times 1.10 = ${wFinal} \\text{ mm}`)}</div>`;
      } else {
        workedExample = '<p>Enter all input values to see worked example.</p>';
      }
    } else {
      // method3
      const Pu = parseFloat(getVal('method3', 1));
      const Pb = parseFloat(getVal('method3', 2));
      const Wu = parseFloat(getVal('method3', 3));
      const Wd = parseFloat(getVal('method3', 4));
      const We = parseFloat(getVal('method3', 5));
      const D = parseFloat(getVal('method3', 6));
      const Wp = parseFloat(getVal('method3', 7));
      const hasAll = !isNaN(Pu) && !isNaN(Pb) && !isNaN(Wu) && !isNaN(Wd) && !isNaN(We) && !isNaN(D) && !isNaN(Wp);
      const qUpper = hasAll ? (Pu * Wp) + (0.75 * Wu) : null;
      const qLower = hasAll ? (Pb * Wp) + (0.75 * Wd) : null;
      const dLess2 = hasAll && D < 2;
      const qTotal = hasAll ? (dLess2 ? Math.max(qUpper, qLower) + (0.50 * Math.min(qUpper, qLower)) : 0.70 * (qUpper + qLower)) : null;
      qMerge = qTotal != null ? fmt(qTotal) : '—';
      const wCalc = hasAll ? Math.max(qTotal, We) * 1.15 : null;
      wFinal = wCalc != null ? fmt(wCalc) : wFinal;
      safetyFactor = '1.15';
      existingExit = hasAll ? fmt(We) : '—';

      inputTable = `
        <tr><td>Upper Level Occupancy (Pᵤ)</td><td>${fmt(Pu)}</td><td>persons</td></tr>
        <tr><td>Basement Level Occupancy (P_b)</td><td>${fmt(Pb)}</td><td>persons</td></tr>
        <tr><td>Stair Width Up (Wᵤ)</td><td>${fmt(Wu)}</td><td>mm</td></tr>
        <tr><td>Stair Width Down (W_d)</td><td>${fmt(Wd)}</td><td>mm</td></tr>
        <tr><td>Storey Exit Width (Wₑ)</td><td>${fmt(We)}</td><td>mm</td></tr>
        <tr><td>Distance to Stair (D)</td><td>${fmt(D)}</td><td>m</td></tr>
        <tr><td>Door Width per Person (Wₚ)</td><td>${fmt(Wp)}</td><td>mm/person</td></tr>`;

      const formulaBlockStyle = 'margin: 6px 0; padding: 8px 12px; background: var(--result-card-bg); border: 1px solid var(--window-border); border-radius: 4px; font-size: 12px; overflow-x: auto;';
      methodology = `
        <p><strong>Step 1: Individual Level Merge Requirements</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('\\text{Upper: } Q_{upper} = (P_u \\times W_p) + (0.75 \\times W_u)')}</div>
        <div style="${formulaBlockStyle}">${renderMath('\\text{Basement: } Q_{lower} = (P_b \\times W_p) + (0.75 \\times W_d)')}</div>
        <p><strong>Step 2: Cumulative Flow Formulas</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('D < 2 \\text{ m: } Q_{total} = \\max(Q_{upper}, Q_{lower}) + 0.50 \\times \\min(Q_{upper}, Q_{lower})')}</div>
        <div style="${formulaBlockStyle}">${renderMath('D \\geq 2 \\text{ m: } Q_{total} = 0.70 \\times (Q_{upper} + Q_{lower})')}</div>
        <p><strong>Step 3: Accumulation Allowance</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('W_{final} = \\max(Q_{total}, W_e) \\times 1.15')}</div>`;

      if (hasAll) {
        const formulaText = dLess2
          ? `\\max(${fmt(qUpper)}, ${fmt(qLower)}) + 0.50 \\times \\min(${fmt(qUpper)}, ${fmt(qLower)})`
          : `0.70 \\times (${fmt(qUpper)} + ${fmt(qLower)})`;
        workedExample = `
        <div style="${formulaBlockStyle}">${renderMath(`Q_{upper} = (${fmt(Pu)} \\times ${fmt(Wp)}) + (0.75 \\times ${fmt(Wu)}) = ${fmt(qUpper)} \\text{ mm}`)}</div>
        <div style="${formulaBlockStyle}">${renderMath(`Q_{lower} = (${fmt(Pb)} \\times ${fmt(Wp)}) + (0.75 \\times ${fmt(Wd)}) = ${fmt(qLower)} \\text{ mm}`)}</div>
        <p>Since D ${dLess2 ? '<' : '≥'} 2 m:</p>
        <div style="${formulaBlockStyle}">${renderMath(`Q_{total} = ${formulaText} = ${qMerge} \\text{ mm}`)}</div>
        <div style="${formulaBlockStyle}">${renderMath(`W_{final} = \\max(${qMerge}, ${fmt(We)}) \\times 1.15 = ${wFinal} \\text{ mm}`)}</div>`;
      } else {
        workedExample = '<p>Enter all input values to see worked example.</p>';
      }
    }

    const commonSections = `
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Results Summary</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Calculation Step</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
        <tr><td style="padding:6px; border:1px solid var(--window-border);">Merge Flow Requirement</td><td style="padding:6px; border:1px solid var(--window-border);">${qMerge}</td><td style="padding:6px; border:1px solid var(--window-border);">mm</td></tr>
        <tr><td style="padding:6px; border:1px solid var(--window-border);">Existing Exit Width</td><td style="padding:6px; border:1px solid var(--window-border);">${existingExit}</td><td style="padding:6px; border:1px solid var(--window-border);">mm</td></tr>
        <tr><td style="padding:6px; border:1px solid var(--window-border);">Applied Safety Factor</td><td style="padding:6px; border:1px solid var(--window-border);">${safetyFactor}</td><td style="padding:6px; border:1px solid var(--window-border);">-</td></tr>
        <tr style="background:var(--button-hover);"><td style="padding:6px; border:1px solid var(--window-border);"><strong>Minimum Final Exit Width</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${wFinal}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>mm</strong></td></tr>
      </table>`;

    return `
      <div class="form-calculator window-content-help" id="help-${windowId}" style="padding: 8px 12px; gap: 4px;">
        <div id="${reportId}" style="font-size: 12px; line-height: 1.4; color: var(--text-primary);">
          <h3 style="margin: 0 0 4px 0; font-size: 14px;">BS 9999 MERGE FLOW CALCULATION REPORT</h3>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary);">Reference: BS 9999:2017 - Annex B, Clauses 16 &amp; 17</p>
          <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Input Parameters</h4>
          <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
            <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Parameter</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
            ${inputTable}
          </table>
          <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Calculation Methodology</h4>
          <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">${methodology}</div>
          <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Step 4: Worked Example</h4>
          <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">${workedExample}</div>
          ${commonSections}
        </div>
        <div style="margin-top: 8px; display: flex; justify-content: flex-end;"><button id="${copyBtnId}" class="action-btn" style="padding: 6px 14px; background: var(--primary-color); color: white;" onclick="var r=document.getElementById('${reportId}');var b=event.target;if(r&&navigator.clipboard)navigator.clipboard.writeText(r.innerText||r.textContent).then(function(){b.textContent='Copied!';setTimeout(function(){b.textContent='Copy Report to Clipboard';},2000);});">Copy Report to Clipboard</button></div>
      </div>
    `;
  },
  
  // Required: Calculate function
  calculate(windowId) {
    const activeMethod = this.getActiveMethod(windowId);
    const resultEl = document.getElementById(`result-${windowId}`);
    
    if (!resultEl) return;
    
    let result = null;
    let allInputsValid = false;
    
    if (activeMethod === 'method1') {
      // Method 1: 2 inputs
      const input1El = document.getElementById(`method1-input1-${windowId}`);
      const input2El = document.getElementById(`method1-input2-${windowId}`);
      const input3El = document.getElementById(`method1-input3-${windowId}`);
      const input4El = document.getElementById(`method1-input4-${windowId}`);
      const input5El = document.getElementById(`method1-input5-${windowId}`);

      if (!input1El || !input2El || !input3El || !input4El || !input5El) return;
      
      const input1 = parseFloat(input1El.value) || 0;
      const input2 = parseFloat(input2El.value) || 0;
      const input3 = parseFloat(input3El.value) || 0;
      const input4 = parseFloat(input4El.value) || 0;
      const input5 = parseFloat(input5El.value) || 0;

      if (input1 && input2 && input3 && input4 && input5) {
        allInputsValid = true;
        if (input1 > 60 && input3 < 2){
          result = input2 + input4;
        }
        else{
          result = input1 * input5 + 0.75 * input2;
        }
      }
      
    } else if (activeMethod === 'method2') {
      // Method 2: Basement (5 inputs) - P, Wu, D, Wd, Wp
      const input1El = document.getElementById(`method2-input1-${windowId}`);
      const input2El = document.getElementById(`method2-input2-${windowId}`);
      const input3El = document.getElementById(`method2-input3-${windowId}`);
      const input4El = document.getElementById(`method2-input4-${windowId}`);
      const input5El = document.getElementById(`method2-input5-${windowId}`);
      
      if (!input1El || !input2El || !input3El || !input4El || !input5El) return;
      
      const P = parseFloat(input1El.value) || 0;
      const Wu = parseFloat(input2El.value) || 0;
      const D = parseFloat(input3El.value) || 0;
      const Wd = parseFloat(input4El.value) || 0;
      const Wp = parseFloat(input5El.value) || 0;

      if (P && Wu && D && Wd && Wp) {
        allInputsValid = true;
        const wEff = Math.min(Wu, Wd) * 0.85;
        const coeff = D < 2 ? 0.85 : 0.60;
        const qMerge = (P * Wp) + (coeff * wEff);
        result = qMerge * 1.10;
      }
      
    } else if (activeMethod === 'method3') {
      // Method 3: 4 inputs
      const input1El = document.getElementById(`method3-input1-${windowId}`);
      const input2El = document.getElementById(`method3-input2-${windowId}`);
      const input3El = document.getElementById(`method3-input3-${windowId}`);
      const input4El = document.getElementById(`method3-input4-${windowId}`);
      const input5El = document.getElementById(`method3-input5-${windowId}`);
      const input6El = document.getElementById(`method3-input6-${windowId}`);
      const input7El = document.getElementById(`method3-input7-${windowId}`);

      if (!input1El || !input2El || !input3El || !input4El || !input5El || !input6El || !input7El) return;
      
      const input1 = parseFloat(input1El.value) || 0;
      const input2 = parseFloat(input2El.value) || 0;
      const input3 = parseFloat(input3El.value) || 0;
      const input4 = parseFloat(input4El.value) || 0;
      const input5 = parseFloat(input5El.value) || 0;
      const input6 = parseFloat(input6El.value) || 0;
      const input7 = parseFloat(input7El.value) || 0;

      if (input1 && input2 && input3 && input4 && input5 && input6 && input7) {
        allInputsValid = true;
        if (input1+input2 > 60 && input6 < 2){
          result = input3 + input4+input5;
        }
        else{
          result = input1*input7 + input2*input7+ 0.75 * input3;
        }
      }
    }
    
    // Update output field
    if (allInputsValid && result !== null) {
      resultEl.value = result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      resultEl.placeholder = '—';
    } else {
      resultEl.value = '';
      resultEl.placeholder = '—';
    }
  },
  
  // Required: Clear function
  clear(windowId) {
    const activeMethod = this.getActiveMethod(windowId);
    
    if (activeMethod === 'method1') {
      // Method 1 has 5 inputs
      const input1El = document.getElementById(`method1-input1-${windowId}`);
      const input2El = document.getElementById(`method1-input2-${windowId}`);
      const input3El = document.getElementById(`method1-input3-${windowId}`);
      const input4El = document.getElementById(`method1-input4-${windowId}`);
      const input5El = document.getElementById(`method1-input5-${windowId}`);
      if (input1El) input1El.value = '';
      if (input2El) input2El.value = '';
      if (input3El) input3El.value = '';
      if (input4El) input4El.value = '';
      if (input5El) input5El.value = '';
    } else if (activeMethod === 'method2') {
      // Method 2 has 5 inputs
      const input1El = document.getElementById(`method2-input1-${windowId}`);
      const input2El = document.getElementById(`method2-input2-${windowId}`);
      const input3El = document.getElementById(`method2-input3-${windowId}`);
      const input4El = document.getElementById(`method2-input4-${windowId}`);
      const input5El = document.getElementById(`method2-input5-${windowId}`);
      if (input1El) input1El.value = '';
      if (input2El) input2El.value = '';
      if (input3El) input3El.value = '';
      if (input4El) input4El.value = '';
      if (input5El) input5El.value = '';
    } else if (activeMethod === 'method3') {
      // Method 3 has 7 inputs
      const input1El = document.getElementById(`method3-input1-${windowId}`);
      const input2El = document.getElementById(`method3-input2-${windowId}`);
      const input3El = document.getElementById(`method3-input3-${windowId}`);
      const input4El = document.getElementById(`method3-input4-${windowId}`);
      const input5El = document.getElementById(`method3-input5-${windowId}`);
      const input6El = document.getElementById(`method3-input6-${windowId}`);
      const input7El = document.getElementById(`method3-input7-${windowId}`);
      if (input1El) input1El.value = '';
      if (input2El) input2El.value = '';
      if (input3El) input3El.value = '';
      if (input4El) input4El.value = '';
      if (input5El) input5El.value = '';
      if (input6El) input6El.value = '';
      if (input7El) input7El.value = '';
    }
    
    this.calculate(windowId);
  },
  
  // Required: Save input values before re-rendering
  saveInputValues(windowId) {
    const savedValues = {
      method: this.getActiveMethod(windowId)
    };
    
    const activeMethod = this.getActiveMethod(windowId);
    
    if (activeMethod === 'method1') {
      // Method 1 has 5 inputs
      const input1El = document.getElementById(`method1-input1-${windowId}`);
      const input2El = document.getElementById(`method1-input2-${windowId}`);
      const input3El = document.getElementById(`method1-input3-${windowId}`);
      const input4El = document.getElementById(`method1-input4-${windowId}`);
      const input5El = document.getElementById(`method1-input5-${windowId}`);
      if (input1El) savedValues.method1_input1 = input1El.value;
      if (input2El) savedValues.method1_input2 = input2El.value;
      if (input3El) savedValues.method1_input3 = input3El.value;
      if (input4El) savedValues.method1_input4 = input4El.value;
      if (input5El) savedValues.method1_input5 = input5El.value;
    } else if (activeMethod === 'method2') {
      // Method 2 has 5 inputs
      const input1El = document.getElementById(`method2-input1-${windowId}`);
      const input2El = document.getElementById(`method2-input2-${windowId}`);
      const input3El = document.getElementById(`method2-input3-${windowId}`);
      const input4El = document.getElementById(`method2-input4-${windowId}`);
      const input5El = document.getElementById(`method2-input5-${windowId}`);
      if (input1El) savedValues.method2_input1 = input1El.value;
      if (input2El) savedValues.method2_input2 = input2El.value;
      if (input3El) savedValues.method2_input3 = input3El.value;
      if (input4El) savedValues.method2_input4 = input4El.value;
      if (input5El) savedValues.method2_input5 = input5El.value;
    } else if (activeMethod === 'method3') {
      // Method 3 has 7 inputs
      const input1El = document.getElementById(`method3-input1-${windowId}`);
      const input2El = document.getElementById(`method3-input2-${windowId}`);
      const input3El = document.getElementById(`method3-input3-${windowId}`);
      const input4El = document.getElementById(`method3-input4-${windowId}`);
      const input5El = document.getElementById(`method3-input5-${windowId}`);
      const input6El = document.getElementById(`method3-input6-${windowId}`);
      const input7El = document.getElementById(`method3-input7-${windowId}`);
      if (input1El) savedValues.method3_input1 = input1El.value;
      if (input2El) savedValues.method3_input2 = input2El.value;
      if (input3El) savedValues.method3_input3 = input3El.value;
      if (input4El) savedValues.method3_input4 = input4El.value;
      if (input5El) savedValues.method3_input5 = input5El.value;
      if (input6El) savedValues.method3_input6 = input6El.value;
      if (input7El) savedValues.method3_input7 = input7El.value;
    }
    
    return savedValues;
  },
  
  // Restore state before rendering (called before getHTML to ensure correct method is shown)
  restoreStateBeforeRender(windowId, savedValues) {
    // Priority 1: Restore from savedValues if available
    if (savedValues && savedValues.method) {
      BS9999MergeFlowMethodStorage[windowId] = savedValues.method;
      this.windowMethods[windowId] = savedValues.method;
      return;
    }
    
    // Priority 2: Check module-level storage (most reliable - should already be there)
    if (BS9999MergeFlowMethodStorage[windowId]) {
      // Method already stored, ensure it's synced
      this.windowMethods[windowId] = BS9999MergeFlowMethodStorage[windowId];
      return;
    }
    
    // Priority 3: Check localStorage as backup
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedMethod = localStorage.getItem(`bsmergeflow_method_${windowId}`);
        if (savedMethod && (savedMethod === 'method1' || savedMethod === 'method2' || savedMethod === 'method3')) {
          BS9999MergeFlowMethodStorage[windowId] = savedMethod;
          this.windowMethods[windowId] = savedMethod;
          return;
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  },
  
  // Required: Restore input values after re-rendering
  restoreInputValues(windowId, savedValues) {
    if (!savedValues) return;
    
    // DON'T restore method here - it was already restored in restoreStateBeforeRender
    // Only restore method if it's not already set in module-level storage
    // This prevents overwriting the correct method with an old saved value
    if (savedValues.method && !BS9999MergeFlowMethodStorage[windowId]) {
      // Only restore if method isn't already set (shouldn't happen, but safety check)
      this.setActiveMethod(windowId, savedValues.method);
    }
    
    // Use the CURRENT method from storage (already set by restoreStateBeforeRender)
    // Don't use savedValues.method as it might be stale from before the method switch
    const method = BS9999MergeFlowMethodStorage[windowId] || savedValues.method || 'method1';
    
    if (method === 'method1') {
      // Method 1 has 5 inputs
      const input1El = document.getElementById(`method1-input1-${windowId}`);
      const input2El = document.getElementById(`method1-input2-${windowId}`);
      const input3El = document.getElementById(`method1-input3-${windowId}`);
      const input4El = document.getElementById(`method1-input4-${windowId}`);
      const input5El = document.getElementById(`method1-input5-${windowId}`);
      if (input1El && savedValues.method1_input1 !== undefined) {
        input1El.value = savedValues.method1_input1;
      }
      if (input2El && savedValues.method1_input2 !== undefined) {
        input2El.value = savedValues.method1_input2;
      }
      if (input3El && savedValues.method1_input3 !== undefined) {
        input3El.value = savedValues.method1_input3;
      }
      if (input4El && savedValues.method1_input4 !== undefined) {
        input4El.value = savedValues.method1_input4;
      }
      if (input5El && savedValues.method1_input5 !== undefined) {
        input5El.value = savedValues.method1_input5;
      }
    } else if (method === 'method2') {
      // Method 2 has 5 inputs
      const input1El = document.getElementById(`method2-input1-${windowId}`);
      const input2El = document.getElementById(`method2-input2-${windowId}`);
      const input3El = document.getElementById(`method2-input3-${windowId}`);
      const input4El = document.getElementById(`method2-input4-${windowId}`);
      const input5El = document.getElementById(`method2-input5-${windowId}`);
      if (input1El && savedValues.method2_input1 !== undefined) {
        input1El.value = savedValues.method2_input1;
      }
      if (input2El && savedValues.method2_input2 !== undefined) {
        input2El.value = savedValues.method2_input2;
      }
      if (input3El && savedValues.method2_input3 !== undefined) {
        input3El.value = savedValues.method2_input3;
      }
      if (input4El && savedValues.method2_input4 !== undefined) {
        input4El.value = savedValues.method2_input4;
      }
      if (input5El && savedValues.method2_input5 !== undefined) {
        input5El.value = savedValues.method2_input5;
      }
    } else if (method === 'method3') {
      // Method 3 has 7 inputs
      const input1El = document.getElementById(`method3-input1-${windowId}`);
      const input2El = document.getElementById(`method3-input2-${windowId}`);
      const input3El = document.getElementById(`method3-input3-${windowId}`);
      const input4El = document.getElementById(`method3-input4-${windowId}`);
      const input5El = document.getElementById(`method3-input5-${windowId}`);
      const input6El = document.getElementById(`method3-input6-${windowId}`);
      const input7El = document.getElementById(`method3-input7-${windowId}`);
      if (input1El && savedValues.method3_input1 !== undefined) {
        input1El.value = savedValues.method3_input1;
      }
      if (input2El && savedValues.method3_input2 !== undefined) {
        input2El.value = savedValues.method3_input2;
      }
      if (input3El && savedValues.method3_input3 !== undefined) {
        input3El.value = savedValues.method3_input3;
      }
      if (input4El && savedValues.method3_input4 !== undefined) {
        input4El.value = savedValues.method3_input4;
      }
      if (input5El && savedValues.method3_input5 !== undefined) {
        input5El.value = savedValues.method3_input5;
      }
      if (input6El && savedValues.method3_input6 !== undefined) {
        input6El.value = savedValues.method3_input6;
      }
      if (input7El && savedValues.method3_input7 !== undefined) {
        input7El.value = savedValues.method3_input7;
      }
    }
    
    // Recalculate after restoring
    setTimeout(() => {
      this.calculate(windowId);
    }, 50);
  },
  
  // Optional: Attach calculator-specific event handlers
  attachEvents(windowId) {
    // Handle method button clicks
    const methodButtons = document.querySelectorAll(`.method-btn[data-window-id="${windowId}"]`);
    methodButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const method = btn.getAttribute('data-method');
        
        // Save current input values before switching
        const savedValues = this.saveInputValues(windowId);
        
        // Set new method
        this.setActiveMethod(windowId, method);
        
        // Re-render the window to show the correct inputs
        if (typeof window.renderWindows === 'function') {
          window.renderWindows();
          // Restore input values after a short delay to ensure DOM is ready
          setTimeout(() => {
            this.restoreInputValues(windowId, savedValues);
            // Update help window if it exists and is open
            this.updateHelpWindow(windowId);
            // Update figure window if it exists and is open
            this.updateFigureWindow(windowId);
          }, 50);
        }
      });
    });
  },
  
  // Update help window content when method changes
  updateHelpWindow(sourceWindowId) {
    if (typeof window === 'undefined' || !window.state) return;
    
    // Find the help window for this source window
    const helpWindow = window.state.windows.find(w => 
      w.sourceWindowId === sourceWindowId && 
      w.type === 'BSmergeflow-help'
    );
    
    if (helpWindow && !helpWindow.minimized) {
      // Re-render windows to update help content
      if (typeof window.renderWindows === 'function') {
        window.renderWindows();
      }
    }
  },
  
  // Update figure window image when method changes
  updateFigureWindow(sourceWindowId) {
    if (typeof window === 'undefined' || !window.state) return;
    
    // Find the figure window for this source window
    const figureWindow = window.state.windows.find(w => 
      w.sourceWindowId === sourceWindowId && 
      w.type === 'BSmergeflow-figure'
    );
    
    if (figureWindow) {
      const activeMethod = this.getActiveMethod(sourceWindowId);
      const newImagePath = `Figures/BSmergeflow-${activeMethod}.png.png`;
      
      // Update image path and method
      figureWindow.figureImagePath = newImagePath;
      figureWindow.activeMethod = activeMethod;
      
      // Update title based on method
      if (activeMethod === 'method1') {
        figureWindow.title = 'Upper Level - Figure';
      } else if (activeMethod === 'method2') {
        figureWindow.title = 'Basement Level - Figure';
      } else if (activeMethod === 'method3') {
        figureWindow.title = 'Multi-Level - Figure';
      }
      
      // Re-render windows to update figure content
      if (typeof window.renderWindows === 'function') {
        window.renderWindows();
      }
    }
  }
};
