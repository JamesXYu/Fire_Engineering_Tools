// State Management
const state = {
  windows: [],
  nextZIndex: 1000,
  theme: 'dark',
  isDragging: false,
  isResizing: false,
  dragData: null
};

// Categories Data
const categories = [
  {
    id: 'b1',
    label: 'B1',
    expanded: true,
    calculators: [
      { id: 'merge-flow', label: 'Merging Flow', type: 'mergeflow', icon: '🔄' }
    ]
  },
  {
    id: 'b2',
    label: 'B2',
    expanded: false,
    calculators: []
  },
  {
    id: 'b3',
    label: 'B3',
    expanded: false,
    calculators: []
  },
  {
    id: 'b4',
    label: 'B4',
    expanded: false,
    calculators: []
  },
  {
    id: 'b5',
    label: 'B5',
    expanded: false,
    calculators: []
  },
];

// Load from localStorage (only theme, not windows - windows don't persist between sessions)
function loadFromStorage() {
  try {
    // Clear ALL old window data if it exists (cleanup)
    localStorage.removeItem('calculator-windows');
    
    // Also clear any calculator type state that might have window data
    ['mergeflow'].forEach(type => {
      const saved = localStorage.getItem(`calculator-${type}-state`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only keep position/size, remove any window data
          if (parsed.id || parsed.type || parsed.minimized !== undefined) {
            localStorage.setItem(`calculator-${type}-state`, JSON.stringify({
              x: parsed.x || 100,
              y: parsed.y || 100,
              width: parsed.width || 400,
              height: parsed.height || 500
            }));
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
    
    const saved = localStorage.getItem('calculator-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.theme = parsed.theme || 'dark';
    }
  } catch (e) {
    console.error('Failed to load from localStorage', e);
  }
}

// Save to localStorage (only theme, not windows)
function saveToStorage() {
  try {
    localStorage.setItem('calculator-settings', JSON.stringify({
      theme: state.theme
    }));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

// Initialize (don't restore windows, only theme)
// Clear any old window data from localStorage
try {
  localStorage.removeItem('calculator-windows');
} catch (e) {
  // Ignore
}

loadFromStorage();
updateTheme();

// Ensure windows array is empty on load
state.windows = [];

// Theme Management
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  updateTheme();
  saveToStorage();
}

function updateTheme() {
  const app = document.getElementById('app');
  app.className = `app theme-${state.theme}`;
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

// Get number of inputs for each calculator type
function getInputCount(windowType) {
  switch (windowType) {
    case 'mergeflow':
      return 2; // Number of People, Size of Stair
    case 'mergeflow-help':
      return 0; // Help window has no inputs
    default:
      return 0;
  }
}

// Get number of outputs for each calculator type
function getOutputCount(windowType) {
  switch (windowType) {
    case 'mergeflow':
      return 3; // Merging Flow Result, Effective Width, Flow Rate
    case 'mergeflow-help':
      return 0; // Help window has no outputs
    default:
      return 0;
  }
}

// Get minimum window size based on calculator type
function getMinimumSize(windowType) {
  // Base dimensions
  const titleBarHeight = 40;
  const windowContentPadding = 32; // 16px top + 16px bottom
  const formGap = 15; // Gap between form sections
  const inputSectionHeight = 44; // Height of input section (label + input on same line, ~44px for input height)
  const outputSectionHeight = 44; // Height of output section (label + input + detail text, ~44px input + ~20px detail)
  const dividerHeight = 7; // Divider height (3px margin top + 1px line + 3px margin bottom)
  const actionsHeight = 64; // Button height + gap
  
  // Calculate minimum width
  let minWidth = 400; // Base minimum width
  if (windowType === 'mergeflow-help') {
    minWidth = 500; // Help content needs more width
  }
  
  // Calculate minimum height dynamically based on number of inputs and outputs
  const inputCount = getInputCount(windowType);
  const outputCount = getOutputCount(windowType);
  const totalFieldCount = inputCount + outputCount;
  
  if (windowType === 'mergeflow-help') {
    // Help window has fixed minimum size
    return { width: minWidth, height: 600 };
  }
  
  if (totalFieldCount === 0) {
    return { width: minWidth, height: 200 };
  }
  
  // Calculate height: title bar + padding + (input sections + output sections + gaps) + divider + actions
  // Input sections are smaller, output sections include detail text
  const inputSectionsHeight = inputCount * inputSectionHeight;
  const outputSectionsHeight = outputCount * outputSectionHeight;
  const totalSectionsHeight = inputSectionsHeight + outputSectionsHeight;
  const gapsHeight = (totalFieldCount + 1) * formGap; // Gaps: before first, between sections, before actions
  const minHeight = titleBarHeight + windowContentPadding + totalSectionsHeight + gapsHeight + dividerHeight + actionsHeight + 5;
  
  return { width: minWidth, height: minHeight };
}

// Window Management
function openWindow(type, title) {
  const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const defaultSize = { width: 400, height: 500 };
  const minSizes = getMinimumSize(type);
  
  let x = 100 + state.windows.length * 30;
  let y = 100 + state.windows.length * 30;
  let width = defaultSize.width;
  let height = defaultSize.height;

  try {
    const saved = localStorage.getItem(`calculator-${type}-state`);
    if (saved) {
      const parsed = JSON.parse(saved);
      x = parsed.x || x;
      y = parsed.y || y;
      width = parsed.width || width;
      height = parsed.height || height;
    }
  } catch (e) {
    // Ignore
  }
  
  // Ensure window is at least minimum size
  width = Math.max(width, minSizes.width);
  height = Math.max(height, minSizes.height);

  const newWindow = {
    id,
    type,
    title,
    x,
    y,
    width,
    height,
    zIndex: state.nextZIndex++,
    minimized: false,
    maximized: false
  };

  state.windows.push(newWindow);
  renderWindows();
  // Don't save windows to storage, only positions/sizes
  return id;
}

function closeWindow(id) {
  const window = state.windows.find(w => w.id === id);
  if (window) {
    // If closing a source window, also close its attached help windows
    if (window.type === 'mergeflow') {
      const attachedHelpWindows = state.windows.filter(w => w.sourceWindowId === id && w.isAttached);
      attachedHelpWindows.forEach(helpWindow => {
        state.windows = state.windows.filter(w => w.id !== helpWindow.id);
      });
    }
    
    try {
      localStorage.setItem(`calculator-${window.type}-state`, JSON.stringify({
        x: window.x,
        y: window.y,
        width: window.width,
        height: window.height
      }));
    } catch (e) {
      // Ignore
    }
  }
  state.windows = state.windows.filter(w => w.id !== id);
  renderWindows();
  // Don't save windows to storage, only positions/sizes
}

function focusWindow(id) {
  const window = state.windows.find(w => w.id === id);
  if (window) {
    window.zIndex = state.nextZIndex++;
    renderWindows();
    // Don't save windows to storage
  }
}

function updateWindowPosition(id, x, y) {
  const window = state.windows.find(w => w.id === id);
  if (window) {
    window.x = x;
    window.y = y;
    
    // If this window has attached help windows, move them too
    const attachedWindows = state.windows.filter(w => w.sourceWindowId === id && w.isAttached);
    attachedWindows.forEach(attachedWindow => {
      const spacing = 20;
      const workspace = document.getElementById('workspace');
      const workspaceRect = workspace.getBoundingClientRect();
      
      // Try to position to the right first
      let newX = x + window.width + spacing;
      let newY = y;
      
      // Make sure it fits on screen
      if (newX + attachedWindow.width > workspaceRect.width) {
        // If doesn't fit on right, try left side
        newX = x - attachedWindow.width - spacing;
        if (newX < 0) {
          // If doesn't fit on left either, position below
          newX = x;
          newY = y + window.height + spacing;
        }
      }
      
      // Ensure it's within workspace bounds
      newX = Math.max(0, Math.min(newX, workspaceRect.width - attachedWindow.width));
      newY = Math.max(0, Math.min(newY, workspaceRect.height - 40));
      
      attachedWindow.x = newX;
      attachedWindow.y = newY;
    });
    
    renderWindows();
    // Don't save windows to storage, only positions when closing
  }
}

function updateWindowSize(id, width, height) {
  const window = state.windows.find(w => w.id === id);
  if (window) {
    const minSizes = getMinimumSize(window.type);
    window.width = Math.max(width, minSizes.width);
    window.height = Math.max(height, minSizes.height);
    renderWindows();
    // Don't save windows to storage, only sizes when closing
  }
}

function toggleMinimize(id) {
  const window = state.windows.find(w => w.id === id);
  if (window) {
    window.minimized = !window.minimized;
    if (!window.minimized) {
      focusWindow(id);
    }
    
    // If minimizing a source window, also minimize attached help windows
    if (window.type === 'mergeflow') {
      const attachedHelpWindows = state.windows.filter(w => w.sourceWindowId === id && w.isAttached);
      attachedHelpWindows.forEach(helpWindow => {
        helpWindow.minimized = window.minimized;
      });
    }
    
    renderWindows();
    // Don't save windows to storage
  }
}

function toggleMaximize(id) {
  const window = state.windows.find(w => w.id === id);
  if (window) {
    window.maximized = !window.maximized;
    if (!window.maximized) {
      focusWindow(id);
      // When unmaximizing, reposition attached help windows
      if (window.type === 'mergeflow') {
        const attachedHelpWindows = state.windows.filter(w => w.sourceWindowId === id && w.isAttached);
        attachedHelpWindows.forEach(helpWindow => {
          const spacing = 20;
          const workspace = document.getElementById('workspace');
          const workspaceRect = workspace.getBoundingClientRect();
          
          let newX = window.x + window.width + spacing;
          let newY = window.y;
          
          if (newX + helpWindow.width > workspaceRect.width) {
            newX = window.x - helpWindow.width - spacing;
            if (newX < 0) {
              newX = window.x;
              newY = window.y + window.height + spacing;
            }
          }
          
          newX = Math.max(0, Math.min(newX, workspaceRect.width - helpWindow.width));
          newY = Math.max(0, Math.min(newY, workspaceRect.height - 40));
          
          helpWindow.x = newX;
          helpWindow.y = newY;
        });
      }
    }
    renderWindows();
    // Don't save windows to storage
  }
}

// Render Functions
function renderSidebar() {
  const sidebarContent = document.getElementById('sidebarContent');
  sidebarContent.innerHTML = categories.map(category => `
    <div class="category">
      <div class="category-header" onclick="toggleCategory('${category.id}')">
        <span class="category-icon">${category.expanded ? '▼' : '▶'}</span>
        <span class="category-label">${category.label}</span>
      </div>
      <div class="category-items ${category.expanded ? '' : 'collapsed'}">
        ${category.calculators.map(calc => `
          <div class="calculator-item" onclick="openCalculator('${calc.type}', '${calc.label}')">
            <span class="calculator-icon">${calc.icon}</span>
            <span class="calculator-label">${calc.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Save input values before re-rendering
function saveInputValues() {
  const savedValues = {};
  state.windows.forEach(window => {
    if (window.minimized) return;
    
    savedValues[window.id] = {};
    
    if (window.type === 'mergeflow') {
      const peopleEl = document.getElementById(`people-${window.id}`);
      const stairEl = document.getElementById(`stair-${window.id}`);
      if (peopleEl) savedValues[window.id].people = peopleEl.value;
      if (stairEl) savedValues[window.id].stair = stairEl.value;
    }
  });
  return savedValues;
}

// Restore input values after re-rendering
function restoreInputValues(savedValues) {
  Object.keys(savedValues).forEach(windowId => {
    const values = savedValues[windowId];
    
    const window = state.windows.find(w => w.id === windowId);
    if (!window || window.minimized) return;
    
    if (window.type === 'mergeflow') {
      const peopleEl = document.getElementById(`people-${windowId}`);
      const stairEl = document.getElementById(`stair-${windowId}`);
      if (peopleEl && values.people !== undefined) {
        peopleEl.value = values.people;
        if (values.people) calcMergeFlow(windowId);
      }
      if (stairEl && values.stair !== undefined) {
        stairEl.value = values.stair;
        if (values.stair) calcMergeFlow(windowId);
      }
    }
  });
}

function renderWindows() {
  // Save input values before re-rendering
  const savedValues = saveInputValues();
  
  const workspace = document.getElementById('workspace');
  workspace.innerHTML = state.windows.map(window => {
    if (window.minimized) {
      return `
        <div class="calculator-window-minimized" 
             style="z-index: ${window.zIndex};"
             data-window-id="${window.id}">
          ${window.title}
        </div>
      `;
    }
    return `
      <div class="calculator-window ${window.maximized ? 'maximized' : ''}" 
           style="left: ${window.maximized ? '0' : window.x + 'px'}; 
                  top: ${window.maximized ? '0' : window.y + 'px'}; 
                  width: ${window.maximized ? '100%' : window.width + 'px'}; 
                  height: ${window.maximized ? '100%' : window.height + 'px'}; 
                  z-index: ${window.zIndex};"
           data-window-id="${window.id}">
        <div class="window-title-bar" data-window-id="${window.id}">
          <span class="window-title">${window.title}</span>
          <div class="window-controls">
            <button class="control-btn minimize" data-window-id="${window.id}" data-action="minimize" title="Minimize">−</button>
            <button class="control-btn maximize" data-window-id="${window.id}" data-action="maximize" title="Maximize">${window.maximized ? '❐' : '□'}</button>
            <button class="control-btn close" data-window-id="${window.id}" data-action="close" title="Close">×</button>
          </div>
        </div>
        <div class="window-content">
          ${getCalculatorContent(window.type, window.id)}
        </div>
        ${window.maximized || window.isAttached ? '' : '<div class="resize-handle" data-window-id="' + window.id + '"></div>'}
      </div>
    `;
  }).join('');
  
  // Attach event listeners after rendering
  attachWindowEvents();
  
  // Restore input values after re-rendering
  restoreInputValues(savedValues);
  
  // Initialize output fields for mergeflow calculators
  state.windows.forEach(window => {
    if (window.type === 'mergeflow' && !window.minimized) {
      calcMergeFlow(window.id);
    }
  });
}

function attachWindowEvents() {
  // Window focus
  document.querySelectorAll('.calculator-window:not(.calculator-window-minimized)').forEach(el => {
    const windowId = el.getAttribute('data-window-id');
    const window = state.windows.find(w => w.id === windowId);
    el.addEventListener('mousedown', (e) => {
      // Don't interfere with input fields, buttons, or controls
      if (e.target.closest('.window-controls')) return;
      if (e.target.closest('.calc-actions')) return;
      if (e.target.closest('.calc-input')) return;
      if (e.target.closest('input')) return;
      if (e.target.closest('button')) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      
      // Don't interfere with help window content (text selection, copying, etc.)
      if (window && window.type === 'mergeflow-help') {
        // Allow text selection and copying in help windows
        // Only focus if clicking on empty space (not on text content)
        if (e.target.closest('.window-content')) {
          const content = e.target.closest('.window-content');
          // If clicking on actual content (p, div, span, etc.), don't focus
          if (e.target.tagName === 'P' || e.target.tagName === 'DIV' || 
              e.target.tagName === 'SPAN' || e.target.tagName === 'H3' || 
              e.target.tagName === 'H4' || e.target.closest('p') || 
              e.target.closest('div') || e.target.closest('span') ||
              e.target.closest('h3') || e.target.closest('h4')) {
            return; // Don't focus, allow text selection
          }
        }
      }
      
      focusWindow(windowId);
    });
  });
  
  // Minimized window restore
  document.querySelectorAll('.calculator-window-minimized').forEach(el => {
    const windowId = el.getAttribute('data-window-id');
    el.addEventListener('click', () => toggleMinimize(windowId));
  });
  
  // Title bar drag
  document.querySelectorAll('.window-title-bar').forEach(el => {
    const windowId = el.getAttribute('data-window-id');
    const window = state.windows.find(w => w.id === windowId);
    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-controls')) return;
      // Don't allow dragging if this is an attached help window
      if (window && window.isAttached) {
        // Help windows are attached and move with their source window
        return;
      }
      startDrag(e, windowId);
    });
  });
  
  // Control buttons
  document.querySelectorAll('.control-btn').forEach(btn => {
    const windowId = btn.getAttribute('data-window-id');
    const action = btn.getAttribute('data-action');
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      if (action === 'close') {
        closeWindow(windowId);
      } else if (action === 'minimize') {
        toggleMinimize(windowId);
      } else if (action === 'maximize') {
        toggleMaximize(windowId);
      }
    });
  });
  
  // Calculator input events
  document.querySelectorAll('.calc-input[data-window-id]').forEach(input => {
    const windowId = input.getAttribute('data-window-id');
    
    // Ensure input is focusable and clickable
    input.addEventListener('mousedown', (e) => {
      // Don't stop propagation if clicking on spinner buttons
      if (e.target === input || e.target.closest('input')) {
        e.stopPropagation(); // Prevent window focus handler from interfering
        input.focus();
      }
    });
    
    input.addEventListener('click', (e) => {
      // Don't stop propagation if clicking on spinner buttons
      if (e.target === input || e.target.closest('input')) {
        e.stopPropagation(); // Prevent window focus handler from interfering
        input.focus();
      }
    });
    
    // Handle input event (typing)
    input.addEventListener('input', () => {
      const window = state.windows.find(w => w.id === windowId);
      if (window && window.type === 'mergeflow') {
        calcMergeFlow(windowId);
      }
    });
    
    // Handle change event (spinner buttons, enter key, blur, etc.)
    input.addEventListener('change', () => {
      const window = state.windows.find(w => w.id === windowId);
      if (window && window.type === 'mergeflow') {
        calcMergeFlow(windowId);
      }
    });
    
    // Handle spinner button clicks - use a more reliable approach
    // Listen for any value changes that might come from spinner buttons
    let lastValue = input.value;
    
    // Use a combination of events to catch spinner button clicks
    const checkValueChange = () => {
      if (input.value !== lastValue) {
        lastValue = input.value;
        const window = state.windows.find(w => w.id === windowId);
        if (window && window.type === 'mergeflow') {
          calcMergeFlow(windowId);
        }
      }
    };
    
    // Check on mouseup (when spinner button is released)
    input.addEventListener('mouseup', () => {
      setTimeout(checkValueChange, 50);
    });
    
    // Also check on focus blur (when user clicks away)
    input.addEventListener('blur', checkValueChange);
    
    // Periodic check while input is focused (catches spinner changes)
    let valueCheckInterval = null;
    input.addEventListener('focus', () => {
      valueCheckInterval = setInterval(checkValueChange, 100);
    });
    input.addEventListener('blur', () => {
      if (valueCheckInterval) {
        clearInterval(valueCheckInterval);
        valueCheckInterval = null;
      }
    });
  });
  
  // Clear button
  document.querySelectorAll('.clear-btn').forEach(btn => {
    const windowId = btn.getAttribute('data-window-id');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const window = state.windows.find(w => w.id === windowId);
      if (window && window.type === 'mergeflow') {
        clearMergeFlow(windowId);
      }
    });
  });
  
  // Help button
  document.querySelectorAll('.help-btn').forEach(btn => {
    const windowId = btn.getAttribute('data-window-id');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const window = state.windows.find(w => w.id === windowId);
      if (window && window.type === 'mergeflow') {
        openMergeFlowHelp(windowId);
      }
    });
  });
  
  // Resize handle
  document.querySelectorAll('.resize-handle').forEach(handle => {
    const windowId = handle.getAttribute('data-window-id');
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      startResize(e, windowId);
    });
  });
}

