/**
 * Replace YN Feature
 * Replaces Y/N status indicators with symbols
 * Feature ID: ReplaceYN
 * Type: U (Utility)
 * Description: 将Y/N状态替换为符号
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize ReplaceYN feature
 * Replaces status text with symbols:
 * - "Y" (AC/Accepted) -> "✓"
 * - "N" (WA/Wrong Answer) -> "✗"
 * - "W" (Waiting) -> "⏳"
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 404-417: Status text replacement
 */
export function init() {
    // Only execute if ReplaceYN feature is enabled
    if (!UtilityEnabled("ReplaceYN")) {
        return;
    }

    // Replace AC (Accepted) status
    let elements = document.getElementsByClassName("status_y");
    for (let i = 0; i < elements.length; i++) {
        elements[i].innerText = "✓";
    }

    // Replace WA (Wrong Answer) status
    elements = document.getElementsByClassName("status_n");
    for (let i = 0; i < elements.length; i++) {
        elements[i].innerText = "✗";
    }

    // Replace Waiting status
    elements = document.getElementsByClassName("status_w");
    for (let i = 0; i < elements.length; i++) {
        elements[i].innerText = "⏳";
    }
}

/**
 * Check if ReplaceYN is enabled
 * Used by other features that need to apply Y/N replacement
 * @returns {boolean}
 */
export function isEnabled() {
    return UtilityEnabled("ReplaceYN");
}
