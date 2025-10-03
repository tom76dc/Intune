const FONT_KEY = 'font_override_enabled';
const FONT_FAMILY_KEY = 'font_family';
const FONT_SIZE_KEY = 'font_size'; // New key for size
const DEFAULT_FONT_SIZE = 28; // UPDATED default size in pixels
const DEFAULT_FONT_FAMILY = 'Consolas, monospace'; // NEW CONSTANT for default font

// List of available monospace fonts
const FONT_OPTIONS = [
    { name: 'Courier New (Default)', value: 'Courier New, Courier, monospace' },
    { name: 'Consolas', value: 'Consolas, monospace' },
    { name: 'Lucida Console', value: 'Lucida Console, monospace' },
    { name: 'Monaco (Mac/iOS)', value: 'Monaco, monospace' }
];

// Helper function to update only the button's text and style
function updateButtonUI(isEnabled, buttonElement) {
    if (isEnabled) {
        buttonElement.textContent = 'Disable Font Override';
        buttonElement.style.backgroundColor = '#FEE2E2'; /* Tailwind red-100 */
        buttonElement.style.color = '#B91C1C'; /* Tailwind red-700 */
    } else {
        buttonElement.textContent = 'Enable Font Override';
        buttonElement.style.backgroundColor = '#DBEAFE'; /* Tailwind blue-100 */
        buttonElement.style.color = '#1D4ED8'; /* Tailwind blue-700 */
    }
}


document.addEventListener('DOMContentLoaded', () => {
  console.log('[Popup Debug] DOMContentLoaded fired. Starting initialization.'); // Added log
  const button = document.getElementById('toggle-button');
  const fontSelect = document.getElementById('font-select');
  const sizeInput = document.getElementById('font-size-input'); // New DOM element
  let currentFontFamily; 
  
  // Populate the dropdown with options
  FONT_OPTIONS.forEach(font => {
      const option = document.createElement('option');
      option.value = font.value;
      option.textContent = font.name;
      fontSelect.appendChild(option);
  });

  
  // Helper function to send the current state to the content script
  function sendMessageToContent(enabled, fontFamily, fontSize) {
      // fontSize is passed as an integer (e.g., 24). Convert to CSS string (e.g., '24px') here.
      const fontSizeCss = fontSize + 'px';

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
              chrome.tabs.sendMessage(tabs[0].id, {
                  action: 'updateState', 
                  enabled: enabled,
                  fontFamily: fontFamily,
                  fontSize: fontSizeCss // Send as CSS string
              }, () => {
                  // IMPORTANT: This callback prevents the "Uncaught (in promise)" error
                  if (chrome.runtime.lastError) {
                      console.error("Failed to communicate with content script:", chrome.runtime.lastError.message);
                  }
              });
          }
      });
  }

  // 1. Load current state, font, and size when the popup is opened
  chrome.storage.local.get([FONT_KEY, FONT_FAMILY_KEY, FONT_SIZE_KEY], (result) => {
    console.log('[Popup Debug] Storage retrieval attempted.'); 
    
    let isEnabled = !!result[FONT_KEY];
    currentFontFamily = result[FONT_FAMILY_KEY] || DEFAULT_FONT_FAMILY; // UPDATED to use Consolas default
    let currentFontSize = result[FONT_SIZE_KEY] || DEFAULT_FONT_SIZE; // Retrieve size as number

    console.log('[Popup Debug] isEnabled:', isEnabled, 'Font Family:', currentFontFamily, 'Font Size:', currentFontSize); 
    
    updateButtonUI(isEnabled, button); // Update button based on status
    fontSelect.value = currentFontFamily;
    sizeInput.value = currentFontSize; // Set input value
  });
  
  // 2. Handle font selection change
  fontSelect.addEventListener('change', (event) => {
      currentFontFamily = event.target.value;
      
      // 2a. Save new font family
      chrome.storage.local.set({ [FONT_FAMILY_KEY]: currentFontFamily }, () => {
          // 2b. Get current enabled state and size, and send a full update to content script
          chrome.storage.local.get([FONT_KEY, FONT_SIZE_KEY], (result) => {
              const currentSize = result[FONT_SIZE_KEY] || DEFAULT_FONT_SIZE;
              sendMessageToContent(!!result[FONT_KEY], currentFontFamily, currentSize);
          });
      });
  });
  
  // 3. Handle size input change (NEW)
  sizeInput.addEventListener('change', (event) => {
      const newSize = parseInt(event.target.value, 10);
      
      // Basic validation for size
      if (newSize < 8 || newSize > 72 || isNaN(newSize)) {
           // Revert to the last saved or default size if invalid
           sizeInput.value = DEFAULT_FONT_SIZE;
           return;
      }

      // 3a. Save new font size
      chrome.storage.local.set({ [FONT_SIZE_KEY]: newSize }, () => {
          // 3b. Get current enabled state and font family, and send a full update to content script
          chrome.storage.local.get([FONT_KEY, FONT_FAMILY_KEY], (result) => {
              const currentFontFamily = result[FONT_FAMILY_KEY] || DEFAULT_FONT_FAMILY; // UPDATED to use Consolas default
              sendMessageToContent(!!result[FONT_KEY], currentFontFamily, newSize);
          });
      });
  });


  // 4. Handle button click (toggle enabled state)
  button.addEventListener('click', () => {
    // Read current state, toggle it, and save the new state
    chrome.storage.local.get([FONT_KEY, FONT_FAMILY_KEY, FONT_SIZE_KEY], (result) => {
      let newState = !result[FONT_KEY];
      
      // Ensure we use the currently selected/saved font family and size
      currentFontFamily = result[FONT_FAMILY_KEY] || DEFAULT_FONT_FAMILY; // UPDATED to use Consolas default
      const currentSize = result[FONT_SIZE_KEY] || DEFAULT_FONT_SIZE; 
      
      chrome.storage.local.set({ [FONT_KEY]: newState }, () => {
        updateButtonUI(newState, button); // Update button based on new status
        // Send the full current state (enabled/disabled AND selected font family AND size)
        sendMessageToContent(newState, currentFontFamily, currentSize);
      });
    });
  });
});
