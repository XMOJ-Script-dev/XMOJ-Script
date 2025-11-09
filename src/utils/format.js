/**
 * Formatting utilities for sizes and other values
 */

import { UtilityEnabled } from '../core/config.js';
import { SmartAlert } from './alerts.js';

/**
 * Converts a memory size in bytes to a human-readable string representation.
 * @param {number} Memory - The memory size in bytes.
 * @returns {string} The human-readable string representation of the memory size.
 */
export let SizeToStringSize = (Memory) => {
    try {
        if (UtilityEnabled("AddUnits")) {
            if (Memory < 1024) {
                return Memory + "KB";
            } else if (Memory < 1024 * 1024) {
                return (Memory / 1024).toFixed(2) + "MB";
            } else if (Memory < 1024 * 1024 * 1024) {
                return (Memory / 1024 / 1024).toFixed(2) + "GB";
            } else {
                return (Memory / 1024 / 1024 / 1024).toFixed(2) + "TB";
            }
        } else {
            return Memory;
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

/**
 * Converts a code size in bytes to a human-readable string representation.
 * @param {number} Memory - The code size in bytes.
 * @returns {string} The human-readable string representation of the code size.
 */
export let CodeSizeToStringSize = (Memory) => {
    try {
        if (UtilityEnabled("AddUnits")) {
            if (Memory < 1024) {
                return Memory + "B";
            } else if (Memory < 1024 * 1024) {
                return (Memory / 1024).toFixed(2) + "KB";
            } else if (Memory < 1024 * 1024 * 1024) {
                return (Memory / 1024 / 1024).toFixed(2) + "MB";
            } else {
                return (Memory / 1024 / 1024 / 1024).toFixed(2) + "GB";
            }
        } else {
            return Memory;
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};