function getCalculatorContent(type, windowId) {
  switch (type) {
    case 'mergeflow':
      return getMergeFlowCalculatorHTML(windowId);
    case 'mergeflow-help':
      return getMergeFlowHelpHTML(windowId);
    default:
      return '';
  }
}

function getMergeFlowCalculatorHTML(windowId) {
  return `
    <div class="form-calculator" id="calc-${windowId}">
      <div class="calc-input-section">
        <div class="calc-section">
          <label class="calc-label">Number of People</label>
          <input type="number" class="calc-input" id="people-${windowId}" placeholder="Enter number of people" min="0" data-window-id="${windowId}">
        </div>
        <div class="calc-section">
          <label class="calc-label">Size of Stair (mm)</label>
          <input type="number" class="calc-input" id="stair-${windowId}" placeholder="Enter stair width in mm" min="0" data-window-id="${windowId}">
        </div>
      </div>
      
      <div class="calc-divider">
        <div class="divider-line"></div>
        <div class="divider-label">Results</div>
        <div class="divider-line"></div>
      </div>
      
      <div class="calc-output-section">
        <div class="calc-section">
          <label class="calc-label">Result</label>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <div class="calc-output-wrapper">
              <input type="text" class="calc-output" id="flow-capacity-${windowId}" placeholder="—" readonly>
              <span class="calc-output-unit">people/min</span>
            </div>
          </div>
        </div>
        <div class="calc-section">
          <label class="calc-label">Effective Width</label>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <div class="calc-output-wrapper">
              <input type="text" class="calc-output" id="effective-width-${windowId}" placeholder="—" readonly>
              <span class="calc-output-unit">mm</span>
            </div>
          </div>
        </div>
        <div class="calc-section">
          <label class="calc-label">Flow Rate</label>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
            <div class="calc-output-wrapper">
              <input type="text" class="calc-output" id="flow-rate-${windowId}" placeholder="—" readonly>
              <span class="calc-output-unit">people/m</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="calc-actions" style="position: relative; display: flex; justify-content: space-between;">
        <button class="action-btn clear-btn" data-window-id="${windowId}" >Clear</button>
        <button class="action-btn help-btn" data-window-id="${windowId}" style="background: var(--primary-color); color: white;">ℹ️ Show detail</button>
      </div>
    </div>
  `;
}

