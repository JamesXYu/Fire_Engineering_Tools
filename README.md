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


## References

- PD 7974-1:2019 — Application of fire safety engineering principles
- BS 9999 — Fire safety in the design, management and use of buildings
- Approved Document B — Fire safety (England & Wales)
- SFPE Handbook of Fire Protection Engineering
- EN 1991-1-2 — Eurocode 1: Actions on structures (fire)
- BS EN 1993-1-2 — Eurocode 3: Design of steel structures (fire)
