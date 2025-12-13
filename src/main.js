/**
 * Main entry point for XMOJ Script
 * This file imports all utilities and features, then initializes the application
 */

// Core imports
import { UtilityEnabled } from './core/config.js';
import { AdminUserList } from './core/constants.js';

// Utility imports
import { escapeHTML, PurifyHTML } from './utils/html.js';
import { SmartAlert } from './utils/alerts.js';
import { GetRelativeTime, SecondsToString, StringToSeconds, TimeToStringTime } from './utils/time.js';
import { SizeToStringSize, CodeSizeToStringSize } from './utils/format.js';
import { compareVersions } from './utils/version.js';
import { RequestAPI } from './utils/api.js';
import { storeCredential, getCredential, clearCredential } from './utils/credentials.js';
import { RenderMathJax } from './utils/mathjax.js';
import { TidyTable } from './utils/table.js';
import { GetUserInfo, GetUserBadge, GetUsernameHTML } from './utils/user.js';

// Core application imports
import { initTheme, main } from './core/bootstrap.js';
import { registerMenuCommands } from './core/menu.js';

// Feature modules imports
import { initializeFeatures, getExtractedFeatures } from './features/index.js';

// Page modules imports
import { initializePage, getImplementedPages } from './pages/index.js';

// Make utilities globally available (for compatibility with inline code)
window.escapeHTML = escapeHTML;
window.PurifyHTML = PurifyHTML;
window.SmartAlert = SmartAlert;
window.GetRelativeTime = GetRelativeTime;
window.SecondsToString = SecondsToString;
window.StringToSeconds = StringToSeconds;
window.TimeToStringTime = TimeToStringTime;
window.SizeToStringSize = SizeToStringSize;
window.CodeSizeToStringSize = CodeSizeToStringSize;
window.compareVersions = compareVersions;
window.RequestAPI = RequestAPI;
window.storeCredential = storeCredential;
window.getCredential = getCredential;
window.clearCredential = clearCredential;
window.RenderMathJax = RenderMathJax;
window.TidyTable = TidyTable;
window.GetUserInfo = GetUserInfo;
window.GetUserBadge = GetUserBadge;
window.GetUsernameHTML = GetUsernameHTML;
window.UtilityEnabled = UtilityEnabled;
window.AdminUserList = AdminUserList;

// Register menu commands
registerMenuCommands();

// Initialize theme
initTheme();

// Initialize extracted feature modules
// These run before main() to allow early initialization (like AutoLogin)
initializeFeatures().then(() => {
    console.log('[XMOJ-Script] Extracted features loaded:', getExtractedFeatures());
});

// Start the main application
// Note: bootstrap.js still contains all original code for compatibility
// Extracted features in src/features/ provide the same functionality
// in a more maintainable way
main();

// Initialize page-specific modules after main() runs
// Page modules handle page-specific styling and DOM manipulations
// This needs to run after bootstrap.js sets up the basic structure
window.addEventListener('load', () => {
    // Create context object with commonly used utilities
    const pageContext = {
        SearchParams: new URLSearchParams(location.search),
        RenderMathJax,
        RequestAPI,
        TidyTable,
        GetUserInfo,
        GetUserBadge,
        GetUsernameHTML,
        GetRelativeTime,
        SmartAlert,
        Style: document.querySelector('style#UserScript-Style'),
        IsAdmin: window.IsAdmin || false, // Set by bootstrap.js
    };

    initializePage(pageContext).then(() => {
        console.log('[XMOJ-Script] Page modules available for:', getImplementedPages());
    });
});
