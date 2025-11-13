/**
 * Contest Rank Pages Module
 * Handles all styling and functionality for /contestrank-oi.php and /contestrank-correct.php
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize contest rank page
 * @param {Object} context - Page context with utilities
 */
export async function init(context) {
    const { SearchParams, TidyTable, GetUsernameHTML, Style } = context;

    const pathname = location.pathname;
    const isOI = pathname === "/contestrank-oi.php";
    const isCorrect = pathname === "/contestrank-correct.php";

    // Create rank table if doesn't exist
    if (document.querySelector("#rank") === null) {
        document.querySelector("body > div > div.mt-3").innerHTML =
            '<center><h3>比赛排名</h3><a></a><table id="rank"></table></center>';
    }

    // Check if in UserScript mode
    const byUserScript = SearchParams.get("ByUserScript") !== null;

    // Handle title and headers
    const titleElement = document.querySelector("body > div > div.mt-3 > center > h3");
    if (titleElement.innerText === "比赛排名") {
        document.querySelector("#rank").innerText = "比赛暂时还没有排名";
    } else {
        if (isOI && !byUserScript) {
            await initOIRanking(titleElement, TidyTable, GetUsernameHTML);
        } else if (isCorrect) {
            initCorrectRanking(titleElement, TidyTable, GetUsernameHTML);
        }
    }

    // Add page styles
    addPageStyles(Style);

    // Hide link and set title
    const linkElement = document.querySelector("body > div.container > div > center > a");
    if (linkElement) {
        linkElement.style.display = "none";
    }

    const centerDiv = document.querySelector("body > div.container > div > center");
    if (centerDiv) {
        centerDiv.style.paddingBottom = "10px";
    }

    document.title = titleElement.innerText;
}

/**
 * Initialize OI ranking table
 */
async function initOIRanking(titleElement, TidyTable, GetUsernameHTML) {
    // Update title
    const originalTitle = titleElement.innerText;
    titleElement.innerText = originalTitle.substring(originalTitle.indexOf(" -- ") + 4) + "（OI排名）";

    // Translate headers
    translateRankHeaders();

    // Refresh ranking function
    const refreshOIRank = async () => {
        await fetch(location.href)
            .then((response) => response.text())
            .then(async (response) => {
                const parsedDocument = new DOMParser().parseFromString(response, "text/html");
                TidyTable(parsedDocument.getElementById("rank"));

                const rows = parsedDocument.getElementById("rank").rows;
                for (let i = 1; i < rows.length; i++) {
                    // Add medal badge
                    const metalCell = rows[i].cells[0];
                    const metal = document.createElement("span");
                    metal.innerText = metalCell.innerText;
                    metal.className = "badge text-bg-primary";
                    metalCell.innerText = "";
                    metalCell.appendChild(metal);

                    // Format username
                    GetUsernameHTML(rows[i].cells[1], rows[i].cells[1].innerText);

                    // Style problem cells
                    for (let j = 5; j < rows[i].cells.length; j++) {
                        styleProblemCell(rows[i].cells[j]);
                    }
                }

                // Update DOM
                document.querySelector("#rank > tbody").innerHTML = parsedDocument.querySelector("#rank > tbody").innerHTML;
            });
    };

    // Initial refresh
    await refreshOIRank();

    // Auto-refresh on focus if enabled
    if (UtilityEnabled("AutoRefresh")) {
        addEventListener("focus", refreshOIRank);
    }
}

/**
 * Initialize correct ranking table
 */
function initCorrectRanking(titleElement, TidyTable, GetUsernameHTML) {
    // Update title
    if (UtilityEnabled("ResetType")) {
        const originalTitle = titleElement.innerText;
        titleElement.innerText = originalTitle.substring(originalTitle.indexOf(" -- ") + 4) + "（订正排名）";

        const linkElement = document.querySelector("body > div > div.mt-3 > center > a");
        if (linkElement) {
            linkElement.remove();
        }
    }

    // Translate headers
    translateRankHeaders();

    // Style rows
    TidyTable(document.getElementById("rank"));
    const rows = document.getElementById("rank").rows;

    for (let i = 1; i < rows.length; i++) {
        // Add medal badge
        const metalCell = rows[i].cells[0];
        const metal = document.createElement("span");
        metal.innerText = metalCell.innerText;
        metal.className = "badge text-bg-primary";
        metalCell.innerText = "";
        metalCell.appendChild(metal);

        // Format username
        GetUsernameHTML(rows[i].cells[1], rows[i].cells[1].innerText);

        // Style problem cells
        for (let j = 5; j < rows[i].cells.length; j++) {
            styleProblemCell(rows[i].cells[j]);
        }
    }
}

/**
 * Translate rank table headers
 */
function translateRankHeaders() {
    try {
        const headers = document.querySelectorAll("#rank > thead > tr > th");
        if (headers.length >= 5) {
            headers[0].innerText = "排名";
            headers[1].innerText = "用户";
            headers[2].innerText = "昵称";
            headers[3].innerText = "AC数";
            headers[4].innerText = "得分";
        }
    } catch (error) {
        console.error('[ContestRank] Error translating headers:', error);
    }
}

/**
 * Style problem cell based on status
 * @param {HTMLTableCellElement} cell - Table cell to style
 */
function styleProblemCell(cell) {
    let innerText = cell.innerText;
    let backgroundColor = cell.style.backgroundColor;

    // Parse RGB values
    const red = parseInt(backgroundColor.substring(4, backgroundColor.indexOf(",")));
    const green = parseInt(backgroundColor.substring(backgroundColor.indexOf(",") + 2, backgroundColor.lastIndexOf(",")));
    const blue = parseInt(backgroundColor.substring(backgroundColor.lastIndexOf(",") + 2, backgroundColor.lastIndexOf(")")));

    const noData = (red === 238 && green === 238 && blue === 238);
    const firstBlood = (red === 170 && green === 170 && blue === 255);
    const solved = (green === 255);

    let errorCount = 0;
    if (solved) {
        errorCount = (blue === 170 ? 5 : (blue - 51) / 32);
    } else {
        errorCount = (blue === 22 ? 15 : (170 - blue) / 10);
    }

    // Apply styling
    if (noData) {
        backgroundColor = "";
    } else if (firstBlood) {
        backgroundColor = "rgb(127, 127, 255)";
    } else if (solved) {
        backgroundColor = `rgb(0, 255, 0, ${Math.max(1 / 10 * (10 - errorCount), 0.2)})`;
        if (errorCount !== 0) {
            innerText += ` (${errorCount === 5 ? "4+" : errorCount})`;
        }
    } else {
        backgroundColor = `rgba(255, 0, 0, ${Math.min(errorCount / 10 + 0.2, 1)})`;
        if (errorCount !== 0) {
            innerText += ` (${errorCount === 15 ? "14+" : errorCount})`;
        }
    }

    cell.innerHTML = innerText;
    cell.style.backgroundColor = backgroundColor;
    cell.style.color = UtilityEnabled("DarkMode") ? "white" : "black";
}

/**
 * Add page-specific styles
 * @param {HTMLStyleElement} Style - Style element
 */
function addPageStyles(Style) {
    Style.innerHTML += `
td {
    white-space: nowrap;
}`;
}
