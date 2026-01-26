# Calculator Structure

This directory contains all calculator implementations. Each calculator is a self-contained module that can be easily added or removed.

## File Structure

```
calculators/
├── registry.js          # Calculator registry system
├── mergeflow.js         # Merge Flow calculator (example)
├── TEMPLATE.js          # Template for creating new calculators
└── README.md           # This file
```

## How to Add a New Calculator

1. **Copy the template:**
   ```bash
   cp calculators/TEMPLATE.js calculators/your-calculator.js
   ```

2. **Modify the calculator object:**
   - Change `type` to a unique identifier (e.g., 'flow-rate')
   - Update `name` and `icon`
   - Implement all required methods (see below)

3. **Add the calculator to HTML:**
   In `calculator-desktop.html`, add:
   ```html
   <script src="calculators/your-calculator.js"></script>
   ```

4. **Register the calculator:**
   In `calculator-desktop.html`, add:
   ```javascript
   CalculatorRegistry.register(YourCalculatorName);
   ```

5. **Add to sidebar categories:**
   In `script.js`, update the `categories` array to include your calculator:
   ```javascript
   calculators: [
     { id: 'your-calc', label: 'Your Calculator', type: 'your-calculator-type', icon: '🔢' }
   ]
   ```

## Required Calculator Methods

Each calculator must implement these methods:

### `getInputCount()`
Returns the number of input fields (for minimum window size calculation).

### `getOutputCount()`
Returns the number of output fields (for minimum window size calculation).

### `getMinimumSize()`
Returns an object with `width` and `height` for the minimum window size.

### `getHTML(windowId)`
Returns the HTML string for the calculator interface. Use the provided `windowId` to create unique element IDs.

**Important:** The HTML should include Import/Export buttons in the `calc-actions` div:
```html
<div class="calc-actions" style="position: relative; display: flex; justify-content: space-between; gap: 8px;">
  <button class="action-btn clear-btn" data-window-id="${windowId}">Clear</button>
  <button class="action-btn export-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Export</button>
  <button class="action-btn import-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">Import</button>
  <button class="action-btn help-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">ℹ️ Show detail</button>
</div>
```

### `getHelpHTML(windowId)`
Returns the HTML string for the help window. Can optionally accept `sourceWindowId` as second parameter for method-specific help (see BSmergeflow.js example).

### `calculate(windowId)`
Performs the calculation and updates output fields. Called automatically when inputs change.

### `clear(windowId)`
Clears all input fields and resets outputs.

### `saveInputValues(windowId)`
Saves current input values before window re-rendering. Returns an object with saved values. This is used for both window re-rendering and data export.

### `restoreInputValues(windowId, savedValues)`
Restores input values after window re-rendering or data import.

## Optional Methods

### `restoreStateBeforeRender(windowId, savedValues)`
**Important for calculators with multiple modes/methods:** This method is called before `getHTML()` to restore calculator state (like method selection). If your calculator has state that needs to be preserved across re-renders, implement this method. See `BSmergeflow.js` for an example with method switching.

### `attachEvents(windowId)`
Attach any calculator-specific event handlers here. For example, method button clicks for calculators with multiple calculation methods.

## Calculator Properties

- `type` (required): Unique identifier (e.g., 'mergeflow')
- `name` (required): Display name (e.g., 'Merging Flow')
- `icon` (required): Icon emoji or text (e.g., '🔄')

## Example

See `mergeflow.js` for a complete working example.

## Features

### Import/Export Functionality
- **Export**: Saves all input values to a JSON file
- **Import**: Loads input values from a JSON file automatically
- JSON files include calculator type, name, method (if applicable), and all input values
- Files are validated to ensure they match the calculator type before importing

### Multiple Methods (Optional)
For calculators with multiple calculation methods (like BSmergeflow):
- Use method selector buttons at the top of the calculator
- Implement `getActiveMethod(windowId)` and `setActiveMethod(windowId, method)`
- Store method state in module-level variables for persistence
- Implement `restoreStateBeforeRender()` to preserve method selection
- Help windows can show method-specific content

### Help Windows
- Automatically positioned next to the calculator window
- Cannot be dragged independently (attached to source window)
- Title can be customized (e.g., "Justification" for mergeflow)
- Can show method-specific content for multi-method calculators

## Notes

- All element IDs should use the `windowId` parameter to ensure uniqueness
- Input fields should have `data-window-id="${windowId}"` attribute
- Use the existing CSS classes for consistent styling
- Help windows are automatically created with type `${calculatorType}-help`
- Input and output fields are 150px wide and right-aligned by default
- Minimized windows are automatically arranged in a grid to prevent overlap

