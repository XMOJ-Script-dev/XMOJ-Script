/**
 * Translate Feature
 * Translates English text to Chinese throughout the site
 * Feature ID: Translate
 * Type: F (Format/UI)
 * Description: 统一使用中文，翻译了部分英文
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize Translate feature
 * Translates various English UI elements to Chinese based on current page
 *
 * Translations include:
 * - Navbar: "Problems" -> "题库"
 * - Problem set page: Form placeholders and table headers
 * - Contest page: Table headers
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 211-213: Navbar translation
 * - Lines 1073-1078: Problemset page translations
 * - Lines 1611-1617: Contest page translations
 */
export function init() {
    // Only execute if Translate feature is enabled
    if (!UtilityEnabled("Translate")) {
        return;
    }

    const pathname = location.pathname;

    // Translate navbar (on all pages)
    translateNavbar();

    // Page-specific translations
    if (pathname === "/problemset.php") {
        translateProblemsetPage();
    } else if (pathname === "/contest.php") {
        translateContestPage();
    }
}

/**
 * Translate navbar elements
 */
function translateNavbar() {
    try {
        const problemsLink = document.querySelector("#navbar > ul:nth-child(1) > li:nth-child(2) > a");
        if (problemsLink) {
            problemsLink.innerText = "题库";
        }
    } catch (e) {
        console.error('[Translate] Error translating navbar:', e);
    }
}

/**
 * Translate problemset page elements
 */
function translateProblemsetPage() {
    try {
        // Translate search form placeholders and buttons
        const problemIdInput = document.querySelector("body > div > div.mt-3 > center > table:nth-child(2) > tbody > tr > td:nth-child(2) > form > input");
        if (problemIdInput) {
            problemIdInput.placeholder = "题目编号";
        }

        const confirmButton = document.querySelector("body > div > div.mt-3 > center > table:nth-child(2) > tbody > tr > td:nth-child(2) > form > button");
        if (confirmButton) {
            confirmButton.innerText = "确认";
        }

        const searchInput = document.querySelector("body > div > div.mt-3 > center > table:nth-child(2) > tbody > tr > td:nth-child(3) > form > input");
        if (searchInput) {
            searchInput.placeholder = "标题或内容";
        }

        // Translate table header
        const statusHeader = document.querySelector("#problemset > thead > tr > th:nth-child(1)");
        if (statusHeader) {
            statusHeader.innerText = "状态";
        }
    } catch (e) {
        console.error('[Translate] Error translating problemset page:', e);
    }
}

/**
 * Translate contest page table headers
 */
function translateContestPage() {
    try {
        const tableHeader = document.querySelector("body > div > div.mt-3 > center > table > thead > tr");
        if (tableHeader && tableHeader.childNodes.length >= 4) {
            tableHeader.childNodes[0].innerText = "编号";
            tableHeader.childNodes[1].innerText = "标题";
            tableHeader.childNodes[2].innerText = "状态";
            tableHeader.childNodes[3].remove();
            if (tableHeader.childNodes[3]) {
                tableHeader.childNodes[3].innerText = "创建者";
            }
        }
    } catch (e) {
        console.error('[Translate] Error translating contest page:', e);
    }
}