function getMergeFlowHelpHTML(windowId) {
  return `
    <div class="form-calculator" id="help-${windowId}" style="padding: 20px;">
      <h3 style="margin-bottom: 20px; color: var(--text-primary);">ADB Merging Flow Calculation Process</h3>
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: var(--text-primary); margin-bottom: 10px;">Step 1: Input Parameters</h4>
        <p style="color: var(--text-secondary); line-height: 1.6;">
          Enter the number of people and the width of the stair in millimeters.
        </p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: var(--text-primary); margin-bottom: 10px;">Step 2: Calculate Flow Capacity</h4>
        <p style="color: var(--text-secondary); line-height: 1.6;">
          The flow capacity is calculated using the formula:
        </p>
        <div class="math-formula">Flow Capacity = (Stair Width (mm) / 5.5) × Number of People</div>
        <p style="color: var(--text-secondary); line-height: 1.6;">
          This determines the maximum flow rate through the stairway.
        </p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: var(--text-primary); margin-bottom: 10px;">Step 3: Determine Effective Width</h4>
        <p style="color: var(--text-secondary); line-height: 1.6;">
          The effective width is the actual usable width of the stair after accounting for handrails and other obstructions.
          In this calculation, it is taken as the input stair width:
        </p>
        <div class="math-formula">Effective Width = Stair Width (mm)</div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: var(--text-primary); margin-bottom: 10px;">Step 4: Calculate Flow Rate</h4>
        <p style="color: var(--text-secondary); line-height: 1.6;">
          The flow rate is calculated as the number of people per meter of width:
        </p>
        <div class="math-formula">Flow Rate = Number of People / Stair Width (m)</div>
        <p style="color: var(--text-secondary); line-height: 1.6;">
          This provides a measure of the density of people flow through the escape route.
        </p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="color: var(--text-primary); margin-bottom: 10px;">Step 5: Result Interpretation</h4>
        <p style="color: var(--text-secondary); line-height: 1.6;">
          The merging flow result indicates the capacity of the escape route. This value should be compared against
          building regulations requirements to ensure adequate means of escape.
        </p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--window-border);">
        <p style="color: var(--text-secondary); font-size: 12px; font-style: italic;">
          Note: This is a placeholder calculation process. The actual ADB merging flow formula may need refinement
          based on specific building regulations and standards.
        </p>
      </div>
    </div>
  `;
}

