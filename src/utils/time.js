/**
 * Time utilities for formatting and converting time values
 */

import { UtilityEnabled } from '../core/config.js';
import { SmartAlert } from './alerts.js';

/**
 * Calculates the relative time based on the input date.
 * @param {string|Date} Input - The input date.
 * @returns {string} The relative time in a formatted string.
 */
export let GetRelativeTime = (Input) => {
    try {
        Input = new Date(parseInt(Input));
        let Now = new Date().getTime();
        let Delta = Now - Input.getTime();
        let RelativeName = "";
        if (Delta < 0) {
            RelativeName = "未来";
        } else if (Delta <= 1000 * 60) {
            RelativeName = "刚刚";
        } else if (Delta <= 1000 * 60 * 60) {
            RelativeName = Math.floor((Now - Input) / 1000 / 60) + "分钟前";
        } else if (Delta <= 1000 * 60 * 60 * 24) {
            RelativeName = Math.floor((Now - Input) / 1000 / 60 / 60) + "小时前";
        } else if (Delta <= 1000 * 60 * 60 * 24 * 31) {
            RelativeName = Math.floor((Now - Input) / 1000 / 60 / 60 / 24) + "天前";
        } else if (Delta <= 1000 * 60 * 60 * 24 * 365) {
            RelativeName = Math.floor((Now - Input) / 1000 / 60 / 60 / 24 / 31) + "个月前";
        } else {
            RelativeName = Math.floor((Now - Input) / 1000 / 60 / 60 / 24 / 365) + "年前";
        }
        return "<span title=\"" + Input.toLocaleString() + "\">" + RelativeName + "</span>";
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

/**
 * Converts the given number of seconds to a formatted string representation of hours, minutes, and seconds.
 * @param {number} InputSeconds - The number of seconds to convert.
 * @returns {string} The formatted string representation of the input seconds.
 */
export let SecondsToString = (InputSeconds) => {
    try {
        let Hours = Math.floor(InputSeconds / 3600);
        let Minutes = Math.floor((InputSeconds % 3600) / 60);
        let Seconds = InputSeconds % 60;
        return (Hours < 10 ? "0" : "") + Hours + ":" + (Minutes < 10 ? "0" : "") + Minutes + ":" + (Seconds < 10 ? "0" : "") + Seconds;
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

/**
 * Converts a string in the format "hh:mm:ss" to the equivalent number of seconds.
 * @param {string} InputString - The input string to convert.
 * @returns {number} The number of seconds equivalent to the input string.
 */
export let StringToSeconds = (InputString) => {
    try {
        let SplittedString = InputString.split(":");
        return parseInt(SplittedString[0]) * 60 * 60 + parseInt(SplittedString[1]) * 60 + parseInt(SplittedString[2]);
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

/**
 * Converts a time value to a string representation.
 * @param {number} Time - The time value to convert.
 * @returns {string|number} - The converted time value as a string, or the original value if UtilityEnabled("AddUnits") is false.
 */
export let TimeToStringTime = (Time) => {
    try {
        if (UtilityEnabled("AddUnits")) {
            if (Time < 1000) {
                return Time + "ms";
            } else if (Time < 1000 * 60) {
                return (Time / 1000).toFixed(2) + "s";
            }
        } else {
            return Time;
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};
