// --- CONFIGURATION ---
// Change this class name to match the target element on your websites
const TARGET_CLASS = 'ext-devices-hidden-value-text'; 
// ---------------------

// State variables managed by messages and storage
let currentFontFamily = 'Consolas, monospace'; // UPDATED default font
let currentFontSize = '28px'; // UPDATED default size
let isEnabled = false;

// Create a style element once when the script loads
const styleElement = document.createElement('style');
styleElement.id = 'font-override-style';
document.head.appendChild(styleElement);

// Function to apply or remove the font style based on current state
function applyStyles() {
    if (isEnabled) {
        console.log(`[Font Overrider] Applying font: ${currentFontFamily} and size ${currentFontSize} to class: .${TARGET_CLASS}`);
        // Inject the CSS to override the font and size. !important ensures it takes priority.
        styleElement.textContent = `
            .${TARGET_CLASS} {
                font-family: ${currentFontFamily} !important;
                font-size: ${currentFontSize} !important;
            }
        `;
    } else {
        console.log('[Font Overrider] Removing font override.');
        // Clear the CSS content to revert the font
        styleElement.textContent = '';
    }
}

// 1. Listener for messages from the popup script (to toggle on/off or change font/size)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateState') {
        // Update both the enabled state and the font family and size
        isEnabled = request.enabled;
        currentFontFamily = request.fontFamily || currentFontFamily; 
        currentFontSize = request.fontSize || currentFontSize; 
        applyStyles();
    }
});

// 2. Initial check on page load (to maintain state across page reloads)
chrome.storage.local.get(['font_override_enabled', 'font_family', 'font_size'], (result) => {
    isEnabled = !!result.font_override_enabled;
    // Set default if not found in storage (UPDATED)
    currentFontFamily = result.font_family || 'Consolas, monospace'; 
    // Use saved size (as string with 'px') or default (UPDATED)
    currentFontSize = (result.font_size ? result.font_size + 'px' : '28px'); 
    applyStyles();
});
