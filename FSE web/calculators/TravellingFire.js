// Travelling Fire Calculator
// Based on external lib/fse_travelling_fire.py and fse_travelling_fire_flux.py
// Same principle: travelling fire dynamics. Two output modes: Temperature (°C) or Heat Flux (kW/m²)

const TravellingFireMethodStorage = {};

// Flux helper functions (EN 1991-1-2 Annex C)
function Q_star_H(HRR, height) {
  return HRR / (1.11e6 * Math.pow(height, 5 / 2));
}
function Q_star_D(HRR, diameter) {
  return HRR / (1.11e6 * Math.pow(diameter, 5 / 2));
}
function flame_ext_length(q_star, height) {
  return Math.max(0, (2.9 * height * Math.pow(q_star, 0.33)) - height);
}
function y_param(q_star_D, diameter, lh, radial_dist, height) {
  let z;
  if (q_star_D < 1) {
    z = 2.4 * diameter * (Math.pow(q_star_D, 2 / 5) - Math.pow(q_star_D, 2 / 3));
  } else {
    z = 2.4 * diameter * (1 - Math.pow(q_star_D, 2 / 5));
  }
  return (radial_dist + height + z) / (lh + height + z);
}

// Calculate travelling fire gas temperature (fse_travelling_fire.py)
function runTravellingFireTemperature(inputs) {
  const {
    t_end = 3600, dt = 1,
    fire_load_density_MJm2, fire_hrr_density_MWm2, room_length_m, room_width_m,
    fire_spread_rate_ms, beam_location_height_m, beam_location_length_m,
    fire_nft_limit_c = 1200
  } = inputs;

  let l = room_length_m, w = room_width_m;
  if (l < w) { const t = l; l = w; w = t; }

  const q_fd = fire_load_density_MJm2, HRRPUA = fire_hrr_density_MWm2;
  const s = fire_spread_rate_ms, h_s = beam_location_height_m, l_s = beam_location_length_m;

  const t_burn = Math.max(q_fd / HRRPUA, 900.0);
  const t_decay = Math.max(t_burn, l / s);
  const t_lim = Math.min(t_burn, l / s);
  let t_lim_ = Math.round(t_lim / dt) * dt;
  const t_decay_ = Math.round(t_decay / dt) * dt;
  if (t_decay_ === t_lim_) t_lim_ -= dt;

  let peakTemperature = 20;
  for (let t = 0; t <= t_end; t += dt) {
    let Q_growth = 0, Q_peak = 0, Q_decay = 0;
    if (t < t_lim_) Q_growth = HRRPUA * w * s * t;
    else if (t >= t_lim_ && t <= t_decay_) Q_peak = Math.min(HRRPUA * w * s * t_burn, HRRPUA * w * l);
    else Q_decay = Math.max(0, Math.min(HRRPUA * w * s * t_burn, HRRPUA * w * l) - (t - t_decay_) * w * s * HRRPUA);

    const Q = (Q_growth + Q_peak + Q_decay) * 1000.0;
    let l_fire_front = Math.max(0, Math.min(s * t, l));
    let l_fire_end = Math.max(0, Math.min(s * (t - t_lim), l));
    const l_fire_median = (l_fire_front + l_fire_end) / 2.0;
    let r = Math.max(0.001, Math.abs(l_s - l_fire_median));

    let T_g = (r / h_s > 0.18)
      ? (5.38 * Math.pow(Q / r, 2 / 3) / h_s) + 20.0
      : (16.9 * Math.pow(Q, 2 / 3) / Math.pow(h_s, 5 / 3)) + 20.0;
    T_g = Math.min(T_g, fire_nft_limit_c);
    if (T_g > peakTemperature) peakTemperature = T_g;
  }
  return { peakTemperature };
}

