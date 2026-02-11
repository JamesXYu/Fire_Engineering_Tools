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
      { id: 'merge-flow', label: 'Merging Flow', type: 'mergeflow', icon: '🔄' },
      { id: 'BSmergeflow', label: 'BS 9999 Merge Flow', type: 'BSmergeflow', icon: '🔢' },
      { id: 'flameheight', label: 'Flame Height', type: 'Flameheight', icon: '🔥' },
      { id: 'detector-activation', label: 'Detector Activation', type: 'DetectorActivation', icon: '🔔' }
    ]
  },
  {
    id: 'b2',
    label: 'B2',
    expanded: false,
    calculators: [
    ]
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
    calculators: [
      { id: 'externalfirespread', label: 'External Fire Spread ', type: 'Externalfirespread', icon: '🔢' }
    ]
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

// Get available viewport dimensions (workspace area)
function getAvailableViewportSize() {
  const workspace = document.getElementById('workspace');
  if (!workspace) return { width: window.innerWidth, height: window.innerHeight };
  const rect = workspace.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

// Adjust window size to fit within viewport if needed
function adjustWindowSizeForViewport(windowType, minSize, requestedHeight) {
  const viewport = getAvailableViewportSize();
  const titleBarHeight = 40; // Height of title bar
  const minVisibleHeight = 200; // Minimum visible height (title bar + some content)
  
  // Calculate maximum allowed height (viewport height - some margin for positioning)
  const maxAllowedHeight = viewport.height - 20; // 20px margin from top/bottom
  
  // If minimum size is larger than viewport, use viewport height minus title bar
  if (minSize.height > maxAllowedHeight) {
    // Use viewport height but ensure at least title bar is visible
    const adjustedHeight = Math.max(maxAllowedHeight, minVisibleHeight);
    return {
      width: minSize.width,
      height: adjustedHeight,
      needsScrolling: true // Flag to indicate scrolling is needed
    };
  }
  
  // If requested height is larger than viewport, cap it
  if (requestedHeight && requestedHeight > maxAllowedHeight) {
    return {
      width: minSize.width,
      height: maxAllowedHeight,
      needsScrolling: true
    };
  }
  
  // Normal case - use requested height or minimum
  return {
    width: minSize.width,
    height: requestedHeight || minSize.height,
    needsScrolling: false
  };
}

// Get minimum window size based on calculator type
function getMinimumSize(windowType) {
  // Figure windows have fixed size (non-resizable)
  if (windowType.endsWith('-figure')) {
    return { width: 600, height: 500 };
  }
  
  // Check if it's a help window
  if (windowType.endsWith('-help')) {
    const baseType = windowType.replace('-help', '');
    const calculator = CalculatorRegistry.get(baseType);
    if (calculator) {
      return { width: 400, height: 600 }; // Help windows have fixed size
    }
    return { width: 400, height: 600 };
  }
  
  // Get calculator from registry
  const calculator = CalculatorRegistry.get(windowType);
  if (calculator && calculator.getMinimumSize) {
    return calculator.getMinimumSize();
  }
  
  // Default minimum size
  return { width: 400, height: 200 };
}

// Window Management
function openWindow(type, title, sizeOverride) {
  const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const defaultSize = { width: 400, height: 500 };
  
  // Figure windows have different default size
  if (type.endsWith('-figure')) {
    const figureSize = { width: 600, height: 500 };
    const newWindow = {
      id,
      type,
      title,
      x: 100 + state.windows.length * 30,
      y: 100 + state.windows.length * 30,
      width: figureSize.width,
      height: figureSize.height,
      zIndex: state.nextZIndex++,
      minimized: false,
      maximized: false
    };
    state.windows.push(newWindow);
    renderWindows();
    return id;
  }
  
  const minSizes = getMinimumSize(type);
  
  let x = 100 + state.windows.length * 30;
  let y = 100 + state.windows.length * 30;
  // Use minimum width for mergeflow, default for others
  let width = (type === 'mergeflow') ? minSizes.width : defaultSize.width;
  // Use minimum height as the initial height (or sizeOverride for help windows)
  let height = sizeOverride && sizeOverride.height !== undefined ? sizeOverride.height : minSizes.height;
  if (sizeOverride && sizeOverride.width !== undefined) {
    width = sizeOverride.width;
  }

  try {
    const saved = localStorage.getItem(`calculator-${type}-state`);
    if (saved) {
      const parsed = JSON.parse(saved);
      x = parsed.x || x;
      y = parsed.y || y;
      // For mergeflow, always use minimum width; for others, use saved width or default
      if (type !== 'mergeflow') {
        width = parsed.width || width;
      }
      // Don't restore saved height - always use minimum height
      // height = parsed.height || height;
    }
  } catch (e) {
    // Ignore
  }
  
  // Ensure window is at least minimum size (skip for sizeOverride, e.g. help window matching calculator height)
  if (!sizeOverride) {
    width = Math.max(width, minSizes.width);
    height = Math.max(height, minSizes.height);
  }
  
  // Adjust window size to fit within viewport if needed
  const adjustedSize = adjustWindowSizeForViewport(type, minSizes, height);
  width = adjustedSize.width;
  height = adjustedSize.height;

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
    // If closing a source window, also close its attached help and figure windows
    if (!window.type.endsWith('-help') && !window.type.endsWith('-figure')) {
      const attachedWindows = state.windows.filter(w => w.sourceWindowId === id && w.isAttached);
      attachedWindows.forEach(attachedWindow => {
        state.windows = state.windows.filter(w => w.id !== attachedWindow.id);
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
    let newWidth = Math.max(width, minSizes.width);
    let newHeight = Math.max(height, minSizes.height);
    
    // Adjust size to fit within viewport if needed
    const adjustedSize = adjustWindowSizeForViewport(window.type, minSizes, newHeight);
    newWidth = adjustedSize.width;
    newHeight = adjustedSize.height;
    
    window.width = newWidth;
    window.height = newHeight;
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
    
    // If minimizing a source window, also minimize attached help and figure windows
    if (!window.type.endsWith('-help') && !window.type.endsWith('-figure')) {
      const attachedWindows = state.windows.filter(w => w.sourceWindowId === id && w.isAttached);
      attachedWindows.forEach(attachedWindow => {
        attachedWindow.minimized = window.minimized;
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
      // When unmaximizing, reposition attached help and figure windows
      if (!window.type.endsWith('-help') && !window.type.endsWith('-figure')) {
        const attachedWindows = state.windows.filter(w => w.sourceWindowId === id && w.isAttached);
        attachedWindows.forEach(attachedWindow => {
          const spacing = 20;
          const workspace = document.getElementById('workspace');
          const workspaceRect = workspace.getBoundingClientRect();
          
          let newX = window.x + window.width + spacing;
          let newY = window.y;
          
          if (newX + attachedWindow.width > workspaceRect.width) {
            newX = window.x - attachedWindow.width - spacing;
            if (newX < 0) {
              newX = window.x;
              newY = window.y + window.height + spacing;
            }
          }
          
          newX = Math.max(0, Math.min(newX, workspaceRect.width - attachedWindow.width));
          newY = Math.max(0, Math.min(newY, workspaceRect.height - 40));
          
          attachedWindow.x = newX;
          attachedWindow.y = newY;
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
    if (window.type.endsWith('-help')) return; // Skip help windows
    
    const calculator = CalculatorRegistry.get(window.type);
    if (calculator && calculator.saveInputValues) {
      savedValues[window.id] = calculator.saveInputValues(window.id);
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
    if (window.type.endsWith('-help')) return; // Skip help windows
    
    const calculator = CalculatorRegistry.get(window.type);
    if (calculator && calculator.restoreInputValues) {
      calculator.restoreInputValues(windowId, values);
    }
  });
}

function renderWindows() {
  // Save input values before re-rendering
  const savedValues = saveInputValues();
  
  // Restore calculator state (like method selection) BEFORE rendering HTML
  // This ensures getHTML() uses the correct method
  // IMPORTANT: Process ALL windows to ensure state is preserved
  state.windows.forEach(window => {
    if (window.minimized) return;
    if (window.type.endsWith('-help')) return; // Skip help windows
    
    const calculator = CalculatorRegistry.get(window.type);
    if (!calculator) return;
    
    const values = savedValues[window.id];
    
    // Always try to restore state before rendering
    // This is critical for calculators with multiple modes (like BSmergeflow)
    // Pass values even if undefined - restoreStateBeforeRender will handle it
    if (calculator.restoreStateBeforeRender) {
      calculator.restoreStateBeforeRender(window.id, values);
    } else if (values && values.method && calculator.setActiveMethod) {
      // Fallback: restore method selection if calculator doesn't have restoreStateBeforeRender
      calculator.setActiveMethod(window.id, values.method);
    } else if (!values && calculator.restoreStateBeforeRender) {
      // If no savedValues but calculator has restoreStateBeforeRender, call it anyway
      // This allows it to check localStorage or other persistence mechanisms
      calculator.restoreStateBeforeRender(window.id, undefined);
    }
  });
  
  const workspace = document.getElementById('workspace');
  const workspaceRect = workspace.getBoundingClientRect();
  
  // Get all minimized windows (excluding figure and help windows) and calculate their positions
  const minimizedWindows = state.windows.filter(w => 
    w.minimized && 
    !w.type.endsWith('-figure') && 
    !w.type.endsWith('-help')
  );
  const minimizedWindowPositions = {};
  const minimizedSpacing = 10; // Space between minimized windows
  const minimizedStartX = 20;
  const minimizedStartY = 20;
  const minimizedHeight = 36; // Approximate height of minimized window
  const leftPadding = 16; // Left padding
  const rightPadding = 2; // Minimal right padding to prevent text cutoff
  const minWidth = 100; // Minimum width for minimized windows
  const maxWidth = 300; // Maximum width for minimized windows
  
  // Calculate dynamic widths for each minimized window based on title length
  const minimizedWindowWidths = {};
  minimizedWindows.forEach(window => {
    // Calculate width based on title length
    const titleLength = window.title ? window.title.length : 10;
    // Base width: ~8.5px per character + padding (allows full text display)
    const calculatedWidth = Math.max(minWidth, Math.min(maxWidth, titleLength * 8.5 + leftPadding + rightPadding));
    minimizedWindowWidths[window.id] = calculatedWidth;
  });
  
  // Calculate positions using dynamic widths
  let currentX = minimizedStartX;
  let currentY = minimizedStartY;
  
  minimizedWindows.forEach((window) => {
    const windowWidth = minimizedWindowWidths[window.id];
    
    // Check if window fits on current row
    if (currentX + windowWidth > workspaceRect.width - minimizedStartX) {
      // Move to next row
      currentX = minimizedStartX;
      currentY += minimizedHeight + minimizedSpacing;
    }
    
    minimizedWindowPositions[window.id] = {
      x: currentX,
      y: currentY,
      width: windowWidth
    };
    
    currentX += windowWidth + minimizedSpacing;
  });
  
  workspace.innerHTML = state.windows.map(window => {
    // Only show minimized windows that are not figure or help windows
    if (window.minimized && !window.type.endsWith('-figure') && !window.type.endsWith('-help')) {
      const position = minimizedWindowPositions[window.id] || { x: minimizedStartX, y: minimizedStartY, width: 150 };
      return `
        <div class="calculator-window-minimized" 
             style="z-index: ${window.zIndex}; 
                    left: ${position.x}px; 
                    bottom: ${position.y}px;
                    width: ${position.width}px;"
             data-window-id="${window.id}"
             title="${window.title}">
          ${window.title}
        </div>
      `;
    }
    // Skip rendering minimized figure/help windows (they're hidden when minimized)
    if (window.minimized) {
      return '';
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
          <div style="display: flex; align-items: center; gap: 8px;">
            ${window.type.endsWith('-help') || window.type.endsWith('-figure') ? '' : `<button class="figure-btn" data-window-id="${window.id}" title="Show Figure">📍</button>`}
            <span class="window-title">${window.title}</span>
          </div>
          <div class="window-controls">
            <button class="control-btn minimize" data-window-id="${window.id}" data-action="minimize" title="Minimize">−</button>
            <button class="control-btn maximize" data-window-id="${window.id}" data-action="maximize" title="Maximize">${window.maximized ? '❐' : '□'}</button>
            <button class="control-btn close" data-window-id="${window.id}" data-action="close" title="Close">╳</button>
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
  
  // Initialize calculators
  state.windows.forEach(window => {
    if (window.minimized) return;
    if (window.type.endsWith('-help')) return; // Skip help windows
    
    const calculator = CalculatorRegistry.get(window.type);
    if (calculator) {
      // Call calculator-specific attachEvents if available
      if (calculator.attachEvents) {
        calculator.attachEvents(window.id);
      }
      // Calculate initial values
      if (calculator.calculate) {
        calculator.calculate(window.id);
      }
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
      if (e.target.closest('.figure-btn')) return;
      // Don't allow dragging if this is an attached help window
      if (window && window.isAttached) {
        // Help windows are attached and move with their source window
        return;
      }
      startDrag(e, windowId);
    });
  });
  
  // Figure button
  document.querySelectorAll('.figure-btn').forEach(btn => {
    const windowId = btn.getAttribute('data-window-id');
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openFigureWindow(windowId);
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
      if (window && !window.type.endsWith('-help')) {
        const calculator = CalculatorRegistry.get(window.type);
        if (calculator && calculator.calculate) {
          calculator.calculate(windowId);
        }
      }
    });
    
    // Handle change event (spinner buttons, enter key, blur, etc.)
    input.addEventListener('change', () => {
      const window = state.windows.find(w => w.id === windowId);
      if (window && !window.type.endsWith('-help')) {
        const calculator = CalculatorRegistry.get(window.type);
        if (calculator && calculator.calculate) {
          calculator.calculate(windowId);
        }
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
        if (window && !window.type.endsWith('-help')) {
          const calculator = CalculatorRegistry.get(window.type);
          if (calculator && calculator.calculate) {
            calculator.calculate(windowId);
          }
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
      if (window && !window.type.endsWith('-help')) {
        const calculator = CalculatorRegistry.get(window.type);
        if (calculator && calculator.clear) {
          calculator.clear(windowId);
        }
      }
    });
  });
  
  // Export button
  document.querySelectorAll('.export-btn').forEach(btn => {
    const windowId = btn.getAttribute('data-window-id');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const window = state.windows.find(w => w.id === windowId);
      if (window && !window.type.endsWith('-help')) {
        const calculator = CalculatorRegistry.get(window.type);
        if (calculator) {
          exportCalculatorData(windowId, calculator, window);
        }
      }
    });
  });
  
  // Import button
  document.querySelectorAll('.import-btn').forEach(btn => {
    const windowId = btn.getAttribute('data-window-id');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const window = state.windows.find(w => w.id === windowId);
      if (window && !window.type.endsWith('-help')) {
        const calculator = CalculatorRegistry.get(window.type);
        if (calculator) {
          importCalculatorData(windowId, calculator, window);
        }
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
      if (window && !window.type.endsWith('-help')) {
        openHelpWindow(windowId);
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
  // Check if it's a figure window
  if (type.endsWith('-figure')) {
    const figureWindow = state.windows.find(w => w.id === windowId);
    const imagePath = figureWindow ? figureWindow.figureImagePath : `Figures/${type.replace('-figure', '')}.png`;
    return `
      <div style="padding: 20px; display: flex; justify-content: center; align-items: center; height: 100%; overflow: auto;">
        <img src="${imagePath}" alt="Figure" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.style.display='none'; this.parentElement.innerHTML='<p style=\\'color: var(--text-secondary); text-align: center;\\'>Figure image not found: ${imagePath}</p>'">
      </div>
    `;
  }
  
  // Check if it's a help window
  if (type.endsWith('-help')) {
    const baseType = type.replace('-help', '');
    const calculator = CalculatorRegistry.get(baseType);
    if (calculator && calculator.getHelpHTML) {
      // Get sourceWindowId from the help window's state
      const helpWindow = state.windows.find(w => w.id === windowId);
      const sourceWindowId = helpWindow ? helpWindow.sourceWindowId : null;
      // Pass sourceWindowId to getHelpHTML so it can determine the active method
      return calculator.getHelpHTML(windowId, sourceWindowId);
    }
    return '';
  }
  
  // Get calculator HTML from registry
  const calculator = CalculatorRegistry.get(type);
  if (calculator && calculator.getHTML) {
    return calculator.getHTML(windowId);
  }
  
  return '';
}

// Open figure window
function openFigureWindow(sourceWindowId) {
  const sourceWindow = state.windows.find(w => w.id === sourceWindowId);
  if (!sourceWindow) return;
  
  const figureType = `${sourceWindow.type}-figure`;
  const helpType = `${sourceWindow.type}-help`;
  const calculator = CalculatorRegistry.get(sourceWindow.type);
  
  // Close any existing help window for this source window
  const existingHelpWindow = state.windows.find(w => w.sourceWindowId === sourceWindowId && w.type === helpType);
  if (existingHelpWindow) {
    state.windows = state.windows.filter(w => w.id !== existingHelpWindow.id);
  }
  
  // Check if figure window already exists for this source window
  const existingFigureWindow = state.windows.find(w => w.sourceWindowId === sourceWindowId && w.type === figureType);
  if (existingFigureWindow) {
    // Update figure image if method changed (for BSmergeflow)
    if (sourceWindow.type === 'BSmergeflow' && calculator && calculator.getActiveMethod) {
      const activeMethod = calculator.getActiveMethod(sourceWindow.id);
      const newImagePath = `Figures/${sourceWindow.type}-${activeMethod}.png`;
      existingFigureWindow.figureImagePath = newImagePath;
      existingFigureWindow.activeMethod = activeMethod;
    }
    // Focus existing figure window
    focusWindow(existingFigureWindow.id);
    if (existingFigureWindow.minimized) {
      toggleMinimize(existingFigureWindow.id);
    }
    renderWindows();
    return;
  }
  
  // Determine figure image path based on calculator type and method
  let figureImagePath = `Figures/${sourceWindow.type}.png`;
  let figureTitle = calculator && calculator.name ? `${calculator.name} - Figure` : 'Figure';
  
  // For BSmergeflow, use method-specific image
  if (sourceWindow.type === 'BSmergeflow' && calculator && calculator.getActiveMethod) {
    const activeMethod = calculator.getActiveMethod(sourceWindow.id);
    figureImagePath = `Figures/${sourceWindow.type}-${activeMethod}.png`;
    // Update title based on method
    if (activeMethod === 'method1') {
      figureTitle = 'Upper Level - Figure';
    } else if (activeMethod === 'method2') {
      figureTitle = 'Basement Level - Figure';
    } else if (activeMethod === 'method3') {
      figureTitle = 'Multi-Level - Figure';
    }
  }
  
  // Create figure window with fixed size
  const figureSize = { width: 600, height: 500 };
  const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const figureWindow = {
    id,
    type: figureType,
    title: figureTitle,
    x: 0, // Will be positioned below
    y: 0, // Will be positioned below
    width: figureSize.width,
    height: figureSize.height,
    zIndex: state.nextZIndex++,
    minimized: false,
    maximized: false,
    sourceWindowId: sourceWindowId,
    figureImagePath: figureImagePath,
    isAttached: true, // Mark as attached to source window
    activeMethod: sourceWindow.type === 'BSmergeflow' && calculator && calculator.getActiveMethod ? calculator.getActiveMethod(sourceWindowId) : null
  };
  
  state.windows.push(figureWindow);
  
  // Position figure window next to source window
  setTimeout(() => {
    const workspace = document.getElementById('workspace');
    const workspaceRect = workspace.getBoundingClientRect();
    const spacing = 20;
    
    // Position to the right of source window
    let newX = sourceWindow.x + sourceWindow.width + spacing;
    let newY = sourceWindow.y;
    
    // Make sure it fits on screen
    if (newX + figureWindow.width > workspaceRect.width) {
      // If doesn't fit on right, try left side
      newX = sourceWindow.x - figureWindow.width - spacing;
      if (newX < 0) {
        // If doesn't fit on left either, position below
        newX = sourceWindow.x;
        newY = sourceWindow.y + sourceWindow.height + spacing;
      }
    }
    
    // Ensure it's within workspace bounds
    newX = Math.max(0, Math.min(newX, workspaceRect.width - figureWindow.width));
    newY = Math.max(0, Math.min(newY, workspaceRect.height - 40));
    
    updateWindowPosition(figureWindow.id, newX, newY);
    renderWindows();
  }, 50);
}

// Generic help window opener
function openHelpWindow(sourceWindowId) {
  const sourceWindow = state.windows.find(w => w.id === sourceWindowId);
  if (!sourceWindow) return;
  
  const helpType = `${sourceWindow.type}-help`;
  const figureType = `${sourceWindow.type}-figure`;
  const calculator = CalculatorRegistry.get(sourceWindow.type);
  if (!calculator || !calculator.getHelpHTML) return;
  
  // Close any existing figure window for this source window
  const existingFigureWindow = state.windows.find(w => w.sourceWindowId === sourceWindowId && w.type === figureType);
  if (existingFigureWindow) {
    state.windows = state.windows.filter(w => w.id !== existingFigureWindow.id);
  }
  
  // Check if help window already exists for this source window
  const existingHelpWindow = state.windows.find(w => w.sourceWindowId === sourceWindowId && w.type === helpType);
  if (existingHelpWindow) {
    // Update title if method changed (for BSmergeflow)
    if (sourceWindow.type === 'BSmergeflow' && calculator.getActiveMethod) {
      const activeMethod = calculator.getActiveMethod(sourceWindow.id);
      let newTitle = 'Justification';
      if (activeMethod === 'method1') {
        newTitle = 'Upper Level - Justification';
      } else if (activeMethod === 'method2') {
        newTitle = 'Basement Level - Justification';
      } else if (activeMethod === 'method3') {
        newTitle = 'Multi-Level - Justification';
      }
      existingHelpWindow.title = newTitle;
    }
    // Focus existing help window
    focusWindow(existingHelpWindow.id);
    if (existingHelpWindow.minimized) {
      toggleMinimize(existingHelpWindow.id);
    }
    // Re-render to update content and title
    renderWindows();
    return;
  }
  
  // Custom help title
  let helpTitle = 'Help';
  if (sourceWindow.type === 'mergeflow') {
    helpTitle = 'Justification';
  } else if (sourceWindow.type === 'BSmergeflow') {
    // Get the active method for BSmergeflow to show method-specific title
    if (calculator.getActiveMethod) {
      const activeMethod = calculator.getActiveMethod(sourceWindow.id);
      if (activeMethod === 'method1') {
        helpTitle = 'Upper Level - Justification';
      } else if (activeMethod === 'method2') {
        helpTitle = 'Basement Level - Justification';
      } else if (activeMethod === 'method3') {
        helpTitle = 'Multi-Level - Justification';
      } else {
        helpTitle = 'Justification';
      }
    } else {
      helpTitle = 'Justification';
    }
  } else if (calculator.name) {
    helpTitle = `${calculator.name} - Help`;
  }
  // Match help window height to the source calculator window
  const helpWindowId = openWindow(helpType, helpTitle, { height: sourceWindow.height });
  
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

// Export calculator data to JSON file
function exportCalculatorData(windowId, calculator, window) {
  try {
    // Get all input values
    const inputValues = calculator.saveInputValues ? calculator.saveInputValues(windowId) : {};
    
    // Get method if calculator supports it (for BSmergeflow)
    let method = null;
    if (calculator.getActiveMethod) {
      method = calculator.getActiveMethod(windowId);
    }
    
    // Create export data object
    const exportData = {
      calculatorType: window.type,
      calculatorName: calculator.name || window.title,
      windowId: windowId,
      timestamp: new Date().toISOString(),
      method: method,
      inputValues: inputValues
    };
    
    // Convert to JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${calculator.name || 'calculator'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Failed to export data. Please try again.');
  }
}

// Import calculator data from JSON file
function importCalculatorData(windowId, calculator, window) {
  try {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          
          // Validate that this is the correct calculator type
          if (jsonData.calculatorType !== window.type) {
            alert(`This file is for "${jsonData.calculatorName || jsonData.calculatorType}" calculator, not "${calculator.name || window.type}".`);
            return;
          }
          
          // Restore method if calculator supports it
          if (calculator.setActiveMethod && jsonData.method) {
            calculator.setActiveMethod(windowId, jsonData.method);
            // Re-render to show correct inputs for the method
            if (typeof window.renderWindows === 'function') {
              window.renderWindows();
              // Wait for DOM to be ready before restoring values
              setTimeout(() => {
                if (calculator.restoreInputValues && jsonData.inputValues) {
                  calculator.restoreInputValues(windowId, jsonData.inputValues);
                }
              }, 100);
            } else {
              // Fallback: restore values directly
              if (calculator.restoreInputValues && jsonData.inputValues) {
                calculator.restoreInputValues(windowId, jsonData.inputValues);
              }
            }
          } else {
            // Restore input values directly
            if (calculator.restoreInputValues && jsonData.inputValues) {
              calculator.restoreInputValues(windowId, jsonData.inputValues);
            }
          }
          
          alert('Data imported successfully!');
        } catch (error) {
          console.error('Error importing data:', error);
          alert('Failed to import data. The file may be corrupted or invalid.');
        }
      };
      
      reader.onerror = () => {
        alert('Failed to read file. Please try again.');
      };
      
      reader.readAsText(file);
    });
    
    // Trigger file picker
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  } catch (error) {
    console.error('Error importing data:', error);
    alert('Failed to import data. Please try again.');
  }
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
window.openHelpWindow = openHelpWindow;
window.renderWindows = renderWindows;
// Expose state for calculator access
if (typeof window !== 'undefined') {
  window.state = state;
}

// Clear all windows function
function clearAllWindows() {
  if (confirm('Close all calculator windows?')) {
    state.windows = [];
    renderWindows();
  }
}

// Handle window resize to adjust windows if viewport becomes smaller
function handleViewportResize() {
  // Check all windows and adjust if they exceed viewport
  state.windows.forEach(window => {
    if (window.minimized || window.maximized) return;
    
    const minSizes = getMinimumSize(window.type);
    const adjustedSize = adjustWindowSizeForViewport(window.type, minSizes, window.height);
    
    // If window needs adjustment, update it
    if (window.height !== adjustedSize.height || window.width !== adjustedSize.width) {
      window.height = adjustedSize.height;
      window.width = adjustedSize.width;
      
      // Also ensure window position is within viewport
      const viewport = getAvailableViewportSize();
      window.x = Math.max(0, Math.min(window.x, viewport.width - window.width));
      window.y = Math.max(0, Math.min(window.y, viewport.height - 40)); // 40px for title bar
    }
  });
  
  renderWindows();
}

// Initialize
renderSidebar();
renderWindows();
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('clearAllBtn').addEventListener('click', clearAllWindows);

// Listen for window resize events
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(handleViewportResize, 100); // Debounce resize events
});
