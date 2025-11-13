/**
 * User Info Page Module
 * Handles all styling and functionality for /userinfo.php
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize user info page
 * @param {Object} context - Page context with utilities
 */
export async function init(context) {
    const { SearchParams, GetUserInfo, GetUserBadge, GetRelativeTime, RequestAPI, SmartAlert, IsAdmin } = context;

    // Check if in ByUserScript mode (upload standard solution)
    if (SearchParams.get("ByUserScript") !== null) {
        document.title = "上传标程";
        // Upload standard solution UI is handled in bootstrap.js
        return;
    }

    // Clean up submission section if RemoveUseless is enabled
    if (UtilityEnabled("RemoveUseless")) {
        cleanupSubmissionSection();
    }

    // Execute embedded script (chart initialization)
    executeEmbeddedScript();

    // Translate table headers
    translateTableHeaders();

    // Extract and display user information
    await displayUserProfile(GetUserInfo, GetUserBadge, GetRelativeTime, RequestAPI, SmartAlert, IsAdmin);
}

/**
 * Clean up submission section
 */
function cleanupSubmissionSection() {
    try {
        const submissionElement = document.getElementById("submission");
        if (submissionElement) {
            const childNodes = submissionElement.childNodes;
            for (let i = childNodes.length - 1; i >= 0; i--) {
                childNodes[i].remove();
            }
        }
    } catch (error) {
        console.error('[UserInfo] Error cleaning up submission section:', error);
    }
}

/**
 * Execute embedded chart script
 */
function executeEmbeddedScript() {
    try {
        const scriptElement = document.querySelector("body > script:nth-child(5)");
        if (scriptElement) {
            eval(scriptElement.innerHTML);
        }
    } catch (error) {
        console.error('[UserInfo] Error executing embedded script:', error);
    }
}

/**
 * Translate table headers
 */
function translateTableHeaders() {
    try {
        // Remove first row
        const firstRow = document.querySelector("#statics > tbody > tr:nth-child(1)");
        if (firstRow) {
            firstRow.remove();
        }

        // Translate remaining headers
        const rows = document.querySelector("#statics > tbody")?.children;
        if (!rows) return;

        for (let i = 0; i < rows.length; i++) {
            if (rows[i].children[0]) {
                const headerText = rows[i].children[0].innerText;
                if (headerText === "Statistics") {
                    rows[i].children[0].innerText = "统计";
                } else if (headerText === "Email:") {
                    rows[i].children[0].innerText = "电子邮箱";
                }
                rows[i].children[1].removeAttribute("align");
            }
        }
    } catch (error) {
        console.error('[UserInfo] Error translating table headers:', error);
    }
}

/**
 * Display user profile with avatar and solved problems
 * @param {Function} GetUserInfo - Function to get user info
 * @param {Function} GetUserBadge - Function to get user badge
 * @param {Function} GetRelativeTime - Function to format relative time
 * @param {Function} RequestAPI - Function to make API requests
 * @param {Function} SmartAlert - Function to show alerts
 * @param {boolean} IsAdmin - Whether current user is admin
 */
async function displayUserProfile(GetUserInfo, GetUserBadge, GetRelativeTime, RequestAPI, SmartAlert, IsAdmin) {
    try {
        // Extract AC problems
        const acCell = document.querySelector("#statics > tbody > tr:nth-child(1) > td:nth-child(3)");
        const acProblems = [];

        if (acCell) {
            const childNodes = acCell.childNodes;
            for (let i = 0; i < childNodes.length; i++) {
                if (childNodes[i].tagName === "A" && childNodes[i].href.indexOf("problem.php?id=") !== -1) {
                    acProblems.push(Number(childNodes[i].innerText.trim()));
                }
            }
            acCell.remove();
        }

        // Extract user info from caption
        const caption = document.querySelector("#statics > caption");
        if (!caption) return;

        const captionText = caption.childNodes[0].data.trim();
        const [userId, userNick] = captionText.split("--");
        caption.remove();

        // Set page title
        document.title = `用户 ${userId} 的个人中心`;

        // Create new layout
        await createUserLayout(userId, userNick, acProblems, GetUserInfo, GetUserBadge, GetRelativeTime, RequestAPI, SmartAlert, IsAdmin);
    } catch (error) {
        console.error('[UserInfo] Error displaying user profile:', error);
    }
}

/**
 * Create user profile layout with avatar, info, and solved problems
 */
