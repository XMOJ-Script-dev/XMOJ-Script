/**
 * Auto Login Feature
 * Automatically redirects to login page when user is not logged in
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize auto login feature
 * Checks if user is logged in and redirects to login page if necessary
 */
export function init() {
    // Only execute if AutoLogin feature is enabled
    if (!UtilityEnabled("AutoLogin")) {
        return;
    }

    // Check if navbar exists (indicates page is loaded)
    if (document.querySelector("#navbar") === null) {
        return;
    }

    // Check if profile element exists
    const profileElement = document.querySelector("#profile");
    if (profileElement === null) {
        return;
    }

    // Check if user is not logged in (profile shows "登录" = "Login")
    const isNotLoggedIn = profileElement.innerHTML === "登录";

    // Exclude login-related pages from auto-redirect
    const excludedPaths = ["/login.php", "/loginpage.php", "/lostpassword.php"];
    const isExcludedPath = excludedPaths.includes(location.pathname);

    // If user is not logged in and not already on a login page, redirect
    if (isNotLoggedIn && !isExcludedPath) {
        // Save current page to return after login
        localStorage.setItem("UserScript-LastPage", location.pathname + location.search);

        // Redirect to login page
        location.href = "https://www.xmoj.tech/loginpage.php";
    }
}
