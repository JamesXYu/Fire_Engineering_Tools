const ExternalfirespreadStorage = {};

const ExternalfirespreadCalculator = {
  // Required: Unique identifier for this calculator
  type: 'Externalfirespread',
  
  // Required: Display name
  name: "External Fire Spread",
  
  // Required: Icon (emoji or text)
  icon: '🔢',
  
  // Store active method combination for each window (e.g., "1-4", "1-5", "2-4", "2-5")
  // Using module-level storage for better persistence
  windowMethods: ExternalfirespreadStorage,
  
  // Store selected buttons for each row (row1: 1,2 and row2: 4,5)
  windowRowSelections: {},
  
  // Get the active method combination for a window (default to "1-4")
  // Uses module-level storage for persistence across re-renders
  getActiveMethod(windowId) {
    // Priority 1: Check module-level storage (persists across re-renders)
    if (ExternalfirespreadStorage[windowId]) {
      return ExternalfirespreadStorage[windowId];
    }
    
    // Priority 2: Check localStorage as backup
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedMethod = localStorage.getItem(`externalfirespread_method_${windowId}`);
        if (savedMethod && ['1-4', '1-5', '2-4', '2-5'].includes(savedMethod)) {
          // Restore from localStorage to module-level storage
          ExternalfirespreadStorage[windowId] = savedMethod;
          return savedMethod;
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    
    // Default to "1-4"
    return '1-4';
  },
  
  // Get selected buttons for each row
  getRowSelections(windowId) {
    const method = this.getActiveMethod(windowId);
    const [row1, row2] = method.split('-');
    return { row1: parseInt(row1), row2: parseInt(row2) };
  },
  
  // Set the active method combination for a window
  setActiveMethod(windowId, method) {
    // Store in module-level storage (persists across re-renders)
    ExternalfirespreadStorage[windowId] = method;
    // Also update the object property for consistency
    this.windowMethods[windowId] = method;
    // Also store in localStorage as backup
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`externalfirespread_method_${windowId}`, method);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  },
  
  // Set row selection (row1: 1-2, row2: 4-5)
  setRowSelection(windowId, row, value) {
    const currentMethod = this.getActiveMethod(windowId);
    const [currentRow1, currentRow2] = currentMethod.split('-');
    
    let newMethod;
    if (row === 1) {
      // Update first row selection
      newMethod = `${value}-${currentRow2}`;
    } else {
      // Update second row selection
      newMethod = `${currentRow1}-${value}`;
    }
    
    this.setActiveMethod(windowId, newMethod);
  },
  
  // Get checkbox state for a window
  getCheckboxState(windowId) {
    const checkboxEl = document.getElementById(`checkbox-${windowId}`);
    return checkboxEl ? checkboxEl.checked : false;
  },
  
  // Method configurations - each method has different inputs and outputs
  getMethodConfig(method) {
    const configs = {
      '1-4': { // Method A: 5 enabled, 2 disabled, checkbox, 3 outputs
        inputs: [
          { id: 'input1', label: 'Emitter Width w (m)' },
          { id: 'input2', label: 'Emitter Height h (m)' },
          { id: 'input3', label: 'Boundary Distance d (m)' },
          { id: 'input4', label: 'Emitter Heat Flux q<sub>e</sub> (kW/m²)' },
          { id: 'input5', label: 'Critical Heat Flux q<sub>crit</sub> (kW/m²)' },
          { id: 'input6', label: 'Horizontal Location x (m)', disabled: true , placeholder:'0'},
          { id: 'input7', label: 'Vertical Location y (m)', disabled: true , placeholder:'0'}
        ],
        outputs: [
          { id: 'output1', label: 'View Factor', unit: '%' },
          { id: 'output2', label: 'Receiver Heat Flux', unit: 'kW/m²' },
          { id: 'output3', label: "Unprotected Area", unit: '%' }
        ],
        hasCheckbox: true
      },
      '1-5': { // Method B: 5 enabled, 2 disabled, checkbox, 3 outputs
        inputs: [
          { id: 'input1', label: 'Emitter Width w (m)' },
          { id: 'input2', label: 'Emitter Height h (m)' },
          { id: 'input3', label: 'Unprotected Area A<sub>u</sub> (%)' },
          { id: 'input4', label: 'Emitter Heat Flux q<sub>e</sub> (kW/m²)' },
          { id: 'input5', label: 'Critical Heat Flux q<sub>crit</sub> (kW/m²)' },
          { id: 'input6', label: 'Horizontal Location x (m)', disabled: true, placeholder:'0' },
          { id: 'input7', label: 'Vertical Location y (m)', disabled: true , placeholder:'0'}
        ],
        outputs: [
          { id: 'output1', label: 'View Factor', unit: '%' },
          { id: 'output2', label: 'Receiver Heat Flux', unit:'kW/m²' },
          { id: 'output3', label: 'Distance', unit: 'm' }
        ],
        hasCheckbox: true
      },
      '2-4': { // Method C: 6 enabled, 2 disabled, checkbox, 3 outputs
        inputs: [
          { id: 'input1', label: 'Emitter Width w (m)' },
          { id: 'input2', label: 'Emitter Height h (m)' },
          { id: 'input3', label: 'Boundary Distance d (m)' },
          { id: 'input4', label: 'Emitter Heat Flux q<sub>e</sub> (kW/m²)' },
          { id: 'input5', label: 'Critical Heat Flux q<sub>crit</sub> (kW/m²)' },
          { id: 'input6', label: 'Angle θ (°)', placeholder: '90', defaultValue: 90 },
          { id: 'input7', label: 'Horizontal Location x (m)', disabled: true, placeholder:'0' },
          { id: 'input8', label: 'Vertical Location y (m)', disabled: true, placeholder: '0' }
        ],
        outputs: [
          { id: 'output1', label: 'View Factor', unit: '%' },
          { id: 'output2', label: 'Receiver Heat Flux', unit: 'kW/m²'},
          { id: 'output3', label: 'Unprotected Area' , unit: '%' }
        ],
        hasCheckbox: true
      },
      '2-5': { // Method D: 6 enabled, 2 disabled, checkbox, 3 outputs
        inputs: [
          { id: 'input1', label: 'Emitter Width w (m)' },
          { id: 'input2', label: 'Emitter Height h (m)' },
          { id: 'input3', label: 'Unprotected Area A<sub>u</sub> (%)' },
          { id: 'input4', label: 'Emitter Heat Flux q<sub>e</sub> (kW/m²)' },
          { id: 'input5', label: 'Critical Heat Flux q<sub>crit</sub> (kW/m²)' },
          { id: 'input6', label: 'Angle θ (°)', placeholder: '90', defaultValue: 90},
          { id: 'input7', label: 'Horizontal Location x (m)', disabled: true , placeholder:'0'},
          { id: 'input8', label: 'Vertical Location y (m)', disabled: true , placeholder:'0'}
        ],
        outputs: [
          { id: 'output1', label: 'View Factor', unit:'%' },
          { id: 'output2', label: 'Receiver Heat Flux', unit:'kW/m²' },
          { id: 'output3', label: 'Distance', unit: 'm'}
        ],
        hasCheckbox: true
      }
    };
    return configs[method] || configs['1-4'];
  },
  
  // Required: Get number of input fields (based on active method)
  getInputCount(windowId) {
    if (windowId) {
      const method = this.getActiveMethod(windowId);
      const config = this.getMethodConfig(method);
      return config.inputs.length + (config.hasCheckbox ? 1 : 0);
    }
    // Return maximum for minimum size calculation
    return 9; // Maximum: 8 inputs + 1 checkbox
  },
  
  // Required: Get number of output fields (based on active method)
  getOutputCount(windowId) {
    if (windowId) {
      const method = this.getActiveMethod(windowId);
      const config = this.getMethodConfig(method);
      return config.outputs.length;
    }
    // Return maximum for minimum size calculation
    return 3; // Maximum outputs
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
    const methodButtonGroupHeight = 100; // Height for two rows of method selector buttons
    
    // Use maximum counts across all methods
    const maxInputCount = 9; // Maximum: 8 inputs + 1 checkbox
    const maxOutputCount = 3; // Maximum outputs
    const totalFieldCount = maxInputCount + maxOutputCount;
    
    const inputSectionsHeight = maxInputCount * inputSectionHeight;
    const outputSectionsHeight = maxOutputCount * outputSectionHeight;
    const totalSectionsHeight = inputSectionsHeight + outputSectionsHeight;
    const gapsHeight = (totalFieldCount + 1) * formGap;
    const minHeight = titleBarHeight + windowContentPadding + methodButtonGroupHeight + totalSectionsHeight + gapsHeight + dividerHeight + actionsHeight + 50;
    
    return { width: 400, height: minHeight };
  },
  
  // Required: Get calculator HTML
  getHTML(windowId) {
    // Get the active method combination - ALWAYS read directly from module-level storage first
    let activeMethod = ExternalfirespreadStorage[windowId] || this.getActiveMethod(windowId);
    const selections = this.getRowSelections(windowId);
    const config = this.getMethodConfig(activeMethod);
    
    // Build input HTML
    let inputHTML = '';
    config.inputs.forEach(input => {
      const disabledAttr = input.disabled ? 'disabled' : '';
      const disabledClass = input.disabled ? 'input-disabled' : '';
      const wrapperDisabledClass = input.disabled ? 'disabled' : '';
      const inputPlaceholder = input.placeholder !== undefined ? `placeholder="${input.placeholder}"` : '';
      const inputValue = input.defaultValue !== undefined ? `value="${input.defaultValue}"` : '';
      inputHTML += `
        <div class="calc-section ${disabledClass}">
          <label class="calc-label">${input.label}</label>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <div class="calc-input-wrapper ${wrapperDisabledClass}">
              <input type="number" class="calc-input" id="${input.id}-${windowId}" min="0" data-window-id="${windowId}" ${disabledAttr} ${inputPlaceholder} ${inputValue}>
            </div>
          </div>
        </div>
      `;
    });
    if (config.hasCheckbox) {
      inputHTML += `
        <div class="calc-section">
          <label class="calc-label" style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="checkbox-${windowId}" data-window-id="${windowId}">
            <span>Non-centriod</span>
          </label>
        </div>
      `;
    }
    
    // Build output HTML
    let outputHTML = '';
    config.outputs.forEach(output => {
      const unit = output.unit || 'unit'; // Use unit from config, default to 'unit' if not specified
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
        <!-- Method Selector Buttons - Two Rows (Combination Selection) -->
        <div class="method-selector" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--window-border);">
          <!-- First Row: 2 buttons (select one) -->
          <div style="display: flex; gap: 8px;">
            <button class="method-btn-row1 ${selections.row1 === 1 ? 'active' : ''}" 
                    data-window-id="${windowId}" 
                    data-row="1"
                    data-value="1"
                    style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${selections.row1 === 1 ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${selections.row1 === 1 ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
              Parallel
            </button>
            <button class="method-btn-row1 ${selections.row1 === 2 ? 'active' : ''}" 
                    data-window-id="${windowId}" 
                    data-row="1"
                    data-value="2"
                    style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${selections.row1 === 2 ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${selections.row1 === 2 ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
              Perpendicular
            </button>
          </div>
          <!-- Second Row: 2 buttons (select one) -->
          <div style="display: flex; gap: 8px;">
            <button class="method-btn-row2 ${selections.row2 === 4 ? 'active' : ''}" 
                    data-window-id="${windowId}" 
                    data-row="2"
                    data-value="4"
                    style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${selections.row2 === 4 ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${selections.row2 === 4 ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
              Boundary Distance
            </button>
            <button class="method-btn-row2 ${selections.row2 === 5 ? 'active' : ''}" 
                    data-window-id="${windowId}" 
                    data-row="2"
                    data-value="5"
                    style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 5px; background: ${selections.row2 === 5 ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${selections.row2 === 5 ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
              Unprotected Areas
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
  
  // Required: Get help window HTML
  getHelpHTML(windowId, sourceWindowId) {
    const srcId = sourceWindowId || windowId;
    const activeMethod = sourceWindowId ? this.getActiveMethod(sourceWindowId) : '1-4';
    const config = this.getMethodConfig(activeMethod);
    const reportId = `externalfirespread-report-${windowId}`;
    const copyBtnId = `externalfirespread-copy-${windowId}`;

    const methodMap = { '1-4': 'A', '1-5': 'B', '2-4': 'C', '2-5': 'D' };
    const methodLetter = methodMap[activeMethod] || 'A';

    const getVal = (inputId) => {
      const el = document.getElementById(`${inputId}-${srcId}`);
      const raw = el?.value?.trim();
      const v = parseFloat(raw);
      return isNaN(v) ? null : v;
    };
    const getOutput = (outputId) => {
      const el = document.getElementById(`${outputId}-${srcId}`);
      return el && el.value ? el.value : '—';
    };
    const fmt = (x) => (typeof x === 'number' && !isNaN(x) ? x.toLocaleString('en-US', { maximumFractionDigits: 4 }) : (x != null ? String(x) : '—'));

    const checkboxChecked = config.hasCheckbox && document.getElementById(`checkbox-${srcId}`)?.checked;

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

    const unitForInput = (inputId) => {
      if (inputId === 'input4' || inputId === 'input5') return 'kW/m²';
      if ((activeMethod === '1-5' || activeMethod === '2-5') && inputId === 'input3') return '%';
      if (inputId === 'input6') return '°';
      return 'm';
    };
    const fullInputTable = config.inputs
      .filter(i => !i.disabled || (i.disabled && checkboxChecked))
      .map(i => `<tr><td>${i.label}</td><td>${fmt(getVal(i.id))}</td><td>${unitForInput(i.id)}</td></tr>`)
      .join('') + (config.hasCheckbox ? `<tr><td>Non-centroid</td><td>${checkboxChecked ? 'Yes' : 'No'}</td><td>-</td></tr>` : '');

    let methodology = '';
    const isParallel = activeMethod === '1-4' || activeMethod === '1-5';
    const isBoundaryDist = activeMethod === '1-4' || activeMethod === '2-4';

    if (isParallel) {
      methodology = `
        <p><strong>Step 1: Mode — Method ${methodLetter} (Parallel)</strong></p>
        <p>Emitter and receiver facades are parallel. View factor from radiative heat transfer between opposed rectangles.</p>
        <p><strong>Step 2: View factor (centroid)</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('x = \\frac{W}{2d}, \\quad y = \\frac{H}{2d}')}</div>
        <div style="${formulaBlockStyle}">${renderMath('xx = \\frac{x}{\\sqrt{1+x^2}}, \\quad xy = \\frac{x}{\\sqrt{1+y^2}}, \\quad yy = \\frac{y}{\\sqrt{1+y^2}}, \\quad yx = \\frac{y}{\\sqrt{1+x^2}}')}</div>
        <div style="${formulaBlockStyle}">${renderMath('\\text{VF} = \\frac{2 \\times (xx \\cdot \\arctan(yx) + yy \\cdot \\arctan(xy))}{\\pi}')}</div>
        <p><em>Non-centroid: VF from corner decomposition with horizontal/vertical offsets.</em></p>
        <p><strong>Step 3: Receiver heat flux</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('q_{rec} = \\text{VF} \\times q_{emit} / 100')}</div>
        <p><strong>Step 4: Unprotected area (when given boundary distance)</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('\\text{Unprotected } \\% = \\min(100, (q_{crit} / q_{rec}) \\times 100)')}</div>
        <p><strong>Step 5: Distance (when given unprotected area)</strong></p>
        <p><em>Binary search to invert VF formula; find d such that resulting q_rec gives target unprotected %.</em></p>`;
    } else {
      methodology = `
        <p><strong>Step 1: Mode — Method ${methodLetter} (Perpendicular)</strong></p>
        <p>Emitter and receiver facades are perpendicular (angle θ). View factor from corner configuration.</p>
        <p><strong>Step 2: View factor (centroid, perpendicular)</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('x = w/d, \\quad y = h/d')}</div>
        <div style="${formulaBlockStyle}">${renderMath('yy = \\sqrt{y^2 + 1}')}</div>
        <div style="${formulaBlockStyle}">${renderMath('\\text{VF} = \\frac{\\arctan(x) - \\arctan(x/yy)/yy}{2\\pi}')}</div>
        <p><em>Non-centroid: VF from angled corner decomposition with offsets.</em></p>
        <p><strong>Step 3: Receiver heat flux</strong></p>
        <div style="${formulaBlockStyle}">${renderMath('q_{rec} = \\text{VF} \\times q_{emit} / 100')}</div>
        <p><strong>Step 4: Unprotected area / Distance</strong></p>
        <p><em>Same logic as parallel; distance inverted via binary search when given unprotected %.</em></p>`;
    }

    const out1 = getOutput('output1');
    const out2 = getOutput('output2');
    const out3 = getOutput('output3');
    const W = getVal('input1');
    const H = getVal('input2');
    const input3Val = getVal('input3');
    const q_emit = getVal('input4');
    const q_crit = getVal('input5');
    const hasKey = W != null && H != null && input3Val != null && q_emit != null && q_crit != null && W > 0 && H > 0 && q_emit > 0 && q_crit > 0;
    const hasKeyDist = isBoundaryDist && hasKey && input3Val > 0;
    const hasKeyArea = !isBoundaryDist && hasKey;

    let workedExample = '';
    if (hasKeyDist || hasKeyArea) {
      const givenStr = isBoundaryDist
        ? `W = ${fmt(W)} m, H = ${fmt(H)} m, d = ${fmt(input3Val)} m, q_emit = ${fmt(q_emit)} kW/m², q_crit = ${fmt(q_crit)} kW/m²`
        : `W = ${fmt(W)} m, H = ${fmt(H)} m, Unprotected % = ${fmt(input3Val)}, q_emit = ${fmt(q_emit)} kW/m², q_crit = ${fmt(q_crit)} kW/m²`;
      workedExample = `
        <p>Given: ${givenStr}</p>
        <p>View factor VF is computed from geometry; q_rec = VF × q_emit / 100.</p>
        <p><strong>Result:</strong> View Factor = ${out1}%, Receiver Heat Flux = ${out2} kW/m², ${config.outputs[2].label} = ${out3} ${config.outputs[2].unit || ''}</p>`;
    } else {
      workedExample = '<p>Enter all required input values and run the calculation to see results.</p>';
    }

    const resultsTable = `
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Results Summary</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Output</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
        <tr><td style="padding:6px; border:1px solid var(--window-border);">View Factor</td><td style="padding:6px; border:1px solid var(--window-border);">${out1}</td><td style="padding:6px; border:1px solid var(--window-border);">%</td></tr>
        <tr><td style="padding:6px; border:1px solid var(--window-border);">Receiver Heat Flux</td><td style="padding:6px; border:1px solid var(--window-border);">${out2}</td><td style="padding:6px; border:1px solid var(--window-border);">kW/m²</td></tr>
        <tr style="background:var(--button-hover);"><td style="padding:6px; border:1px solid var(--window-border);"><strong>${config.outputs[2].label}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${out3}</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${config.outputs[2].unit || ''}</strong></td></tr>
      </table>`;

    return `
      <div class="form-calculator window-content-help" id="help-${windowId}" style="padding: 8px 12px; gap: 4px;">
        <div id="${reportId}" style="font-size: 12px; line-height: 1.4; color: var(--text-primary);">
          <h3 style="margin: 0 0 4px 0; font-size: 14px;">EXTERNAL FIRE SPREAD CALCULATION REPORT</h3>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary);">Reference: View factor and separation distance for fire spread between buildings/facades (Parallel/Perpendicular)</p>
          <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Input Parameters</h4>
          <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
            <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Parameter</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
            ${fullInputTable}
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
    const config = this.getMethodConfig(activeMethod);
    const checkboxChecked = config.hasCheckbox ? this.getCheckboxState(windowId) : false;
    
    // Get input elements based on method configuration
    const inputValues = {};
    let allInputsValid = true;
    
    config.inputs.forEach(input => {
      const inputEl = document.getElementById(`${input.id}-${windowId}`);
      if (!inputEl) {
        allInputsValid = false;
        return;
      }
      
      // Check if input is required (not disabled, or disabled but checkbox is checked)
      const isRequired = !input.disabled || (input.disabled && checkboxChecked);
      
      // For methods 2-4 and 2-5, input7 and input8 are offset values - they can be 0
      const isOffsetInput = (activeMethod === '2-4' || activeMethod === '2-5') && 
                            (input.id === 'input7' || input.id === 'input8');
      
      if (isRequired) {
        const raw = (inputEl.value || '').trim();
        let value;
        if (input.defaultValue !== undefined && raw === '') {
          value = input.defaultValue;
        } else {
          value = parseFloat(inputEl.value) || 0;
        }
        inputValues[input.id] = value;
        
        // Don't mark offset inputs (input7, input8) as invalid even if 0 - 0 is a valid offset value
        if (!value && !isOffsetInput) {
          allInputsValid = false;
        }
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
      // Clear outputs if inputs are invalid
      config.outputs.forEach(output => {
        if (outputElements[output.id]) {
          outputElements[output.id].value = '';
          outputElements[output.id].placeholder = '—';
        }
      });
      return;
    }
    function calculateViewFactor(inputValues) {
      let x = inputValues.input1 / (2 * inputValues.input3);
      let y = inputValues.input2 / (2 * inputValues.input3);
      let xx = x / Math.sqrt(1 + x * x);
      let xy = x / Math.sqrt(1 + y * y);
      let yy = y / Math.sqrt(1 + y * y);
      let yx = y / Math.sqrt(1 + x * x);
      // View factor formula for parallel rectangles
      let vf = 2 * ((xx * Math.atan(yx) + yy * Math.atan(xy))) / Math.PI;
      return vf;
    }

    /**
     * Calculate distance given view factor, width, and height.
     * Uses binary search to invert the view factor formula (no closed-form solution).
     * @param {number} viewFactor - View factor as percentage (0–100)
     * @param {number} width - Width (same units as distance)
     * @param {number} height - Height (same units as distance)
     * @returns {number} distance
     */
    function calculateDistanceFromViewFactor(viewFactor, width, height) {
      const targetVf = viewFactor;
      let dLow = 1e-6;
      let dHigh = 1e8;
      const tol = 1e-9;
      const maxIter = 100;

      for (let i = 0; i < maxIter; i++) {
        const dMid = (dLow + dHigh) / 2;
        const vf = calculateViewFactor({ input1: width, input2: height, input3: dMid });
        if (Math.abs(vf - targetVf) < tol) return dMid;
        if (vf > targetVf) dLow = dMid;
        else dHigh = dMid;
      }
      return (dLow + dHigh) / 2;
    }

    function calculateViewFactorCornerPerpen(w, h, d) {
      let x = w / d;
      let y = h / d;
      let yy = Math.sqrt(y * y + 1);
      let vf = (Math.atan(x) - Math.atan(x / yy) / yy) / (2 * Math.PI);
      return vf;
    }
    
    function CalculateVFCorner(w, h, d){
      let x = w / d;
      let y = h / d;
      let xx = x / Math.sqrt(1 + x * x);
      let xy = x / Math.sqrt(1 + y * y);
      let yy = y / Math.sqrt(1 + y * y);
      let yx = y / Math.sqrt(1 + x * x);
      let vf =  ((xx * Math.atan(yx) + yy * Math.atan(xy))) / (2 * Math.PI);
      return vf;
    }

    function CalculateVFoffset(W, H, offw, offh, d) {
      if (offw >= 0) {
        if (offh >= 0) {
          // Positive w, positive h
          let dw = W - offw;
          let dh = H - offh;
          let a1 = CalculateVFCorner(offw, offh, d);
          let a2 = CalculateVFCorner(offw, dh, d);
          let a3 = CalculateVFCorner(dw, offh, d);
          let a4 = CalculateVFCorner(dw, dh, d);
          let vf = a1 + a2 + a3 + a4;
          return vf;
        } else {
          // Positive w, negative h
          let dw = W - offw;
          let dh = H - offh; // H + h (since offh is negative)
          let a1 = CalculateVFCorner(offw, -offh, d);
          let a2 = CalculateVFCorner(offw, dh, d);
          let a3 = CalculateVFCorner(dw, -offh, d);
          let a4 = CalculateVFCorner(dw, dh, d);
          let vf = a2 + a4 - a1 - a3;
          return vf;
        }
      } else {
        if (offh >= 0) {
          // Negative w, positive h
          let dw = W - offw; // W + w (since offw is negative)
          let dh = H - offh;
          let a1 = CalculateVFCorner(-offw, offh, d);
          let a2 = CalculateVFCorner(-offw, dh, d);
          let a3 = CalculateVFCorner(dw, offh, d);
          let a4 = CalculateVFCorner(dw, dh, d);
          let vf = a3 + a4 - a1 - a2;
          return vf;
        } else {
          // Negative w, negative h
          let dw = W - offw; // W + w (since offw is negative)
          let dh = H - offh; // H + h (since offh is negative)
          let a1 = CalculateVFCorner(-offw, -offh, d);
          let a2 = CalculateVFCorner(-offw, dh, d);
          let a3 = CalculateVFCorner(dw, -offh, d);
          let a4 = CalculateVFCorner(dw, dh, d);
          let vf = a4 - a1 - a2 - a3;
          return vf;
        }
      }
    }

    function CalculateVFanglecorner(w, h, d, angle) {
      let sin = Math.sin(angle * Math.PI / 180);
      let cos = Math.cos(angle * Math.PI / 180);
      let a = h * sin / d;
      let b = w * sin / d;
      let bb = (1 - b * cos) / Math.sqrt(1 + b * b - 2 * b * cos);
      let ab = a / Math.sqrt(1 + b * b - 2 * b * cos);
      let aa = a * cos / Math.sqrt(a * a + sin * sin);
      let ba = (b - cos) / Math.sqrt(a * a + sin * sin);
      let acos = cos / Math.sqrt(a * a + sin * sin);
      let vf = (Math.atan(a) - bb * Math.atan(ab) + aa * (Math.atan(ba) + Math.atan(acos))) / (2 * Math.PI);
      return vf;
    }

    function CalculateVFangleoffset(W, H, offw, offh, d, a) {
      let sin = Math.sin(a * Math.PI / 180);
      let cos = Math.cos(a * Math.PI / 180);
      let extra = cos * d / sin;
      console.log("extra =" + extra);
      if(offw >= 0){
        if(offh >= 0){ 
          if (extra < offw){
            let topleft = CalculateVFanglecorner(W-offw+extra, offh, d, a);
            let topright = CalculateVFanglecorner(offw-extra, offh, d, 180-a);
            let bottomleft = CalculateVFanglecorner(W-offw+extra, H-offh, d, a);
            let bottomright = CalculateVFanglecorner(offw-extra, H-offh, d, 180-a);
            let vf = topleft + topright + bottomleft + bottomright;
            return vf;
          } else {
            let topbig = CalculateVFanglecorner(W - offw + extra, offh, d, a);
            let topsmall = CalculateVFanglecorner(extra - offw, offh, d, a);
            let bottombig = CalculateVFanglecorner(W- offw + extra, H - offh, d, a);
            let bottomsmall = CalculateVFanglecorner(- offw + extra, H - offh, d, a);
            let vf = topbig - topsmall + bottombig - bottomsmall;
            return vf;
          }
        }else{
          if(extra < offw){
            let ls = CalculateVFanglecorner(W - offw + extra, -offh, d, a);
            let rs = CalculateVFanglecorner(offw - extra, -offh, d, 180-a);
            let lb = CalculateVFanglecorner(W - offw+extra, H-offh, d, a);
            let rb = CalculateVFanglecorner(offw - extra, H-offh, d, 180-a);
            let vf = lb + rb - ls - rs;
            return vf;
          } else {
            let big = CalculateVFanglecorner(W - offw + extra, H - offh, d, a);
            let medium1 = CalculateVFanglecorner(-offw + extra, H - offh, d, a);
            let medium2 = CalculateVFanglecorner(W - offw + extra, -offh, d, a);
            let small = CalculateVFanglecorner(- offw + extra, - offh, d, a);
            let vf = big + small - medium1 - medium2;
            return vf;
          }
        }
      } else {
        if (offh >= 0) {
          // Negative w, positive h
          let topbig = CalculateVFanglecorner(-offw + extra + W, offh, d, a);
          let topsmall = CalculateVFanglecorner(-offw + extra, offh, d, a);
          let bottombig = CalculateVFanglecorner(-offw + extra + W, H - offh, d, a);
          let bottomsmall = CalculateVFanglecorner(-offw + extra, H - offh, d, a);
          let vf = topbig - topsmall + bottombig - bottomsmall;
          return vf;
        } else {
          // Negative w, negative h
          let big = CalculateVFanglecorner(W - offw + extra, H - offh, d, a);
          let medium1 = CalculateVFanglecorner(-offw + extra, H - offh, d, a);
          let medium2 = CalculateVFanglecorner(W - offw + extra, -offh, d, a);
          let small = CalculateVFanglecorner(-offw + extra, -offh, d, a);
          let vf = big + small - medium1 - medium2;
          return vf;
        }
      }
    }

    /**
     * Calculate distance given view factor (angle offset formula), width, height, offsets, and angle.
     * Inverse of CalculateVFangleoffset; uses binary search.
     * @param {number} viewFactor - View factor as percentage (0-100), same units as output from CalculateVFangleoffset * 100
     * @param {number} W - Width (same units as distance)
     * @param {number} H - Height (same units as distance)
     * @param {number} offw - Width offset (same units as distance)
     * @param {number} offh - Height offset (same units as distance)
     * @param {number} angle - Angle in degrees
     * @returns {number} distance
     */
    function calculateDistanceFromVFangleoffset(viewFactor, W, H, offw, offh, angle) {
      const targetVf = viewFactor;
      let dLow = 1e-6;
      let dHigh = 1e8;
      const tol = 1e-9;
      const maxIter = 100;

      for (let i = 0; i < maxIter; i++) {
        const dMid = (dLow + dHigh) / 2;
        const vf = CalculateVFangleoffset(W, H, offw, offh, dMid, angle) * 100;
        if (Math.abs(vf - targetVf) < tol) return dMid;
        if (vf > targetVf) dLow = dMid;
        else dHigh = dMid;
      }
      return (dLow + dHigh) / 2;
    }

    /**
     * Calculate distance given view factor (offset formula), width, height, and offsets.
     * Inverse of CalculateVFoffset; uses binary search.
     * @param {number} viewFactor - View factor (0-1), same units as output from CalculateVFoffset
     * @param {number} W - Width (same units as distance)
     * @param {number} H - Height (same units as distance)
     * @param {number} offw - Width offset (same units as distance)
     * @param {number} offh - Height offset (same units as distance)
     * @returns {number} distance
     */
    function calculateDistanceFromVFoffset(viewFactor, W, H, offw, offh) {
      const targetVf = viewFactor;
      let dLow = 1e-6;
      let dHigh = 1e8;
      const tol = 1e-9;
      const maxIter = 100;

      for (let i = 0; i < maxIter; i++) {
        const dMid = (dLow + dHigh) / 2;
        const vf = CalculateVFoffset(W, H, offw, offh, dMid);
        if (Math.abs(vf - targetVf) < tol) return dMid;
        if (vf > targetVf) dLow = dMid;
        else dHigh = dMid;
      }
      return (dLow + dHigh) / 2;
    }
    /**
     * Calculate distance given view factor (corner formula), width, and height.
     * Inverse of calculateViewFactorCornerPerpen; uses binary search.
     * @param {number} viewFactor - View factor as percentage (0–100), same units as output from calculateViewFactorCornerPerpen * 100
     * @param {number} width - Width (same units as distance)
     * @param {number} height - Height (same units as distance)
     * @returns {number} distance
     */
    function calculateDistanceFromViewFactorCorner(viewFactor, width, height) {
      const targetVf = viewFactor;
      let dLow = 1e-6;
      let dHigh = 1e8;
      const tol = 1e-9;
      const maxIter = 100;

      for (let i = 0; i < maxIter; i++) {
        const dMid = (dLow + dHigh) / 2;
        const vf = calculateViewFactorCornerPerpen(width, height, dMid) * 100;
        if (Math.abs(vf - targetVf) < tol) return dMid;
        if (vf > targetVf) dLow = dMid;
        else dHigh = dMid;
      }
      return (dLow + dHigh) / 2;
    }

    const results = {};
    
    if (activeMethod === '1-4') {
      if (!checkboxChecked) {
        results.output1 = calculateViewFactor(inputValues) * 100;
        results.output2 = results.output1 * inputValues.input4 / 100;
        let a_check =  inputValues.input5 / results.output2;
        if(a_check < 1.0) {
          results.output3 = a_check * 100;
        }
        else{
          results.output3 = 100;
        }
      } else {
        results.output1 = CalculateVFoffset(inputValues.input1, inputValues.input2, inputValues.input6, inputValues.input7, inputValues.input3) * 100;
        results.output2 = results.output1 * inputValues.input4 / 100;
        let a_check =  inputValues.input5 / results.output2;
        if(a_check < 1.0) {
          results.output3 = a_check * 100;
        }
        else{
          results.output3 = 100;
        }
      }
    } else if (activeMethod === '1-5') {
      if (!checkboxChecked) {
        let a = inputValues.input5 / (inputValues.input3 / 100);
        if (a > inputValues.input4) {
          results.output1 = 100;
          results.output2 = inputValues.input4;
        } else {
          results.output2 = a;
          results.output1 = (results.output2 / inputValues.input4) * 100;
        }
        results.output3 = calculateDistanceFromViewFactor(results.output1 / 100, inputValues.input1, inputValues.input2);
      } else {
        let a = inputValues.input5 / (inputValues.input3 / 100);
        if (a > inputValues.input4) {
          results.output1 = 100;
          results.output2 = inputValues.input4;
          results.output3 = calculateDistanceFromVFoffset(results.output1 / 100, inputValues.input1, inputValues.input2, inputValues.input6, inputValues.input7);
        } else {
          results.output2 = a;
          results.output1 = (results.output2 / inputValues.input4) * 100;
          results.output3 = calculateDistanceFromVFoffset(results.output1 / 100, inputValues.input1, inputValues.input2, inputValues.input6, inputValues.input7);
        }
      }
    } else if (activeMethod === '2-4') { // Method C: 6 enabled, 2 disabled, checkbox, 3 outputs
      if (!checkboxChecked) {
        // When checkbox not checked, input7 and input8 are disabled - use 0,0
        results.output1 = CalculateVFangleoffset(inputValues.input1, inputValues.input2, 0, 0, inputValues.input3, inputValues.input6) * 100;
        results.output2 = inputValues.input4 * results.output1 / 100;
        let a_check = inputValues.input5 / results.output2;
        if (a_check < 1.0) {
          results.output3 = a_check * 100;
        } else {
          results.output3 = 100;
        }
      } else {
        // When checkbox checked, input7 and input8 are enabled - use their values
        let offw = inputValues.input7 || 0;
        let offh = inputValues.input8 || 0;
        results.output1 = CalculateVFangleoffset(inputValues.input1, inputValues.input2, offw, offh, inputValues.input3, inputValues.input6) * 100;
        results.output2 = inputValues.input4 * results.output1 / 100;
        let a_check = inputValues.input5 / results.output2;
        if (a_check < 1.0) {
          results.output3 = a_check * 100;
        } else {
          results.output3 = 100;
        }
      }
    } else if (activeMethod === '2-5') { // Method D: 6 enabled, 2 disabled, checkbox, 3 outputs
      if (!checkboxChecked) {
        // When checkbox not checked, input7 and input8 are disabled - use 0,0
        let a = inputValues.input5 / (inputValues.input3 / 100);
        if (a > inputValues.input4) {
          results.output1 = 100;
          results.output2 = inputValues.input4;
        } else {
          results.output2 = a;
          results.output1 = (results.output2 / inputValues.input4) * 100;
        }
        // calculateDistanceFromVFangleoffset expects percentage (0-100), same as output1
        results.output3 = calculateDistanceFromVFangleoffset(results.output1, inputValues.input1, inputValues.input2, 0, 0, inputValues.input6);
      } else {
        // When checkbox checked, input7 and input8 are enabled - use their values
        let offw = inputValues.input7 || 0;
        let offh = inputValues.input8 || 0; 
        let a = inputValues.input5 / (inputValues.input3 / 100);
        if (a > inputValues.input4) {
          results.output1 = 100;
          results.output2 = inputValues.input4;
          results.output3 = calculateDistanceFromVFangleoffset(results.output1, inputValues.input1, inputValues.input2, offw, offh, inputValues.input6);
        } else {
          results.output2 = a;
          results.output1 = (results.output2 / inputValues.input4) * 100;
          results.output3 = calculateDistanceFromVFangleoffset(results.output1, inputValues.input1, inputValues.input2, offw, offh, inputValues.input6);
        }
      }
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
    const config = this.getMethodConfig(activeMethod);
    
    // Clear all inputs for this method
    config.inputs.forEach(input => {
      const inputEl = document.getElementById(`${input.id}-${windowId}`);
      const sectionEl = inputEl ? inputEl.closest('.calc-section') : null;
      const wrapperEl = inputEl ? inputEl.closest('.calc-input-wrapper') : null;
      
      if (inputEl) {
        inputEl.value = '';
        // Restore disabled state if needed
        if (input.disabled) {
          inputEl.disabled = true;
          // Restore visual indicators
          if (sectionEl) sectionEl.classList.add('input-disabled');
          if (wrapperEl) wrapperEl.classList.add('disabled');
        }
      }
    });
    
    // Clear checkbox if method has one
    if (config.hasCheckbox) {
      const checkboxEl = document.getElementById(`checkbox-${windowId}`);
      if (checkboxEl) {
        checkboxEl.checked = false;
        // Disable inputs that should be disabled and update visual indicators
        config.inputs.forEach(input => {
          if (input.disabled) {
            const inputEl = document.getElementById(`${input.id}-${windowId}`);
            const sectionEl = inputEl ? inputEl.closest('.calc-section') : null;
            const wrapperEl = inputEl ? inputEl.closest('.calc-input-wrapper') : null;
            
            if (inputEl) {
              inputEl.disabled = true;
              // Update visual indicators
              if (sectionEl) sectionEl.classList.add('input-disabled');
              if (wrapperEl) wrapperEl.classList.add('disabled');
            }
          }
        });
      }
    }
    
    this.calculate(windowId);
  },
  
  // Required: Save input values before re-rendering
  saveInputValues(windowId) {
    const activeMethod = this.getActiveMethod(windowId);
    const config = this.getMethodConfig(activeMethod);
    const savedValues = {
      method: activeMethod
    };
    
    // Save inputs for this method
    config.inputs.forEach(input => {
      const inputEl = document.getElementById(`${input.id}-${windowId}`);
      if (inputEl) {
        savedValues[input.id] = inputEl.value;
      }
    });
    
    // Save checkbox state if method has one
    if (config.hasCheckbox) {
      const checkboxEl = document.getElementById(`checkbox-${windowId}`);
      if (checkboxEl) {
        savedValues.checkbox = checkboxEl.checked;
      }
    }
    
    return savedValues;
  },
  
  // Restore state before rendering (called before getHTML to ensure correct method is shown)
  restoreStateBeforeRender(windowId, savedValues) {
    // Priority 1: Restore from savedValues if available
    if (savedValues && savedValues.method) {
      ExternalfirespreadStorage[windowId] = savedValues.method;
      this.windowMethods[windowId] = savedValues.method;
      return;
    }
    
    // Priority 2: Check module-level storage (most reliable - should already be there)
    if (ExternalfirespreadStorage[windowId]) {
      // Method already stored, ensure it's synced
      this.windowMethods[windowId] = ExternalfirespreadStorage[windowId];
      return;
    }
    
    // Priority 3: Check localStorage as backup
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedMethod = localStorage.getItem(`externalfirespread_method_${windowId}`);
        if (savedMethod && ['1-4', '1-5', '2-4', '2-5'].includes(savedMethod)) {
          ExternalfirespreadStorage[windowId] = savedMethod;
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
    if (savedValues.method && !ExternalfirespreadStorage[windowId]) {
      this.setActiveMethod(windowId, savedValues.method);
    }
    
    const activeMethod = ExternalfirespreadStorage[windowId] || savedValues.method || '1-4';
    const config = this.getMethodConfig(activeMethod);
    
    // Restore inputs for this method
    config.inputs.forEach(input => {
      const inputEl = document.getElementById(`${input.id}-${windowId}`);
      const sectionEl = inputEl ? inputEl.closest('.calc-section') : null;
      const wrapperEl = inputEl ? inputEl.closest('.calc-input-wrapper') : null;
      
      if (inputEl && savedValues[input.id] !== undefined) {
        inputEl.value = savedValues[input.id];
        // Restore disabled state and visual indicators
        if (input.disabled) {
          inputEl.disabled = true;
          if (sectionEl) sectionEl.classList.add('input-disabled');
          if (wrapperEl) wrapperEl.classList.add('disabled');
        }
      }
    });
    
    // Restore checkbox state and enable/disable inputs accordingly
    if (config.hasCheckbox) {
      const checkboxEl = document.getElementById(`checkbox-${windowId}`);
      if (checkboxEl && savedValues.checkbox !== undefined) {
        checkboxEl.checked = savedValues.checkbox;
        // Enable/disable inputs based on checkbox state and update visual indicators
        config.inputs.forEach(input => {
          if (input.disabled) {
            const inputEl = document.getElementById(`${input.id}-${windowId}`);
            const sectionEl = inputEl ? inputEl.closest('.calc-section') : null;
            const wrapperEl = inputEl ? inputEl.closest('.calc-input-wrapper') : null;
            
            if (inputEl) {
              inputEl.disabled = !savedValues.checkbox;
              
              // Update visual indicators
              if (sectionEl) {
                if (savedValues.checkbox) {
                  sectionEl.classList.remove('input-disabled');
                } else {
                  sectionEl.classList.add('input-disabled');
                }
              }
              
              if (wrapperEl) {
                if (savedValues.checkbox) {
                  wrapperEl.classList.remove('disabled');
                } else {
                  wrapperEl.classList.add('disabled');
                }
              }
            }
          }
        });
      }
    }
    
    // Recalculate after restoring
    setTimeout(() => {
      this.calculate(windowId);
    }, 50);
  },
  
  // Optional: Attach calculator-specific event handlers
  attachEvents(windowId) {
    // Handle row 1 button clicks (buttons 1, 2)
    const row1Buttons = document.querySelectorAll(`.method-btn-row1[data-window-id="${windowId}"]`);
    row1Buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const value = parseInt(btn.getAttribute('data-value'));
        
        // Save current input values before switching
        const savedValues = this.saveInputValues(windowId);
        
        // Update row 1 selection
        this.setRowSelection(windowId, 1, value);
        
        // Re-render the window to show the correct button states
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
    
    // Handle row 2 button clicks (buttons 4, 5)
    const row2Buttons = document.querySelectorAll(`.method-btn-row2[data-window-id="${windowId}"]`);
    row2Buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const value = parseInt(btn.getAttribute('data-value'));
        
        // Save current input values before switching
        const savedValues = this.saveInputValues(windowId);
        
        // Update row 2 selection
        this.setRowSelection(windowId, 2, value);
        
        // Re-render the window to show the correct button states
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
    
    // Handle checkbox change
    const checkboxEl = document.getElementById(`checkbox-${windowId}`);
    if (checkboxEl) {
      checkboxEl.addEventListener('change', (e) => {
        const activeMethod = this.getActiveMethod(windowId);
        const config = this.getMethodConfig(activeMethod);
        
        // Enable/disable inputs based on checkbox state
        config.inputs.forEach(input => {
          if (input.disabled) {
            const inputEl = document.getElementById(`${input.id}-${windowId}`);
            const sectionEl = inputEl ? inputEl.closest('.calc-section') : null;
            const wrapperEl = inputEl ? inputEl.closest('.calc-input-wrapper') : null;
            
            if (inputEl) {
              inputEl.disabled = !e.target.checked;
              
              // Update visual indicators
              if (sectionEl) {
                if (e.target.checked) {
                  sectionEl.classList.remove('input-disabled');
                } else {
                  sectionEl.classList.add('input-disabled');
                }
              }
              
              if (wrapperEl) {
                if (e.target.checked) {
                  wrapperEl.classList.remove('disabled');
                } else {
                  wrapperEl.classList.add('disabled');
                }
              }
            }
          }
        });
        
        // Recalculate when checkbox state changes
        this.calculate(windowId);
        // Update figure window when checkbox changes (centroid vs non-centroid)
        this.updateFigureWindow(windowId);
      });
    }
  },
  
  // Update help window content when method changes
  updateHelpWindow(sourceWindowId) {
    if (typeof window === 'undefined' || !window.state) return;
    
    // Find the help window for this source window
    const helpWindow = window.state.windows.find(w => 
      w.sourceWindowId === sourceWindowId && 
      w.type === 'Externalfirespread-help'
    );
    
    if (helpWindow && !helpWindow.minimized) {
      // Re-render windows to update help content
      if (typeof window.renderWindows === 'function') {
        window.renderWindows();
      }
    }
  },
  
  // Update figure window image when method or checkbox changes
  // 1-4 and 1-5 use same figure; 2-4 and 2-5 use same figure
  // Checkbox unchecked (centroid): efs-parallel.png.png or efs-per.png.png
  // Checkbox checked (non-centroid): efs-parallel-noncenter.png.png or efs-per-noncenter.png.png
  updateFigureWindow(sourceWindowId) {
    if (typeof window === 'undefined' || !window.state) return;
    
    const figureWindow = window.state.windows.find(w => 
      w.sourceWindowId === sourceWindowId && 
      w.type === 'Externalfirespread-figure'
    );
    
    if (figureWindow) {
      const activeMethod = this.getActiveMethod(sourceWindowId);
      const isNonCentroid = this.getCheckboxState(sourceWindowId);
      const methodGroup = (activeMethod === '1-4' || activeMethod === '1-5') ? 'parallel' : 'per';
      const suffix = isNonCentroid ? '-noncenter' : '';
      const newImagePath = `Figures/efs-${methodGroup}${suffix}.png.png`;
      
      const methodLetter = { '1-4': 'A', '1-5': 'B', '2-4': 'C', '2-5': 'D' }[activeMethod] || 'A';
      
      figureWindow.figureImagePath = newImagePath;
      figureWindow.activeMethod = activeMethod;
      figureWindow.title = `Method ${methodLetter} (${activeMethod}) - Figure`;
      
      if (typeof window.renderWindows === 'function') {
        window.renderWindows();
      }
    }
  }
};