// ADB Merging Flow Calculation
// Based on Approved Document B merging flow calculations
function calcMergeFlow(windowId) {
  const peopleEl = document.getElementById(`people-${windowId}`);
  const stairEl = document.getElementById(`stair-${windowId}`);
  const flowCapacityEl = document.getElementById(`flow-capacity-${windowId}`);
  const effectiveWidthEl = document.getElementById(`effective-width-${windowId}`);
  const flowRateEl = document.getElementById(`flow-rate-${windowId}`);
  
  if (!peopleEl || !stairEl || !flowCapacityEl || !effectiveWidthEl || !flowRateEl) return;
  
  const numberOfPeople = parseFloat(peopleEl.value) || 0;
  const stairWidth = parseFloat(stairEl.value) || 0;
  
  // Always show output fields, but with placeholder if no input
  if (!numberOfPeople || !stairWidth) {
    flowCapacityEl.value = '';
    flowCapacityEl.placeholder = '—';
    effectiveWidthEl.value = '';
    effectiveWidthEl.placeholder = '—';
    flowRateEl.value = '';
    flowRateEl.placeholder = '—';
    return;
  }
  
  // ADB Merging Flow calculation
  // Flow capacity = (Stair width in mm / 5.5) * number of people
  // This is a simplified version - you can refine the formula as needed
  const flowCapacity = (stairWidth / 5.5) * numberOfPeople;
  const effectiveWidth = stairWidth;
  const flowRate = numberOfPeople / (stairWidth / 1000); // people per meter
  
  // Update output fields
  flowCapacityEl.value = flowCapacity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  flowCapacityEl.placeholder = '';
  effectiveWidthEl.value = effectiveWidth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  effectiveWidthEl.placeholder = '';
  flowRateEl.value = flowRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  flowRateEl.placeholder = '';
}

