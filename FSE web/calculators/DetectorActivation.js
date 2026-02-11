// PD 7974-1:2019 Equation Functions

// Equation 10: Virtual fire origin
function eq_10_virtual_origin(D, Q_dot_kW) {
  return -1.02 * D + 0.083 * Math.pow(Q_dot_kW, 2 / 5);
}

// Equation 14: Plume temperature (mean centre-line excess gas temperature)
function eq_14_plume_temperature(T_0, g, c_p_0_kJ_kg_K, rho_0, Q_dot_c_kW, z, z_0) {
  const aa = Math.pow(T_0 / (g * Math.pow(c_p_0_kJ_kg_K, 2) * Math.pow(rho_0, 2)), 1 / 3);
  const bb = Math.pow(Q_dot_c_kW, 2 / 3);
  const cc = Math.pow(z - z_0, -5 / 3);
  return 9.1 * aa * bb * cc;
}

// Equation 15: Plume velocity (mean gas velocity along fire centre-line)
function eq_15_plume_velocity(T_0, g, c_p_0_kJ_kg_K, rho_0, Q_dot_c_kW, z, z_0) {
  const aa = Math.pow(g / (c_p_0_kJ_kg_K * rho_0 * T_0), 1 / 3);
  const bb = Math.pow(Q_dot_c_kW, 1 / 3);
  const cc = Math.pow(z - z_0, -1 / 3);
  return 3.4 * aa * bb * cc;
}

// Equation 26: Axisymmetric ceiling jet temperature
function eq_26_axisymmetric_ceiling_jet_temperature(Q_dot_c_kW, z_H, z_0, r) {
  const aa = 6.721;
  const bb = Math.pow(Q_dot_c_kW, 2 / 3) / Math.pow(z_H - z_0, 5 / 3);
  const cc = Math.pow(r / (z_H - z_0), -0.6545);
  return aa * bb * cc;
}

// Equation 27: Axisymmetric ceiling jet velocity
function eq_27_axisymmetric_ceiling_jet_velocity(Q_dot_c_kW, z_H, z_0, r) {
  const aa = 0.2526;
  const bb = Math.pow(Q_dot_c_kW, 1 / 3) / Math.pow(z_H - z_0, 1 / 3);
  const cc = Math.pow(r / (z_H - z_0), -1.0739);
  return aa * bb * cc;
}

// Equation 55: Activation of heat detector device
function eq_55_activation_of_heat_detector_device(u, RTI, Delta_T_g, Delta_T_e, C) {
  const aa = Math.pow(u, 0.5) / RTI;
  const bb = Delta_T_g - Delta_T_e * (1 + C / Math.pow(u, 0.5));
  return aa * bb;
}