async function createUserLayout(userId, userNick, acProblems, GetUserInfo, GetUserBadge, GetRelativeTime, RequestAPI, SmartAlert, IsAdmin) {
    // Create main row
    const row = document.createElement("div");
    row.className = "row";

    // Left column
    const leftDiv = document.createElement("div");
    leftDiv.className = "col-md-5";
    row.appendChild(leftDiv);

    // Avatar and user info
    const leftTopDiv = document.createElement("div");
    leftTopDiv.className = "row mb-2";
    leftDiv.appendChild(leftTopDiv);

    // Avatar
    const avatarContainer = document.createElement("div");
    avatarContainer.classList.add("col-auto");
    const avatarElement = document.createElement("img");

    const userInfo = await GetUserInfo(userId);
    const emailHash = userInfo?.EmailHash;

    if (!emailHash) {
        avatarElement.src = `https://cravatar.cn/avatar/00000000000000000000000000000000?d=mp&f=y`;
    } else {
        avatarElement.src = `https://cravatar.cn/avatar/${emailHash}?d=retro`;
    }

    avatarElement.classList.add("rounded", "me-2");
    avatarElement.style.height = "120px";
    avatarContainer.appendChild(avatarElement);
    leftTopDiv.appendChild(avatarContainer);

    // User info
    const userInfoElement = document.createElement("div");
    userInfoElement.classList.add("col-auto");
    userInfoElement.style.lineHeight = "40px";
    userInfoElement.innerHTML += `用户名：${userId}<br>`;
    userInfoElement.innerHTML += `昵称：${userNick}<br>`;

    if (UtilityEnabled("Rating")) {
        userInfoElement.innerHTML += `评分：${userInfo?.Rating || 'N/A'}<br>`;
    }

    // Last online time (async)
    const lastOnlineElement = document.createElement('div');
    lastOnlineElement.innerHTML = "最后在线：加载中...<br>";
    userInfoElement.appendChild(lastOnlineElement);

    RequestAPI("LastOnline", { "Username": userId }, (result) => {
        if (result.Success) {
            lastOnlineElement.innerHTML = `最后在线：${GetRelativeTime(result.Data.logintime)}<br>`;
        } else {
            lastOnlineElement.innerHTML = "最后在线：近三个月内从未<br>";
        }
    });

    // Badge management buttons (admin only)
    if (IsAdmin) {
        await addBadgeManagement(userId, userInfoElement, GetUserBadge, RequestAPI, SmartAlert);
    }

    leftTopDiv.appendChild(userInfoElement);

    // Move statistics table to left column
    const leftTable = document.querySelector("body > div > div > center > table");
    if (leftTable) {
        leftDiv.appendChild(leftTable);
    }

    // Right column - AC problems
    const rightDiv = document.createElement("div");
    rightDiv.className = "col-md-7";
    row.appendChild(rightDiv);
    rightDiv.innerHTML = "<h5>已解决题目</h5>";

    for (const problemId of acProblems) {
        rightDiv.innerHTML += `<a href="https://www.xmoj.tech/problem.php?id=${problemId}" target="_blank">${problemId}</a> `;
    }

    // Replace page content
    const contentDiv = document.querySelector("body > div > div");
    if (contentDiv) {
        contentDiv.innerHTML = "";
        contentDiv.appendChild(row);
    }
}

/**
 * Add badge management buttons for admins
 */
async function addBadgeManagement(userId, container, GetUserBadge, RequestAPI, SmartAlert) {
    const badgeInfo = await GetUserBadge(userId);

    if (badgeInfo.Content !== "") {
        // Delete badge button
        const deleteBadgeButton = document.createElement("button");
        deleteBadgeButton.className = "btn btn-outline-danger btn-sm";
        deleteBadgeButton.innerText = "删除标签";
        deleteBadgeButton.addEventListener("click", async () => {
            if (confirm("您确定要删除此标签吗？")) {
                RequestAPI("DeleteBadge", { "UserID": userId }, (response) => {
                    if (response.Success) {
                        clearBadgeCache(userId);
                        window.location.reload();
                    } else {
                        SmartAlert(response.Message);
                    }
                });
            }
        });
        container.appendChild(deleteBadgeButton);
    } else {
        // Add badge button
        const addBadgeButton = document.createElement("button");
        addBadgeButton.className = "btn btn-outline-primary btn-sm";
        addBadgeButton.innerText = "添加标签";
        addBadgeButton.addEventListener("click", async () => {
            RequestAPI("NewBadge", { "UserID": userId }, (response) => {
                if (response.Success) {
                    clearBadgeCache(userId);
                    window.location.reload();
                } else {
                    SmartAlert(response.Message);
                }
            });
        });
        container.appendChild(addBadgeButton);
    }
}

/**
 * Clear badge cache for a user
 * @param {string} userId - User ID
 */
function clearBadgeCache(userId) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`UserScript-User-${userId}-Badge-`)) {
            keysToRemove.push(key);
        }
    }
    for (const key of keysToRemove) {
        localStorage.removeItem(key);
    }
}
