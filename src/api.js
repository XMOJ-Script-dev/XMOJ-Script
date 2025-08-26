import { GM_xmlhttpRequest } from '$'
import { UtilityEnabled } from './utils'

export const RequestAPI = (Action, Data, CallBack) => {
    try {
        let Session = "";
        let Temp = document.cookie.split(";");
        for (let i = 0; i < Temp.length; i++) {
            if (Temp[i].includes("PHPSESSID")) {
                Session = Temp[i].split("=")[1];
            }
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
