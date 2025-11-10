/**
 * Export AC Code Feature
 * Exports all accepted code solutions as a ZIP file
 * Feature ID: ExportACCode
 * Type: U (Utility)
 * Description: 导出所有AC代码为ZIP文件
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize ExportACCode feature
 * Adds a button to export all accepted code solutions
 *
 * This feature:
 * 1. Adds an "导出AC代码" button to the user page
 * 2. Fetches all AC code from export_ac_code.php
 * 3. Creates a ZIP file with all accepted solutions
 * 4. Uses JSZip library for compression
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 2445-2495: Export AC code button and logic
 */
export function init() {
    // Only execute if ExportACCode feature is enabled
    if (!UtilityEnabled("ExportACCode")) {
        return;
    }

    // Only execute on user information page
    if (location.pathname !== "/userinfo.php") {
        return;
    }

    // Wait for page to be ready
    setTimeout(() => {
        try {
            const container = document.querySelector("body > div.container > div");
            if (!container) return;

            // Create export button
            const exportButton = document.createElement("button");
            container.appendChild(exportButton);
            exportButton.innerText = "导出AC代码";
            exportButton.className = "btn btn-outline-secondary";

            // Add click handler
            exportButton.addEventListener("click", () => {
                exportButton.disabled = true;
                exportButton.innerText = "正在导出...";

                const request = new XMLHttpRequest();
                request.addEventListener("readystatechange", () => {
                    if (request.readyState === 4) {
                        if (request.status === 200) {
                            const response = request.responseText;
                            const acCode = response.split("------------------------------------------------------\r\n");

                            // Load JSZip library
                            const scriptElement = document.createElement("script");
                            scriptElement.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
                            document.head.appendChild(scriptElement);

                            scriptElement.onload = () => {
                                const zip = new JSZip();

                                // Add each AC code file to ZIP
                                for (let i = 0; i < acCode.length; i++) {
                                    let currentCode = acCode[i];
                                    if (currentCode !== "") {
                                        const currentQuestionID = currentCode.substring(7, 11);
                                        currentCode = currentCode.substring(14);
                                        currentCode = currentCode.replaceAll("\r", "");
                                        zip.file(currentQuestionID + ".cpp", currentCode);
                                    }
                                }

                                exportButton.innerText = "正在生成压缩包……";
                                zip.generateAsync({ type: "blob" })
                                    .then((content) => {
                                        saveAs(content, "ACCodes.zip");
                                        exportButton.innerText = "AC代码导出成功";
                                        exportButton.disabled = false;
                                        setTimeout(() => {
                                            exportButton.innerText = "导出AC代码";
                                        }, 1000);
                                    });
                            };
                        } else {
                            exportButton.disabled = false;
                            exportButton.innerText = "AC代码导出失败";
                            setTimeout(() => {
                                exportButton.innerText = "导出AC代码";
                            }, 1000);
                        }
                    }
                });

                request.open("GET", "https://www.xmoj.tech/export_ac_code.php", true);
                request.send();
            });
        } catch (error) {
            console.error('[ExportACCode] Error initializing export button:', error);
        }
    }, 100);
}
