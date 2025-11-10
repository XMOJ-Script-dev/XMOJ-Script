/**
 * Compare Source Feature
 * Allows users to compare two source code submissions side-by-side using CodeMirror MergeView
 *
 * Extracted from bootstrap.js:
 * - Lines 985: Feature definition
 * - Lines 1465-1474: Button on problem page
 * - Lines 2720-2787: Main comparison interface
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize compare source feature
 * - Adds a "Compare Submissions" button on problem pages
 * - Creates comparison interface on comparesource.php page
 */
export async function init() {
    // Only execute if CompareSource feature is enabled
    if (!UtilityEnabled("CompareSource")) {
        return;
    }

    // Add "Compare Submissions" button on problem pages
    addCompareButtonOnProblemPage();

    // Handle comparison interface on comparesource.php page
    if (location.pathname === "/comparesource.php") {
        await handleCompareSourcePage();
    }
}

/**
 * Adds a "Compare Submissions" button on problem pages
 * Button navigates to comparesource.php when clicked
 */
function addCompareButtonOnProblemPage() {
    const inputAppend = document.querySelector("body > div.container > div > div.input-append");
    if (!inputAppend) {
        return;
    }

    const compareButton = document.createElement("button");
    inputAppend.appendChild(compareButton);
    compareButton.className = "btn btn-outline-secondary";
    compareButton.innerText = "比较提交记录";
    compareButton.addEventListener("click", () => {
        location.href = "https://www.xmoj.tech/comparesource.php";
    });
    compareButton.style.marginBottom = "7px";
}

/**
 * Handles the compare source page functionality
 * Creates either a form to input submission IDs or displays a side-by-side comparison
 */
async function handleCompareSourcePage() {
    const searchParams = new URLSearchParams(location.search);

    // If no search parameters, show the input form
    if (location.search === "") {
        createComparisonForm();
    } else {
        // If search parameters exist, fetch and display the comparison
        await createComparisonView(searchParams);
    }
}

/**
 * Creates the form to input submission IDs for comparison
 */
function createComparisonForm() {
    const container = document.querySelector("body > div.container > div");
    if (!container) {
        return;
    }

    container.innerHTML = "";

    // Left code input
    const leftCodeText = document.createElement("span");
    container.appendChild(leftCodeText);
    leftCodeText.innerText = "左侧代码的运行编号：";

    const leftCode = document.createElement("input");
    container.appendChild(leftCode);
    leftCode.classList.add("form-control");
    leftCode.style.width = "40%";
    leftCode.style.marginBottom = "5px";

    // Right code input
    const rightCodeText = document.createElement("span");
    container.appendChild(rightCodeText);
    rightCodeText.innerText = "右侧代码的运行编号：";

    const rightCode = document.createElement("input");
    container.appendChild(rightCode);
    rightCode.classList.add("form-control");
    rightCode.style.width = "40%";
    rightCode.style.marginBottom = "5px";

    // Compare button
    const compareButton = document.createElement("button");
    container.appendChild(compareButton);
    compareButton.innerText = "比较";
    compareButton.className = "btn btn-primary";
    compareButton.addEventListener("click", () => {
        location.href = "https://www.xmoj.tech/comparesource.php?left=" +
            Number(leftCode.value) + "&right=" + Number(rightCode.value);
    });
}

/**
 * Creates the side-by-side comparison view using CodeMirror MergeView
 * @param {URLSearchParams} searchParams - URL parameters containing left and right submission IDs
 */
async function createComparisonView(searchParams) {
    const mtElement = document.querySelector("body > div > div.mt-3");
    if (!mtElement) {
        return;
    }

    // Create comparison interface with checkbox and comparison element
    mtElement.innerHTML = `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" checked id="IgnoreWhitespace">
            <label class="form-check-label" for="IgnoreWhitespace">忽略空白</label>
        </div>
        <div id="CompareElement"></div>`;

    // Fetch left code
    let leftCode = "";
    await fetch("https://www.xmoj.tech/getsource.php?id=" + searchParams.get("left"))
        .then((response) => {
            return response.text();
        })
        .then((response) => {
            leftCode = response.substring(0, response.indexOf("/**************************************************************")).trim();
        });

    // Fetch right code
    let rightCode = "";
    await fetch("https://www.xmoj.tech/getsource.php?id=" + searchParams.get("right"))
        .then((response) => {
            return response.text();
        })
        .then((response) => {
            rightCode = response.substring(0, response.indexOf("/**************************************************************")).trim();
        });

    // Create CodeMirror MergeView for side-by-side comparison
    const compareElement = document.getElementById("CompareElement");
    const mergeViewElement = CodeMirror.MergeView(compareElement, {
        value: leftCode,
        origLeft: null,
        orig: rightCode,
        lineNumbers: true,
        mode: "text/x-c++src",
        collapseIdentical: "true",
        readOnly: true,
        theme: (UtilityEnabled("DarkMode") ? "darcula" : "default"),
        revertButtons: false,
        ignoreWhitespace: true
    });

    // Add event listener for ignore whitespace checkbox
    const ignoreWhitespace = document.getElementById("IgnoreWhitespace");
    ignoreWhitespace.addEventListener("change", () => {
        mergeViewElement.ignoreWhitespace = ignoreWhitespace.checked;
    });
}