function clearMergeFlow(windowId) {
  const peopleEl = document.getElementById(`people-${windowId}`);
  const stairEl = document.getElementById(`stair-${windowId}`);
  if (peopleEl) peopleEl.value = '';
  if (stairEl) stairEl.value = '';
  calcMergeFlow(windowId);
}

// Open help window for merge flow calculation
function openMergeFlowHelp(sourceWindowId) {
  // Check if help window already exists for this source window
  const existingHelpWindow = state.windows.find(w => w.sourceWindowId === sourceWindowId && w.type === 'mergeflow-help');
  if (existingHelpWindow) {
    // Focus existing help window
    focusWindow(existingHelpWindow.id);
    if (existingHelpWindow.minimized) {
      toggleMinimize(existingHelpWindow.id);
    }
    return;
  }
  
  const sourceWindow = state.windows.find(w => w.id === sourceWindowId);
  if (!sourceWindow) return;
  
  const helpWindowId = openWindow('mergeflow-help', 'Merging Flow Calculation Process');
  
  // Position help window next to source window
  setTimeout(() => {
    const helpWindow = state.windows.find(w => w.id === helpWindowId);
    if (helpWindow && sourceWindow) {
      helpWindow.sourceWindowId = sourceWindowId;
      helpWindow.isAttached = true; // Mark as attached to source window
      
      // Position to the right of source window
      const workspace = document.getElementById('workspace');
      const workspaceRect = workspace.getBoundingClientRect();
      const spacing = 20; // Gap between windows
      
      let newX = sourceWindow.x + sourceWindow.width + spacing;
      let newY = sourceWindow.y;
      
      // Make sure it fits on screen
      if (newX + helpWindow.width > workspaceRect.width) {
        // If doesn't fit on right, try left side
        newX = sourceWindow.x - helpWindow.width - spacing;
        if (newX < 0) {
          // If doesn't fit on left either, position below
          newX = sourceWindow.x;
          newY = sourceWindow.y + sourceWindow.height + spacing;
        }
      }
      
      // Ensure it's within workspace bounds
      newX = Math.max(0, Math.min(newX, workspaceRect.width - helpWindow.width));
      newY = Math.max(0, Math.min(newY, workspaceRect.height - 40));
      
      updateWindowPosition(helpWindowId, newX, newY);
      renderWindows();
    }
  }, 50);
}

