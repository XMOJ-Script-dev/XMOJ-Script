import CodeMirror from 'codemirror';
import { UtilityEnabled } from '../utils.js';

export async function handleProblemStdPage() {
    await fetch("https://www.xmoj.tech/problem_std.php?cid=" + SearchParams.get("cid") + "&pid=" + SearchParams.get("pid"))
        .then((Response) => {
            return Response.text();
        }).then((Response) => {
            let ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
            let Temp = ParsedDocument.getElementsByTagName("pre");
            document.querySelector("body > div > div.mt-3").innerHTML = "";
            for (let i = 0; i < Temp.length; i++) {
                let CodeElement = document.createElement("div");
                CodeElement.className = "mb-3";
                document.querySelector("body > div > div.mt-3").appendChild(CodeElement);
                CodeMirror(CodeElement, {
                    value: Temp[i].innerText,
                    lineNumbers: true,
                    mode: "text/x-c++src",
                    readOnly: true,
                    theme: (UtilityEnabled("DarkMode") ? "darcula" : "default")
                }).setSize("100%", "auto");
            }
        });
}
