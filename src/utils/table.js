/**
 * Table utilities for styling and tidying up tables
 */

import { UtilityEnabled } from '../core/config.js';
import { SmartAlert } from './alerts.js';

/**
 * Tidies up the given table by applying Bootstrap styling and removing unnecessary attributes.
 *
 * @param {HTMLElement} Table - The table element to be tidied up.
 */
export let TidyTable = (Table) => {
    try {
        if (UtilityEnabled("NewBootstrap") && Table != null) {
            Table.className = "table table-hover";
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};
