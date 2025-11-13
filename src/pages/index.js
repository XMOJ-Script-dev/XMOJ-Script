/**
 * Page loader - Initializes page-specific modules based on current URL
 *
 * This module provides a centralized way to load page-specific styling and functionality.
 * Each page module handles its own initialization and styling.
 */

import { init as initProblemPage } from './problem.js';
import { init as initContestPage } from './contest.js';
import { init as initStatusPage } from './status.js';
import { init as initSubmitPage } from './submit.js';

/**
 * Page route mapping
 */
const PAGE_ROUTES = {
    '/problem.php': initProblemPage,
    '/contest.php': initContestPage,
    '/status.php': initStatusPage,
    '/submitpage.php': initSubmitPage,
};

/**
 * Initialize page-specific module based on current pathname
 * @param {Object} context - Shared context object with dependencies
 */
export async function initializePage(context) {
    const pathname = location.pathname;

    const pageInit = PAGE_ROUTES[pathname];

    if (pageInit) {
        try {
            await pageInit(context);
            console.log(`[XMOJ-Script] Initialized page module: ${pathname}`);
        } catch (error) {
            console.error(`[XMOJ-Script] Error initializing page ${pathname}:`, error);
        }
    }
}

/**
 * Get list of all implemented page modules
 * @returns {string[]} List of page pathnames with modules
 */
export function getImplementedPages() {
    return Object.keys(PAGE_ROUTES);
}
