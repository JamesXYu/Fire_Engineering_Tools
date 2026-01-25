// Calculator Template
// Copy this file and modify it to create a new calculator

const YourCalculatorName = {
  // Required: Unique identifier for this calculator
  type: 'your-calculator-type',
  
  // Required: Display name
  name: 'Your Calculator Name',
  
  // Required: Icon (emoji or text)
  icon: '🔢',
  
  // Required: Get number of input fields
  getInputCount() {
    return 2; // Return the number of input fields
  },
  
  // Required: Get number of output fields
  getOutputCount() {
    return 1; // Return the number of output fields
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
  
  // Required: Get calculator HTML
  getHTML(windowId) {
    return `
      <div class="form-calculator" id="calc-${windowId}">
        <div class="calc-input-section">
          <div class="calc-section">
            <label class="calc-label">Input 1</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="Enter value" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Input 2</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="Enter value" min="0" data-window-id="${windowId}">
          </div>
        </div>
        
        <div class="calc-divider">
          <div class="divider-line"></div>
          <div class="divider-label">Results</div>
          <div class="divider-line"></div>
        </div>
        
        <div class="calc-output-section">
          <div class="calc-section">
            <label class="calc-label">Result</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-output-wrapper">
                <input type="text" class="calc-output" id="result-${windowId}" placeholder="—" readonly>
                <span class="calc-output-unit">unit</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="calc-actions" style="position: relative; display: flex; justify-content: space-between;">
          <button class="action-btn clear-btn" data-window-id="${windowId}">Clear</button>
          <button class="action-btn help-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">ℹ️ Show detail</button>
        </div>
      </div>
    `;
  },
  
  // Required: Get help window HTML
  getHelpHTML(windowId) {
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 20px;">
        <h3 style="margin-bottom: 20px; color: var(--text-primary);">Your Calculator Help</h3>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">How to Use</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            Enter your values and the calculator will compute the result.
          </p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Formula</h4>
          <div class="math-formula">Result = Input1 × Input2</div>
        </div>
      </div>
    `;
  },
  
  // Required: Calculate function
  calculate(windowId) {
    const input1El = document.getElementById(`input1-${windowId}`);
    const input2El = document.getElementById(`input2-${windowId}`);
    const resultEl = document.getElementById(`result-${windowId}`);
    
    if (!input1El || !input2El || !resultEl) return;
    
    const input1 = parseFloat(input1El.value) || 0;
    const input2 = parseFloat(input2El.value) || 0;
    
    if (!input1 || !input2) {
      resultEl.value = '';
      resultEl.placeholder = '—';
      return;
    }
    
    // Your calculation here
    const result = input1 * input2;
    
    // Update output field
    resultEl.value = result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    resultEl.placeholder = '';
  },
  
  // Required: Clear function
  clear(windowId) {
    const input1El = document.getElementById(`input1-${windowId}`);
    const input2El = document.getElementById(`input2-${windowId}`);
    if (input1El) input1El.value = '';
    if (input2El) input2El.value = '';
    this.calculate(windowId);
  },
  
  // Required: Save input values before re-rendering
  saveInputValues(windowId) {
    const savedValues = {};
    const input1El = document.getElementById(`input1-${windowId}`);
    const input2El = document.getElementById(`input2-${windowId}`);
    if (input1El) savedValues.input1 = input1El.value;
    if (input2El) savedValues.input2 = input2El.value;
    return savedValues;
  },
  
  // Required: Restore input values after re-rendering
  restoreInputValues(windowId, savedValues) {
    const input1El = document.getElementById(`input1-${windowId}`);
    const input2El = document.getElementById(`input2-${windowId}`);
    if (input1El && savedValues.input1 !== undefined) {
      input1El.value = savedValues.input1;
      if (savedValues.input1) this.calculate(windowId);
    }
    if (input2El && savedValues.input2 !== undefined) {
      input2El.value = savedValues.input2;
      if (savedValues.input2) this.calculate(windowId);
    }
  },
  
  // Optional: Attach calculator-specific event handlers
  attachEvents(windowId) {
    // Add any calculator-specific event handlers here
  }
};

