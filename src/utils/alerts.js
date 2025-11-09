/**
 * Alert utilities
 */

/**
 * Shows an alert only if the message has changed
 * @param {string} Message - The message to display
 */
export let SmartAlert = (Message) => {
    if (localStorage.getItem("UserScript-Alert") !== Message) {
        alert(Message);
    }
    localStorage.setItem("UserScript-Alert", Message);
};
