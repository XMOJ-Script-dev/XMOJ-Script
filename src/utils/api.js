/**
 * API request utilities
 */

import { UtilityEnabled } from '../core/config.js';
import { SmartAlert } from './alerts.js';

/**
 * Make an API request to the backend
 * @param {string} Action - The API action
 * @param {Object} Data - The data to send
 * @param {Function} CallBack - Callback function to handle response
 */
export let RequestAPI = (Action, Data, CallBack) => {
    try {
        let Session = "";
        let Temp = document.cookie.split(";");
        for (let i = 0; i < Temp.length; i++) {
            if (Temp[i].includes("PHPSESSID")) {
                Session = Temp[i].split("=")[1];
            }
        }
        if (Session === "") { //The cookie is httpOnly
            GM.cookie.set({
                name: 'PHPSESSID',
                value: (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).substring(0, 28),
                path: "/"
            })
                .then(() => {
                    console.log('Reset PHPSESSID successfully.');
                    location.reload(); //Refresh the page to auth with the new PHPSESSID
                })
                .catch((error) => {
                    console.error(error);
                });
        }

        // Get current username from profile
        let CurrentUsername = "";
        if (document.querySelector("#profile") !== null) {
            CurrentUsername = document.querySelector("#profile").innerText;
            CurrentUsername = CurrentUsername.replaceAll(/[^a-zA-Z0-9]/g, "");
        }

        let PostData = {
            "Authentication": {
                "SessionID": Session, "Username": CurrentUsername,
            }, "Data": Data, "Version": GM_info.script.version, "DebugMode": UtilityEnabled("DebugMode")
        };
        let DataString = JSON.stringify(PostData);
        if (UtilityEnabled("DebugMode")) {
            console.log("Sent for", Action + ":", DataString);
        }
        GM_xmlhttpRequest({
            method: "POST",
            url: (UtilityEnabled("SuperDebug") ? "http://127.0.0.1:8787/" : "https://api.xmoj-bbs.me/") + Action,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "XMOJ-UserID": CurrentUsername,
                "XMOJ-Script-Version": GM_info.script.version,
                "DebugMode": UtilityEnabled("DebugMode")
            },
            data: DataString,
            onload: (Response) => {
                if (UtilityEnabled("DebugMode")) {
                    console.log("Received for", Action + ":", Response.responseText);
                }
                try {
                    CallBack(JSON.parse(Response.responseText));
                } catch (Error) {
                    console.log(Response.responseText);
                }
            }
        });
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};
