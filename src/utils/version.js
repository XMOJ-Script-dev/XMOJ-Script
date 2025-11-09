/**
 * Version comparison utilities
 */

/**
 * Compares two version strings
 * @param {string} currVer - Current version
 * @param {string} remoteVer - Remote version
 * @returns {boolean} True if update is needed
 */
export function compareVersions(currVer, remoteVer) {
    const currParts = currVer.split('.').map(Number);
    const remoteParts = remoteVer.split('.').map(Number);

    const maxLen = Math.max(currParts.length, remoteParts.length);
    for (let i = 0; i < maxLen; i++) {
        const curr = currParts[i] !== undefined ? currParts[i] : 0;
        const remote = remoteParts[i] !== undefined ? remoteParts[i] : 0;
        if (remote > curr) {
            return true; // update needed
        } else if (remote < curr) {
            return false; // no update needed
        }
    }
    return false; // versions are equal
}
