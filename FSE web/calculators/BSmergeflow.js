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
  
  // Required: Get help window HTML
  getHelpHTML(windowId, sourceWindowId) {
    let activeMethod = 'method1';
    if (sourceWindowId) activeMethod = this.getActiveMethod(sourceWindowId);
    const labels = { method1: 'Upper Level', method2: 'Basement Level', method3: 'Multi-Level' };
    const label = labels[activeMethod] || 'Upper Level';
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 4px 0; gap: 4px;">
        <p style="color: var(--text-secondary); line-height: 1.3; margin: 0; font-size: 13px;">
          BS 9999 — Merge flow for minimum final exit width. Three methods: Upper Level, Basement Level, Multi-Level.
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 1px 0; font-size: 14px; font-weight: 600;">Step 1: Mode</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0 0 4px 0; font-size: 13px;">
          ${label}
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 2: Condition</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0 0 4px 0; font-size: 13px;">
          <strong>Upper Level:</strong> People and stair width determine minimum exit width.<br>
          <strong>Basement Level:</strong> Similar logic for basement escape routes.<br>
          <strong>Multi-Level:</strong> Merging flows from multiple levels.
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 3: Output</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0; font-size: 13px;">
          Minimum final exit width (mm) for the selected configuration.
        </p>
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
      // Method 2: 3 inputs
      const input1El = document.getElementById(`method2-input1-${windowId}`);
      const input2El = document.getElementById(`method2-input2-${windowId}`);
      const input3El = document.getElementById(`method2-input3-${windowId}`);
      const input4El = document.getElementById(`method2-input4-${windowId}`);
      const input5El = document.getElementById(`method2-input5-${windowId}`);
      
      if (!input1El || !input2El || !input3El || input4El || input5El) return;
      
      const input1 = parseFloat(input1El.value) || 0;
      const input2 = parseFloat(input2El.value) || 0;
      const input3 = parseFloat(input3El.value) || 0;
      const input4 = parseFloat(input4El.value) || 0;
      const input5 = parseFloat(input5El.value) || 0;

      if (input1 && input2 && input3 && input4 && input5) {
        allInputsValid = true;
        if (input1 && input2 && input3 && input4 && input5) {
          allInputsValid = true;
          if (input1 > 60 && input3 < 2){
            result = input2 + input4;
          }
          else{
            result = input1* input5 + 0.75 * input2;
          }
        }
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
      const newImagePath = `Figures/BSmergeflow-${activeMethod}.png`;
      
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
