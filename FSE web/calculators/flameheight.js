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
      { id: 'input1', label: 'Total HRR (kW)' },
      { id: 'input2', label: 'Air Density (kg/m³)', defaultValue: 1.2, placeholder: '1.2' },
      { id: 'input3', label: 'Air Heat Capacity (KJ/(kg K))', defaultValue: 1.0, placeholder: '1.0' },
      { id: 'input4', label: 'Air Temperature (K)', defaultValue: 293, placeholder: '293' },
      { id: 'input5', label: 'Gravity (m/s²)', defaultValue: 9.81, placeholder: '9.81' }
    ];
    
    // Method 1 inputs: Fire Diameter (6 inputs) + dropdown for sub-method
    const method1Inputs = [
      ...commonInputs,
      { id: 'input6', label: 'Fire Diameter (m)' }
    ];
    
    // Method 2 inputs: Fire Length (6 inputs)
    const method2Inputs = [
      ...commonInputs,
      { id: 'input6', label: 'Fire Length (m)' }
    ];
    
    // Method 3 inputs: Fire Long Dimension + Fire Short Dimension (7 inputs)
    const method3Inputs = [
      ...commonInputs,
      { id: 'input6', label: 'Fire Long Dimension (m)' },
      { id: 'input7', label: 'Fire Short Dimension (m)' }
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
    const minHeight = titleBarHeight + windowContentPadding + methodButtonGroupHeight + totalSectionsHeight + gapsHeight + dividerHeight + actionsHeight + 50;
    
    return { width: 400, height: minHeight };
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
  
  // Required: Get help window HTML
  getHelpHTML(windowId, sourceWindowId) {
    let activeMethod = '1';
    let subMethod = '4';
    if (sourceWindowId) {
      activeMethod = this.getActiveMethod(sourceWindowId);
      subMethod = this.getSubMethod(sourceWindowId);
    }
    
    const config = this.getMethodConfig(activeMethod, subMethod);
    
    let methodTitle = `Method ${activeMethod}`;
    if (activeMethod === '1') {
      methodTitle += ` (Sub-option ${subMethod})`;
    }
    
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 20px;">
        <h3 style="margin-bottom: 20px; color: var(--text-primary);">${methodTitle} - Help</h3>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Description</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            ${config.description}
          </p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Formula</h4>
          <div class="math-formula">[METHOD ${activeMethod} FORMULA - REPLACE WITH ACTUAL FORMULA]</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Inputs</h4>
          <ul style="color: var(--text-secondary); line-height: 1.6; padding-left: 20px;">
            ${config.inputs.map(input => `<li>${input.label}</li>`).join('')}
          </ul>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Outputs</h4>
          <ul style="color: var(--text-secondary); line-height: 1.6; padding-left: 20px;">
            ${config.outputs.map(output => `<li>${output.label} (${output.unit})</li>`).join('')}
          </ul>
        </div>
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
      if (inputEl) {
        if (input.defaultValue !== undefined) {
          inputEl.value = input.defaultValue;
        } else {
          inputEl.value = '';
        }
      }
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
      let newImagePath = `Figures/Flameheight-${activeMethod}.png`;
      if (activeMethod === '1') {
        newImagePath = `Figures/Flameheight-${activeMethod}-${subMethod}.png`;
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
