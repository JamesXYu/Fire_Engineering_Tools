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

### `getHelpHTML(windowId)`
Returns the HTML string for the help window.

### `calculate(windowId)`
Performs the calculation and updates output fields. Called automatically when inputs change.

### `clear(windowId)`
Clears all input fields and resets outputs.

### `saveInputValues(windowId)`
Saves current input values before window re-rendering. Returns an object with saved values.

### `restoreInputValues(windowId, savedValues)`
Restores input values after window re-rendering.

## Optional Methods

### `attachEvents(windowId)`
Attach any calculator-specific event handlers here.

## Calculator Properties

- `type` (required): Unique identifier (e.g., 'mergeflow')
- `name` (required): Display name (e.g., 'Merging Flow')
- `icon` (required): Icon emoji or text (e.g., '🔄')

## Example

See `mergeflow.js` for a complete working example.

## Notes

- All element IDs should use the `windowId` parameter to ensure uniqueness
- Input fields should have `data-window-id="${windowId}"` attribute
- Use the existing CSS classes for consistent styling
- Help windows are automatically created with type `${calculatorType}-help`

