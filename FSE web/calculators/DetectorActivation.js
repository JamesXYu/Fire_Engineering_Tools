/*
function runPD7974DetectorCalculation(inputs) {
  const {
    t_end = 600,    // s
    dt = 1,          // s
    alpha,          // kW/s^2
    H,              // m (ceiling height)
    R,              // m (radial distance)
    RTI,            // m^1/2 s^1/2
    C,              // m^1/2 s^-1/2
    HRR_density,    // kW/m^2
    Ccov,           // Convection HRR (%)
    T_act,          // °C

  } = inputs;

    // -----------------------------
    // Fire growth (t-squared fire)
    // -----------------------------
    const Q = alpha * t * t; // kW
    const Qc = Ccov * Q;

    // -----------------------------
    // Virtual origin (simplified)
    // -----------------------------
    const z0 = 0.083 * Math.pow(Q, 2 / 5);

    // -----------------------------
    // Decide Jet or Plume
    // HRR density only affects regime
    // -----------------------------
    const plumecheck = R / (H - z0);
    let ΔTg, u;

    if (plumecheck < 0.134) {
      const z = H - z0;
      ΔTg = 25 * Math.pow(Qc, 2 / 3) * Math.pow(z, -5 / 3);
      u = 1.03 * Math.pow(Qc, 1 / 3) * Math.pow(z, -1 / 3);
      regime = "Jet";
    } else if (plumecheck > 0.134 && plumecheck < 0.246) {
      const z = H - z0;
      const rRatio = R / z;
      ΔTg = 6.72 * Math.pow(Qc, 2 / 3) * Math.pow(z, -5 / 3) * Math.pow(rRatio, -0.6545);
      u = 1.03 * Math.pow(Qc, 1 / 3) * Math.pow(z, -1 / 3);
      regime = "Jet";
    } else {
      const z = H - z0;
      const rRatio = R / z;
      ΔTg = 6.72 * Math.pow(Qc, 2 / 3) * Math.pow(z, -5 / 3) * Math.pow(rRatio, -0.6545);
      u = 0.2526 * Math.pow(Q / z, 1 / 3) * Math.pow(rRatio, -1.0739);
      regime = "Jet";
    }
    const du = Math.sqrt(u);

    const dΔTe_dt =
      (du / RTI) *
      (ΔTg - (1 + C / du) * ΔTe);

    ΔTe += dΔTe_dt * dt;

*/

