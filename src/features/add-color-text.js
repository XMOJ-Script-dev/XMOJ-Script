/**
 * Add Color Text Feature
 * Adds CSS classes for colored text (red, green, blue)
 * Feature ID: AddColorText
 * Type: U (Utility)
 * Description: 添加彩色文本CSS类
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize AddColorText feature
 * Adds CSS classes for red, green, and blue text
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 386-395: Color text CSS
 */
export function init() {
    // Only execute if AddColorText feature is enabled
    if (!UtilityEnabled("AddColorText")) {
        return;
    }

    // Add CSS for colored text classes
    const style = document.createElement('style');
    style.innerHTML = `.red {
        color: red !important;
    }
    .green {
        color: green !important;
    }
    .blue {
        color: blue !important;
    }`;
    document.head.appendChild(style);
}
