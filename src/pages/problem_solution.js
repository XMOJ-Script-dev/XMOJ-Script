import { UtilityEnabled } from '../utils.js';
import CodeMirror from 'codemirror';
import { GM_setClipboard } from '$';

export async function handleProblemSolutionPage() {
    if (UtilityEnabled("RemoveUseless")) {
        document.querySelector("h2.lang_en").remove(); //fixes #332
    }
    if (UtilityEnabled("CopyMD")) {
        await fetch(location.href).then((Response) => {
            return Response.text();
        }).then((Response) => {
            let ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
            let CopyMDButton = document.createElement("button");
            CopyMDButton.className = "btn btn-sm btn-outline-secondary copy-btn";
            CopyMDButton.innerText = "复制";
            CopyMDButton.style.marginLeft = "10px";
            CopyMDButton.type = "button";
            document.querySelector("body > div > div.mt-3 > center > h2").appendChild(CopyMDButton);
            CopyMDButton.addEventListener("click", () => {
                GM_setClipboard(ParsedDocument.querySelector("body > div > div > div").innerText.trim().replaceAll("\n\t", "\n").replaceAll("\n\n", "\n"));
                CopyMDButton.innerText = "复制成功";
                setTimeout(() => {
                    CopyMDButton.innerText = "复制";
                }, 1000);
            });
        });
    }
    let Temp = document.getElementsByClassName("prettyprint");
    for (let i = 0; i < Temp.length; i++) {
        let Code = Temp[i].innerText;
        Temp[i].outerHTML = `<textarea class="prettyprint"></textarea>`;
        Temp[i].value = Code;
    }
    for (let i = 0; i < Temp.length; i++) {
        CodeMirror.fromTextArea(Temp[i], {
            lineNumbers: true,
            mode: "text/x-c++src",
            readOnly: true,
            theme: (UtilityEnabled("DarkMode") ? "darcula" : "default")
        }).setSize("100%", "auto");
    }
}
