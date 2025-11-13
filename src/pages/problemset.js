/**
 * Problemset Page Module
 * Handles all styling and functionality for /problemset.php
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize problemset page
 * @param {Object} context - Page context with utilities
 */
export async function init(context) {
    const { SearchParams } = context;

    // Set column widths
    if (UtilityEnabled("ResetType")) {
        setColumnWidths();
    }

    // Replace search forms with improved layout
    replaceSearchForms(SearchParams);

    // Store problem names in localStorage
    storeProblemNames();
}

/**
 * Set column widths for problemset table
 */
function setColumnWidths() {
    try {
        const headers = document.querySelectorAll("#problemset > thead > tr > th");
        if (headers.length >= 5) {
            headers[0].style.width = "5%";  // Status
            headers[1].style.width = "10%"; // ID
            headers[2].style.width = "75%"; // Title
            headers[3].style.width = "5%";  // AC ratio
            headers[4].style.width = "5%";  // Difficulty
        }
    } catch (error) {
        console.error('[Problemset] Error setting column widths:', error);
    }
}

/**
 * Replace search forms with improved layout
 * @param {URLSearchParams} SearchParams - URL search parameters
 */
function replaceSearchForms(SearchParams) {
    try {
        const oldTable = document.querySelector("body > div > div.mt-3 > center > table:nth-child(2)");
        if (!oldTable) return;

        oldTable.outerHTML = `
            <div class="row">
                <div class="center col-md-3"></div>
                <div class="col-md-2">
                    <form action="problem.php" class="input-group">
                        <input class="form-control" type="number" name="id" placeholder="题目编号" min="0">
                        <button class="btn btn-outline-secondary" type="submit">跳转</button>
                    </form>
                </div>
                <div class="col-md-4">
                    <form action="problemset.php" class="input-group">
                        <input class="form-control" type="text" name="search" placeholder="标题或内容">
                        <button class="btn btn-outline-secondary" type="submit">查找</button>
                    </form>
                </div>
            </div>`;

        // Restore search value if present
        const searchParam = SearchParams.get("search");
        if (searchParam) {
            const searchInput = document.querySelector("body > div > div.mt-3 > center > div > div:nth-child(3) > form > input");
            if (searchInput) {
                searchInput.value = searchParam;
            }
        }
    } catch (error) {
        console.error('[Problemset] Error replacing search forms:', error);
    }
}

/**
 * Store problem names in localStorage for quick access
 */
function storeProblemNames() {
    try {
        const rows = document.querySelector("#problemset")?.rows;
        if (!rows) return;

        for (let i = 1; i < rows.length; i++) {
            const problemId = rows[i].children[1]?.innerText;
            const problemName = rows[i].children[2]?.innerText;

            if (problemId && problemName) {
                localStorage.setItem(`UserScript-Problem-${problemId}-Name`, problemName);
            }
        }
    } catch (error) {
        console.error('[Problemset] Error storing problem names:', error);
    }
}