// Calculate travelling fire incident heat flux (fse_travelling_fire_flux.py)
function runTravellingFireFlux(inputs) {
  const {
    t_end = 3600, dt = 1,
    fire_load_density_MJm2, fire_hrr_density_MWm2, room_length_m, room_width_m,
    fire_spread_rate_ms, beam_location_height_m, beam_location_length_m,
    fire_nff_limit_kW = 300
  } = inputs;

  let l = room_length_m, w = room_width_m;
  if (l < w) { const t = l; l = w; w = t; }

  const q_fd = fire_load_density_MJm2, HRRPUA = fire_hrr_density_MWm2;
  const s = fire_spread_rate_ms, h_s = beam_location_height_m, l_s = beam_location_length_m;

  const t_burn = Math.max(q_fd / HRRPUA, 900.0);
  const t_decay = Math.max(t_burn, l / s);
  const t_lim = Math.min(t_burn, l / s);
  let t_lim_ = Math.round(t_lim / dt) * dt;
  const t_decay_ = Math.round(t_decay / dt) * dt;
  if (t_decay_ === t_lim_) t_lim_ -= dt;

  let peakFlux = 0;
  for (let t = 0; t <= t_end; t += dt) {
    let Q_growth = 0, Q_peak = 0, Q_decay = 0;
    if (t < t_lim_) Q_growth = HRRPUA * w * s * t;
    else if (t >= t_lim_ && t <= t_decay_) Q_peak = Math.min(HRRPUA * w * s * t_burn, HRRPUA * w * l);
    else Q_decay = Math.max(0, Math.min(HRRPUA * w * s * t_burn, HRRPUA * w * l) - (t - t_decay_) * w * s * HRRPUA);

    let Q = (Q_growth + Q_peak + Q_decay) * 1000.0;
    if (Q < 0.001) Q = 0.001;

    let l_fire_front = Math.max(0, Math.min(s * t, l));
    let l_fire_end = Math.max(0, Math.min(s * (t - t_lim), l));
    const l_fire_median = (l_fire_front + l_fire_end) / 2.0;
    const r = Math.abs(l_s - l_fire_median);

    const fire_area = Q / (HRRPUA * 1000);
    const fire_dia = Math.sqrt(fire_area / Math.PI) * 2;
    const q_star_H = Q_star_H(Q * 1000, h_s);
    const q_star_D = Q_star_D(Q * 1000, fire_dia);
    const lh = flame_ext_length(q_star_H, h_s);
    const y = y_param(q_star_D, fire_dia, lh, r, h_s);

    let q_inc;
    if (Q <= 0) q_inc = 0;
    else if (y <= 0.5) q_inc = fire_nff_limit_kW;
    else if (y > 1) q_inc = 682 * Math.exp(-3.4 * 1) * Math.pow(y, -3.7);
    else q_inc = 682 * Math.exp(-3.4 * y);
    q_inc = Math.min(q_inc, fire_nff_limit_kW);

    if (q_inc > peakFlux) peakFlux = q_inc;
  }
  return { peakFlux };
}

