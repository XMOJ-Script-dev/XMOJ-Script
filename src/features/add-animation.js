/**
 * Add Animation Feature
 * Adds CSS transitions to status and test-case elements
 * Feature ID: AddAnimation
 * Type: C (Cosmetic)
 * Description: 为状态和测试用例元素添加动画
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize AddAnimation feature
 * Adds smooth transitions to status and test-case elements
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 381-384: Animation CSS
 */
export function init() {
    // Only execute if AddAnimation feature is enabled
    if (!UtilityEnabled("AddAnimation")) {
        return;
    }

    // Add CSS for animations
    const style = document.createElement('style');
    style.innerHTML = `.status, .test-case {
        transition: 0.5s !important;
    }`;
    document.head.appendChild(style);
}
