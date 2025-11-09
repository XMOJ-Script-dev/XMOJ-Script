/**
 * HTML utilities for escaping and purifying HTML content
 */

import { UtilityEnabled } from '../core/config.js';
import { SmartAlert } from './alerts.js';

/**
 * Escapes HTML special characters
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export let escapeHTML = (str) => {
    return str.replace(/[&<>"']/g, function (match) {
        const escape = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escape[match];
    });
};

/**
 * Purifies HTML content using DOMPurify
 * @param {string} Input - The HTML content to purify
 * @returns {string} The purified HTML content
 */
export let PurifyHTML = (Input) => {
    try {
        return DOMPurify.sanitize(Input, {
            "ALLOWED_TAGS": ["a", "b", "big", "blockquote", "br", "code", "dd", "del", "div", "dl", "dt", "em", "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8", "hr", "i", "img", "ins", "kbd", "li", "ol", "p", "pre", "q", "rp", "rt", "ruby", "s", "samp", "strike", "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "tt", "ul", "var"],
            "ALLOWED_ATTR": ["abbr", "accept", "accept-charset", "accesskey", "action", "align", "alt", "axis", "border", "cellpadding", "cellspacing", "char", "charoff", "charset", "checked", "cite", "clear", "color", "cols", "colspan", "compact", "coords", "datetime", "dir", "disabled", "enctype", "for", "frame", "headers", "height", "href", "hreflang", "hspace", "ismap", "itemprop", "label", "lang", "longdesc", "maxlength", "media", "method", "multiple", "name", "nohref", "noshade", "nowrap", "prompt", "readonly", "rel", "rev", "rows", "rowspan", "rules", "scope", "selected", "shape", "size", "span", "src", "start", "summary", "tabindex", "target", "title", "type", "usemap", "valign", "value", "vspace", "width"]
        });
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};
