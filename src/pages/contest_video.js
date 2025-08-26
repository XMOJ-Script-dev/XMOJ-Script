import { UtilityEnabled } from '../utils.js';
import * as CryptoJS from 'crypto-js';

export async function handleContestVideoPage() {
    let ScriptData = document.querySelector("body > div > div.mt-3 > center > script").innerHTML;
    if (document.getElementById("J_prismPlayer0").innerHTML != "") {
        document.getElementById("J_prismPlayer0").innerHTML = "";
        if (player) {
            player.dispose();
        }
        // This eval is necessary to execute the inline script on the page
        // that initializes the video player.
        eval(ScriptData);
    }
    if (UtilityEnabled("DownloadPlayback")) {
        ScriptData = ScriptData.substring(ScriptData.indexOf("{"));
        ScriptData = ScriptData.substring(0, ScriptData.indexOf("}") + 1);
        ScriptData = ScriptData.replace(/([a-zA-Z0-9]+) ?:/g, "\"$1\":");
        ScriptData = ScriptData.replace(/'/g, "\"");
        let VideoData = JSON.parse(ScriptData);
        let RandomUUID = () => {
            let t = "0123456789abcdef";
            let e = [];
            for (let r = 0; r < 36; r++) e[r] = t.substr(Math.floor(16 * Math.random()), 1);
            e[14] = "4";
            e[19] = t.substr(3 & e[19] | 8, 1);
            e[8] = e[13] = e[18] = e[23] = "-";
            return e.join("");
        };
        let URLParams = new URLSearchParams({
            "AccessKeyId": VideoData.accessKeyId,
            "Action": "GetPlayInfo",
            "VideoId": VideoData.vid,
            "Formats": "",
            "AuthTimeout": 7200,
            "Rand": RandomUUID(),
            "SecurityToken": VideoData.securityToken,
            "StreamType": "video",
            "Format": "JSON",
            "Version": "2017-03-21",
            "SignatureMethod": "HMAC-SHA1",
            "SignatureVersion": "1.0",
            "SignatureNonce": RandomUUID(),
            "PlayerVersion": "2.9.3",
            "Channel": "HTML5"
        });
        URLParams.sort();
        await fetch("https://vod." + VideoData.region + ".aliyuncs.com/?" + URLParams.toString() + "&Signature=" + encodeURIComponent(CryptoJS.HmacSHA1("GET&%2F&" + encodeURIComponent(URLParams.toString()), VideoData.accessKeySecret + "&").toString(CryptoJS.enc.Base64)))
            .then((Response) => {
                return Response.json();
            })
            .then((Response) => {
                let DownloadButton = document.createElement("a");
                DownloadButton.className = "btn btn-outline-secondary";
                DownloadButton.innerText = "下载";
                DownloadButton.href = Response.PlayInfoList.PlayInfo[0].PlayURL;
                DownloadButton.download = Response.VideoBase.Title;
                document.querySelector("body > div > div.mt-3 > center").appendChild(DownloadButton);
            });
    }
}
