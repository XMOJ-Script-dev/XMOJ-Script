/**
 * More STD Feature
 * Adds standard solution links to contest problem tables
 * Feature ID: MoreSTD
 * Type: U (Utility)
 * Description: 在比赛题目表格中添加标程链接
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize MoreSTD feature
 * Reorganizes contest problem table to add standard solution links
 *
 * This feature:
 * 1. Removes any existing "标程" column
 * 2. Adds a new "标程" column header
 * 3. Adds links to standard solutions for each problem
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 1699-1717: Standard solution column management
 */
export function init() {
    // Only execute if MoreSTD feature is enabled
    if (!UtilityEnabled("MoreSTD")) {
        return;
    }

    // Only execute on contest pages
    if (location.pathname !== "/contest.php") {
        return;
    }

    // Check if we're in a contest with problem list
    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.get("cid")) {
        return;
    }

    // Wait for page to be ready
    setTimeout(() => {
        try {
            const tableHeader = document.querySelector("#problemset > thead > tr");

            // Only proceed if table exists and has "标程" column
            if (!tableHeader || tableHeader.innerHTML.indexOf("标程") === -1) {
                return;
            }

            // Remove existing "标程" column
            let headerCells = tableHeader.children;
            for (let i = 0; i < headerCells.length; i++) {
                if (headerCells[i].innerText === "标程") {
                    headerCells[i].remove();

                    // Remove corresponding cells from each row
                    const bodyRows = document.querySelector("#problemset > tbody").children;
                    for (let j = 0; j < bodyRows.length; j++) {
                        if (bodyRows[j].children[i] !== undefined) {
                            bodyRows[j].children[i].remove();
                        }
                    }
                }
            }

            // Add new "标程" column header
            tableHeader.innerHTML += '<td width="5%">标程</td>';

            // Add standard solution links for each problem
            const bodyRows = document.querySelector("#problemset > tbody").children;
            const cid = Number(searchParams.get("cid"));

            for (let i = 0; i < bodyRows.length; i++) {
                bodyRows[i].innerHTML +=
                    `<td><a href="https://www.xmoj.tech/problem_std.php?cid=${cid}&pid=${i}" target="_blank">打开</a></td>`;
            }
        } catch (error) {
            console.error('[MoreSTD] Error adding standard solution links:', error);
        }
    }, 100);
}
