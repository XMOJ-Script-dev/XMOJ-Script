/**
 * Replace Links Feature
 * Replaces bracketed links with styled buttons
 * Feature ID: ReplaceLinks
 * Type: F (Format/UI)
 * Description: 将网站中所有以方括号包装的链接替换为按钮
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize ReplaceLinks feature
 * Replaces all links in format [<a href="...">text</a>] with styled buttons
 *
 * Example transformation:
 * [<a href="/problem.php?id=1001">Problem 1001</a>]
 * -> <button onclick="location.href='/problem.php?id=1001'" class="btn btn-outline-secondary">Problem 1001</button>
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 216-218: Link to button replacement
 */
export function init() {
    // Only execute if ReplaceLinks feature is enabled
    if (!UtilityEnabled("ReplaceLinks")) {
        return;
    }

    // Replace all bracketed links with buttons
    document.body.innerHTML = String(document.body.innerHTML).replaceAll(
        /\[<a href="([^"]*)">([^<]*)<\/a>\]/g,
        '<button onclick="location.href=\'$1\'" class="btn btn-outline-secondary">$2</button>'
    );
}
