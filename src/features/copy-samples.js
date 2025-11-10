/**
 * Copy Samples Feature
 * Fixes copy functionality for test samples in problem pages
 * Feature ID: CopySamples
 * Type: F (Fix)
 * Description: 题目界面测试样例有时复制无效
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize copy samples feature
 * Adds click handlers to copy buttons that copy sample data to clipboard
 *
 * This feature fixes issues where copy buttons on the problem page don't work
 * properly. It intercepts clicks on .copy-btn elements and copies the associated
 * .sampledata content to the clipboard using GM_setClipboard.
 *
 * Expected DOM structure:
 * - Button with class "copy-btn"
 * - Parent element containing a .sampledata element with the text to copy
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js lines 1226-1244
 */
export function init() {
    // Only execute if CopySamples feature is enabled
    if (!UtilityEnabled("CopySamples")) {
        return;
    }

    // Attach click handlers to all copy buttons
    $(".copy-btn").click((Event) => {
        let CurrentButton = $(Event.currentTarget);
        let span = CurrentButton.parent().last().find(".sampledata");

        // Check if sample data element was found
        if (!span.length) {
            CurrentButton.text("未找到代码块").addClass("done");
            setTimeout(() => {
                $(".copy-btn").text("复制").removeClass("done");
            }, 1000);
            return;
        }

        // Copy sample data to clipboard
        GM_setClipboard(span.text());

        // Show success feedback
        CurrentButton.text("复制成功").addClass("done");
        setTimeout(() => {
            $(".copy-btn").text("复制").removeClass("done");
        }, 1000);
    });
}
