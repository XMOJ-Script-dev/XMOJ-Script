import { UtilityEnabled } from '../utils.js';
import CodeMirror from 'codemirror';

export async function handleCompareSourcePage() {
    const SearchParams = new URLSearchParams(location.search);
    if (UtilityEnabled("CompareSource")) {
        if (location.search == "") {
            document.querySelector("body > div.container > div").innerHTML = "";
            let LeftCodeText = document.createElement("span");
            document.querySelector("body > div.container > div").appendChild(LeftCodeText);
            LeftCodeText.innerText = "左侧代码的运行编号：";
            let LeftCode = document.createElement("input");
            document.querySelector("body > div.container > div").appendChild(LeftCode);
            LeftCode.classList.add("form-control");
            LeftCode.style.width = "40%";
            LeftCode.style.marginBottom = "5px";
            let RightCodeText = document.createElement("span");
            document.querySelector("body > div.container > div").appendChild(RightCodeText);
            RightCodeText.innerText = "右侧代码的运行编号：";
            let RightCode = document.createElement("input");
            document.querySelector("body > div.container > div").appendChild(RightCode);
            RightCode.classList.add("form-control");
            RightCode.style.width = "40%";
            RightCode.style.marginBottom = "5px";
            let CompareButton = document.createElement("button");
            document.querySelector("body > div.container > div").appendChild(CompareButton);
            CompareButton.innerText = "比较";
            CompareButton.className = "btn btn-primary";
            CompareButton.addEventListener("click", () => {
                location.href = "https://www.xmoj.tech/comparesource.php?left=" + Number(LeftCode.value) + "&right=" + Number(RightCode.value);
            });
        } else {
            document.querySelector("body > div > div.mt-3").innerHTML = `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" checked id="IgnoreWhitespace">
            <label class="form-check-label" for="IgnoreWhitespace">忽略空白</label>
        </div>
        <div id="CompareElement"></div>`;

            let LeftCode = "";
            await fetch("https://www.xmoj.tech/getsource.php?id=" + SearchParams.get("left"))
                .then((Response) => {
                    return Response.text();
                }).then((Response) => {
                    LeftCode = Response.substring(0, Response.indexOf("/**************************************************************")).trim();
                });
            let RightCode = "";
            await fetch("https://www.xmoj.tech/getsource.php?id=" + SearchParams.get("right"))
                .then((Response) => {
                    return Response.text();
                }).then((Response) => {
                    RightCode = Response.substring(0, Response.indexOf("/**************************************************************")).trim();
                });

            let MergeViewElement = CodeMirror.MergeView(CompareElement, {
                value: LeftCode,
                origLeft: null,
                orig: RightCode,
                lineNumbers: true,
                mode: "text/x-c++src",
                collapseIdentical: "true",
                readOnly: true,
                theme: (UtilityEnabled("DarkMode") ? "darcula" : "default"),
                revertButtons: false,
                ignoreWhitespace: true
            });

            IgnoreWhitespace.addEventListener("change", () => {
                MergeViewElement.ignoreWhitespace = ignorews.checked;
            });
        }
    }
}
