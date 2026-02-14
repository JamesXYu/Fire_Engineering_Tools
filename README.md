# FSE Tools Web

A web-based desktop application for fire safety engineering calculations. The app provides a multi-window workspace where users can open multiple calculators side-by-side, each in its own draggable, resizable window.

## Features

- **Multi-window workspace** — Open multiple calculators simultaneously and arrange them as needed
- **Dark/Light theme** — Toggle between themes
- **Export/Import** — Save and restore calculator inputs as JSON
- **Detail/Help** — Context-sensitive help for each calculator
- **Responsive layout** — Windows adapt to viewport size

## Getting Started

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
2. Use the sidebar to browse calculators by category (B1, B2, B3, B4, B5)
3. Click a calculator to open it in a new window
4. Enter inputs; results update automatically

## Calculators

### ADB Merging Flow
Calculates effective stair width for evacuation design per Approved Document B. Inputs include number of people, stair width, and travel distance. Used for merging flow in escape route design.

### BS 9999 Merge Flow
BS 9999–based merge flow calculator with three methods: Upper Level, Basement Level, and Multi-Level. Computes minimum final exit width for different building configurations.

### Flame Height
Estimates flame height for various fire geometries (circular, line, rectangular) using dimensionless HRR correlations. Supports multiple fuel types (natural gas, wood cribs, gas/liquids/solids) for circular fires. Based on PD 7974 and McCaffrey/Heskestad-type correlations.

### Detector Activation
Predicts heat detector activation time using PD 7974-1:2019. Models t-squared fire growth, plume/ceiling jet regime selection, and detector ODE integration. Outputs activation time and flow regime (Plume or Jet).

### Travelling Fire
Models a fire that spreads along a compartment. Two modes: **Temperature** (peak gas temperature at a beam location, Alpert correlations) and **Flux** (peak incident heat flux, EN 1991-1-2 Annex C). Based on `fse_travelling_fire.py` and `fse_travelling_fire_flux.py`.

### Fire Plume
Calculates fire plume centre-line temperature rise, region (flame/intermittent/plume), and visible plume diameter. Uses SFPE Handbook Chapter 51 correlations. Based on `fse_plume.py`.

### External Fire Spread
Evaluates external fire spread between buildings or facades. Supports multiple calculation methods and configurations for assessing fire exposure across building separations.

## Adding a New Calculator

1. Copy `calculators/TEMPLATE.js` and implement the required methods
2. Add a `<script>` tag in `index.html`
3. Register with `CalculatorRegistry.register(YourCalculator)`
4. Add an entry to the `categories` array in `script.js`

## References

- PD 7974-1:2019 — Application of fire safety engineering principles
- BS 9999 — Fire safety in the design, management and use of buildings
- Approved Document B — Fire safety (England & Wales)
- SFPE Handbook of Fire Protection Engineering
- EN 1991-1-2 — Eurocode 1: Actions on structures (fire)
