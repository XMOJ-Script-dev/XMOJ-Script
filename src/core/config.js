/**
 * Feature configuration and utility enabling/disabling
 */

/**
 * Check if a utility/feature is enabled
 * @param {string} Name - The name of the utility/feature
 * @returns {boolean} True if enabled, false otherwise
 */
export let UtilityEnabled = (Name) => {
    try {
        if (localStorage.getItem("UserScript-Setting-" + Name) == null) {
            const defaultOffItems = ["DebugMode", "SuperDebug", "ReplaceXM"];
            localStorage.setItem("UserScript-Setting-" + Name, defaultOffItems.includes(Name) ? "false" : "true");
        }
        return localStorage.getItem("UserScript-Setting-" + Name) == "true";
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            const { SmartAlert } = require('./alerts');
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};
