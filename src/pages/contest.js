/**
 * Contest Page Module
 * Handles all styling and functionality for /contest.php
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize contest page
 * @param {Object} context - Page context with utilities
 */
export async function init(context) {
    const { SearchParams } = context;

    // Check if viewing specific contest or contest list
    if (location.href.indexOf("?cid=") === -1) {
        // Contest list page
        initContestList();
    } else {
        // Specific contest page
        initContestView(SearchParams);
    }
}

/**
 * Initialize contest list view
 */
function initContestList() {
    // Style contest list table rows
    const contestRows = document.querySelector("body > div > div.mt-3 > center > table > tbody")?.childNodes;
    if (!contestRows) return;

    for (let i = 1; i < contestRows.length; i++) {
        const currentElement = contestRows[i].childNodes[2]?.childNodes;
        if (!currentElement) continue;

        // Handle different contest states
        if (currentElement[1]?.childNodes[0]?.data?.indexOf("运行中") !== -1) {
            handleRunningContest(currentElement);
        } else if (currentElement[1]?.childNodes[0]?.data?.indexOf("开始于") !== -1) {
            handleUpcomingContest(currentElement);
        } else if (currentElement[1]?.childNodes[0]?.data?.indexOf("已结束") !== -1) {
            handleFinishedContest(currentElement);
        }

        // Hide column and add user link
        contestRows[i].childNodes[3].style.display = "none";
        const creator = contestRows[i].childNodes[4].innerHTML;
        contestRows[i].childNodes[4].innerHTML = `<a href="https://www.xmoj.tech/userinfo.php?user=${creator}">${creator}</a>`;

        // Store contest name
        const contestId = contestRows[i].childNodes[0].innerText;
        const contestName = contestRows[i].childNodes[1].innerText;
        localStorage.setItem(`UserScript-Contest-${contestId}-Name`, contestName);
    }
}

/**
 * Handle running contest countdown
 * @param {NodeList} element - Contest row element
 */
function handleRunningContest(element) {
    const time = String(element[1].childNodes[1].innerText).substring(4);

    // Parse time components
    const day = parseInt(time.substring(0, time.indexOf("天"))) || 0;
    const hourStart = time.indexOf("天") === -1 ? 0 : time.indexOf("天") + 1;
    const hour = parseInt(time.substring(hourStart, time.indexOf("小时"))) || 0;
    const minuteStart = time.indexOf("小时") === -1 ? 0 : time.indexOf("小时") + 2;
    const minute = parseInt(time.substring(minuteStart, time.indexOf("分"))) || 0;
    const secondStart = time.indexOf("分") === -1 ? 0 : time.indexOf("分") + 1;
    const second = parseInt(time.substring(secondStart, time.indexOf("秒"))) || 0;

    // Calculate timestamp
    const diff = window.diff || 0; // Global time diff
    const timeStamp = new Date().getTime() + diff + ((((day * 24 + hour) * 60 + minute) * 60 + second) * 1000);

    element[1].childNodes[1].setAttribute("EndTime", timeStamp);
    element[1].childNodes[1].classList.add("UpdateByJS");
}

/**
 * Handle upcoming contest
 * @param {NodeList} element - Contest row element
 */
function handleUpcomingContest(element) {
    const diff = window.diff || 0;
    const timeStamp = Date.parse(String(element[1].childNodes[0].data).substring(4)) + diff;
    element[1].setAttribute("EndTime", timeStamp);
    element[1].classList.add("UpdateByJS");
}

/**
 * Handle finished contest
 * @param {NodeList} element - Contest row element
 */
function handleFinishedContest(element) {
    const timeStamp = String(element[1].childNodes[0].data).substring(4);
    element[1].childNodes[0].data = " 已结束 ";
    element[1].className = "red";

    const span = document.createElement("span");
    span.className = "green";
    span.innerHTML = timeStamp;
    element[1].appendChild(span);
}

/**
 * Initialize specific contest view
 * @param {URLSearchParams} SearchParams - URL search parameters
 */
function initContestView(SearchParams) {
    // Update title
    const title = document.getElementsByTagName("h3")[0];
    if (title) {
        title.innerHTML = "比赛" + title.innerHTML.substring(7);
    }

    // Handle countdown timer
    const timeLeft = document.querySelector("#time_left");
    if (timeLeft) {
        const centerNode = document.querySelector("body > div > div.mt-3 > center");
        let endTimeText = centerNode?.childNodes[3]?.data;

        if (endTimeText) {
            endTimeText = endTimeText.substring(endTimeText.indexOf("结束时间是：") + 6, endTimeText.lastIndexOf("。"));
            const endTime = new Date(endTimeText).getTime();

            if (new Date().getTime() < endTime) {
                timeLeft.classList.add("UpdateByJS");
                timeLeft.setAttribute("EndTime", endTime);
            }
        }
    }

    // Format contest information
    const infoDiv = document.querySelector("body > div > div.mt-3 > center > div");
    if (infoDiv) {
        let htmlData = infoDiv.innerHTML;
        htmlData = htmlData.replaceAll("&nbsp;&nbsp;\n&nbsp;&nbsp;", "&nbsp;");
        htmlData = htmlData.replaceAll("<br>开始于: ", "开始时间：");
        htmlData = htmlData.replaceAll("\n结束于: ", "<br>结束时间：");
        htmlData = htmlData.replaceAll("\n订正截止日期: ", "<br>订正截止日期：");
        htmlData = htmlData.replaceAll("\n现在时间: ", "当前时间：");
        htmlData = htmlData.replaceAll("\n状态:", "<br>状态：");
        infoDiv.innerHTML = htmlData;
    }

    // Format problem list
    formatProblemList();

    // Store problem count
    const problemCount = document.querySelector("#problemset > tbody")?.rows.length;
    if (problemCount) {
        localStorage.setItem(`UserScript-Contest-${SearchParams.get("cid")}-ProblemCount`, problemCount);
    }
}

/**
 * Format problem list in contest
 */
function formatProblemList() {
    const tbody = document.querySelector("#problemset > tbody");
    if (!tbody) return;

    // Format problem names
    tbody.innerHTML = tbody.innerHTML.replaceAll(
        /\t&nbsp;([0-9]*) &nbsp;&nbsp;&nbsp;&nbsp; 问题 &nbsp;([^<]*)/g,
        "$2. $1"
    );
    tbody.innerHTML = tbody.innerHTML.replaceAll(
        /\t\*([0-9]*) &nbsp;&nbsp;&nbsp;&nbsp; 问题 &nbsp;([^<]*)/g,
        "拓展$2. $1"
    );

    // Ensure status divs exist
    const rows = tbody.rows;
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].childNodes[0]?.children.length === 0) {
            rows[i].childNodes[0].innerHTML = '<div class="status"></div>';
        }

        // Make problem title link open in new tab
        const titleLink = rows[i].children[2]?.children[0];
        if (titleLink) {
            titleLink.target = "_blank";
        }
    }
}
