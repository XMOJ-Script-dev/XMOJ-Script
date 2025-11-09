/**
 * Credential storage utilities using the Credentials API
 */

/**
 * Store user credentials
 * @param {string} username - Username
 * @param {string} password - Password
 */
export let storeCredential = async (username, password) => {
    if ('credentials' in navigator && window.PasswordCredential) {
        try {
            const credential = new PasswordCredential({id: username, password: password});
            await navigator.credentials.store(credential);
        } catch (e) {
            console.error(e);
        }
    }
};

/**
 * Get stored credentials
 * @returns {Promise<PasswordCredential|null>} The stored credentials or null
 */
export let getCredential = async () => {
    if ('credentials' in navigator && window.PasswordCredential) {
        try {
            return await navigator.credentials.get({password: true, mediation: 'optional'});
        } catch (e) {
            console.error(e);
        }
    }
    return null;
};

/**
 * Clear stored credentials
 */
export let clearCredential = async () => {
    if ('credentials' in navigator && window.PasswordCredential) {
        try {
            await navigator.credentials.preventSilentAccess();
        } catch (e) {
            console.error(e);
        }
    }
};
