const FlameheightStorage = {};

const FlameheightCalculator = {
  // Required: Unique identifier for this calculator
  type: 'Flameheight',
  
  // Required: Display name
  name: "Flame Height",
  
  // Required: Icon (emoji or text)
  icon: '🔥',
  
  // Store active method for each window (1, 2, or 3)
  windowMethods: FlameheightStorage,
  
  // Store sub-method for method 1 (4, 5, or 6)
  windowSubMethods: {},
  
  // Get the active method for a window (default to "1")
  getActiveMethod(windowId) {
    if (FlameheightStorage[windowId]) {
      return FlameheightStorage[windowId];
    }
    
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedMethod = localStorage.getItem(`flameheight_method_${windowId}`);
        if (savedMethod && ['1', '2', '3'].includes(savedMethod)) {
          FlameheightStorage[windowId] = savedMethod;
          return savedMethod;
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    
    return '1';
  },
  
  // Get the sub-method for method 1 (default to "4")
  getSubMethod(windowId) {
    if (this.windowSubMethods[windowId]) {
      return this.windowSubMethods[windowId];
    }
    
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedSubMethod = localStorage.getItem(`flameheight_submethod_${windowId}`);
        if (savedSubMethod && ['4', '5', '6'].includes(savedSubMethod)) {
          this.windowSubMethods[windowId] = savedSubMethod;
          return savedSubMethod;
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    
    return '4';
  },
  
  // Set the active method for a window
  setActiveMethod(windowId, method) {
    FlameheightStorage[windowId] = method;
    this.windowMethods[windowId] = method;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`flameheight_method_${windowId}`, method);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  },
  
  // Set the sub-method for method 1
  setSubMethod(windowId, subMethod) {
    this.windowSubMethods[windowId] = subMethod;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`flameheight_submethod_${windowId}`, subMethod);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  },
  
  // Method configurations
  // Method 1: 6 inputs + dropdown (sub-methods 4, 5, 6)
  // Method 2: 6 inputs (Fire Length)
  // Method 3: 7 inputs (Fire Long Dimension + Fire Short Dimension)
  getMethodConfig(method, subMethod) {
    // Common inputs with default values for inputs 2-5
    const commonInputs = [
      { id: 'input1', label: 'Total HRR Q (kW)' },
      { id: 'input2', label: 'Air Density ρ (kg/m³)', defaultValue: 1.2, placeholder: '1.2' },
      { id: 'input3', label: 'Air Heat Capacity c<sub>p</sub> (kJ/(kg·K))', defaultValue: 1.0, placeholder: '1.0' },
      { id: 'input4', label: 'Air Temperature T<sub>∞</sub> (K)', defaultValue: 293, placeholder: '293' },
      { id: 'input5', label: 'Gravity g (m/s²)', defaultValue: 9.81, placeholder: '9.81' }
    ];
    
    // Method 1 inputs: Fire Diameter (6 inputs) + dropdown for sub-method
    const method1Inputs = [
      ...commonInputs,
      { id: 'input6', label: 'Fire Diameter D (m)' }
    ];
    
    // Method 2 inputs: Fire Length (6 inputs)
    const method2Inputs = [
      ...commonInputs,
      { id: 'input6', label: 'Fire Length L (m)' }
    ];
    
    // Method 3 inputs: Fire Long Dimension + Fire Short Dimension (7 inputs)
    const method3Inputs = [
      ...commonInputs,
      { id: 'input6', label: 'Fire Long Dimension L (m)' },
      { id: 'input7', label: 'Fire Short Dimension W (m)' }
    ];
    
    // Base outputs (2 outputs)
    const baseOutputs = [
      { id: 'output1', label: 'Dimensionless HRR', unit: 'kW' },
      { id: 'output2', label: 'Flame Height', unit: 'm' }
    ];
    
    const configs = {
      '1': {
        inputs: method1Inputs,
        outputs: baseOutputs,
        hasDropdown: true,
        dropdownOptions: [
          { value: '4', label: 'Natural Gas' },
          { value: '5', label: 'Wood Cribs' },
          { value: '6', label: 'Gas Liquids Solids' }
        ],
        description: 'Method 1: Circular fire with sub-options'
      },
      '2': {
        inputs: method2Inputs,
        outputs: baseOutputs,
        hasDropdown: false,
        description: 'Method 2: Line fire'
      },
      '3': {
        inputs: method3Inputs,
        outputs: baseOutputs,
        hasDropdown: false,
        description: 'Method 3: Rectangular fire'
      }
    };
    
    return configs[method] || configs['1'];
  },
  
  // Required: Get number of input fields (based on active method)
  getInputCount(windowId) {
    if (windowId) {
      const method = this.getActiveMethod(windowId);
      const config = this.getMethodConfig(method);
      // Add 1 for dropdown if method 1
      return config.inputs.length + (config.hasDropdown ? 1 : 0);
    }
    return 8; // Maximum: 7 inputs + 1 dropdown
  },
  
  // Required: Get number of output fields
  getOutputCount(windowId) {
    if (windowId) {
      const method = this.getActiveMethod(windowId);
      const config = this.getMethodConfig(method);
      return config.outputs.length;
    }
    return 2;
  },
  
  // Required: Get minimum window size
  getMinimumSize() {
    const titleBarHeight = 40;
    const windowContentPadding = 32;
    const formGap = 15;
    const inputSectionHeight = 44;
    const outputSectionHeight = 44;
    const dividerHeight = 7;
    const actionsHeight = 64;
    const methodButtonGroupHeight = 60; // Height for one row of method selector buttons
    
    const maxInputCount = 8; // Maximum: 7 inputs + 1 dropdown
    const maxOutputCount = 2;
    const totalFieldCount = maxInputCount + maxOutputCount;
    
    const inputSectionsHeight = maxInputCount * inputSectionHeight;
    const outputSectionsHeight = maxOutputCount * outputSectionHeight;
    const totalSectionsHeight = inputSectionsHeight + outputSectionsHeight;
    const gapsHeight = (totalFieldCount + 1) * formGap;
    const minHeight = titleBarHeight + windowContentPadding + methodButtonGroupHeight + totalSectionsHeight + gapsHeight + dividerHeight + actionsHeight ;
    
    return { width: 400, height: minHeight};
  },
  
  // Required: Get calculator HTML
  getHTML(windowId) {
    const activeMethod = FlameheightStorage[windowId] || this.getActiveMethod(windowId);
    const subMethod = this.getSubMethod(windowId);
    const config = this.getMethodConfig(activeMethod, subMethod);
    
    // Build input HTML
    let inputHTML = '';
    
    // Add dropdown first if method 1
    if (config.hasDropdown) {
      inputHTML += `
        <div class="calc-section">
          <label class="calc-label">Calculation Type</label>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <div class="calc-input-wrapper">
              <select class="calc-input calc-dropdown" id="submethod-${windowId}" data-window-id="${windowId}">
                ${config.dropdownOptions.map(opt => 
                  `<option value="${opt.value}" ${opt.value === subMethod ? 'selected' : ''}>${opt.label}</option>`
                ).join('')}
              </select>
            </div>
          </div>
        </div>
      `;
    }
    
    config.inputs.forEach(input => {
      const disabledAttr = input.disabled ? 'disabled' : '';
      const disabledClass = input.disabled ? 'input-disabled' : '';
      const wrapperDisabledClass = input.disabled ? 'disabled' : '';
      const inputPlaceholder = input.placeholder !== undefined ? `placeholder="${input.placeholder}"` : '';
      inputHTML += `
        <div class="calc-section ${disabledClass}">
          <label class="calc-label">${input.label}</label>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <div class="calc-input-wrapper ${wrapperDisabledClass}">
              <input type="number" class="calc-input" id="${input.id}-${windowId}" min="0" data-window-id="${windowId}" ${disabledAttr} ${inputPlaceholder}>
            </div>
          </div>
        </div>
      `;
    });
    
    // Build output HTML
    let outputHTML = '';
    config.outputs.forEach(output => {
      const unit = output.unit || 'unit';
      outputHTML += `
        <div class="calc-section">
          <label class="calc-label">${output.label}</label>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <div class="calc-output-wrapper">
              <input type="text" class="calc-output" id="${output.id}-${windowId}" readonly>
              <span class="calc-output-unit">${unit}</span>
            </div>
          </div>
        </div>
      `;
    });
    
    return `
      <div class="form-calculator" id="calc-${windowId}">
        <!-- Method Selector Buttons - Single Row -->
        <div class="method-selector" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--window-border);">
          <div style="display: flex; gap: 8px;">
            <button class="method-btn ${activeMethod === '1' ? 'active' : ''}" 
                    data-window-id="${windowId}" 
                    data-value="1"
                    style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${activeMethod === '1' ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${activeMethod === '1' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
              Circular
            </button>
            <button class="method-btn ${activeMethod === '2' ? 'active' : ''}" 
                    data-window-id="${windowId}" 
                    data-value="2"
                    style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${activeMethod === '2' ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${activeMethod === '2' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
              Line
            </button>
            <button class="method-btn ${activeMethod === '3' ? 'active' : ''}" 
                    data-window-id="${windowId}" 
                    data-value="3"
                    style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${activeMethod === '3' ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${activeMethod === '3' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
              Rectangle
            </button>
          </div>
        </div>
        
        <div class="calc-input-section">
          ${inputHTML}
        </div>
        
        <div class="calc-divider">
          <div class="divider-line"></div>
          <div class="divider-label">Results</div>
          <div class="divider-line"></div>
        </div>
        
        <div class="calc-output-section">
          ${outputHTML}
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
  
  // Required: Get help window HTML - Flame Height Calculation Report
  getHelpHTML(windowId, sourceWindowId) {
    const srcId = sourceWindowId || windowId;
    const activeMethod = this.getActiveMethod(srcId);
    const subMethod = this.getSubMethod(srcId);
    const config = this.getMethodConfig(activeMethod, subMethod);
    const reportId = `flameheight-report-${windowId}`;
    const copyBtnId = `flameheight-copy-${windowId}`;

    const getVal = (id) => {
      const el = document.getElementById(`${id}-${srcId}`);
      if (!el) return null;
      const raw = el.value?.trim();
      const input = config.inputs.find(i => i.id === id);
      if (raw === '' && input?.defaultValue !== undefined) return input.defaultValue;
      const v = parseFloat(raw);
      return isNaN(v) ? null : v;
    };
    const getOutput = (id) => {
      const el = document.getElementById(`${id}-${srcId}`);
      return el && el.value ? el.value : '—';
    };
    const fmt = (x) => (typeof x === 'number' && !isNaN(x) ? x.toLocaleString('en-US', { maximumFractionDigits: 4 }) : String(x));

    const Q = getVal('input1');
    const rho = getVal('input2');
    const cp = getVal('input3');
    const T = getVal('input4');
    const g = getVal('input5');
    const D = getVal('input6');
    const L2 = getVal('input7');

    const hasCommon = Q != null && rho != null && cp != null && T != null && g != null;
    const hasAll = activeMethod === '1' ? (hasCommon && D != null) : activeMethod === '2' ? (hasCommon && D != null) : (hasCommon && D != null && L2 != null);

    let inputTable = '';
    let methodology = '';
    let workedExample = '';
    let qStar = '—';
    let flameHeight = getOutput('output2');
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

    const subLabels = { '4': 'Natural Gas', '5': 'Wood Cribs', '6': 'Gas Liquids Solids' };
    const methodLabels = { '1': 'Circular', '2': 'Line', '3': 'Rectangular' };

    if (activeMethod === '1') {
      inputTable = config.inputs.map(i => `<tr><td>${i.label}</td><td>${fmt(getVal(i.id))}</td><td>${i.id === 'input1' ? 'kW' : i.id === 'input2' ? 'kg/m³' : i.id === 'input3' ? 'kJ/(kg K)' : i.id === 'input4' ? 'K' : i.id === 'input5' ? 'm/s²' : 'm'}</td></tr>`).join('');
      methodology = `
        <p><strong>Step 1: Dimensionless HRR (Circular)</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('Q^* = \\frac{Q}{\\rho \\times c_p \\times T \\times \\sqrt{g} \\times D^{2.5}}')}</div>
        <p><strong>Step 2: Flame Height (${subLabels[subMethod] || '—'})</strong></p>
        ${subMethod === '4' ? `
        <div style="${formulaBlockStyle}">${renderMath('Q^* < 0.15: \\quad H_f = (Q^*)^2 \\times 40 \\times D')}</div>
        <div style="${formulaBlockStyle}">${renderMath('0.15 \\leq Q^* < 1: \\quad H_f = (Q^*)^{2/3} \\times 3.3 \\times D')}</div>
        <div style="${formulaBlockStyle}">${renderMath('1 \\leq Q^* < 40: \\quad H_f = (Q^*)^{2/5} \\times 3.3 \\times D')}</div>
        <div style="${formulaBlockStyle}">${renderMath('Q^* \\geq 40: \\text{ N/A}')}</div>` : subMethod === '5' ? `
        <div style="${formulaBlockStyle}">${renderMath('0.75 < Q^* < 8.8: \\quad H_f = (Q^*)^{0.61} \\times 3.4 \\times D')}</div>
        <div style="${formulaBlockStyle}">Else: N/A</div>` : subMethod === '6' ? `
        <div style="${formulaBlockStyle}">${renderMath('0.12 < Q^* < 12000: \\quad H_f = ((Q^*)^{0.4} \\times 3.7 - 1.02) \\times D')}</div>
        <div style="${formulaBlockStyle}">Else: N/A</div>` : ''}`;

      if (hasAll) {
        const qStarVal = Q / (rho * cp * T * Math.sqrt(g) * Math.pow(D, 2.5));
        qStar = fmt(qStarVal);
        let hCalc = null;
        if (subMethod === '4') {
          if (qStarVal < 0.15) hCalc = Math.pow(qStarVal, 2) * 40 * D;
          else if (qStarVal < 1) hCalc = Math.pow(qStarVal, 2/3) * 3.3 * D;
          else if (qStarVal < 40) hCalc = Math.pow(qStarVal, 2/5) * 3.3 * D;
        } else if (subMethod === '5' && qStarVal > 0.75 && qStarVal < 8.8) {
          hCalc = Math.pow(qStarVal, 0.61) * 3.4 * D;
        } else if (subMethod === '6' && qStarVal > 0.12 && qStarVal < 12000) {
          hCalc = (Math.pow(qStarVal, 0.4) * 3.7 - 1.02) * D;
        }
        flameHeight = hCalc != null ? fmt(hCalc) : getOutput('output2');
        workedExample = `
        <p>Given: Q = ${fmt(Q)} kW, ρ = ${fmt(rho)} kg/m³, cₚ = ${fmt(cp)}, T = ${fmt(T)} K, g = ${fmt(g)} m/s², D = ${fmt(D)} m</p>
        <div style="${formulaBlockStyle}">${renderMath(`Q^* = \\frac{${fmt(Q)}}{${fmt(rho)} \\times ${fmt(cp)} \\times ${fmt(T)} \\times \\sqrt{${fmt(g)}} \\times ${fmt(D)}^{2.5}} = ${qStar}`)}</div>
        <div style="${formulaBlockStyle}">${renderMath(`H_f = ${flameHeight} \\text{ m}`)}</div>`;
      } else {
        workedExample = '<p>Enter all input values to see worked example.</p>';
      }
    } else if (activeMethod === '2') {
      inputTable = config.inputs.map(i => `<tr><td>${i.label}</td><td>${fmt(getVal(i.id))}</td><td>${i.id === 'input6' ? 'm' : i.id === 'input1' ? 'kW' : i.id === 'input2' ? 'kg/m³' : i.id === 'input3' ? 'kJ/(kg K)' : i.id === 'input4' ? 'K' : 'm/s²'}</td></tr>`).join('');
      methodology = `
        <p><strong>Step 1: Dimensionless HRR (Line fire)</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('Q^* = \\frac{Q}{\\rho \\times c_p \\times T \\times \\sqrt{g} \\times L^{1.5}}')}</div>
        <p><strong>Step 2: Flame Height</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('H_f = 3.46 \\times Q^* \\times L')}</div>`;

      if (hasAll) {
        const qStarVal = Q / (rho * cp * T * Math.sqrt(g) * Math.pow(D, 1.5));
        qStar = fmt(qStarVal);
        const hCalc = 3.46 * qStarVal * D;
        flameHeight = fmt(hCalc);
        workedExample = `
        <p>Given: Q = ${fmt(Q)} kW, ρ = ${fmt(rho)} kg/m³, cₚ = ${fmt(cp)}, T = ${fmt(T)} K, g = ${fmt(g)} m/s², L = ${fmt(D)} m</p>
        <div style="${formulaBlockStyle}">${renderMath(`Q^* = \\frac{${fmt(Q)}}{${fmt(rho)} \\times ${fmt(cp)} \\times ${fmt(T)} \\times \\sqrt{${fmt(g)}} \\times ${fmt(D)}^{1.5}} = ${qStar}`)}</div>
        <div style="${formulaBlockStyle}">${renderMath(`H_f = 3.46 \\times ${qStar} \\times ${fmt(D)} = ${flameHeight} \\text{ m}`)}</div>`;
      } else {
        workedExample = '<p>Enter all input values to see worked example.</p>';
      }
    } else {
      inputTable = config.inputs.map(i => `<tr><td>${i.label}</td><td>${fmt(getVal(i.id))}</td><td>${i.id === 'input6' || i.id === 'input7' ? 'm' : i.id === 'input1' ? 'kW' : i.id === 'input2' ? 'kg/m³' : i.id === 'input3' ? 'kJ/(kg K)' : i.id === 'input4' ? 'K' : 'm/s²'}</td></tr>`).join('');
      methodology = `
        <p><strong>Step 1: Dimensionless HRR (Rectangular, L &gt; W)</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('Q^* = \\frac{Q}{\\rho \\times c_p \\times T \\times \\sqrt{g} \\times W^{1.5} \\times L}')}</div>
        <p><strong>Step 2: Flame Height</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('H_f = 3.46 \\times Q^* \\times L')}</div>
        <p><em>Requires L (long) &gt; W (short).</em></p>`;

      if (hasAll && D > L2) {
        const qStarVal = Q / (rho * cp * T * Math.sqrt(g) * Math.pow(L2, 1.5) * D);
        qStar = fmt(qStarVal);
        const hCalc = 3.46 * qStarVal * D;
        flameHeight = fmt(hCalc);
        workedExample = `
        <p>Given: Q = ${fmt(Q)} kW, ρ = ${fmt(rho)}, cₚ = ${fmt(cp)}, T = ${fmt(T)} K, g = ${fmt(g)} m/s², L = ${fmt(D)} m, W = ${fmt(L2)} m</p>
        <div style="${formulaBlockStyle}">${renderMath(`Q^* = \\frac{${fmt(Q)}}{${fmt(rho)} \\times ${fmt(cp)} \\times ${fmt(T)} \\times \\sqrt{${fmt(g)}} \\times ${fmt(L2)}^{1.5} \\times ${fmt(D)}} = ${qStar}`)}</div>
        <div style="${formulaBlockStyle}">${renderMath(`H_f = 3.46 \\times ${qStar} \\times ${fmt(D)} = ${flameHeight} \\text{ m}`)}</div>`;
      } else if (hasAll && D <= L2) {
        workedExample = '<p>Long dimension must be greater than short dimension. Swap L and W.</p>';
      } else {
        workedExample = '<p>Enter all input values to see worked example.</p>';
      }
    }

    const resultsTable = `
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Results Summary</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Calculation Step</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
        <tr><td style="padding:6px; border:1px solid var(--window-border);">Dimensionless HRR (Q*)</td><td style="padding:6px; border:1px solid var(--window-border);">${qStar}</td><td style="padding:6px; border:1px solid var(--window-border);">-</td></tr>
        <tr style="background:var(--button-hover);"><td style="padding:6px; border:1px solid var(--window-border);"><strong>Flame Height</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${flameHeight}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>m</strong></td></tr>
      </table>`;

    return `
      <div class="form-calculator window-content-help" id="help-${windowId}" style="padding: 8px 12px; gap: 4px;">
        <div id="${reportId}" style="font-size: 12px; line-height: 1.4; color: var(--text-primary);">
          <h3 style="margin: 0 0 4px 0; font-size: 14px;">FLAME HEIGHT CALCULATION REPORT</h3>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary);">Reference: PD 7974 - Dimensionless HRR correlations</p>
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
  
  // Required: Calculate function
  calculate(windowId) {
    const activeMethod = this.getActiveMethod(windowId);
    const subMethod = this.getSubMethod(windowId);
    const config = this.getMethodConfig(activeMethod, subMethod);
    
    // Get input elements based on method configuration
    const inputValues = {};
    let allInputsValid = true;
    
    config.inputs.forEach(input => {
      const inputEl = document.getElementById(`${input.id}-${windowId}`);
      if (!inputEl) {
        allInputsValid = false;
        return;
      }
      
      const rawValue = inputEl.value.trim();
      let value;
      if (rawValue === '' && input.defaultValue !== undefined) {
        value = input.defaultValue;
      } else {
        value = parseFloat(rawValue) || 0;
      }
      inputValues[input.id] = value;
      
      if (!value && input.defaultValue === undefined) {
        allInputsValid = false;
      }
    });
    
    // Get output elements
    const outputElements = {};
    config.outputs.forEach(output => {
      const outputEl = document.getElementById(`${output.id}-${windowId}`);
      if (!outputEl) {
        allInputsValid = false;
        return;
      }
      outputElements[output.id] = outputEl;
    });
    
    if (!allInputsValid) {
      config.outputs.forEach(output => {
        if (outputElements[output.id]) {
          outputElements[output.id].value = '';
          outputElements[output.id].placeholder = '—';
        }
      });
      return;
    }
    
    const results = {};
    
    // Calculations based on method and sub-method
    switch (activeMethod) {
      case '1':
        // Method 1 (Circular) with sub-methods 4, 5, 6
        switch (subMethod) {
          case '4':
            // Method 1-4 calculation
            results.output1 = inputValues.input1 / (inputValues.input2 * inputValues.input3 * inputValues.input4 * Math.sqrt(inputValues.input5) * Math.pow(inputValues.input6, 2.5));
            if (results.output1 < 0.15) {
              results.output2 = Math.pow(results.output1, 2) * 40 * inputValues.input6;
            } else if (results.output1 < 1) {
              results.output2 = Math.pow(results.output1, 2/3) * 3.3 * inputValues.input6;
            } else if (results.output1 < 40) {
              results.output2 = Math.pow(results.output1, 2/5) * 3.3 * inputValues.input6;
            } else {
              results.output2 = "N/A";
            }
            break;
          case '5':
            results.output1 = inputValues.input1 / (inputValues.input2 * inputValues.input3 * inputValues.input4 * Math.sqrt(inputValues.input5) * Math.pow(inputValues.input6, 2.5));
            if (results.output1 < 8.8 && results.output1 > 0.75){
              results.output2 = Math.pow(results.output1, 0.61) * 3.4 * inputValues.input6;
            }else{
              results.output2 = "N/A";
            }
            break;
          case '6':
            results.output1 = inputValues.input1 / (inputValues.input2 * inputValues.input3 * inputValues.input4 * Math.sqrt(inputValues.input5) * Math.pow(inputValues.input6, 2.5));
            if (results.output1 < 12000 && results.output1 > 0.12){
              results.output2 = (Math.pow(results.output1, 0.4) * 3.7 - 1.02) * inputValues.input6;
            }else{
              results.output2 = "N/A";
            }
            break;
        }
        break;
      case '2':
        results.output1 = inputValues.input1 / (inputValues.input2 * inputValues.input3 * inputValues.input4 * Math.sqrt(inputValues.input5) * Math.pow(inputValues.input6, 1.5));
        results.output2 = 3.46 * results.output1 * inputValues.input6;
        break;
      case '3':
        if (inputValues.input6 > inputValues.input7){
          results.output1 = inputValues.input1 / (inputValues.input2 * inputValues.input3 * inputValues.input4 * Math.sqrt(inputValues.input5) * Math.pow(inputValues.input7, 1.5) * inputValues.input6);
          results.output2 = 3.46 * results.output1 * inputValues.input6;
        }else{
          results.output1 = "N/A";
          results.output2 = "N/A";
        }
        break;
      default:
        results.output1 = 0;
        results.output2 = 0;
    }
    
    // Update output fields
    config.outputs.forEach(output => {
      if (outputElements[output.id] && results[output.id] !== undefined) {
        outputElements[output.id].value = results[output.id].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        outputElements[output.id].placeholder = '';
      } else if (outputElements[output.id]) {
        outputElements[output.id].value = '';
        outputElements[output.id].placeholder = '—';
      }
    });
  },
  
  // Required: Clear function
  clear(windowId) {
    const activeMethod = this.getActiveMethod(windowId);
    const subMethod = this.getSubMethod(windowId);
    const config = this.getMethodConfig(activeMethod, subMethod);
    
    config.inputs.forEach(input => {
      const inputEl = document.getElementById(`${input.id}-${windowId}`);
      if (inputEl) inputEl.value = '';
    });
    
    this.calculate(windowId);
  },
  
  // Required: Save input values before re-rendering
  saveInputValues(windowId) {
    const activeMethod = this.getActiveMethod(windowId);
    const subMethod = this.getSubMethod(windowId);
    const config = this.getMethodConfig(activeMethod, subMethod);
    const savedValues = {
      method: activeMethod,
      subMethod: subMethod
    };
    
    config.inputs.forEach(input => {
      const inputEl = document.getElementById(`${input.id}-${windowId}`);
      if (inputEl) {
        savedValues[input.id] = inputEl.value;
      }
    });
    
    return savedValues;
  },
  
  // Restore state before rendering
  restoreStateBeforeRender(windowId, savedValues) {
    if (savedValues && savedValues.method) {
      FlameheightStorage[windowId] = savedValues.method;
      this.windowMethods[windowId] = savedValues.method;
    }
    if (savedValues && savedValues.subMethod) {
      this.windowSubMethods[windowId] = savedValues.subMethod;
    }
    
    if (FlameheightStorage[windowId]) {
      this.windowMethods[windowId] = FlameheightStorage[windowId];
    }
    
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (!FlameheightStorage[windowId]) {
          const savedMethod = localStorage.getItem(`flameheight_method_${windowId}`);
          if (savedMethod && ['1', '2', '3'].includes(savedMethod)) {
            FlameheightStorage[windowId] = savedMethod;
            this.windowMethods[windowId] = savedMethod;
          }
        }
        if (!this.windowSubMethods[windowId]) {
          const savedSubMethod = localStorage.getItem(`flameheight_submethod_${windowId}`);
          if (savedSubMethod && ['4', '5', '6'].includes(savedSubMethod)) {
            this.windowSubMethods[windowId] = savedSubMethod;
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  },
  
  // Required: Restore input values after re-rendering
  restoreInputValues(windowId, savedValues) {
    if (!savedValues) return;
    
    if (savedValues.method && !FlameheightStorage[windowId]) {
      this.setActiveMethod(windowId, savedValues.method);
    }
    if (savedValues.subMethod && !this.windowSubMethods[windowId]) {
      this.setSubMethod(windowId, savedValues.subMethod);
    }
    
    const activeMethod = FlameheightStorage[windowId] || savedValues.method || '1';
    const subMethod = this.windowSubMethods[windowId] || savedValues.subMethod || '4';
    const config = this.getMethodConfig(activeMethod, subMethod);
    
    config.inputs.forEach(input => {
      const inputEl = document.getElementById(`${input.id}-${windowId}`);
      if (inputEl && savedValues[input.id] !== undefined) {
        inputEl.value = savedValues[input.id];
      }
    });
    
    setTimeout(() => {
      this.calculate(windowId);
    }, 50);
  },
  
  // Optional: Attach calculator-specific event handlers
  attachEvents(windowId) {
    // Handle method button clicks (1, 2, 3)
    const methodButtons = document.querySelectorAll(`.method-btn[data-window-id="${windowId}"]`);
    methodButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const value = btn.getAttribute('data-value');
        
        const savedValues = this.saveInputValues(windowId);
        this.setActiveMethod(windowId, value);
        
        if (typeof window.renderWindows === 'function') {
          window.renderWindows();
          setTimeout(() => {
            this.restoreInputValues(windowId, savedValues);
            this.updateHelpWindow(windowId);
            this.updateFigureWindow(windowId);
          }, 50);
        }
      });
    });
    
    // Handle dropdown change (for method 1)
    const dropdown = document.getElementById(`submethod-${windowId}`);
    if (dropdown) {
      dropdown.addEventListener('change', (e) => {
        const value = e.target.value;
        this.setSubMethod(windowId, value);
        this.calculate(windowId);
        this.updateHelpWindow(windowId);
      });
    }
  },
  
  // Update help window content when method changes
  updateHelpWindow(sourceWindowId) {
    if (typeof window === 'undefined' || !window.state) return;
    
    const helpWindow = window.state.windows.find(w => 
      w.sourceWindowId === sourceWindowId && 
      w.type === 'Flameheight-help'
    );
    
    if (helpWindow && !helpWindow.minimized) {
      if (typeof window.renderWindows === 'function') {
        window.renderWindows();
      }
    }
  },
  
  // Update figure window image when method changes
  updateFigureWindow(sourceWindowId) {
    if (typeof window === 'undefined' || !window.state) return;
    
    const figureWindow = window.state.windows.find(w => 
      w.sourceWindowId === sourceWindowId && 
      w.type === 'Flameheight-figure'
    );
    
    if (figureWindow) {
      const activeMethod = this.getActiveMethod(sourceWindowId);
      const subMethod = this.getSubMethod(sourceWindowId);
      let newImagePath = `Figures/Flameheight-${activeMethod}.png.png`;
      if (activeMethod === '1') {
        newImagePath = `Figures/Flameheight-${activeMethod}-${subMethod}.png.png`;
      }
      
      figureWindow.figureImagePath = newImagePath;
      figureWindow.activeMethod = activeMethod;
      figureWindow.title = `Method ${activeMethod} - Figure`;
      
      if (typeof window.renderWindows === 'function') {
        window.renderWindows();
      }
    }
  }
};
