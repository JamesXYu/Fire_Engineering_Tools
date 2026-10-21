# FSE Tools Web

A web-based desktop application for fire safety engineering calculations. The app provides a multi-window workspace where users can open multiple calculators side-by-side, each in its own draggable, resizable window.

## Features

- **Multi-window workspace** — Open multiple calculators simultaneously and arrange them as needed
- **Dark/Light theme** — Toggle between themes
- **Export/Import** — Save and restore calculator inputs as JSON
- **Detail/Help** — Context-sensitive help for each calculator
- **Responsive layout** — Windows adapt to viewport size

## Getting Started

1. Open `FSE web/index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
2. Use the sidebar to browse calculators by category (B1, B3, B4, B5)
3. Click a calculator to open it in a new window
4. Enter inputs; results update automatically

## Calculators

###  Means of Escape

**Merging Flow (ADB)**  
Calculates effective stair width for evacuation design per Approved Document B. Inputs include number of people, stair width, and travel distance. Used for merging flow in escape route design.

**BS 9999 Merge Flow**  
BS 9999–based merge flow calculator with three methods: Upper Level, Basement Level, and Multi-Level. Computes minimum final exit width for different building configurations.

**Flame Height**  
Estimates flame height for various fire geometries (circular, line, rectangular) using dimensionless HRR correlations. Supports multiple fuel types (natural gas, wood cribs, gas/liquids/solids) for circular fires. Based on PD 7974 and McCaffrey/Heskestad-type correlations.

**Detector Activation**  
Predicts heat detector activation time using PD 7974-1:2019. Models t-squared fire growth, plume/ceiling jet regime selection, and detector ODE integration. Outputs activation time and flow regime (Plume or Jet).

**Fire Plume**  
Calculates fire plume centre-line temperature rise, region (flame/intermittent/plume), and visible plume diameter. Uses SFPE Handbook Chapter 51 correlations. Based on `fse_plume.py`.

### Internal Fire Spread

**Parametric Fire**  
Computes compartment gas temperature–time curves per BS EN 1991-1-2 Appendix A (Eurocode) and DIN EN 1991-1-2/NA Appendix AA (German Annex). Supports heat storage groups and ventilation-controlled fires.

**Steel Heat Transfer**  
Calculates steel member temperature rise for unprotected and protected members per BS EN 1993-1-2. Uses ISO 834 standard fire curve and lumped-mass heat balance.

**External Steel**  
Estimates external steel member temperature (column and beam) per BS EN 1993-1-2 Annex B. For steel exposed to flames and opening temperatures outside a compartment.

**Strength Reduction Factor**  
Computes k<sub>y,θ</sub> (reduction factor for yield strength at temperature θ<sub>a</sub>) per BS EN 1993-1-2:2005 Table 3.1 for carbon steel.

###  External Fire Spread

**External Fire Spread**  
Evaluates external fire spread between buildings or facades. Supports multiple calculation methods and configurations for assessing fire exposure across building separations.

###  Thermal Fundamentals

**Travelling Fire**  
Models a fire that spreads along a compartment. Two modes: **Temperature** (peak gas temperature at a beam location, Alpert correlations) and **Flux** (peak incident heat flux, EN 1991-1-2 Annex C). Based on `fse_travelling_fire.py` and `fse_travelling_fire_flux.py`.

**Stefan-Boltzmann Law**  
Radiative heat flux calculator: P = ε × σ × (T₁⁴ − T₂⁴). Two modes: Temperature → Heat flux, or Heat flux → Temperature. Uses the Stefan-Boltzmann constant for fire engineering applications.

**Fire Growth Rate**  
t-squared fire growth: Q = α × t<sup>n</sup>. Two modes: **Time → HRR** (time-series table and graph) or **HRR → Time** (time to reach a given heat release rate).


## How to Add Another Calculator

This project is built around a small, consistent plugin contract. Every calculator is a plain JavaScript object that implements the same interface, registers itself in a central registry, and is listed in the sidebar. Adding a new calculator is a **four-step** process — create the calculator file, wire it into the page, add it to the sidebar, and verify it works.

The scaffold for a new calculator ships with the repo at **`FSE web/calculators/TEMPLATE.js`**. Start by copying it, then follow the steps below.

> **TL;DR**
> 1. Copy `calculators/TEMPLATE.js` → `calculators/MyCalculator.js` and edit it.
> 2. Add `<script src="calculators/MyCalculator.js"></script>` to `index.html` (in the *Calculators* block).
> 3. Register it in `index.html` with `CalculatorRegistry.register(MyCalculator);`.
> 4. Add an entry to the `categories` array in `script.js` so it appears in the sidebar.

---

### Step 0 — Understand the calculator contract

Every calculator object exposes methods that `script.js` calls automatically. The ones marked **required** must exist; the rest are optional enhancements.

| Member | Required | Called by | Purpose |
|--------|:--------:|-----------|---------|
| `type` (property) | Yes | Registry, sidebar, `getMinimumSize` | **Unique** string ID. Must match the `type` used in `script.js`'s `categories`. Convention: PascalCase, e.g. `StefanBoltzmann`. |
| `name` (property) | Yes | Export/help titles | Human-readable display name. |
| `icon` (property) | Yes | (informational) | Emoji or short text shown in the sidebar. |
| `getInputCount()` | Yes | `getMinimumSize` | Number of input fields (used to auto-size the window). |
| `getOutputCount()` | Yes | `getMinimumSize` | Number of output fields. |
| `getMinimumSize()` | Yes | Window manager | Returns `{ width, height }` in px. Copy the version in `TEMPLATE.js` — it computes height automatically from input/output counts. |
| `getHTML(windowId)` | Yes | `openWindow` → render | Returns the calculator's HTML as a template string. **Must** embed `windowId` in every element `id`/`data-window-id`. |
| `getHelpHTML(windowId, sourceWindowId)` | Yes | "Detail" / Help button | Returns the help/justification window HTML. `sourceWindowId` is provided so multi-method calculators can render method-specific help. |
| `calculate(windowId)` | Yes | Input `input`/`change` events | Reads the DOM inputs and writes results into the output field(s). Runs on every keystroke. |
| `clear(windowId)` | Yes | "Clear" button | Resets inputs to defaults, then calls `calculate`. |
| `saveInputValues(windowId)` | Yes | Before every re-render; Export | Returns a plain object of current input values (plus `method` if applicable). |
| `restoreInputValues(windowId, savedValues)` | Yes | After every re-render; Import | Re-populates inputs from `savedValues`, then recalculates. |
| `restoreStateBeforeRender(windowId, savedValues)` | optional | Before `getHTML` | For **multi-mode** calculators: restore the active method *before* HTML is generated so the correct fields render. |
| `attachEvents(windowId)` | optional | After render | Wire up calculator-specific buttons (mode toggles, etc.). |
| `getActiveMethod` / `setActiveMethod` | optional | Export/Import, figures | Persist a selected "method"/mode across re-renders. |

**Key rule: everything is scoped by `windowId`.** The same calculator can be open many times at once, so never use global element IDs. Always suffix IDs and read/write via `document.getElementById('input1-' + windowId)`.

---

### Step 1 — Create the calculator file

1. Copy the template:
   ```
   cp "FSE web/calculators/TEMPLATE.js" "FSE web/calculators/MyCalculator.js"
   ```
2. Rename the top-level object constant from `YourCalculatorName` to a unique name (e.g. `MyCalculator`). This is the identifier you register in Step 2.
3. Set the identity properties:
   ```javascript
   const MyCalculator = {
     type: 'MyCalculator',   // unique, must match script.js categories
     name: 'My Calculator',  // display name
     icon: '🔧',
     // ...
   };
   ```
4. Update the **inputs** in `getHTML()` — copy the `.calc-section` blocks and give each a unique numeric suffix (`input1-${windowId}`, `input2-${windowId}`, …). A standard body looks like:
   ```html
   <div class="form-calculator" id="calc-${windowId}">
     <div class="calc-input-section">
       <div class="calc-section">
         <label class="calc-label">Length L (m)</label>
         <input type="number" class="calc-input" id="input1-${windowId}"
                placeholder="0" min="0" data-window-id="${windowId}">
       </div>
       <!-- ... more .calc-section inputs ... -->
     </div>

     <div class="calc-divider">
       <div class="divider-line"></div>
       <div class="divider-label">Results</div>
       <div class="divider-line"></div>
     </div>

     <div class="calc-output-section">
       <div class="calc-section">
         <label class="calc-label">Result</label>
         <div class="calc-output-wrapper">
           <input type="text" class="calc-output" id="result-${windowId}" placeholder="—" readonly>
           <span class="calc-output-unit">m²</span>
         </div>
       </div>
     </div>

     <div class="calc-actions">
       <button class="action-btn clear-btn"  data-window-id="${windowId}">Clear</button>
       <button class="action-btn export-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Export</button>
       <button class="action-btn import-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Import</button>
       <button class="action-btn help-btn"   data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Detail</button>
     </div>
   </div>
   ```
   > The action buttons (`clear-btn`, `export-btn`, `import-btn`, `help-btn`) are wired up **automatically** by `script.js` — do not add your own listeners for them. Just include them with the correct classes and `data-window-id`.

5. Implement **`calculate()`**. Read each input defensively, guard against empty/NaN values (leave the output blank), then write a formatted result:
   ```javascript
   calculate(windowId) {
     const el = (id) => document.getElementById(`${id}-${windowId}`);
     const resultEl = el('result');
     if (!resultEl) return;

     const a = parseFloat(el('input1').value);
     const b = parseFloat(el('input2').value);

     if (isNaN(a) || isNaN(b)) {        // incomplete input
       resultEl.value = '';
       resultEl.placeholder = '—';
       return;
     }

     const result = a * b;              // <-- your engineering formula here

     resultEl.value = result.toLocaleString('en-US', { maximumFractionDigits: 2 });
     resultEl.placeholder = '';
   }
   ```
   > Isolate the pure math in a small helper above the object (e.g. `function runMyCalc(inputs) { ... }`). This keeps `calculate()` focused on reading/writing the DOM and makes the formula easy to test — the pattern used by `StefanBoltzmann.js` and the other calculators.

6. Implement **`saveInputValues` / `restoreInputValues`** for every input you added, keyed by field name:
   ```javascript
   saveInputValues(windowId) {
     const out = {};
     for (let i = 1; i <= 2; i++) {           // match your input count
       const el = document.getElementById(`input${i}-${windowId}`);
       if (el) out[`input${i}`] = el.value;
     }
     return out;
   },
   restoreInputValues(windowId, savedValues) {
     if (!savedValues) return;
     for (let i = 1; i <= 2; i++) {
       const el = document.getElementById(`input${i}-${windowId}`);
       if (el && savedValues[`input${i}`] !== undefined) el.value = savedValues[`input${i}`];
     }
     this.calculate(windowId);
   },
   ```
   > This is what makes **Export/Import** and **surviving a re-render** (dragging, theme toggle, resizing) work. If you skip it, inputs get wiped whenever the workspace re-renders.

7. Write **`getHelpHTML()`** — explain the method, show the formula (KaTeX auto-renders `$$...$$` / `\(...\)`), and add a worked example. See `StefanBoltzmann.js` for a rich version that builds a full calculation report.

---

### Step 2 — Wire the file into the page

Open **`FSE web/index.html`** and make two edits inside `<body>`:

**(a)** Add a `<script>` tag in the *Calculators* block (after `registry.js`, before `script.js`):
```html
  <!-- Calculator Registry -->
  <script src="calculators/registry.js"></script>
  <!-- Calculators -->
  <script src="calculators/mergeflow.js"></script>
  <!-- ... existing calculators ... -->
  <script src="calculators/MyCalculator.js"></script>   <!-- NEW -->
  <!-- Main Application -->
  <script src="script.js"></script>
