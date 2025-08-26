import { UtilityEnabled } from '../utils.js';
import CodeMirror from 'codemirror';
import { RequestAPI } from '../api.js';

export async function handleShowSourcePage() {
    const SearchParams = new URLSearchParams(location.search);
    let Code = "";
    if (SearchParams.get("ByUserScript") == null) {
        document.title = "查看代码: " + SearchParams.get("id");
        await fetch("https://www.xmoj.tech/getsource.php?id=" + SearchParams.get("id"))
            .then((Response) => {
                return Response.text();
            }).then((Response) => {
                Code = Response.replace("\n<!--not cached-->\n", "");
            });
    } else {
        document.title = "查看标程: " + SearchParams.get("pid");
        if (localStorage.getItem("UserScript-LastUploadedStdTime") === undefined || new Date().getTime() - localStorage.getItem("UserScript-LastUploadedStdTime") > 1000 * 60 * 60 * 24 * 30) {
            location.href = "https://www.xmoj.tech/userinfo.php?ByUserScript=1";
        }
        await new Promise((Resolve) => {
            RequestAPI("GetStd", {
                "ProblemID": Number(SearchParams.get("pid"))
            }, (Response) => {
                if (Response.Success) {
                    Code = Response.Data.StdCode;
                } else {
                    Code = Response.Message;
                }
                Resolve();
            });
        });
    }
    document.querySelector("body > div > div.mt-3").innerHTML = `<textarea>${Code}</textarea>`;
    CodeMirror.fromTextArea(document.querySelector("body > div > div.mt-3 > textarea"), {
        lineNumbers: true,
        mode: "text/x-c++src",
        readOnly: true,
        theme: (UtilityEnabled("DarkMode") ? "darcula" : "default")
    }).setSize("100%", "auto");
}