const TravellingFireCalculator = {
  type: 'TravellingFire',
  name: 'Travelling Fire',
  icon: '🔥',
  windowMethods: TravellingFireMethodStorage,

  getActiveMethod(windowId) {
    if (TravellingFireMethodStorage[windowId]) return TravellingFireMethodStorage[windowId];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem(`travellingfire_method_${windowId}`);
        if (saved && (saved === 'temperature' || saved === 'flux')) {
          TravellingFireMethodStorage[windowId] = saved;
          return saved;
        }
      } catch (e) {}
    }
    return 'temperature';
  },

  setActiveMethod(windowId, method) {
    TravellingFireMethodStorage[windowId] = method;
    this.windowMethods[windowId] = method;
    if (typeof window !== 'undefined' && window.localStorage) {
      try { localStorage.setItem(`travellingfire_method_${windowId}`, method); } catch (e) {}
    }
  },

  getInputCount() { return 10; },
  getOutputCount() { return 1; },

  getMinimumSize() {
    const titleBarHeight = 40, windowContentPadding = 32, formGap = 15;
    const inputSectionHeight = 44, outputSectionHeight = 44, dividerHeight = 7, actionsHeight = 64;
    const methodButtonGroupHeight = 50;
    const inputCount = 10, outputCount = 1, totalFieldCount = inputCount + outputCount;
    const minHeight = titleBarHeight + windowContentPadding + methodButtonGroupHeight +
      inputCount * inputSectionHeight + outputCount * outputSectionHeight +
      (totalFieldCount + 1) * formGap + dividerHeight + actionsHeight + 75;
    return { width: 400, height: minHeight};
  },

  getHTML(windowId) {
    const activeMethod = TravellingFireMethodStorage[windowId] || this.getActiveMethod(windowId);
    const input10Label = activeMethod === 'temperature' ? 'Max Near Field T (°C)' : 'Max Near Field Flux (kW/m²)';
    const input10Placeholder = activeMethod === 'temperature' ? '1200' : '300';
    const outputLabel = activeMethod === 'temperature' ? 'Peak Gas Temperature' : 'Peak Incident Heat Flux';
    const outputUnit = activeMethod === 'temperature' ? '°C' : 'kW/m²';

    return `
      <div class="form-calculator" id="calc-${windowId}">
        <div class="method-selector" style="display: flex; gap: 8px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--window-border);">
          <button class="method-btn ${activeMethod === 'temperature' ? 'active' : ''}" data-window-id="${windowId}" data-method="temperature"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${activeMethod === 'temperature' ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${activeMethod === 'temperature' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
            Temperature
          </button>
          <button class="method-btn ${activeMethod === 'flux' ? 'active' : ''}" data-window-id="${windowId}" data-method="flux"
            style="flex: 1; padding: 10px; border: 1px solid var(--window-border); border-radius: 4px; background: ${activeMethod === 'flux' ? 'var(--primary-color)' : 'var(--window-bg)'}; color: ${activeMethod === 'flux' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
            Flux
          </button>
        </div>
        <div class="calc-input-section">
          <div class="calc-section">
            <label class="calc-label">Duration (s)</label>
            <input type="number" class="calc-input" id="input1-${windowId}" placeholder="3600" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Time Step (s)</label>
            <input type="number" class="calc-input" id="input2-${windowId}" placeholder="1" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Fire Load Density (MJ/m²)</label>
            <input type="number" class="calc-input" id="input3-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Fire HRR Density (MW/m²)</label>
            <input type="number" class="calc-input" id="input4-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Room Length (m)</label>
            <input type="number" class="calc-input" id="input5-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Room Width (m)</label>
            <input type="number" class="calc-input" id="input6-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Fire Spread Rate (m/s)</label>
            <input type="number" class="calc-input" id="input7-${windowId}" placeholder="-" min="0" step="0.001" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Beam Height (m)</label>
            <input type="number" class="calc-input" id="input8-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">Beam Position (m)</label>
            <input type="number" class="calc-input" id="input9-${windowId}" placeholder="-" min="0" data-window-id="${windowId}">
          </div>
          <div class="calc-section">
            <label class="calc-label">${input10Label}</label>
            <input type="number" class="calc-input" id="input10-${windowId}" placeholder="${input10Placeholder}" min="0" data-window-id="${windowId}">
          </div>
        </div>
        <div class="calc-divider">
          <div class="divider-line"></div>
          <div class="divider-label">Results</div>
          <div class="divider-line"></div>
        </div>
        <div class="calc-output-section">
          <div class="calc-section">
            <label class="calc-label">${outputLabel}</label>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div class="calc-output-wrapper">
                <input type="text" class="calc-output" id="result-${windowId}" placeholder="—" readonly>
                <span class="calc-output-unit">${outputUnit}</span>
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

  getHelpHTML(windowId, sourceWindowId) {
    const activeMethod = sourceWindowId ? this.getActiveMethod(sourceWindowId) : 'temperature';
    const isTemperature = activeMethod === 'temperature';
    return `
      <div class="form-calculator" id="help-${windowId}" style="padding: 20px;">
        <h3 style="margin-bottom: 20px; color: var(--text-primary);">Travelling Fire - ${isTemperature ? 'Temperature' : 'Flux'} Help</h3>
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Description</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            ${isTemperature
              ? 'Calculates peak gas temperature at a structural element during a travelling fire. Based on fse_travelling_fire.py (Alpert correlations).'
              : 'Calculates peak incident heat flux at a structural element during a travelling fire. Based on fse_travelling_fire_flux.py (EN 1991-1-2 Annex C).'}
          </p>
        </div>
        <div style="margin-bottom: 20px;">
          <h4 style="color: var(--text-primary); margin-bottom: 10px;">Input 10</h4>
          <p style="color: var(--text-secondary); line-height: 1.6;">
            ${isTemperature ? 'Max Near Field T (°C): Cap on near-field gas temperature.' : 'Max Near Field Flux (kW/m²): Cap on near-field incident heat flux.'}
          </p>
        </div>
      </div>
    `;
  },

  calculate(windowId) {
    const resultEl = document.getElementById(`result-${windowId}`);
    if (!resultEl) return;

    const activeMethod = this.getActiveMethod(windowId);
    const t_end = document.getElementById(`input1-${windowId}`).value.trim() === '' ? 3600 : parseFloat(document.getElementById(`input1-${windowId}`).value) || 3600;
    const dt = document.getElementById(`input2-${windowId}`).value.trim() === '' ? 1 : parseFloat(document.getElementById(`input2-${windowId}`).value) || 1;
    const fire_load_density_MJm2 = parseFloat(document.getElementById(`input3-${windowId}`).value);
    const fire_hrr_density_MWm2 = parseFloat(document.getElementById(`input4-${windowId}`).value);
    const room_length_m = parseFloat(document.getElementById(`input5-${windowId}`).value);
    const room_width_m = parseFloat(document.getElementById(`input6-${windowId}`).value);
    const fire_spread_rate_ms = parseFloat(document.getElementById(`input7-${windowId}`).value);
    const beam_location_height_m = parseFloat(document.getElementById(`input8-${windowId}`).value);
    const beam_location_length_m = parseFloat(document.getElementById(`input9-${windowId}`).value);
    const input10Val = document.getElementById(`input10-${windowId}`).value.trim();

    const required = [fire_load_density_MJm2, fire_hrr_density_MWm2, room_length_m, room_width_m, fire_spread_rate_ms, beam_location_height_m, beam_location_length_m];
    if (required.some(v => isNaN(v) || v <= 0) || dt <= 0 || t_end <= 0) {
      resultEl.value = '';
      resultEl.placeholder = '—';
      return;
    }

    if (activeMethod === 'temperature') {
      const fire_nft_limit_c = input10Val === '' ? 1200 : parseFloat(input10Val) || 1200;
      const result = runTravellingFireTemperature({
        t_end, dt, fire_load_density_MJm2, fire_hrr_density_MWm2, room_length_m, room_width_m,
        fire_spread_rate_ms, beam_location_height_m, beam_location_length_m, fire_nft_limit_c
      });
      resultEl.value = result.peakTemperature.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      const fire_nff_limit_kW = input10Val === '' ? 300 : parseFloat(input10Val) || 300;
      const result = runTravellingFireFlux({
        t_end, dt, fire_load_density_MJm2, fire_hrr_density_MWm2, room_length_m, room_width_m,
        fire_spread_rate_ms, beam_location_height_m, beam_location_length_m, fire_nff_limit_kW
      });
      resultEl.value = result.peakFlux.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    resultEl.placeholder = '';
  },

  clear(windowId) {
    for (let i = 1; i <= 10; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) el.value = '';
    }
    this.calculate(windowId);
  },

  saveInputValues(windowId) {
    const saved = { method: this.getActiveMethod(windowId) };
    for (let i = 1; i <= 10; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el) saved[`input${i}`] = el.value;
    }
    return saved;
  },

  restoreStateBeforeRender(windowId, savedValues) {
    if (savedValues && savedValues.method) {
      TravellingFireMethodStorage[windowId] = savedValues.method;
    }
  },

  restoreInputValues(windowId, savedValues) {
    if (!savedValues) return;
    if (savedValues.method) this.setActiveMethod(windowId, savedValues.method);
    for (let i = 1; i <= 10; i++) {
      const el = document.getElementById(`input${i}-${windowId}`);
      if (el && savedValues[`input${i}`] !== undefined) el.value = savedValues[`input${i}`];
    }
    this.calculate(windowId);
  },

  attachEvents(windowId) {
    document.querySelectorAll(`.method-btn[data-window-id="${windowId}"]`).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const method = btn.getAttribute('data-method');
        const savedValues = this.saveInputValues(windowId);
        this.setActiveMethod(windowId, method);
        if (typeof window.renderWindows === 'function') {
          window.renderWindows();
          setTimeout(() => this.restoreInputValues(windowId, savedValues), 50);
        }
      });
    });
  }
};
