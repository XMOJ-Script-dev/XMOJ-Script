/**
 * Improve AC Rate Feature
 * Adds a button to resubmit already-AC'd problems to improve submission statistics
 * Feature ID: ImproveACRate
 * Type: U (Utility)
 * Description: 添加按钮来重新提交已AC的题目以提高正确率
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize ImproveACRate feature
 * Adds a "提高正确率" button that resubmits already-AC'd problems
 *
 * This feature:
 * 1. Fetches user's AC problems from userinfo page
 * 2. Displays current AC rate percentage
 * 3. On click, randomly selects 3 AC'd problems and resubmits them
 * 4. Uses existing AC code from status page
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 1405-1463: Improve AC rate button and logic
 */
export function init() {
    // Only execute if ImproveACRate feature is enabled
    if (!UtilityEnabled("ImproveACRate")) {
        return;
    }

    // Only execute on status page
    if (location.pathname !== "/status.php") {
        return;
    }

    // Need current username
    const currentUsername = document.querySelector("#profile")?.innerText;
    if (!currentUsername || currentUsername === "登录") {
        return;
    }

    // Wait for page to be ready
    setTimeout(async () => {
        try {
            const container = document.querySelector("body > div.container > div > div.input-append");
            if (!container) return;

            // Create improve AC rate button
            const improveACRateButton = document.createElement("button");
            container.appendChild(improveACRateButton);
            improveACRateButton.className = "btn btn-outline-secondary";
            improveACRateButton.innerText = "提高正确率";
            improveACRateButton.disabled = true;

            // Fetch user's AC problems
            let acProblems = [];
            await fetch(`https://www.xmoj.tech/userinfo.php?user=${currentUsername}`)
                .then((response) => response.text())
                .then((response) => {
                    const parsedDocument = new DOMParser().parseFromString(response, "text/html");

                    // Calculate and display AC rate
                    const acCount = parseInt(parsedDocument.querySelector("#statics > tbody > tr:nth-child(4) > td:nth-child(2)").innerText);
                    const submitCount = parseInt(parsedDocument.querySelector("#statics > tbody > tr:nth-child(3) > td:nth-child(2)").innerText);
                    const acRate = (acCount / submitCount * 100).toFixed(2);
                    improveACRateButton.innerText += ` (${acRate}%)`;

                    // Extract AC problem IDs
                    const scriptContent = parsedDocument.querySelector("#statics > tbody > tr:nth-child(2) > td:nth-child(3) > script").innerText.split("\n")[5].split(";");
                    for (let i = 0; i < scriptContent.length; i++) {
                        const problemId = Number(scriptContent[i].substring(2, scriptContent[i].indexOf(",")));
                        if (!isNaN(problemId)) {
                            acProblems.push(problemId);
                        }
                    }

                    improveACRateButton.disabled = false;
                });

            // Add click handler
            improveACRateButton.addEventListener("click", async () => {
                improveACRateButton.disabled = true;
                const submitTimes = 3;
                let count = 0;

                const submitInterval = setInterval(async () => {
                    if (count >= submitTimes) {
                        clearInterval(submitInterval);
                        location.reload();
                        return;
                    }

                    improveACRateButton.innerText = `正在提交 (${count + 1}/${submitTimes})`;

                    // Randomly select an AC'd problem
                    const pid = acProblems[Math.floor(Math.random() * acProblems.length)];

                    // Get a solution ID for this problem
                    let sid = 0;
                    await fetch(`https://www.xmoj.tech/status.php?problem_id=${pid}&jresult=4`)
                        .then((result) => result.text())
                        .then((result) => {
                            const parsedDocument = new DOMParser().parseFromString(result, "text/html");
                            sid = parsedDocument.querySelector("#result-tab > tbody > tr:nth-child(1) > td:nth-child(2)").innerText;
                        });

                    // Get the source code
                    let code = "";
                    await fetch(`https://www.xmoj.tech/getsource.php?id=${sid}`)
                        .then((response) => response.text())
                        .then((response) => {
                            code = response.substring(0, response.indexOf("/**************************************************************")).trim();
                        });

                    // Resubmit the code
                    await fetch("https://www.xmoj.tech/submit.php", {
                        headers: {
                            "content-type": "application/x-www-form-urlencoded"
                        },
                        referrer: `https://www.xmoj.tech/submitpage.php?id=${pid}`,
                        method: "POST",
                        body: `id=${pid}&language=1&source=${encodeURIComponent(code)}&enable_O2=on`
                    });

                    count++;
                }, 1000);
            });

            // Style the button
            improveACRateButton.style.marginBottom = "7px";
            improveACRateButton.style.marginRight = "7px";
        } catch (error) {
            console.error('[ImproveACRate] Error initializing button:', error);
        }
    }, 100);
}