const DetectorActivationCalculator = {
  // Required: Unique identifier for this calculator
  type: 'DetectorActivation',

  // Required: Display name
  name: 'Detector Activation',

  // Required: Icon (emoji or text)
  icon: '🔔',

  // Required: Get number of input fields
  getInputCount() {
    return 10; // Return the number of input fields
  },

  // Required: Get number of output fields
  getOutputCount() {
    return 2; // Return the number of output fields
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
            <label class="calc-label">Duration (s)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Time Step (s)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Fire Growth Factor (kW/s²)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Height (m)</label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Radial Distance (m)</label>
            <input type="number" class="calc-input" id="input5-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Response Time Index (m½s½)</label>
            <input type="number" class="calc-input" id="input6-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Conduction factor (m½/s½)</label>
            <input type="number" class="calc-input" id="input7-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Activation Temperature (°C)</label>
            <input type="number" class="calc-input" id="input8-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Convention HRR (%)</label>
            <input type="number" class="calc-input" id="input9-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">HRR density (kW/m²)</label>
            <input type="number" class="calc-input" id="input10-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
        </div>
        
        <div class="calc-divider">
          <div class="divider-line"></div>
          <div class="divider-label">Results</div>
          <div class="divider-line"></div>
        </div>
        
        <div class="calc-output-section">
          <div class="calc-section">
            <label class="calc-label">Activation Time</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-output-wrapper">
                <input type="text" class="calc-output" id="result1-${windowId}" placeholder="—" readonly>
                <span class="calc-output-unit">s</span>
              </div>
            </div>
          </div>
          <div class="calc-section">
            <label class="calc-label">Jet or Plume</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-output-wrapper">
                <input type="text" class="calc-output" id="result2-${windowId}" placeholder="—" readonly>
                
              </div>
            </div>
          </div>
        </div>
        
        <div class="calc-actions" style="position: relative; display: flex; justify-content: space-between; gap: 8px;">
          <button class="action-btn clear-btn" data-window-id="${windowId}">Clear</button>
          <button class="action-btn export-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Export</button>
          <button class="action-btn import-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Import</button>
          <button class="action-btn help-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Detail</button>
        </div>
      </div>
    `;
  },

  // Required: Get help window HTML
  getHelpHTML(windowId) {
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 20px;">
        <h3 style="margin-bottom: 20px; color: var(--text-primary);">Detector Activation Help</h3>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">How to Use</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            Enter your values in the 10 input fields and the calculator will compute the results.
          </p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Description</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            This calculator implements PD 7974 detector activation calculations using t-squared fire growth model.
            It determines whether the detector operates in Plume or Jet regime and calculates the activation time.
          </p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Outputs</h4>
          <ul style="color: var(--text-secondary); line-height: 1.6; padding-left: 20px;">
            <li><strong>Activation Time:</strong> Time in seconds when detector activates (or "No activation" if it doesn't activate within simulation time)</li>
            <li><strong>Jet or Plume:</strong> The regime determined by the calculation (Plume or Jet)</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">References</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            PD 7974 Clause 8.9 - Detector ODE calculations
          </p>
        </div>
      </div>
    `;
  },

  // Required: Calculate function
  calculate(windowId) {
    const input1El = document.getElementById(`input1-${windowId}`);
    const input2El = document.getElementById(`input2-${windowId}`);
    const input3El = document.getElementById(`input3-${windowId}`);
    const input4El = document.getElementById(`input4-${windowId}`);
    const input5El = document.getElementById(`input5-${windowId}`);
    const input6El = document.getElementById(`input6-${windowId}`);
    const input7El = document.getElementById(`input7-${windowId}`);
    const input8El = document.getElementById(`input8-${windowId}`);
    const input9El = document.getElementById(`input9-${windowId}`);
    const input10El = document.getElementById(`input10-${windowId}`);
    const result1El = document.getElementById(`result1-${windowId}`);
    const result2El = document.getElementById(`result2-${windowId}`);

    if (!input1El || !input2El || !input3El || !input4El || !input5El ||
      !input6El || !input7El || !input8El || !input9El || !input10El || !result1El || !result2El) return;

    // Parse inputs with defaults for t_end and dt
    const t_end = input1El.value.trim() === '' ? 600 : parseFloat(input1El.value) || 600;
    const dt = input2El.value.trim() === '' ? 1 : parseFloat(input2El.value) || 1;
    const alpha = parseFloat(input3El.value);
    const H = parseFloat(input4El.value);
    const R = parseFloat(input5El.value);
    const RTI = parseFloat(input6El.value);
    const C = parseFloat(input7El.value);
    const T_act = parseFloat(input8El.value);
    const Ccov = parseFloat(input9El.value);
    const HRR_density = parseFloat(input10El.value);

    // Check if required inputs are provided (Ccov - Convection HRR % is used in calculation)
    if (isNaN(alpha) || isNaN(H) || isNaN(R) || isNaN(RTI) || isNaN(C) || isNaN(T_act) || isNaN(HRR_density)) {
      result1El.value = '';
      result1El.placeholder = '—';
      result2El.value = '';
      result2El.placeholder = '—';
      return;
    }

    // Validate dt and t_end are positive
    if (dt <= 0 || t_end <= 0) {
      result1El.value = '';
      result1El.placeholder = '—';
      result2El.value = '';
      result2El.placeholder = '—';
      return;
    }

    // Run PD 7974 Detector Calculation
    const calculationInputs = {
      t_end: t_end,
      dt: dt,
      alpha: alpha,
      H: H,
      R: R,
      RTI: RTI,
      C: C,
      HRR_density: HRR_density,
      Ccov: Ccov || 0,
      T_act: T_act
    };
const u =
    0.2526 *
    Math.pow(Q / z, 1 / 3) *
    Math.pow(rRatio, -1.0739);
    const result = runPD7974DetectorCalculation(calculationInputs);

    // Update output fields
    if (result.activationTime !== null) {
      result1El.value = result.activationTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      result1El.placeholder = '';
    } else {
      result1El.value = '';
      result1El.placeholder = 'No activation';
    }

    result2El.value = result.regime || '—';
    result2El.placeholder = '';
  },

  // Required: Clear function
  clear(windowId) {
    const input1El = document.getElementById(`input1-${windowId}`);
    const input2El = document.getElementById(`input2-${windowId}`);
    const input3El = document.getElementById(`input3-${windowId}`);
    const input4El = document.getElementById(`input4-${windowId}`);
    const input5El = document.getElementById(`input5-${windowId}`);
    const input6El = document.getElementById(`input6-${windowId}`);
    const input7El = document.getElementById(`input7-${windowId}`);
    const input8El = document.getElementById(`input8-${windowId}`);
    const input9El = document.getElementById(`input9-${windowId}`);
    const input10El = document.getElementById(`input10-${windowId}`);

    if (input1El) input1El.value = '';
    if (input2El) input2El.value = '';
    if (input3El) input3El.value = '';
    if (input4El) input4El.value = '';
    if (input5El) input5El.value = '';
    if (input6El) input6El.value = '';
    if (input7El) input7El.value = '';
    if (input8El) input8El.value = '';
    if (input9El) input9El.value = '';
    if (input10El) input10El.value = '';

    this.calculate(windowId);
  },

  // Required: Save input values before re-rendering
  saveInputValues(windowId) {
    const savedValues = {};
    const input1El = document.getElementById(`input1-${windowId}`);
    const input2El = document.getElementById(`input2-${windowId}`);
    const input3El = document.getElementById(`input3-${windowId}`);
    const input4El = document.getElementById(`input4-${windowId}`);
    const input5El = document.getElementById(`input5-${windowId}`);
    const input6El = document.getElementById(`input6-${windowId}`);
    const input7El = document.getElementById(`input7-${windowId}`);
    const input8El = document.getElementById(`input8-${windowId}`);
    const input9El = document.getElementById(`input9-${windowId}`);
    const input10El = document.getElementById(`input10-${windowId}`);

    if (input1El) savedValues.input1 = input1El.value;
    if (input2El) savedValues.input2 = input2El.value;
    if (input3El) savedValues.input3 = input3El.value;
    if (input4El) savedValues.input4 = input4El.value;
    if (input5El) savedValues.input5 = input5El.value;
    if (input6El) savedValues.input6 = input6El.value;
    if (input7El) savedValues.input7 = input7El.value;
    if (input8El) savedValues.input8 = input8El.value;
    if (input9El) savedValues.input9 = input9El.value;
    if (input10El) savedValues.input10 = input10El.value;

    return savedValues;
  },

  // Required: Restore input values after re-rendering
  restoreInputValues(windowId, savedValues) {
    const input1El = document.getElementById(`input1-${windowId}`);
    const input2El = document.getElementById(`input2-${windowId}`);
    const input3El = document.getElementById(`input3-${windowId}`);
    const input4El = document.getElementById(`input4-${windowId}`);
    const input5El = document.getElementById(`input5-${windowId}`);
    const input6El = document.getElementById(`input6-${windowId}`);
    const input7El = document.getElementById(`input7-${windowId}`);
    const input8El = document.getElementById(`input8-${windowId}`);
    const input9El = document.getElementById(`input9-${windowId}`);
    const input10El = document.getElementById(`input10-${windowId}`);

    if (input1El && savedValues.input1 !== undefined) {
      input1El.value = savedValues.input1;
      if (savedValues.input1) this.calculate(windowId);
    }
    if (input2El && savedValues.input2 !== undefined) {
      input2El.value = savedValues.input2;
      if (savedValues.input2) this.calculate(windowId);
    }
    if (input3El && savedValues.input3 !== undefined) {
      input3El.value = savedValues.input3;
      if (savedValues.input3) this.calculate(windowId);
    }
    if (input4El && savedValues.input4 !== undefined) {
      input4El.value = savedValues.input4;
      if (savedValues.input4) this.calculate(windowId);
    }
    if (input5El && savedValues.input5 !== undefined) {
      input5El.value = savedValues.input5;
      if (savedValues.input5) this.calculate(windowId);
    }
    if (input6El && savedValues.input6 !== undefined) {
      input6El.value = savedValues.input6;
      if (savedValues.input6) this.calculate(windowId);
    }
    if (input7El && savedValues.input7 !== undefined) {
      input7El.value = savedValues.input7;
      if (savedValues.input7) this.calculate(windowId);
    }
    if (input8El && savedValues.input8 !== undefined) {
      input8El.value = savedValues.input8;
      if (savedValues.input8) this.calculate(windowId);
    }
    if (input9El && savedValues.input9 !== undefined) {
      input9El.value = savedValues.input9;
      if (savedValues.input9) this.calculate(windowId);
    }
    if (input10El && savedValues.input10 !== undefined) {
      input10El.value = savedValues.input10;
      if (savedValues.input10) this.calculate(windowId);
    }
  },

  // Optional: Attach calculator-specific event handlers
  attachEvents(windowId) {
    // Add any calculator-specific event handlers here
  }
};
