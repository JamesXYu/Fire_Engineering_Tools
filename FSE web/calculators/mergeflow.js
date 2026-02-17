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
  getHelpHTML(windowId, sourceWindowId) {
    let P = 'P', W = 'W', D = 'D';
    let P_val = null, W_val = null, D_val = null;
    let effectiveWidth = null;
    let branch = '';

    if (sourceWindowId) {
      const peopleEl = document.getElementById(`people-${sourceWindowId}`);
      const stairEl = document.getElementById(`stair-${sourceWindowId}`);
      const distanceEl = document.getElementById(`distance-${sourceWindowId}`);
      P_val = peopleEl && peopleEl.value ? parseFloat(peopleEl.value) : null;
      W_val = stairEl && stairEl.value ? parseFloat(stairEl.value) : null;
      D_val = distanceEl && distanceEl.value ? parseFloat(distanceEl.value) : null;
      if (P_val != null) P = P_val;
      if (W_val != null) W = W_val;
      if (D_val != null) D = D_val;

      if (P_val != null && W_val != null && D_val != null) {
        const base = ((P_val / 2.5) + (W_val * 0.06)) / 80 * 1000;
        if (P_val < 60) {
          effectiveWidth = base;
          branch = 'Fewer than 60 people — base formula';
        } else if (D_val >= 2) {
          effectiveWidth = base;
          branch = '60+ people, distance ≥ 2 m — base formula';
        } else {
          effectiveWidth = Math.max(W_val, base);
          branch = '60+ people, distance < 2 m — greater of stair width or formula';
        }
      }
    }

    const formulaDisplay = P_val != null && W_val != null
      ? `\\( E = \\frac{(${P}/2.5) + (${W} \\times 0.06)}{80} \\times 1000 \\; \\text{mm} \\)`
      : `\\( E = \\frac{(P/2.5) + (W \\times 0.06)}{80} \\times 1000 \\; \\text{mm} \\)`;

    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 4px 0; gap: 4px;">
        <p style="color: var(--text-secondary); line-height: 1.3; margin: 0; font-size: 13px;">
          ADB Merging Flow (Approved Document B). Effective width is derived from number of people, stair width, and travel distance.
        </p>
        <h4 style="color: var(--text-primary); margin: 0 0 1px 0; font-size: 14px; font-weight: 600;">Step 1: Input data</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0 0 8px 0; font-size: 13px;">
          <strong>P</strong> (Number of people) = ${P_val != null ? P_val : '—'}<br>
          <strong>W</strong> (Stair width, mm) = ${W_val != null ? W_val : '—'}<br>
          <strong>D</strong> (Distance, m) = ${D_val != null ? D_val : '—'}
        </p>

        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 2: Which rule applies</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0 0 4px 0; font-size: 13px;">
          <strong>Fewer than 60 people:</strong> Use the base formula.<br>
          <strong>60 or more people, and travel distance ≥ 2 m:</strong> Use the base formula.<br>
          <strong>60 or more people, and travel distance &lt; 2 m:</strong> The effective width is the greater of the stair width or the formula result.
        </p>
        ${effectiveWidth != null ? `<p style="color: var(--text-primary); line-height: 1.45; margin: 0 0 8px 0; font-size: 13px;"><strong>Applied:</strong> ${branch}</p>` : ''}

        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 3: Formula</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0 0 4px 0; font-size: 13px;">
          Base formula:
        </p>
        <div style="text-align: center; margin: 4px 0 8px 0; padding: 8px 12px; background: var(--result-card-bg); border: 1px solid var(--window-border); border-radius: 4px;">
          \\( E = \\frac{(P/2.5) + (W \\times 0.06)}{80} \\times 1000 \\; \\text{mm} \\)
        </div>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0 0 4px 0; font-size: 13px;">
          With values:
        </p>
        <div style="text-align: center; margin: 4px 0 8px 0; padding: 8px 12px; background: var(--result-card-bg); border: 1px solid var(--window-border); border-radius: 4px;">
          ${formulaDisplay}
        </div>

        <h4 style="color: var(--text-primary); margin: 0 0 2px 0; font-size: 14px; font-weight: 600;">Step 4: Conclusion</h4>
        <p style="color: var(--text-secondary); line-height: 1.45; margin: 0; font-size: 13px;">
          ${effectiveWidth != null
            ? `<strong>Effective width = ${effectiveWidth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mm</strong>`
            : 'Enter all inputs to see the result.'}
        </p>
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

