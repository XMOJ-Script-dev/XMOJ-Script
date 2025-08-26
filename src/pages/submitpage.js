import { UtilityEnabled } from '../utils.js';
import CodeMirror from 'codemirror';
import { GM_xmlhttpRequest } from '$';

export async function handleSubmitPage() {
    const SearchParams = new URLSearchParams(location.search);
    document.title = "提交代码: " + (SearchParams.get("id") != null ? "题目" + Number(SearchParams.get("id")) : "比赛" + Number(SearchParams.get("cid")));
    document.querySelector("body > div > div.mt-3").innerHTML = `<center class="mb-3">` + `<h3>提交代码</h3>` + (SearchParams.get("id") != null ? `题目<span class="blue">${Number(SearchParams.get("id"))}</span>` : `比赛<span class="blue">${Number(SearchParams.get("cid")) + `</span>&emsp;题目<span class="blue">` + String.fromCharCode(65 + parseInt(SearchParams.get("pid")))}</span>`) + `</center>
<textarea id="CodeInput"></textarea>
<center class="mt-3">
    <input id="enable_O2" name="enable_O2" type="checkbox"><label for="enable_O2">打开O2开关</label>
    <br>
    <input id="Submit" class="btn btn-info mt-2" type="button" value="提交">
    <div id="ErrorElement" class="mt-2" style="display: none; text-align: left; padding: 10px;">
        <div id="ErrorMessage" style="white-space: pre; background-color: rgba(0, 0, 0, 0.1); padding: 10px; border-radius: 5px;"></div>
        <button id="PassCheck" class="btn btn-outline-secondary mt-2" style="display: none">强制提交</button>
    </div>
</center>`;
    if (UtilityEnabled("AutoO2")) {
        document.querySelector("#enable_O2").checked = true;
    }
    let CodeMirrorElement;
    (() => {
        CodeMirrorElement = CodeMirror.fromTextArea(document.querySelector("#CodeInput"), {
            lineNumbers: true,
            matchBrackets: true,
            mode: "text/x-c++src",
            indentUnit: 4,
            indentWithTabs: true,
            enterMode: "keep",
            tabMode: "shift",
            theme: (UtilityEnabled("DarkMode") ? "darcula" : "default"),
            extraKeys: {
                "Ctrl-Space": "autocomplete", "Ctrl-Enter": function (instance) {
                    Submit.click();
                }
            }
        })
    })();
    CodeMirrorElement.setSize("100%", "auto");
    CodeMirrorElement.getWrapperElement().style.border = "1px solid #ddd";

    if (SearchParams.get("sid") !== null) {
        await fetch("https://www.xmoj.tech/getsource.php?id=" + SearchParams.get("sid"))
            .then((Response) => {
                return Response.text()
            })
            .then((Response) => {
                CodeMirrorElement.setValue(Response.substring(0, Response.indexOf("/**************************************************************")).trim());
            });
    }

    PassCheck.addEventListener("click", async () => {
        ErrorElement.style.display = "none";
        document.querySelector("#Submit").disabled = true;
        document.querySelector("#Submit").value = "正在提交...";
        let o2Switch = "&enable_O2=on";
        if (!document.querySelector("#enable_O2").checked) o2Switch = "";
        await fetch("https://www.xmoj.tech/submit.php", {
            "headers": {
                "content-type": "application/x-www-form-urlencoded"
            },
            "referrer": location.href,
            "method": "POST",
            "body": (SearchParams.get("id") != null ? "id=" + SearchParams.get("id") : "cid=" + SearchParams.get("cid") + "&pid=" + SearchParams.get("pid")) + "&language=1&" + "source=" + encodeURIComponent(CodeMirrorElement.getValue()) + o2Switch
        }).then(async (Response) => {
            if (Response.redirected) {
                location.href = Response.url;
            } else {
                const text = await Response.text();
                if (text.indexOf("没有这个比赛！") !== -1 && new URL(location.href).searchParams.get("pid") !== null) {
                    // Credit: https://github.com/boomzero/quicksubmit/blob/main/index.ts
                    // Also licensed under GPL-3.0
                    const contestReq = await fetch("https://www.xmoj.tech/contest.php?cid=" + new URL(location.href).searchParams.get("cid"));
                    const res = await contestReq.text();
                    if (
                        contestReq.status !== 200 ||
                        res.indexOf("比赛尚未开始或私有，不能查看题目。") !== -1
                    ) {
                        console.error(`Failed to get contest page!`);
                        return;
                    }
                    const parser = new DOMParser();
                    const dom = parser.parseFromString(res, "text/html");
                    const contestProblems = [];
                    const rows = (dom.querySelector(
                        "#problemset > tbody",
                    )).rows;
                    for (let i = 0; i < rows.length; i++) {
                        contestProblems.push(
                            rows[i].children[1].textContent.substring(2, 6).replaceAll(
                                "\t",
                                "",
                            ),
                        );
                    }
                    rPID = contestProblems[new URL(location.href).searchParams.get("pid")];
                    if (UtilityEnabled("DebugMode")) {
                        console.log("Contest Problems:", contestProblems);
                        console.log("Real PID:", rPID);
                    }
                    ErrorElement.style.display = "block";
                    ErrorMessage.style.color = "red";
                    ErrorMessage.innerText = "比赛已结束, 正在尝试像题目 " + rPID + " 提交";
                    console.log("比赛已结束, 正在尝试像题目 " + rPID + " 提交");
                    let o2Switch = "&enable_O2=on";
                    if (!document.querySelector("#enable_O2").checked) o2Switch = "";
                    await fetch("https://www.xmoj.tech/submit.php", {
                        "headers": {
                            "content-type": "application/x-www-form-urlencoded"
                        },
                        "referrer": location.href,
                        "method": "POST",
                        "body": "id=" + rPID + "&language=1&" + "source=" + encodeURIComponent(CodeMirrorElement.getValue()) + o2Switch
                    }).then(async (Response) => {
                        if (Response.redirected) {
                            location.href = Response.url;
                        }
                        console.log(await Response.text());
                    });

                }
                if (UtilityEnabled("DebugMode")) {
                    console.log("Submission failed! Response:", text);
                }
                ErrorElement.style.display = "block";
                ErrorMessage.style.color = "red";
                ErrorMessage.innerText = "提交失败！请关闭脚本后重试！";
                Submit.disabled = false;
                Submit.value = "提交";
            }
        })
    });

    Submit.addEventListener("click", async () => {
        PassCheck.style.display = "none";
        ErrorElement.style.display = "none";
        document.querySelector("#Submit").disabled = true;
        document.querySelector("#Submit").value = "正在检查...";
        let Source = CodeMirrorElement.getValue();
        let PID = 0;
        let IOFilename = "";
        if (SearchParams.get("cid") != null && SearchParams.get("pid") != null) {
            PID = localStorage.getItem("UserScript-Contest-" + SearchParams.get("cid") + "-Problem-" + SearchParams.get("pid") + "-PID")
        } else {
            PID = SearchParams.get("id");
        }
        IOFilename = localStorage.getItem("UserScript-Problem-" + PID + "-IOFilename");
        if (UtilityEnabled("IOFile") && IOFilename != null) {
            if (Source.indexOf(IOFilename) == -1) {
                PassCheck.style.display = "";
                ErrorElement.style.display = "block";
                if (UtilityEnabled("DarkMode")) ErrorMessage.style.color = "yellow"; else ErrorMessage.style.color = "red";
                ErrorMessage.innerText = "此题输入输出文件名为" + IOFilename + "，请检查是否填错";

                let freopenText = document.createElement('small');
                if (UtilityEnabled("DarkMode")) freopenText.style.color = "white"; else freopenText.style.color = "black";
                freopenText.textContent = '\n您也可以复制freopen语句。\n';
                document.getElementById('ErrorMessage').appendChild(freopenText);
                let copyFreopenButton = document.createElement("button");
                copyFreopenButton.className = "btn btn-sm btn-outline-secondary copy-btn";
                copyFreopenButton.innerText = "复制代码";
                copyFreopenButton.style.marginLeft = "10px";
                copyFreopenButton.style.marginTop = "10px";
                copyFreopenButton.style.marginBottom = "10px";
                copyFreopenButton.type = "button";
                copyFreopenButton.addEventListener("click", () => {
                    navigator.clipboard.writeText('\n	freopen("' + IOFilename + '.in", "r", stdin);\n	freopen("' + IOFilename + '.out", "w", stdout);');
                    copyFreopenButton.innerText = "复制成功";
                    setTimeout(() => {
                        copyFreopenButton.innerText = "复制代码";
                    }, 1500);
                });
                document.getElementById('ErrorMessage').appendChild(copyFreopenButton);
                let freopenCodeField = CodeMirror(document.getElementById('ErrorMessage'), {
                    value: 'freopen("' + IOFilename + '.in", "r", stdin);\nfreopen("' + IOFilename + '.out", "w", stdout);',
                    mode: 'text/x-c++src',
                    theme: (UtilityEnabled("DarkMode") ? "darcula" : "default"),
                    readOnly: true,
                    lineNumbers: true
                });
                freopenCodeField.setSize("100%", "auto");
                document.querySelector("#Submit").disabled = false;
                document.querySelector("#Submit").value = "提交";
                return false;
            } else if (RegExp("//.*freopen").test(Source)) {
                PassCheck.style.display = "";
                ErrorElement.style.display = "block";
                if (UtilityEnabled("DarkMode")) ErrorMessage.style.color = "yellow"; else ErrorMessage.style.color = "red";
                ErrorMessage.innerText = "请不要注释freopen语句";
                document.querySelector("#Submit").disabled = false;
                document.querySelector("#Submit").value = "提交";
                return false;
            }
        }
        if (Source == "") {
            PassCheck.style.display = "";
            ErrorElement.style.display = "block";
            if (UtilityEnabled("DarkMode")) ErrorMessage.style.color = "yellow"; else ErrorMessage.style.color = "red";
            ErrorMessage.innerText = "源代码为空";
            document.querySelector("#Submit").disabled = false;
            document.querySelector("#Submit").value = "提交";
            return false;
        }
        if (UtilityEnabled("CompileError")) {
            let ResponseData = await new Promise((Resolve) => {
                GM_xmlhttpRequest({
                    method: "POST", url: "https://cppinsights.io/api/v1/transform", headers: {
                        "content-type": "application/json;charset=UTF-8"
                    }, referrer: "https://cppinsights.io/", data: JSON.stringify({
                        "insightsOptions": ["cpp14"], "code": Source
                    }), onload: (Response) => {
                        Resolve(Response);
                    }
                });
            });
            let Response = JSON.parse(ResponseData.responseText);
            if (Response.returncode) {
                PassCheck.style.display = "";
                ErrorElement.style.display = "block";
                if (UtilityEnabled("DarkMode")) ErrorMessage.style.color = "yellow"; else ErrorMessage.style.color = "red";
                ErrorMessage.innerText = "编译错误：\n" + Response.stderr.trim();
                document.querySelector("#Submit").disabled = false;
                document.querySelector("#Submit").value = "提交";
                return false;
            } else {
                PassCheck.click();
            }
        } else {
            PassCheck.click();
        }
    });
}
