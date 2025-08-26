import { UtilityEnabled, TimeToStringTime, SizeToStringSize } from '../utils.js';
import CodeMirror from 'codemirror';
import * as CryptoJS from 'crypto-js';

export async function handleReinfoPage() {
    const SearchParams = new URLSearchParams(location.search);
    document.title = "测试点信息: " + SearchParams.get("sid");
    if (document.querySelector("#results > div") == undefined) {
        document.querySelector("#results").parentElement.innerHTML = "没有测试点信息";
    } else {
        for (let i = 0; i < document.querySelector("#results > div").children.length; i++) {
            let CurrentElement = document.querySelector("#results > div").children[i].children[0].children[0].children[0];
            let Temp = CurrentElement.innerText.substring(0, CurrentElement.innerText.length - 2).split("/");
            CurrentElement.innerText = TimeToStringTime(Temp[0]) + "/" + SizeToStringSize(Temp[1]);
        }
        if (document.getElementById("apply_data")) {
            let ApplyDiv = document.getElementById("apply_data").parentElement;
            console.log("启动！！！");
            if (UtilityEnabled("ApplyData")) {
                let GetDataButton = document.createElement("button");
                GetDataButton.className = "ms-2 btn btn-outline-secondary";
                GetDataButton.innerText = "获取数据";
                console.log("按钮创建成功");
                ApplyDiv.appendChild(GetDataButton);
                GetDataButton.addEventListener("click", async () => {
                    GetDataButton.disabled = true;
                    GetDataButton.innerText = "正在获取数据...";
                    let PID = localStorage.getItem("UserScript-Solution-" + SearchParams.get("sid") + "-Problem");
                    if (PID == null) {
                        GetDataButton.innerText = "失败! 无法获取PID";
                        GetDataButton.disabled = false;
                        await new Promise((resolve) => {
                            setTimeout(resolve, 800);
                        });
                        GetDataButton.innerText = "获取数据";
                        return;
                    }
                    let Code = "";
                    if (localStorage.getItem(`UserScript-Problem-${PID}-IOFilename`) !== null) {
                        Code = `#define IOFile "${localStorage.getItem(`UserScript-Problem-${PID}-IOFilename`)}"\n`;
                    }
                    Code += `//XMOJ-Script 获取数据代码
#include <bits/stdc++.h>
using namespace std;
string Base64Encode(string Input)
{
const string Base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
string Output;
for (int i = 0; i < Input.length(); i += 3)
{
    Output.push_back(i + 0 > Input.length() ? '=' : Base64Chars[(Input[i + 0] & 0xfc) >> 2]);
    Output.push_back(i + 1 > Input.length() ? '=' : Base64Chars[((Input[i + 0] & 0x03) << 4) + ((Input[i + 1] & 0xf0) >> 4)]);
    Output.push_back(i + 2 > Input.length() ? '=' : Base64Chars[((Input[i + 1] & 0x0f) << 2) + ((Input[i + 2] & 0xc0) >> 6)]);
    Output.push_back(i + 3 > Input.length() ? '=' : Base64Chars[Input[i + 2] & 0x3f]);
}
return Output;
}
int main()
{
#ifdef IOFile
freopen(IOFile ".in", "r", stdin);
freopen(IOFile ".out", "w", stdout);
#endif
string Input;
while (1)
{
    char Data = getchar();
    if (Data == EOF)
        break;
    Input.push_back(Data);
}
throw runtime_error("[" + Base64Encode(Input.c_str()) + "]");
return 0;
}`;

                    await fetch("https://www.xmoj.tech/submit.php", {
                        "headers": {
                            "content-type": "application/x-www-form-urlencoded"
                        },
                        "referrer": "https://www.xmoj.tech/submitpage.php?id=" + PID,
                        "method": "POST",
                        "body": "id=" + PID + "&" + "language=1&" + "source=" + encodeURIComponent(Code) + "&" + "enable_O2=on"
                    });

                    let SID = await fetch("https://www.xmoj.tech/status.php").then((Response) => {
                        return Response.text();
                    }).then((Response) => {
                        let ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
                        return ParsedDocument.querySelector("#result-tab > tbody > tr:nth-child(1) > td:nth-child(2)").innerText;
                    });

                    await new Promise((Resolve) => {
                        let Interval = setInterval(async () => {
                            await fetch("status-ajax.php?solution_id=" + SID).then((Response) => {
                                return Response.text();
                            }).then((Response) => {
                                if (Response.split(",")[0] >= 4) {
                                    clearInterval(Interval);
                                    Resolve();
                                }
                            });
                        }, 500);
                    });

                    await fetch(`https://www.xmoj.tech/reinfo.php?sid=${SID}`).then((Response) => {
                        return Response.text();
                    }).then((Response) => {
                        let ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
                        let ErrorData = ParsedDocument.getElementById("errtxt").innerText;
                        let MatchResult = ErrorData.match(/\what\(\):  \[([A-Za-z0-9+\/=]+)\]/g);
                        if (MatchResult === null) {
                            GetDataButton.innerText = "获取数据失败";
                            GetDataButton.disabled = false;
                            return;
                        }
                        for (let i = 0; i < MatchResult.length; i++) {
                            let Data = CryptoJS.enc.Base64.parse(MatchResult[i].substring(10, MatchResult[i].length - 1)).toString(CryptoJS.enc.Utf8);
                            ApplyDiv.appendChild(document.createElement("hr"));
                            ApplyDiv.appendChild(document.createTextNode("数据" + (i + 1) + "："));
                            let CodeElement = document.createElement("div");
                            ApplyDiv.appendChild(CodeElement);
                            CodeMirror(CodeElement, {
                                value: Data,
                                theme: (UtilityEnabled("DarkMode") ? "darcula" : "default"),
                                lineNumbers: true,
                                readOnly: true
                            }).setSize("100%", "auto");
                        }
                        GetDataButton.innerText = "获取数据成功";
                        GetDataButton.disabled = false;
                    });
                });
            }
            document.getElementById("apply_data").addEventListener("click", () => {
                let ApplyElements = document.getElementsByClassName("data");
                for (let i = 0; i < ApplyElements.length; i++) {
                    ApplyElements[i].style.display = (ApplyElements[i].style.display == "block" ? "" : "block");
                }
            });
        }
        let ApplyElements = document.getElementsByClassName("data");
        for (let i = 0; i < ApplyElements.length; i++) {
            ApplyElements[i].addEventListener("click", async () => {
                await fetch("https://www.xmoj.tech/data_distribute_ajax_apply.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: "user_id=" + window.CurrentUsername + "&" + "solution_id=" + SearchParams.get("sid") + "&" + "name=" + ApplyElements[i].getAttribute("name")
                }).then((Response) => {
                    return Response.json();
                }).then((Response) => {
                    ApplyElements[i].innerText = Response.msg;
                    setTimeout(() => {
                        ApplyElements[i].innerText = "申请数据";
                    }, 1000);
                });
            });
        }
    }
}
