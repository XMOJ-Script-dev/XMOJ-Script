import { RenderMathJax, UtilityEnabled, GetUsernameHTML, TidyTable } from '../utils.js';
import { RequestAPI } from '../api.js';
import { GM_setClipboard } from '$';
import $ from 'jquery';

export async function handleProblemPage() {
    await RenderMathJax();
    const SearchParams = new URLSearchParams(location.search);
    if (SearchParams.get("cid") != null) {
        document.getElementsByTagName("h2")[0].innerHTML += " (" + localStorage.getItem("UserScript-Contest-" + SearchParams.get("cid") + "-Problem-" + SearchParams.get("pid") + "-PID") + ")";
    }
    if (document.querySelector("body > div > div.mt-3 > h2") != null) {
        document.querySelector("body > div > div.mt-3").innerHTML = "没有此题目或题目对你不可见";
        setTimeout(() => {
            location.href = "https://www.xmoj.tech/problemset.php";
        }, 1000);
    } else {
        let PID = localStorage.getItem("UserScript-Contest-" + SearchParams.get("cid") + "-Problem-" + SearchParams.get("pid") + "-PID");

        document.querySelector("body > div > div.mt-3 > center").lastChild.style.marginLeft = "10px";
        //修复提交按钮
        let SubmitLink = document.querySelector('.mt-3 > center:nth-child(1) > a:nth-child(12)');
        if (SubmitLink == null) { //a special type of problem
            SubmitLink = document.querySelector('.mt-3 > center:nth-child(1) > a:nth-child(10)');
        }
        if (SubmitLink == null) {
            SubmitLink = document.querySelector('.mt-3 > center:nth-child(1) > a:nth-child(11)');
        }
        if (SubmitLink == null) {
            SubmitLink = document.querySelector('.mt-3 > center:nth-child(1) > a:nth-child(13)');
        }
        if (SubmitLink == null) {
            SubmitLink = document.querySelector('.mt-3 > center:nth-child(1) > a:nth-child(9)');
        }
        let SubmitButton = document.createElement('button');
        SubmitButton.id = 'SubmitButton';
        SubmitButton.className = 'btn btn-outline-secondary';
        SubmitButton.textContent = '提交';
        SubmitButton.href = SubmitLink.href;
        SubmitButton.onclick = function () {
            window.location.href = SubmitLink.href;
            console.log(SubmitLink.href);
        };

        // Replace the <a> element with the button
        SubmitLink.parentNode.replaceChild(SubmitButton, SubmitLink);
        // Remove the button's outer []
        let str = document.querySelector('.mt-3 > center:nth-child(1)').innerHTML;
        let target = SubmitButton.outerHTML;
        let result = str.replace(new RegExp(`(.?)${target}(.?)`, 'g'), target);
        document.querySelector('.mt-3 > center:nth-child(1)').innerHTML = result;
        document.querySelector('html body.placeholder-glow div.container div.mt-3 center button#SubmitButton.btn.btn-outline-secondary').onclick = function () {
            window.location.href = SubmitLink.href;
            console.log(SubmitLink.href);
        };
        var Temp = document.querySelectorAll(".sampledata");
        for (var i = 0; i < Temp.length; i++) {
            Temp[i].parentElement.className = "card";
        }
        if (UtilityEnabled("RemoveUseless")) {
            document.querySelector("h2.lang_en").remove();
            document.getElementsByTagName("center")[1].remove();
        }
        if (UtilityEnabled("CopySamples")) {
            $(".copy-btn").click((Event) => {
                let CurrentButton = $(Event.currentTarget);
                let span = CurrentButton.parent().last().find(".sampledata");
                if (!span.length) {
                    CurrentButton.text("未找到代码块").addClass("done");
                    setTimeout(() => {
                        $(".copy-btn").text("复制").removeClass("done");
                    }, 1000);
                    return;
                }
                GM_setClipboard(span.text());
                CurrentButton.text("复制成功").addClass("done");
                setTimeout(() => {
                    $(".copy-btn").text("复制").removeClass("done");
                }, 1000);
                //document.body.removeChild(textarea[0]);
            });
        }
        let IOFileElement = document.querySelector("body > div > div.mt-3 > center > h3");
        if (IOFileElement != null) {
            while (IOFileElement.childNodes.length >= 1) {
                IOFileElement.parentNode.insertBefore(IOFileElement.childNodes[0], IOFileElement);
            }
            IOFileElement.parentNode.insertBefore(document.createElement("br"), IOFileElement);
            IOFileElement.remove();
            let Temp = document.querySelector("body > div > div.mt-3 > center").childNodes[2].data.trim();
            let IOFilename = Temp.substring(0, Temp.length - 3);
            localStorage.setItem("UserScript-Problem-" + PID + "-IOFilename", IOFilename);
        }

        if (UtilityEnabled("CopyMD")) {
            await fetch(location.href).then((Response) => {
                return Response.text();
            }).then((Response) => {
                let ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
                let Temp = ParsedDocument.querySelectorAll(".cnt-row-body");
                if (UtilityEnabled("DebugMode")) console.log(Temp);
                for (let i = 0; i < Temp.length; i++) {
                    if (Temp[i].children[0].className === "content lang_cn") {
                        let CopyMDButton = document.createElement("button");
                        CopyMDButton.className = "btn btn-sm btn-outline-secondary copy-btn";
                        CopyMDButton.innerText = "复制";
                        CopyMDButton.style.marginLeft = "10px";
                        CopyMDButton.type = "button";
                        document.querySelectorAll(".cnt-row-head.title")[i].appendChild(CopyMDButton);
                        CopyMDButton.addEventListener("click", () => {
                            GM_setClipboard(Temp[i].children[0].innerText.trim().replaceAll("\n\t", "\n").replaceAll("\n\n", "\n"));
                            CopyMDButton.innerText = "复制成功";
                            setTimeout(() => {
                                CopyMDButton.innerText = "复制";
                            }, 1000);
                        });
                    }
                }
            });
        }

        if (UtilityEnabled("Discussion")) {
            let DiscussButton = document.createElement("button");
            DiscussButton.className = "btn btn-outline-secondary position-relative";
            DiscussButton.innerHTML = `讨论`;
            DiscussButton.style.marginLeft = "10px";
            DiscussButton.type = "button";
            DiscussButton.addEventListener("click", () => {
                if (SearchParams.get("cid") != null) {
                    open("https://www.xmoj.tech/discuss3/discuss.php?pid=" + PID, "_blank");
                } else {
                    open("https://www.xmoj.tech/discuss3/discuss.php?pid=" + SearchParams.get("id"), "_blank");
                }
            });
            document.querySelector("body > div > div.mt-3 > center").appendChild(DiscussButton);
            let UnreadBadge = document.createElement("span");
            UnreadBadge.className = "position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger";
            UnreadBadge.style.display = "none";
            DiscussButton.appendChild(UnreadBadge);

            let RefreshCount = () => {
                RequestAPI("GetPostCount", {
                    "ProblemID": Number(PID)
                }, (Response) => {
                    if (Response.Success) {
                        if (Response.Data.DiscussCount != 0) {
                            UnreadBadge.innerText = Response.Data.DiscussCount;
                            UnreadBadge.style.display = "";
                        }
                    }
                });
            };
            RefreshCount();
            addEventListener("focus", RefreshCount);
        }

        let Tables = document.getElementsByTagName("table");
        for (let i = 0; i < Tables.length; i++) {
            TidyTable(Tables[i]);
        }
    }
    let Style = document.createElement("style");
    document.body.appendChild(Style);
    Style.innerHTML += "code, kbd, pre, samp {";
    Style.innerHTML += "    font-family: monospace, Consolas, 'Courier New';";
    Style.innerHTML += "    font-size: 1rem;";
    Style.innerHTML += "}";
    Style.innerHTML += "pre {";
    Style.innerHTML += "    padding: 0.3em 0.5em;";
    Style.innerHTML += "    margin: 0.5em 0;";
    Style.innerHTML += "}";
    Style.innerHTML += ".in-out {";
    Style.innerHTML += "    overflow: hidden;";
    Style.innerHTML += "    display: flex;";
    Style.innerHTML += "    padding: 0.5em 0;";
    Style.innerHTML += "}";
    Style.innerHTML += ".in-out .in-out-item {";
    Style.innerHTML += "    flex: 1;";
    Style.innerHTML += "    overflow: hidden;";
    Style.innerHTML += "}";
    Style.innerHTML += ".cnt-row .title {";
    Style.innerHTML += "    font-weight: bolder;";
    Style.innerHTML += "    font-size: 1.1rem;";
    Style.innerHTML += "}";
    Style.innerHTML += ".cnt-row .content {";
    Style.innerHTML += "    overflow: hidden;";
    Style.innerHTML += "}";
    Style.innerHTML += "a.copy-btn {";
    Style.innerHTML += "    float: right;";
    Style.innerHTML += "    padding: 0 0.4em;";
    Style.innerHTML += "    border: 1px solid var(--bs-primary);";
    Style.innerHTML += "    border-radius: 3px;";
    Style.innerHTML += "    color: var(--bs-primary);";
    Style.innerHTML += "    cursor: pointer;";
    Style.innerHTML += "}";
    Style.innerHTML += "a.copy-btn:hover {";
    Style.innerHTML += "    background-color: var(--bs-secondary-bg);";
    Style.innerHTML += "}";
    Style.innerHTML += "a.done, a.done:hover {";
    Style.innerHTML += "    background-color: var(--bs-primary);";
    Style.innerHTML += "    color: white;";
    Style.innerHTML += "}";
}
