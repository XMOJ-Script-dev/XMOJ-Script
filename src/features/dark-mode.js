/**
 * Dark Mode Feature
 * Enables dark theme for the website
 * Feature ID: DarkMode
 * Type: A (Appearance)
 * Description: 启用网站深色主题
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize DarkMode feature
 * Sets the Bootstrap theme to dark or light based on user preference
 *
 * Note: This feature also affects other parts of the application:
 * - CodeMirror theme selection
 * - Contest rank table text colors
 * - Problem switcher background
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 247-251: Theme attribute setting
 * - Used throughout the codebase for conditional styling (17 occurrences)
 */
export function init() {
    // Set theme based on DarkMode setting
    if (UtilityEnabled("DarkMode")) {
        document.querySelector("html").setAttribute("data-bs-theme", "dark");
    } else {
        document.querySelector("html").setAttribute("data-bs-theme", "light");
    }
}

/**
 * Check if dark mode is currently enabled
 * Used by other features for conditional styling
 * @returns {boolean}
 */
export function isDarkMode() {
    return UtilityEnabled("DarkMode");
}
