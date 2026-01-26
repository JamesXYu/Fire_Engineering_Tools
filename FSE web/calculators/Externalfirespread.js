const ExternalfirespreadStorage = {};

const ExternalfirespreadCalculator = {
  // Required: Unique identifier for this calculator
  type: 'Externalfirespread',
  
  // Required: Display name
  name: "External Fire Spread",
  
  // Required: Icon (emoji or text)
  icon: '🔢',
  
  // Store active method combination for each window (e.g., "1-4", "1-5", "2-4", "2-5", "3-4", "3-5")
  // Using module-level storage for better persistence
  windowMethods: ExternalfirespreadStorage,
  
  // Store selected buttons for each row (row1: 1,2,3 and row2: 4,5)
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
        if (savedMethod && ['1-4', '1-5', '2-4', '2-5', '3-4', '3-5'].includes(savedMethod)) {
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
  
  // Set row selection (row1: 1-3, row2: 4-5)
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
          { id: 'input1', label: 'Emitter Width (m)' },
          { id: 'input2', label: 'Emitter Height (m)' },
          { id: 'input3', label: 'Boundary Distance (m)' },
          { id: 'input4', label: 'Emitter Heat Flux (kW/m²)' },
          { id: 'input5', label: 'Critical Heat Flux (kW/m²)' },
          { id: 'input6', label: 'Horizontal Location (m)', disabled: true },
          { id: 'input7', label: 'Vertical Location (m)', disabled: true }
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
          { id: 'input1', label: 'Input B1' },
          { id: 'input2', label: 'Input B2' },
          { id: 'input3', label: 'Input B3' },
          { id: 'input4', label: 'Input B4' },
          { id: 'input5', label: 'Input B5' },
          { id: 'input6', label: 'Input B6', disabled: true },
          { id: 'input7', label: 'Input B7', disabled: true }
        ],
        outputs: [
          { id: 'output1', label: 'Output B1' },
          { id: 'output2', label: 'Output B2' },
          { id: 'output3', label: 'Output B3' }
        ],
        hasCheckbox: true
      },
      '2-4': { // Method C: 6 enabled, 2 disabled, checkbox, 3 outputs
        inputs: [
          { id: 'input1', label: 'Input C1' },
          { id: 'input2', label: 'Input C2' },
          { id: 'input3', label: 'Input C3' },
          { id: 'input4', label: 'Input C4' },
          { id: 'input5', label: 'Input C5' },
          { id: 'input6', label: 'Input C6' },
          { id: 'input7', label: 'Input C7', disabled: true },
          { id: 'input8', label: 'Input C8', disabled: true }
        ],
        outputs: [
          { id: 'output1', label: 'Output C1' },
          { id: 'output2', label: 'Output C2' },
          { id: 'output3', label: 'Output C3' }
        ],
        hasCheckbox: true
      },
      '2-5': { // Method D: 6 enabled, 2 disabled, checkbox, 3 outputs
        inputs: [
          { id: 'input1', label: 'Input D1' },
          { id: 'input2', label: 'Input D2' },
          { id: 'input3', label: 'Input D3' },
          { id: 'input4', label: 'Input D4' },
          { id: 'input5', label: 'Input D5' },
          { id: 'input6', label: 'Input D6' },
          { id: 'input7', label: 'Input D7', disabled: true },
          { id: 'input8', label: 'Input D8', disabled: true }
        ],
        outputs: [
          { id: 'output1', label: 'Output D1' },
          { id: 'output2', label: 'Output D2' },
          { id: 'output3', label: 'Output D3' }
        ],
        hasCheckbox: true
      },
      '3-4': { // Method E: 6 enabled, 2 disabled, checkbox, 3 outputs
        inputs: [
          { id: 'input1', label: 'Input E1' },
          { id: 'input2', label: 'Input E2' },
          { id: 'input3', label: 'Input E3' },
          { id: 'input4', label: 'Input E4' },
          { id: 'input5', label: 'Input E5' },
          { id: 'input6', label: 'Input E6' },
          { id: 'input7', label: 'Input E7', disabled: true },
          { id: 'input8', label: 'Input E8', disabled: true }
        ],
        outputs: [
          { id: 'output1', label: 'Output E1' },
          { id: 'output2', label: 'Output E2' },
          { id: 'output3', label: 'Output E3' }
        ],
        hasCheckbox: true
      },
      '3-5': { // Method F: 6 enabled, 2 disabled, checkbox, 3 outputs
        inputs: [
          { id: 'input1', label: 'Input F1' },
          { id: 'input2', label: 'Input F2' },
          { id: 'input3', label: 'Input F3' },
          { id: 'input4', label: 'Input F4' },
          { id: 'input5', label: 'Input F5' },
          { id: 'input6', label: 'Input F6' },
          { id: 'input7', label: 'Input F7', disabled: true },
          { id: 'input8', label: 'Input F8', disabled: true }
        ],
        outputs: [
          { id: 'output1', label: 'Output F1' },
          { id: 'output2', label: 'Output F2' },
          { id: 'output3', label: 'Output F3' }
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
      inputHTML += `
        <div class="calc-section ${disabledClass}">
          <label class="calc-label">${input.label}</label>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <div class="calc-input-wrapper ${wrapperDisabledClass}">
              <input type="number" class="calc-input" id="${input.id}-${windowId}" min="0" data-window-id="${windowId}" ${disabledAttr} placeholder="-">
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
          <!-- First Row: 3 buttons (select one) -->
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
              Wall
            </button>
            <button class="method-btn-row1 ${selections.row1 === 3 ? 'active' : ''}" 
                    data-window-id="${windowId}" 
                    data-row="1"
                    data-value="3"
                    style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${selections.row1 === 3 ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${selections.row1 === 3 ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
              Roof
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
    // Get the active method combination from the source window
    let activeMethod = '1-4'; // default
    if (sourceWindowId) {
      activeMethod = this.getActiveMethod(sourceWindowId);
    }
    
    // Map combinations to method letters
    const methodMap = {
      '1-4': 'A',
      '1-5': 'B',
      '2-4': 'C',
      '2-5': 'D',
      '3-4': 'E',
      '3-5': 'F'
    };
    
    const methodLetter = methodMap[activeMethod] || 'A';
    
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 20px;">
        <h3 style="margin-bottom: 20px; color: var(--text-primary);">Method ${methodLetter} (${activeMethod}) - Justification</h3>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Method ${methodLetter} Calculation</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            This method combines selection ${activeMethod.split('-')[0]} from the first row and selection ${activeMethod.split('-')[1]} from the second row.
            Enter the required parameters to calculate the results.
          </p>
          <div class="math-formula">[METHOD ${methodLetter} FORMULA - REPLACE WITH ACTUAL FORMULA]</div>
          <p style="color: var(--text-secondary); font-size: 12px; font-style: italic; margin-top: 10px;">
            [METHOD ${methodLetter} JUSTIFICATION TEXT - REPLACE WITH ACTUAL CONTENT]
          </p>
        </div>
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
      
      if (isRequired) {
        const value = parseFloat(inputEl.value) || 0;
        inputValues[input.id] = value;
        if (!value) {
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
      let vf = 2 * ((xx * Math.atan(yx) + yy * Math.atan(xy))) / Math.PI * 100;
      return vf;
    }

    // Pseudo calculations based on method
    const results = {};
    
    if (activeMethod === '1-4') {
      if (!checkboxChecked) {
        results.output1 = calculateViewFactor(inputValues);
        results.output2 = results.output1 * inputValues.input4 / 100;
        let a_check =  inputValues.input5 / results.output2;
        if(a_check < 1.0) {
          results.output3 = a_check * 100;
        }
        else{
          results.output3 = 100;
        }
      } else {
        results.output1 = (inputValues.input1 + inputValues.input2 + inputValues.input3 + inputValues.input4 + inputValues.input5) * 1.0;
        results.output2 = (inputValues.input1 * inputValues.input2) * 1.1;
        results.output3 = (inputValues.input3 + inputValues.input4) * 1.2;
      }
    } else if (activeMethod === '1-5') { // Method B: 5 enabled, 2 disabled, checkbox, 3 outputs
      if (checkboxChecked) {
        results.output1 = (inputValues.input1 + inputValues.input2 + inputValues.input3 + inputValues.input4 + inputValues.input5 + inputValues.input6 + inputValues.input7) * 1.1;
        results.output2 = (inputValues.input1 * inputValues.input2) * 1.2;
        results.output3 = (inputValues.input3 + inputValues.input4 + inputValues.input5) * 1.3;
      } else {
        results.output1 = (inputValues.input1 + inputValues.input2 + inputValues.input3 + inputValues.input4 + inputValues.input5) * 1.1;
        results.output2 = (inputValues.input1 * inputValues.input2) * 1.2;
        results.output3 = (inputValues.input3 * inputValues.input4) * 1.3;
      }
    } else if (activeMethod === '2-4') { // Method C: 6 enabled, 2 disabled, checkbox, 3 outputs
      if (checkboxChecked) {
        results.output1 = (inputValues.input1 + inputValues.input2 + inputValues.input3 + inputValues.input4 + inputValues.input5 + inputValues.input6 + inputValues.input7 + inputValues.input8) * 1.2;
        results.output2 = (inputValues.input1 * inputValues.input2) * 1.3;
        results.output3 = (inputValues.input3 + inputValues.input4 + inputValues.input5) * 1.4;
      } else {
        results.output1 = (inputValues.input1 + inputValues.input2 + inputValues.input3 + inputValues.input4 + inputValues.input5 + inputValues.input6) * 1.2;
        results.output2 = (inputValues.input1 * inputValues.input2) * 1.3;
        results.output3 = (inputValues.input3 + inputValues.input4) * 1.4;
      }
    } else if (activeMethod === '2-5') { // Method D: 6 enabled, 2 disabled, checkbox, 3 outputs
      if (checkboxChecked) {
        results.output1 = (inputValues.input1 + inputValues.input2 + inputValues.input3 + inputValues.input4 + inputValues.input5 + inputValues.input6 + inputValues.input7 + inputValues.input8) * 1.3;
        results.output2 = (inputValues.input1 * inputValues.input2 + inputValues.input3) * 1.4;
        results.output3 = (inputValues.input4 + inputValues.input5 + inputValues.input6) * 1.5;
      } else {
        results.output1 = (inputValues.input1 + inputValues.input2 + inputValues.input3 + inputValues.input4 + inputValues.input5 + inputValues.input6) * 1.3;
        results.output2 = (inputValues.input1 * inputValues.input2) * 1.4;
        results.output3 = (inputValues.input3 + inputValues.input4) * 1.5;
      }
    } else if (activeMethod === '3-4') { // Method E: 6 enabled, 2 disabled, checkbox, 3 outputs
      if (checkboxChecked) {
        results.output1 = (inputValues.input1 + inputValues.input2 + inputValues.input3 + inputValues.input4 + inputValues.input5 + inputValues.input6 + inputValues.input7 + inputValues.input8) * 1.4;
        results.output2 = (inputValues.input1 * inputValues.input2) * 1.5;
        results.output3 = (inputValues.input3 + inputValues.input4 + inputValues.input5 + inputValues.input6) * 1.6;
      } else {
        results.output1 = (inputValues.input1 + inputValues.input2 + inputValues.input3 + inputValues.input4 + inputValues.input5 + inputValues.input6) * 1.4;
        results.output2 = (inputValues.input1 * inputValues.input2) * 1.5;
        results.output3 = (inputValues.input3 + inputValues.input4 + inputValues.input5) * 1.6;
      }
    } else if (activeMethod === '3-5') { // Method F: 6 enabled, 2 disabled, checkbox, 3 outputs
      if (checkboxChecked) {
        results.output1 = (inputValues.input1 + inputValues.input2 + inputValues.input3 + inputValues.input4 + inputValues.input5 + inputValues.input6 + inputValues.input7 + inputValues.input8) * 1.5;
        results.output2 = (inputValues.input1 * inputValues.input2 + inputValues.input3) * 1.6;
        results.output3 = (inputValues.input4 + inputValues.input5 + inputValues.input6) * 1.7;
      } else {
        results.output1 = (inputValues.input1 + inputValues.input2 + inputValues.input3 + inputValues.input4 + inputValues.input5 + inputValues.input6) * 1.5;
        results.output2 = (inputValues.input1 * inputValues.input2) * 1.6;
        results.output3 = (inputValues.input3 + inputValues.input4 + inputValues.input5) * 1.7;
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
        if (savedMethod && ['1-4', '1-5', '2-4', '2-5', '3-4', '3-5'].includes(savedMethod)) {
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
    // Handle row 1 button clicks (buttons 1, 2, 3)
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
  
  // Update figure window image when method changes
  updateFigureWindow(sourceWindowId) {
    if (typeof window === 'undefined' || !window.state) return;
    
    // Find the figure window for this source window
    const figureWindow = window.state.windows.find(w => 
      w.sourceWindowId === sourceWindowId && 
      w.type === 'Externalfirespread-figure'
    );
    
    if (figureWindow) {
      const activeMethod = this.getActiveMethod(sourceWindowId);
      const newImagePath = `Figures/Externalfirespread-${activeMethod}.png`;
      
      // Map combinations to method letters
      const methodMap = {
        '1-4': 'A',
        '1-5': 'B',
        '2-4': 'C',
        '2-5': 'D',
        '3-4': 'E',
        '3-5': 'F'
      };
      
      const methodLetter = methodMap[activeMethod] || 'A';
      
      // Update image path and method
      figureWindow.figureImagePath = newImagePath;
      figureWindow.activeMethod = activeMethod;
      
      // Update title based on method
      figureWindow.title = `Method ${methodLetter} (${activeMethod}) - Figure`;
      
      // Re-render windows to update figure content
      if (typeof window.renderWindows === 'function') {
        window.renderWindows();
      }
    }
  }
};
