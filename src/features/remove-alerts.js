/**
 * Remove Alerts Feature
 * Removes redundant alerts and warnings
 * Feature ID: RemoveAlerts
 * Type: D (Debug/Development)
 * Description: 去除多余反复的提示
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize RemoveAlerts feature
 * Modifies contest links to bypass "contest not started" alerts
 *
 * On contest pages, when the contest hasn't started yet, this feature
 * changes the link to point directly to start_contest.php, bypassing
 * the alert that would normally prevent access.
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 1666-1667: Modify contest start link
 */
export function init() {
    // Only execute if RemoveAlerts feature is enabled
    if (!UtilityEnabled("RemoveAlerts")) {
        return;
    }

    // Only execute on contest pages
    if (location.pathname !== "/contest.php") {
        return;
    }

    // Check if contest hasn't started yet
    const centerElement = document.querySelector("body > div > div.mt-3 > center");
    if (centerElement && centerElement.innerHTML.indexOf("尚未开始比赛") !== -1) {
        const contestLink = document.querySelector("body > div > div.mt-3 > center > a");
        const searchParams = new URLSearchParams(location.search);
        const cid = searchParams.get("cid");

        if (contestLink && cid) {
            // Modify link to bypass alert
            contestLink.setAttribute("href", `start_contest.php?cid=${cid}`);
        }
    }
}
