/**
 * Auto Countdown Feature
 * Automatically updates countdown timers on the page
 * Feature ID: AutoCountdown
 * Type: U (Utility)
 * Description: 自动更新页面上的倒计时器
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize AutoCountdown feature
 * Updates countdown timers with class "UpdateByJS" and reloads page when time expires
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 547-566: Countdown timer update logic
 * - Lines 1592-1594: Disables default clock on contest page
 */
export function init() {
    // Only execute if AutoCountdown feature is enabled
    if (!UtilityEnabled("AutoCountdown")) {
        return;
    }

    // Disable default clock on contest page
    if (location.pathname === "/contest.php") {
        window.clock = () => {};
    }

    // Update countdown timers
    const updateCountdowns = () => {
        const elements = document.getElementsByClassName("UpdateByJS");

        for (let i = 0; i < elements.length; i++) {
            const endTime = elements[i].getAttribute("EndTime");

            if (endTime === null) {
                elements[i].classList.remove("UpdateByJS");
                continue;
            }

            const timeStamp = parseInt(endTime) - new Date().getTime();

            // Reload page when countdown expires
            if (timeStamp < 3000) {
                elements[i].classList.remove("UpdateByJS");
                location.reload();
            }

            // Calculate remaining time
            const currentDate = new Date(timeStamp);
            const day = parseInt((timeStamp / 1000 / 60 / 60 / 24).toFixed(0));
            const hour = currentDate.getUTCHours();
            const minute = currentDate.getUTCMinutes();
            const second = currentDate.getUTCSeconds();

            // Format and display countdown
            elements[i].innerHTML =
                (day !== 0 ? day + "天" : "") +
                (hour !== 0 ? (hour < 10 ? "0" : "") + hour + "小时" : "") +
                (minute !== 0 ? (minute < 10 ? "0" : "") + minute + "分" : "") +
                (second !== 0 ? (second < 10 ? "0" : "") + second + "秒" : "");
        }
    };

    // Initial update
    updateCountdowns();

    // Update every second
    setInterval(updateCountdowns, 1000);
}