// Drag and Resize
function startDrag(e, windowId) {
  const window = state.windows.find(w => w.id === windowId);
  if (!window || window.maximized) return;
  
  e.preventDefault();
  state.isDragging = true;
  state.dragData = {
    windowId,
    startX: e.clientX,
    startY: e.clientY,
    initialX: window.x,
    initialY: window.y
  };
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
}

function handleDrag(e) {
  if (!state.isDragging || !state.dragData) return;
  
  const window = state.windows.find(w => w.id === state.dragData.windowId);
  if (!window) return;
  
  const deltaX = e.clientX - state.dragData.startX;
  const deltaY = e.clientY - state.dragData.startY;
  
  const workspace = document.getElementById('workspace');
  const workspaceRect = workspace.getBoundingClientRect();
  
  const newX = Math.max(0, Math.min(state.dragData.initialX + deltaX, workspaceRect.width - window.width));
  const newY = Math.max(0, Math.min(state.dragData.initialY + deltaY, workspaceRect.height - 40));
  
  updateWindowPosition(state.dragData.windowId, newX, newY);
}

function stopDrag() {
  state.isDragging = false;
  state.dragData = null;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
}

function startResize(e, windowId) {
  const window = state.windows.find(w => w.id === windowId);
  if (!window) return;
  
  e.preventDefault();
  e.stopPropagation();
  state.isResizing = true;
  state.dragData = {
    windowId,
    startX: e.clientX,
    startY: e.clientY,
    initialWidth: window.width,
    initialHeight: window.height
  };
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
}

