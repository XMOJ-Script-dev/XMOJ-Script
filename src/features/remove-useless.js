/**
 * Remove Useless Feature
 * Removes unwanted elements from various pages
 * Feature ID: RemoveUseless
 * Type: U (Utility)
 * Description: 移除页面中的无用元素
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize remove useless feature
 * Removes various unwanted elements from the page based on current location
 *
 * This feature removes several unnecessary or distracting elements:
 * - Marquee elements (scrolling text banners)
 * - Footer elements
 * - English title headers (h2.lang_en) on problem and solution pages
 * - Submission nodes on user info pages
 * - Center tags on problem pages
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Line 320-322: Remove marquee elements
 * - Line 398-402: Remove footer
 * - Line 1222-1225: Remove h2.lang_en and second center tag on problem pages
 * - Line 2500-2505: Remove submission child nodes on userinfo page
 * - Line 3209-3211: Remove h2.lang_en on problem_solution page
 */
export function init() {
    // Only execute if RemoveUseless feature is enabled
    if (!UtilityEnabled("RemoveUseless")) {
        return;
    }

    // Remove marquee elements (scrolling banners) - Line 320-322
    const marquee = document.getElementsByTagName("marquee")[0];
    if (marquee !== undefined) {
        marquee.remove();
    }

    // Remove footer - Line 398-402
    const footer = document.getElementsByClassName("footer")[0];
    if (footer !== null) {
        footer.remove();
    }

    // Page-specific removals based on current pathname
    const pathname = location.pathname;

    // Problem page specific removals - Line 1222-1225
    if (pathname === "/problem.php") {
        const langEnHeader = document.querySelector("h2.lang_en");
        if (langEnHeader) {
            langEnHeader.remove();
        }

        const centerElements = document.getElementsByTagName("center");
        if (centerElements[1]) {
            centerElements[1].remove();
        }
    }

    // User info page specific removals - Line 2500-2505
    if (pathname === "/userinfo.php") {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get("ByUserScript") === null) {
            const submissionElement = document.getElementById("submission");
            if (submissionElement) {
                const childNodes = submissionElement.childNodes;
                // Remove all child nodes
                for (let i = childNodes.length - 1; i >= 0; i--) {
                    childNodes[i].remove();
                }
            }
        }
    }

    // Problem solution page specific removals - Line 3209-3211
    if (pathname === "/problem_solution.php") {
        const langEnHeader = document.querySelector("h2.lang_en");
        if (langEnHeader) {
            langEnHeader.remove();
        }
    }
}