```
> Order matters: the calculator file must load **after** `registry.js` and **before** `script.js`.

**(b)** Register it in the initialization `<script>` block at the bottom, alongside the existing registrations:
```html
  <script>
    // Register all calculators
    // ... existing registrations ...
    CalculatorRegistry.register(MyCalculator);   // NEW
  </script>
```
> `CalculatorRegistry.register` keys off the object's `type`, so the argument here is just the variable name — it must already be defined by the script you added in (a).

---

### Step 3 — Add it to the sidebar

Open **`FSE web/script.js`** and add an entry to the `categories` array near the top of the file. Choose the relevant category (`b1` Means of Escape, `b3` Internal Fire Spread, `b4` External Fire Spread, `b5` Thermal Fundamentals):

```javascript
const categories = [
  {
    id: 'b5',
    label: 'Thermal Fundamentals',
    expanded: false,
    calculators: [
      { id: 'travelling-fire', label: 'Travelling Fire', type: 'TravellingFire', icon: '🚂' },
      { id: 'stefan-boltzmann', label: 'Stefan-Boltzmann Law', type: 'StefanBoltzmann', icon: '🌡️' },
      { id: 'fire-growth-rate', label: 'Fire Growth Rate', type: 'FireGrowthRate', icon: '📈' },
      { id: 'my-calculator', label: 'My Calculator', type: 'MyCalculator', icon: '🔧' }, // NEW
    ]
  },
];
```

The `type` here **must exactly match** the `type` property in your calculator object — that is the key the sidebar uses to look the calculator up in the registry when the user clicks it.

---

### Step 4 — Test

1. Open `FSE web/index.html` in a browser and hard-refresh (Ctrl+F5) to clear cached JS.
2. Expand the category you added the calculator to and click it — a new window should open with your inputs.
3. Type into the inputs and confirm the **result updates live** (`calculate()` fires on `input`).
4. Click **Clear** — inputs reset and results clear.
5. Click **Detail** — the help window opens via `getHelpHTML()`.
6. Click **Export**, then **Import** the same JSON — inputs and results should round-trip. If not, revisit `saveInputValues`/`restoreInputValues`.
7. Toggle the **theme** and **drag/resize** the window — input values should be preserved (this exercises save/restore on re-render).

---

### Optional: multi-method / multi-mode calculators

Some calculators (e.g. `StefanBoltzmann`, `BSmergeflow`, `TravellingFire`, `FireGrowthRate`) present two or more "modes" via buttons. To build one:

1. Add a mode-selector row of `<button class="method-btn" data-window-id="${windowId}" data-method="...">` at the top of `getHTML()`, styling the active button differently.
2. Store the active method in a per-window map **and** `localStorage` (see `StefanBoltzmannMethodStorage` in `StefanBoltzmann.js`):
   ```javascript
   const MyCalcMethodStorage = {};
   // in the object:
   getActiveMethod(windowId) { /* read storage, default to first mode */ },
   setActiveMethod(windowId, method) { /* write storage + localStorage */ },
   ```
3. Implement **`restoreStateBeforeRender(windowId, savedValues)`** to set the active method *before* `getHTML()` runs, so the correct fields render on re-render.
4. In `attachEvents(windowId)`, listen for `.method-btn` clicks → `setActiveMethod(...)` → `window.renderWindows()`.
5. Include `method` in `saveInputValues()` so Export/Import preserves the mode.

---

### Optional: adding a figure (diagram) window

If your calculator benefits from a schematic, the app can show a **pin 📍** button on the title bar that opens a companion figure window:

1. Drop image(s) in `FSE web/Figures/`. Use the naming convention `<Type>.png.png`, and optionally a dark-mode variant `<Type>.png-modified.png`.
2. Add your calculator's `type` to the `CALCULATORS_WITH_FIGURES` array at the top of `script.js`:
   ```javascript
   const CALCULATORS_WITH_FIGURES = ['mergeflow', 'BSmergeflow', /* ... , */ 'MyCalculator'];
   ```
3. For **method-specific** figures, implement `getActiveMethod()` and branch on it inside `openFigureWindow()` (see how `BSmergeflow` and `Flameheight` build `Figures/<type>-<method>.png.png` paths).

---

### Checklist

- [ ] `calculators/MyCalculator.js` created from `TEMPLATE.js`; object renamed and `type`/`name`/`icon` set.
- [ ] Every element `id` and `data-window-id` is suffixed with `${windowId}`.
- [ ] `calculate()`, `clear()`, `saveInputValues()`, `restoreInputValues()` all implemented for every input.
- [ ] Standard action buttons (`clear/export/import/help`) present with correct classes (auto-wired).
- [ ] `<script>` tag added to `index.html` (after `registry.js`, before `script.js`).
- [ ] `CalculatorRegistry.register(MyCalculator);` added in `index.html`.
- [ ] Sidebar entry added to `categories` in `script.js` with a matching `type`.
- [ ] Tested: live results, clear, detail, export→import, theme toggle & drag.


## References

- PD 7974-1:2019 — Application of fire safety engineering principles
- BS 9999 — Fire safety in the design, management and use of buildings
- Approved Document B — Fire safety (England & Wales)
- SFPE Handbook of Fire Protection Engineering
- EN 1991-1-2 — Eurocode 1: Actions on structures (fire)
- BS EN 1993-1-2 — Eurocode 3: Design of steel structures (fire)
