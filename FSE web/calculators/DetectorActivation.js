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
    const minHeight = titleBarHeight + windowContentPadding + totalSectionsHeight + gapsHeight + dividerHeight + actionsHeight + 40;

    return { width: 400, height: minHeight };
  },

  // Required: Get calculator HTML
  getHTML(windowId) {
    return `
      <div class="form-calculator" id="calc-${windowId}">
        <div class="calc-input-section">
          <div class="calc-section">
            <label class="calc-label">Duration t<sub>end</sub> (s)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="3600" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Time Step Δt (s)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="1" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Fire Growth Factor α (kW/s²)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="0.012" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Height z (m)</label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Radial Distance r (m)</label>
            <input type="number" class="calc-input" id="input5-${windowId}" placeholder="" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Response Time Index RTI (m½s½)</label>
            <input type="number" class="calc-input" id="input6-${windowId}" placeholder="" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Conduction factor C (m½/s½)</label>
            <input type="number" class="calc-input" id="input7-${windowId}" placeholder="" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Activation Temperature T<sub>act</sub> (°C)</label>
            <input type="number" class="calc-input" id="input8-${windowId}" placeholder="68" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Convection HRR χ<sub>c</sub> (%)</label>
            <input type="number" class="calc-input" id="input9-${windowId}" placeholder="66.7" min="0" max="100" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">HRR density q̇ (kW/m²)</label>
            <input type="number" class="calc-input" id="input10-${windowId}" placeholder="" min="0" data-window-id="${windowId}">
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

  // Required: Get help window HTML - Detector Activation Calculation Report
  getHelpHTML(windowId, sourceWindowId) {
    const srcId = sourceWindowId || windowId;
    const reportId = `detector-report-${windowId}`;
    const copyBtnId = `detector-copy-${windowId}`;

    const getVal = (n) => {
      const el = document.getElementById(`input${n}-${srcId}`);
      const raw = el?.value?.trim();
      const v = parseFloat(raw);
      return isNaN(v) ? null : v;
    };
    const getOutput = (n) => {
      const el = document.getElementById(`result${n}-${srcId}`);
      return el && el.value ? el.value : '—';
    };
    const fmt = (x) => (typeof x === 'number' && !isNaN(x) ? x.toLocaleString('en-US', { maximumFractionDigits: 4 }) : String(x));

    const inputLabels = [
      { id: 1, label: 'Duration', unit: 's' },
      { id: 2, label: 'Time Step', unit: 's' },
      { id: 3, label: 'Fire Growth Factor (α)', unit: 'kW/s²' },
      { id: 4, label: 'Height (H)', unit: 'm' },
      { id: 5, label: 'Radial Distance (R)', unit: 'm' },
      { id: 6, label: 'Response Time Index (RTI)', unit: '(m·s)½' },
      { id: 7, label: 'Conduction Factor (C)', unit: '(m/s)½' },
      { id: 8, label: 'Activation Temperature', unit: '°C' },
      { id: 9, label: 'Convection HRR', unit: '%' },
      { id: 10, label: 'HRR Density', unit: 'kW/m²' }
    ];

    const inputTable = inputLabels.map(i => `<tr><td>${i.label}</td><td>${fmt(getVal(i.id))}</td><td>${i.unit}</td></tr>`).join('');

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

    const methodology = `
      <p><strong>Step 1: Fire Growth (t-squared)</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('\\dot{Q} = \\alpha \\times t^2 \\text{ (kW)}')}</div>
      <p><strong>Step 2: Fire Diameter</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('D = 2 \\times \\sqrt{\\dot{Q} / (\\pi \\times \\text{HRR}_{\\text{density}})}')}</div>
      <p><strong>Step 3: Virtual Fire Origin</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('z_0 = -1.02 \\times D + 0.083 \\times \\dot{Q}^{2/5}')}</div>
      <p><strong>Step 4: Regime Selection</strong></p>
      <ul>
        <li><strong>Plume:</strong> r/(H − z₀) ≤ 0.246 — use Eq 1 (temperature), Eq 2 (velocity)</li>
        <li><strong>Jet:</strong> r/(H − z₀) &gt; 0.246 — use Eq 3 (temperature), Eq 4 (velocity)</li>
      </ul>
      <p><strong>Equation 1 — Plume temperature</strong> (mean centre-line excess gas temperature):</p>
      <div style="${formulaBlockStyle}">${renderMath('\\Delta\\theta = 9.1 \\times \\left(\\frac{T_0}{g \\cdot c_p^2 \\cdot \\rho^2}\\right)^{1/3} \\times \\dot{Q}_c^{2/3} \\times (z-z_0)^{-5/3}')}</div>
      <p><strong>Equation 2 — Plume velocity</strong> (mean gas velocity along fire centre-line):</p>
      <div style="${formulaBlockStyle}">${renderMath('u = 3.4 \\times \\left(\\frac{g}{c_p \\cdot \\rho \\cdot T_0}\\right)^{1/3} \\times \\dot{Q}_c^{1/3} \\times (z-z_0)^{-1/3}')}</div>
      <p><strong>Equation 3 — Ceiling jet temperature</strong> (axisymmetric):</p>
      <div style="${formulaBlockStyle}">${renderMath('\\Delta\\theta = 6.721 \\times \\frac{\\dot{Q}_c^{2/3}}{(H-z_0)^{5/3}} \\times \\left(\\frac{r}{H-z_0}\\right)^{-0.6545}')}</div>
      <p><strong>Equation 4 — Ceiling jet velocity</strong> (axisymmetric):</p>
      <div style="${formulaBlockStyle}">${renderMath('u = 0.2526 \\times \\frac{\\dot{Q}_c^{1/3}}{(H-z_0)^{1/3}} \\times \\left(\\frac{r}{H-z_0}\\right)^{-1.0739}')}</div>
      <p><strong>Step 5: Detector Temperature (Eq 5)</strong></p>
      <div style="${formulaBlockStyle}">${renderMath('\\frac{d\\Delta T_e}{dt} = \\frac{u^{1/2}}{\\text{RTI}} \\times \\left[\\Delta T_g - \\Delta T_e \\times \\left(1 + \\frac{C}{u^{1/2}}\\right)\\right]')}</div>
      <p><em>Time-stepped until detector temperature ≥ activation temperature.</em></p>`;

    const activationTime = getOutput(1);
    const regime = getOutput(2);
    let workedExample = '';

    const alpha = getVal(3);
    const H = getVal(4);
    const R = getVal(5);
    const hasKeyInputs = alpha != null && H != null && R != null;

    if (hasKeyInputs) {
      workedExample = `
        <p>Given: α = ${fmt(alpha)} kW/s², H = ${fmt(H)} m, R = ${fmt(R)} m</p>
        <p>At each time step: Q̇ = α × t²; D and z₀ are computed; r/(H−z₀) determines Plume vs Jet regime.</p>
        <p>Detector temperature is integrated until it reaches activation temperature.</p>
        <p><strong>Result:</strong> Activation Time = ${activationTime} s, Regime = ${regime}</p>`;
    } else {
      workedExample = '<p>Enter all required input values and run the calculation to see results.</p>';
    }

    const resultsTable = `
      <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Results Summary</h4>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Output</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
        <tr><td style="padding:6px; border:1px solid var(--window-border);">Activation Time</td><td style="padding:6px; border:1px solid var(--window-border);">${activationTime}</td><td style="padding:6px; border:1px solid var(--window-border);">s</td></tr>
        <tr style="background:var(--button-hover);"><td style="padding:6px; border:1px solid var(--window-border);"><strong>Regime</strong></td><td style="padding:6px; border:1px solid var(--window-border);"><strong>${regime}</strong></td><td style="padding:6px; border:1px solid var(--window-border);">-</td></tr>
      </table>`;

    return `
      <div class="form-calculator window-content-help" id="help-${windowId}" style="padding: 8px 12px; gap: 4px;">
        <div id="${reportId}" style="font-size: 12px; line-height: 1.4; color: var(--text-primary);">
          <h3 style="margin: 0 0 4px 0; font-size: 14px;">DETECTOR ACTIVATION CALCULATION REPORT</h3>
          <p style="margin: 0 0 12px 0; font-size: 11px; color: var(--text-secondary);">Reference: PD 7974-1:2019 - Heat detector activation (Clause 8.9)</p>
          <h4 style="color: var(--text-primary); margin: 12px 0 6px 0; font-size: 13px; font-weight: 600;">Input Parameters</h4>
          <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
            <tr style="background:var(--button-hover);"><th style="text-align:left; padding:6px; border:1px solid var(--window-border);">Parameter</th><th style="padding:6px; border:1px solid var(--window-border);">Value</th><th style="padding:6px; border:1px solid var(--window-border);">Unit</th></tr>
            ${inputTable}
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
    const input1El = document.getElementById(`input1-${windowId}`) || 3600;
    const input2El = document.getElementById(`input2-${windowId}`) || 1;
    const input3El = document.getElementById(`input3-${windowId}`) || 0.012;
    const input4El = document.getElementById(`input4-${windowId}`);
    const input5El = document.getElementById(`input5-${windowId}`);
    const input6El = document.getElementById(`input6-${windowId}`);
    const input7El = document.getElementById(`input7-${windowId}`);
    const input8El = document.getElementById(`input8-${windowId}`) || 68;
    const input9El = document.getElementById(`input9-${windowId}`) || 66.7;
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
