/**
 * Auto O2 Feature
 * Automatically enables O2 optimization flag for code submissions
 * Feature ID: AutoO2
 * Type: U (Utility)
 * Description: 自动启用O2编译优化标志
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize AutoO2 feature
 * Automatically checks the "Enable O2" checkbox on problem submission pages
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 2020-2022: Auto-check O2 flag
 */
export function init() {
    // Only execute if AutoO2 feature is enabled
    if (!UtilityEnabled("AutoO2")) {
        return;
    }

    // Only execute on problem pages
    if (location.pathname !== "/problem.php") {
        return;
    }

    // Wait a bit for the page to be ready
    setTimeout(() => {
        const o2Checkbox = document.querySelector("#enable_O2");
        if (o2Checkbox) {
            o2Checkbox.checked = true;
        }
    }, 100);
}
