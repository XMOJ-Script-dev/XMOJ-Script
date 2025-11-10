/**
 * Open All Problem Feature
 * Adds buttons to open all problems or only unsolved problems in new tabs
 * Feature ID: OpenAllProblem
 * Type: U (Utility)
 * Description: 添加按钮以在新标签页中打开所有题目或仅未解决的题目
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize OpenAllProblem feature
 * Adds two buttons to contest pages:
 * 1. "打开全部题目" - Opens all contest problems in new tabs
 * 2. "打开未解决题目" - Opens only unsolved problems in new tabs
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 1817-1841: Open all problem buttons
 */
export function init() {
    // Only execute if OpenAllProblem feature is enabled
    if (!UtilityEnabled("OpenAllProblem")) {
        return;
    }

    // Only execute on contest pages with problem list
    if (location.pathname !== "/contest.php") {
        return;
    }

    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.get("cid")) {
        return;
    }

    // Wait for page to be ready
    setTimeout(() => {
        try {
            // Find or create container for buttons
            let cheatDiv = document.querySelector("#CheatDiv");
            if (!cheatDiv) {
                return;
            }

            // Create "Open All Problems" button
            const openAllButton = document.createElement("button");
            openAllButton.className = "btn btn-outline-secondary";
            openAllButton.innerText = "打开全部题目";
            openAllButton.style.marginRight = "5px";
            cheatDiv.appendChild(openAllButton);

            openAllButton.addEventListener("click", () => {
                const rows = document.querySelector("#problemset > tbody").rows;
                for (let i = 0; i < rows.length; i++) {
                    open(rows[i].children[2].children[0].href, "_blank");
                }
            });

            // Create "Open Unsolved Problems" button
            const openUnsolvedButton = document.createElement("button");
            openUnsolvedButton.className = "btn btn-outline-secondary";
            openUnsolvedButton.innerText = "打开未解决题目";
            cheatDiv.appendChild(openUnsolvedButton);

            openUnsolvedButton.addEventListener("click", () => {
                const rows = document.querySelector("#problemset > tbody").rows;
                for (let i = 0; i < rows.length; i++) {
                    // Only open problems that are not marked as solved (status_y)
                    if (!rows[i].children[0].children[0].classList.contains("status_y")) {
                        open(rows[i].children[2].children[0].href, "_blank");
                    }
                }
            });
        } catch (error) {
            console.error('[OpenAllProblem] Error initializing buttons:', error);
        }
    }, 100);
}