// Main PD 7974 Detector Calculation Function
function runPD7974DetectorCalculation(inputs) {
  const {
    t_end = 600,                    // s
    dt = 1,                          // s
    alpha,                           // kW/s^2 (fire growth factor)
    H,                               // m (detector to fire vertical distance / ceiling height)
    R,                               // m (detector to fire horizontal distance / radial distance)
    RTI,                             // (m s)^0.5 (response time index)
    C,                               // (m/s)^0.5 (conduction factor)
    HRR_density,                     // kW/m^2 (fire HRR density)
    Ccov = 0,                        // Convection HRR (% - converted to fraction)
    T_act,                           // °C (activation temperature)
    ambient_gravity_acceleration = 9.81,      // m/s^2
    ambient_gas_temperature = 293.15,         // K
    ambient_gas_specific_heat = 1.2,          // kJ/kg/K
    ambient_gas_density = 1.0                  // kg/m^3
  } = inputs;

  // Convert convection HRR from percentage to fraction
  const fire_conv_frac = Ccov / 100.0;

  // Initialize detector temperature at ambient
  let detector_temperature = ambient_gas_temperature;
  let regime = "Plume";

  // Generate time array
  const timeSteps = [];
  for (let t = 0; t <= t_end; t += dt) {
    timeSteps.push(t);
  }

  // Main calculation loop
  for (let i = 0; i < timeSteps.length; i++) {
    const t = timeSteps[i];

    // Calculate fire HRR using t-squared fire growth (Equation 22)
    // Note: Python uses kW/m^2 for alpha, but converts to kW, so alpha here should be in kW/s^2
    const Q_dot_kW = alpha * Math.pow(t, 2); // kW

    // Calculate convective heat release rate
    const Q_dot_c_kW = Q_dot_kW * fire_conv_frac;

    // Calculate fire diameter
    const D = Math.sqrt((Q_dot_kW / HRR_density) / Math.PI) * 2;

    // Calculate virtual fire origin (Equation 10)
    const z_0 = eq_10_virtual_origin(D, Q_dot_kW);

    // Decide whether to use plume or jet
    // air_type = 1 for plume, air_type = 2 for jet
    const r_over_z_minus_z0 = R / (H - z_0);
    let air_type;
    
    if (r_over_z_minus_z0 > 0.134 && r_over_z_minus_z0 > 0.246) {
      air_type = 2; // jet
      regime = "Jet";
    } else {
      air_type = 1; // plume
      regime = "Plume";
    }

    // Calculate ceiling jet temperature and velocity
    let theta_jet_rise, u_jet;

    if (air_type === 1) {
      // Plume correlations
      theta_jet_rise = eq_14_plume_temperature(
        ambient_gas_temperature,
        ambient_gravity_acceleration,
        ambient_gas_specific_heat,
        ambient_gas_density,
        Q_dot_c_kW,
        H,
        z_0
      );
      u_jet = eq_15_plume_velocity(
        ambient_gas_temperature,
        ambient_gravity_acceleration,
        ambient_gas_specific_heat,
        ambient_gas_density,
        Q_dot_c_kW,
        H,
        z_0
      );
    } else if (air_type === 2) {
      // Ceiling jet correlations
      theta_jet_rise = eq_26_axisymmetric_ceiling_jet_temperature(
        Q_dot_c_kW,
        H,
        z_0,
        R
      );
      u_jet = eq_27_axisymmetric_ceiling_jet_velocity(
        Q_dot_c_kW,
        H,
        z_0,
        R
      );
    }

    // Calculate absolute jet temperature
    const theta_jet = theta_jet_rise + ambient_gas_temperature;

    // Calculate detector temperature (Equation 55)
    if (i > 0) {
      const Delta_T_g = theta_jet - ambient_gas_temperature;
      const Delta_T_e = detector_temperature - ambient_gas_temperature;
      
      const d_Delta_Te_dt = eq_55_activation_of_heat_detector_device(
        u_jet,
        RTI,
        Delta_T_g,
        Delta_T_e,
        C
      );
      
      const d_Delta_Te = d_Delta_Te_dt * dt;
      detector_temperature = d_Delta_Te + detector_temperature;
    }

    // Check for activation
    // Convert activation temperature from °C to K for comparison
    const T_act_K = T_act + 273.15;
    if (detector_temperature >= T_act_K) {
      return {
        activationTime: t,
        regime: regime,
        detectorTemperature: detector_temperature - 273.15, // Convert back to °C
        jetTemperature: theta_jet - 273.15, // Convert back to °C
        jetVelocity: u_jet
      };
    }
  }

  // No activation within simulation time
  return {
    activationTime: null,
    regime: regime,
    message: "Detector did not activate within simulation time"
  };
}

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
            <label class="calc-label">Convection HRR (%)</label>
            <input type="number" class="calc-input" id="input9-${windowId}" placeholder="-" min="0" max="100" data-window-id="${windowId}">
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

    // Check if required inputs are provided
    if (isNaN(alpha) || isNaN(H) || isNaN(R) || isNaN(RTI) || isNaN(C) || isNaN(T_act) || isNaN(HRR_density) || isNaN(Ccov)) {
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
