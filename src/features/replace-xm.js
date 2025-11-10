/**
 * Replace XM Feature
 * Replaces "小明" references with "高老师"
 * Feature ID: ReplaceXM
 * Type: C (Cosmetic/Fun)
 * Description: 将"小明"替换为"高老师"
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize ReplaceXM feature
 * Replaces text content throughout the page:
 * - "我" -> "高老师"
 * - "小明" -> "高老师"
 * - "下海" -> "上海"
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 219-222: Text replacement
 * - Line 304: Navbar brand text
 */
export function init() {
    // Only execute if ReplaceXM feature is enabled
    if (!UtilityEnabled("ReplaceXM")) {
        return;
    }

    // Replace text content throughout the page
    document.body.innerHTML = String(document.body.innerHTML).replaceAll("我", "高老师");
    document.body.innerHTML = String(document.body.innerHTML).replaceAll("小明", "高老师");
    document.body.innerHTML = String(document.body.innerHTML).replaceAll("下海", "上海");
}

/**
 * Get the site name based on ReplaceXM setting
 * Used by navbar and other UI elements
 * @returns {string} Site name
 */
export function getSiteName() {
    return UtilityEnabled("ReplaceXM") ? "高老师" : "小明";
}
