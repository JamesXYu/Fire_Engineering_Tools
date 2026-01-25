// Merge Flow Calculator
// ADB Merging Flow Calculation based on Approved Document B

const MergeFlowCalculator = {
  // Calculator metadata
  type: 'mergeflow',
  name: 'Merging Flow',
  icon: '🔄',
  
  // Get number of inputs
  getInputCount() {
    return 2; // Number of People, Size of Stair
  },
  
  // Get number of outputs
  getOutputCount() {
    return 3; // Merging Flow Result, Effective Width, Flow Rate
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
            <input type="number" class="calc-input" id="people-${windowId}" placeholder="Enter number of people" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Size of Stair (mm)</label>
            <input type="number" class="calc-input" id="stair-${windowId}" placeholder="Enter stair width in mm" min="0" data-window-id="${windowId}">
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
                <input type="text" class="calc-output" id="flow-capacity-${windowId}" placeholder="—" readonly>
                <span class="calc-output-unit">people/min</span>
              </div>
            </div>
          </div>
          <div class="calc-section">
            <label class="calc-label">Effective Width</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-output-wrapper">
                <input type="text" class="calc-output" id="effective-width-${windowId}" placeholder="—" readonly>
                <span class="calc-output-unit">mm</span>
              </div>
            </div>
          </div>
          <div class="calc-section">
            <label class="calc-label">Flow Rate</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-output-wrapper">
                <input type="text" class="calc-output" id="flow-rate-${windowId}" placeholder="—" readonly>
                <span class="calc-output-unit">people/m</span>
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
  
  // Get help window HTML
  getHelpHTML(windowId) {
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 20px;">
        <h3 style="margin-bottom: 20px; color: var(--text-primary);">ADB Merging Flow Calculation Process</h3>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Step 1: Input Parameters</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            Enter the number of people and the width of the stair in millimeters.
          </p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Step 2: Calculate Flow Capacity</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            The flow capacity is calculated using the formula:
          </p>
          <div class="math-formula">Flow Capacity = (Stair Width (mm) / 5.5) × Number of People</div>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            This determines the maximum flow rate through the stairway.
          </p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Step 3: Determine Effective Width</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            The effective width is the actual usable width of the stair after accounting for handrails and other obstructions.
            In this calculation, it is taken as the input stair width:
          </p>
          <div class="math-formula">Effective Width = Stair Width (mm)</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Step 4: Calculate Flow Rate</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            The flow rate is calculated as the number of people per meter of width:
          </p>
          <div class="math-formula">Flow Rate = Number of People / Stair Width (m)</div>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            This provides a measure of the density of people flow through the escape route.
          </p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Step 5: Result Interpretation</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            The merging flow result indicates the capacity of the escape route. This value should be compared against
            building regulations requirements to ensure adequate means of escape.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--window-border);">
          <p style="color: var(--text-secondary); font-size: 12px; font-style: italic;">
            Note: This is a placeholder calculation process. The actual ADB merging flow formula may need refinement
            based on specific building regulations and standards.
          </p>
        </div>
      </div>
    `;
  },
  
  // Calculate function
  calculate(windowId) {
    const peopleEl = document.getElementById(`people-${windowId}`);
    const stairEl = document.getElementById(`stair-${windowId}`);
    const flowCapacityEl = document.getElementById(`flow-capacity-${windowId}`);
    const effectiveWidthEl = document.getElementById(`effective-width-${windowId}`);
    const flowRateEl = document.getElementById(`flow-rate-${windowId}`);
    
    if (!peopleEl || !stairEl || !flowCapacityEl || !effectiveWidthEl || !flowRateEl) return;
    
    const numberOfPeople = parseFloat(peopleEl.value) || 0;
    const stairWidth = parseFloat(stairEl.value) || 0;
    
    // Always show output fields, but with placeholder if no input
    if (!numberOfPeople || !stairWidth) {
      flowCapacityEl.value = '';
      flowCapacityEl.placeholder = '—';
      effectiveWidthEl.value = '';
      effectiveWidthEl.placeholder = '—';
      flowRateEl.value = '';
      flowRateEl.placeholder = '—';
      return;
    }
    
    // ADB Merging Flow calculation
    const flowCapacity = (stairWidth / 5.5) * numberOfPeople;
    const effectiveWidth = stairWidth;
    const flowRate = numberOfPeople / (stairWidth / 1000); // people per meter
    
    // Update output fields
    flowCapacityEl.value = flowCapacity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    flowCapacityEl.placeholder = '';
    effectiveWidthEl.value = effectiveWidth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    effectiveWidthEl.placeholder = '';
    flowRateEl.value = flowRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    flowRateEl.placeholder = '';
  },
  
  // Clear function
  clear(windowId) {
    const peopleEl = document.getElementById(`people-${windowId}`);
    const stairEl = document.getElementById(`stair-${windowId}`);
    if (peopleEl) peopleEl.value = '';
    if (stairEl) stairEl.value = '';
    this.calculate(windowId);
  },
  
  // Save input values before re-rendering
  saveInputValues(windowId) {
    const savedValues = {};
    const peopleEl = document.getElementById(`people-${windowId}`);
    const stairEl = document.getElementById(`stair-${windowId}`);
    if (peopleEl) savedValues.people = peopleEl.value;
    if (stairEl) savedValues.stair = stairEl.value;
    return savedValues;
  },
  
  // Restore input values after re-rendering
  restoreInputValues(windowId, savedValues) {
    const peopleEl = document.getElementById(`people-${windowId}`);
    const stairEl = document.getElementById(`stair-${windowId}`);
    if (peopleEl && savedValues.people !== undefined) {
      peopleEl.value = savedValues.people;
      if (savedValues.people) this.calculate(windowId);
    }
    if (stairEl && savedValues.stair !== undefined) {
      stairEl.value = savedValues.stair;
      if (savedValues.stair) this.calculate(windowId);
    }
  },
  
  // Attach calculator-specific event handlers
  attachEvents(windowId) {
    // Input events are handled globally, but you can add calculator-specific handlers here
  }
};

