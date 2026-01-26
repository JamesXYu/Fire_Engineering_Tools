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

