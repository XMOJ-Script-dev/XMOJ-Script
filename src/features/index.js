/**
 * Feature loader - Initializes all extracted feature modules
 *
 * This module provides a centralized way to initialize all feature modules.
 * Features are loaded conditionally based on UtilityEnabled settings and
 * current page URL.
 */

import { init as initAutoLogin } from './auto-login.js';
import { init as initDiscussion } from './discussion.js';
import { init as initCopySamples } from './copy-samples.js';
import { init as initCompareSource } from './compare-source.js';
import { init as initRemoveUseless } from './remove-useless.js';
import { init as initReplaceXM } from './replace-xm.js';
import { init as initReplaceYN } from './replace-yn.js';
import { init as initAddAnimation } from './add-animation.js';
import { init as initAddColorText } from './add-color-text.js';
import { init as initSavePassword } from './save-password.js';
import { init as initRemoveAlerts } from './remove-alerts.js';
import { init as initReplaceLinks } from './replace-links.js';
import { init as initAutoO2 } from './auto-o2.js';
import { init as initTranslate } from './translate.js';

/**
 * Initialize all feature modules
 * Features will self-check if they should be active based on UtilityEnabled
 *
 * @param {Object} context - Shared context object with dependencies
 * @param {string} context.CurrentUsername - Current logged-in username
 * @param {URLSearchParams} context.SearchParams - URL search parameters
 * @param {boolean} context.IsAdmin - Whether user is admin
 * @param {HTMLStyleElement} context.Style - Style element for adding CSS
 * @param {string} context.CaptchaSiteKey - Cloudflare Turnstile site key
 * @param {Function} context.GetUsernameHTML - Function to render usernames
 * @param {Function} context.PurifyHTML - Function to sanitize HTML
 * @param {Function} context.RenderMathJax - Function to render MathJax
 */
export async function initializeFeatures(context) {
    try {
        // Initialize features that need to run early (before main page load)
        initAutoLogin();

        // Initialize features that clean up/modify the page
        initRemoveUseless();
        initRemoveAlerts();

        // Initialize cosmetic/styling features
        initAddAnimation();
        initAddColorText();

        // Initialize text replacement features
        initReplaceXM();
        initReplaceYN();
        initReplaceLinks();
        initTranslate();

        // Initialize page-specific features
        initCopySamples();
        initSavePassword();
        initAutoO2();
        await initCompareSource();

        // Initialize complex features that need context
        if (context) {
            await initDiscussion(context);
        }

        console.log('[XMOJ-Script] Feature modules initialized');
    } catch (error) {
        console.error('[XMOJ-Script] Error initializing features:', error);
    }
}

/**
 * Get list of all extracted features
 * Useful for debugging and feature management
 */
export function getExtractedFeatures() {
    return [
        'AutoLogin',
        'Discussion',
        'CopySamples',
        'CompareSource',
        'RemoveUseless',
        'ReplaceXM',
        'ReplaceYN',
        'AddAnimation',
        'AddColorText',
        'SavePassword',
        'RemoveAlerts',
        'ReplaceLinks',
        'AutoO2',
        'Translate',
    ];
}
