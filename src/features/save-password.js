/**
 * Save Password Feature
 * Automatically saves and fills login credentials
 * Feature ID: SavePassword
 * Type: U (Utility)
 * Description: 自动保存和填充登录凭据
 */

import { UtilityEnabled } from '../core/config.js';
import { storeCredential, getCredential, clearCredential } from '../utils/credentials.js';

/**
 * Initialize SavePassword feature
 * Sets up auto-fill on login page when credentials are available
 *
 * Note: This feature also integrates with the login handler to:
 * - Save credentials after successful login
 * - Clear credentials after failed login
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 2841-2843: Save credentials on success
 * - Lines 2850-2852: Clear credentials on failure
 * - Lines 2867-2876: Auto-fill and auto-submit login form
 */
export function init() {
    // Only execute on login page
    if (location.pathname !== "/loginpage.php") {
        return;
    }

    // Only execute if SavePassword feature is enabled
    if (!UtilityEnabled("SavePassword")) {
        return;
    }

    // Auto-fill login form with saved credentials
    (async () => {
        // Wait a bit for the page to be ready
        await new Promise(resolve => setTimeout(resolve, 100));

        const credential = await getCredential();
        if (credential) {
            const usernameInput = document.querySelector("#login > div:nth-child(1) > div > input");
            const passwordInput = document.querySelector("#login > div:nth-child(2) > div > input");
            const loginButton = document.getElementsByName("submit")[0];

            if (usernameInput && passwordInput && loginButton) {
                usernameInput.value = credential.id;
                passwordInput.value = credential.password;
                loginButton.click();
            }
        }
    })();
}

/**
 * Save credentials after successful login
 * Called by login handler after successful authentication
 * @param {string} username - Username to save
 * @param {string} password - Password to save
 */
export async function saveOnSuccess(username, password) {
    if (!UtilityEnabled("SavePassword")) {
        return;
    }
    await storeCredential(username, password);
}

/**
 * Clear credentials after failed login
 * Called by login handler after failed authentication
 */
export async function clearOnFailure() {
    if (!UtilityEnabled("SavePassword")) {
        return;
    }
    await clearCredential();
}

/**
 * Check if SavePassword feature is enabled
 * @returns {boolean}
 */
export function isEnabled() {
    return UtilityEnabled("SavePassword");
}
