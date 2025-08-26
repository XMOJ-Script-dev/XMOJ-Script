import CodeMirror from 'codemirror';
import { UtilityEnabled } from '../utils.js';

export async function handleCeInfoPage() {
    await fetch(location.href)
        .then((Result) => {
            return Result.text();
        }).then((Result) => {
            let ParsedDocument = new DOMParser().parseFromString(Result, "text/html");
            document.querySelector("body > div > div.mt-3").innerHTML = "";
            let CodeElement = document.createElement("div");
            CodeElement.className = "mb-3";
            document.querySelector("body > div > div.mt-3").appendChild(CodeElement);
            CodeMirror(CodeElement, {
                value: ParsedDocument.getElementById("errtxt").innerHTML.replaceAll("&lt;", "<").replaceAll("&gt;", ">"),
                lineNumbers: true,
                mode: "text/x-c++src",
                readOnly: true,
                theme: (UtilityEnabled("DarkMode") ? "darcula" : "default")
            }).setSize("100%", "auto");
        });
}
