/**
 * Problem Page Module
 * Handles all styling and functionality for /problem.php
 */

import { UtilityEnabled } from '../core/config.js';
import { TidyTable } from '../utils/table.js';

/**
 * Initialize problem page
 * @param {Object} context - Page context with utilities
 */
export async function init(context) {
    const { SearchParams, RenderMathJax, RequestAPI, Style } = context;

    // Render MathJax
    await RenderMathJax();

    // Check if problem doesn't exist
    if (document.querySelector("body > div > div.mt-3 > h2") != null) {
        document.querySelector("body > div > div.mt-3").innerHTML = "没有此题目或题目对你不可见";
        setTimeout(() => {
            location.href = "https://www.xmoj.tech/problemset.php";
        }, 1000);
        return;
    }

    const PID = SearchParams.get("cid")
        ? localStorage.getItem(`UserScript-Contest-${SearchParams.get("cid")}-Problem-${SearchParams.get("pid")}-PID`)
        : SearchParams.get("id");

    // Fix spacing
    if (document.querySelector("body > div > div.mt-3 > center").lastElementChild !== null) {
        document.querySelector("body > div > div.mt-3 > center").lastElementChild.style.marginLeft = "10px";
    }

    // Fix submit button
    fixSubmitButton();

    // Style sample data cards
    const sampleDataElements = document.querySelectorAll(".sampledata");
    for (let i = 0; i < sampleDataElements.length; i++) {
        sampleDataElements[i].parentElement.className = "card";
    }

    // Handle IO file information
    handleIOFile(PID);

    // Add discussion button (if Discussion feature is enabled)
    if (UtilityEnabled("Discussion")) {
        addDiscussionButton(PID, SearchParams, RequestAPI);
    }

    // Tidy tables
    const tables = document.getElementsByTagName("table");
    for (let i = 0; i < tables.length; i++) {
        TidyTable(tables[i]);
    }

    // Add custom styles
    addPageStyles(Style);
}

/**
 * Fix submit button styling and behavior
 */
function fixSubmitButton() {
    // Try multiple selectors to find the submit link (it keeps moving position)
    const selectors = [
        '.mt-3 > center:nth-child(1) > a:nth-child(12)',
        '.mt-3 > center:nth-child(1) > a:nth-child(10)',
        '.mt-3 > center:nth-child(1) > a:nth-child(11)',
        '.mt-3 > center:nth-child(1) > a:nth-child(13)',
        '.mt-3 > center:nth-child(1) > a:nth-child(9)',
        '.mt-3 > center:nth-child(1) > a:nth-child(7)',
        '.mt-3 > center:nth-child(1) > a:nth-child(8)',
    ];

    let submitLink = null;
    for (const selector of selectors) {
        submitLink = document.querySelector(selector);
        if (submitLink) break;
    }

    if (!submitLink) return;

    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.id = 'SubmitButton';
    submitButton.className = 'btn btn-outline-secondary';
    submitButton.textContent = '提交';
    submitButton.onclick = function () {
        window.location.href = submitLink.href;
    };

    // Replace the link with the button
    submitLink.parentNode.replaceChild(submitButton, submitLink);

    // Remove the button's outer brackets
    const container = document.querySelector('.mt-3 > center:nth-child(1)');
    if (container) {
        let str = container.innerHTML;
        let target = submitButton.outerHTML;
        let result = str.replace(new RegExp(`(.?)${target}(.?)`, 'g'), target);
        container.innerHTML = result;

        // Re-attach click handler after innerHTML replacement
        const newButton = document.querySelector('html body.placeholder-glow div.container div.mt-3 center button#SubmitButton.btn.btn-outline-secondary');
        if (newButton) {
            newButton.onclick = function () {
                window.location.href = submitLink.href;
            };
        }
    }
}

/**
 * Handle IO file information display
 * @param {string} PID - Problem ID
 */
function handleIOFile(PID) {
    const ioFileElement = document.querySelector("body > div > div.mt-3 > center > h3");
    if (!ioFileElement) return;

    // Move child nodes out of h3
    while (ioFileElement.childNodes.length >= 1) {
        ioFileElement.parentNode.insertBefore(ioFileElement.childNodes[0], ioFileElement);
    }
    ioFileElement.parentNode.insertBefore(document.createElement("br"), ioFileElement);
    ioFileElement.remove();

    // Extract and store IO filename
    const centerNode = document.querySelector("body > div > div.mt-3 > center");
    if (centerNode && centerNode.childNodes[2]) {
        const temp = centerNode.childNodes[2].data.trim();
        const ioFilename = temp.substring(0, temp.length - 3);
        localStorage.setItem(`UserScript-Problem-${PID}-IOFilename`, ioFilename);
    }
}

/**
 * Add discussion button with unread badge
 * @param {string} PID - Problem ID
 * @param {URLSearchParams} SearchParams - URL search parameters
 * @param {Function} RequestAPI - API request function
 */
function addDiscussionButton(PID, SearchParams, RequestAPI) {
    const discussButton = document.createElement("button");
    discussButton.className = "btn btn-outline-secondary position-relative";
    discussButton.innerHTML = `讨论`;
    discussButton.style.marginLeft = "10px";
    discussButton.type = "button";

    discussButton.addEventListener("click", () => {
        const problemId = SearchParams.get("cid") ? PID : SearchParams.get("id");
        open(`https://www.xmoj.tech/discuss3/discuss.php?pid=${problemId}`, "_blank");
    });

    document.querySelector("body > div > div.mt-3 > center").appendChild(discussButton);

    // Add unread badge
    const unreadBadge = document.createElement("span");
    unreadBadge.className = "position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger";
    unreadBadge.style.display = "none";
    discussButton.appendChild(unreadBadge);

    // Refresh unread count
    const refreshCount = () => {
        RequestAPI("GetPostCount", {
            "ProblemID": Number(PID)
        }, (response) => {
            if (response.Success && response.Data.DiscussCount != 0) {
                unreadBadge.innerText = response.Data.DiscussCount;
                unreadBadge.style.display = "";
            }
        });
    };

    refreshCount();
    addEventListener("focus", refreshCount);
}

/**
 * Add custom page styles
 * @param {HTMLStyleElement} Style - Style element to append to
 */
function addPageStyles(Style) {
    Style.innerHTML += `
code, kbd, pre, samp {
    font-family: monospace, Consolas, 'Courier New';
    font-size: 1rem;
}
pre {
    padding: 0.3em 0.5em;
    margin: 0.5em 0;
}
.in-out {
    overflow: hidden;
    display: flex;
    padding: 0.5em 0;
}
.in-out .in-out-item {
    flex: 1;
}`;
}