function handleResize(e) {
  if (!state.isResizing || !state.dragData) return;
  
  const window = state.windows.find(w => w.id === state.dragData.windowId);
  if (!window) return;
  
  const deltaX = e.clientX - state.dragData.startX;
  const deltaY = e.clientY - state.dragData.startY;
  
  const workspace = document.getElementById('workspace');
  const workspaceRect = workspace.getBoundingClientRect();
  
  const minSizes = getMinimumSize(window.type);
  const minWidth = minSizes.width;
  const minHeight = minSizes.height;
  const maxWidth = workspaceRect.width - window.x;
  const maxHeight = workspaceRect.height - window.y;
  
  const newWidth = Math.max(minWidth, Math.min(state.dragData.initialWidth + deltaX, maxWidth));
  const newHeight = Math.max(minHeight, Math.min(state.dragData.initialHeight + deltaY, maxHeight));
  
  updateWindowSize(state.dragData.windowId, newWidth, newHeight);
}

function stopResize() {
  state.isResizing = false;
  state.dragData = null;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
}

// Global functions for onclick handlers
window.toggleCategory = function(categoryId) {
  const category = categories.find(c => c.id === categoryId);
  if (category) {
    category.expanded = !category.expanded;
    renderSidebar();
  }
};

window.openCalculator = function(type, title) {
  openWindow(type, title);
};

window.toggleTheme = toggleTheme;
window.closeWindow = closeWindow;
window.focusWindow = focusWindow;
window.toggleMinimize = toggleMinimize;
window.toggleMaximize = toggleMaximize;
window.startDrag = startDrag;
window.startResize = startResize;
window.calcMergeFlow = calcMergeFlow;
window.clearMergeFlow = clearMergeFlow;
window.openMergeFlowHelp = openMergeFlowHelp;

// Clear all windows function
function clearAllWindows() {
  if (confirm('Close all calculator windows?')) {
    state.windows = [];
    renderWindows();
  }
}

// Initialize
renderSidebar();
renderWindows();
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('clearAllBtn').addEventListener('click', clearAllWindows);

