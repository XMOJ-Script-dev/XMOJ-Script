/**
 * Status Page Module
 * Handles all styling and functionality for /status.php
 */

/**
 * Initialize status page
 * @param {Object} context - Page context with utilities
 */
export async function init(context) {
    const { SearchParams } = context;

    // Only proceed if not in special UserScript mode
    if (SearchParams.get("ByUserScript") !== null) {
        return;
    }

    // Set page title
    document.title = "提交状态";

    // Remove old script tags
    const oldScript = document.querySelector("body > script:nth-child(5)");
    if (oldScript) {
        oldScript.remove();
    }

    // Additional status page initialization can go here
    // Most status page features are handled by feature modules
}
