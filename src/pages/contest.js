import { UtilityEnabled, GetUsernameHTML } from '../utils.js';
import { RequestAPI } from '../api.js';

export async function handleContestPage() {
    const SearchParams = new URLSearchParams(location.search);
    if (UtilityEnabled("AutoCountdown")) {
        window.clock = () => {}
    }
    if (location.href.indexOf("?cid=") == -1) {
        if (UtilityEnabled("ResetType")) {
            document.querySelector("body > div > div.mt-3 > center").innerHTML = String(document.querySelector("body > div > div.mt-3 > center").innerHTML).replaceAll("ServerTime:", "服务器时间：");
            document.querySelector("body > div > div.mt-3 > center > table").style.marginTop = "10px";

            document.querySelector("body > div > div.mt-3 > center > form").outerHTML = `<div class="row">
        <div class="col-md-4"></div>
        <form method="post" action="contest.php" class="col-md-4">
            <div class="input-group">
                <input name="keyword" type="text" class="form-control" spellcheck="false" data-ms-editor="true">
                <input type="submit" value="搜索" class="btn btn-outline-secondary">
            </div>
        </form>
    </div>`;
        }
        if (UtilityEnabled("Translate")) {
            document.querySelector("body > div > div.mt-3 > center > table > thead > tr").childNodes[0].innerText = "编号";
            document.querySelector("body > div > div.mt-3 > center > table > thead > tr").childNodes[1].innerText = "标题";
            document.querySelector("body > div > div.mt-3 > center > table > thead > tr").childNodes[2].innerText = "状态";
            document.querySelector("body > div > div.mt-3 > center > table > thead > tr").childNodes[3].remove();
            document.querySelector("body > div > div.mt-3 > center > table > thead > tr").childNodes[3].innerText = "创建者";
        }
        let Temp = document.querySelector("body > div > div.mt-3 > center > table > tbody").childNodes;
        for (let i = 1; i < Temp.length; i++) {
            let CurrentElement = Temp[i].childNodes[2].childNodes;
            if (CurrentElement[1].childNodes[0].data.indexOf("运行中") != -1) {
                let Time = String(CurrentElement[1].childNodes[1].innerText).substring(4);
                let Day = parseInt(Time.substring(0, Time.indexOf("天"))) || 0;
                let Hour = parseInt(Time.substring((Time.indexOf("天") == -1 ? 0 : Time.indexOf("天") + 1), Time.indexOf("小时"))) || 0;
                let Minute = parseInt(Time.substring((Time.indexOf("小时") == -1 ? 0 : Time.indexOf("小时") + 2), Time.indexOf("分"))) || 0;
                let Second = parseInt(Time.substring((Time.indexOf("分") == -1 ? 0 : Time.indexOf("分") + 1), Time.indexOf("秒"))) || 0;
                let TimeStamp = new Date().getTime() + window.diff + ((((isNaN(Day) ? 0 : Day) * 24 + Hour) * 60 + Minute) * 60 + Second) * 1000;
                CurrentElement[1].childNodes[1].setAttribute("EndTime", TimeStamp);
                CurrentElement[1].childNodes[1].classList.add("UpdateByJS");
            } else if (CurrentElement[1].childNodes[0].data.indexOf("开始于") != -1) {
                let TimeStamp = Date.parse(String(CurrentElement[1].childNodes[0].data).substring(4)) + window.diff;
                CurrentElement[1].setAttribute("EndTime", TimeStamp);
                CurrentElement[1].classList.add("UpdateByJS");
            } else if (CurrentElement[1].childNodes[0].data.indexOf("已结束") != -1) {
                let TimeStamp = String(CurrentElement[1].childNodes[0].data).substring(4);
                CurrentElement[1].childNodes[0].data = " 已结束 ";
                CurrentElement[1].className = "red";
                let Temp = document.createElement("span");
                CurrentElement[1].appendChild(Temp);
                Temp.className = "green";
                Temp.innerHTML = TimeStamp;
            }
            Temp[i].childNodes[3].style.display = "none";
            Temp[i].childNodes[4].innerHTML = "<a href=\"https://www.xmoj.tech/userinfo.php?user=" + Temp[i].childNodes[4].innerHTML + "\">" + Temp[i].childNodes[4].innerHTML + "</a>";
            localStorage.setItem("UserScript-Contest-" + Temp[i].childNodes[0].innerText + "-Name", Temp[i].childNodes[1].innerText);
        }
    } else {
        document.getElementsByTagName("h3")[0].innerHTML = "比赛" + document.getElementsByTagName("h3")[0].innerHTML.substring(7);
        if (document.querySelector("#time_left") != null) {
            let EndTime = document.querySelector("body > div > div.mt-3 > center").childNodes[3].data;
            EndTime = EndTime.substring(EndTime.indexOf("结束时间是：") + 6, EndTime.lastIndexOf("。"));
            EndTime = new Date(EndTime).getTime();
            if (new Date().getTime() < EndTime) {
                document.querySelector("#time_left").classList.add("UpdateByJS");
                document.querySelector("#time_left").setAttribute("EndTime", EndTime);
            }
        }
        let HTMLData = document.querySelector("body > div > div.mt-3 > center > div").innerHTML;
        HTMLData = HTMLData.replaceAll("&nbsp;&nbsp;\n&nbsp;&nbsp;", "&nbsp;")
        HTMLData = HTMLData.replaceAll("<br>开始于: ", "开始时间：")
        HTMLData = HTMLData.replaceAll("\n结束于: ", "<br>结束时间：")
        HTMLData = HTMLData.replaceAll("\n订正截止日期: ", "<br>订正截止日期：")
        HTMLData = HTMLData.replaceAll("\n现在时间: ", "当前时间：")
        HTMLData = HTMLData.replaceAll("\n状态:", "<br>状态：")
        document.querySelector("body > div > div.mt-3 > center > div").innerHTML = HTMLData;
        if (UtilityEnabled("RemoveAlerts") && document.querySelector("body > div > div.mt-3 > center").innerHTML.indexOf("尚未开始比赛") != -1) {
            document.querySelector("body > div > div.mt-3 > center > a").setAttribute("href", "start_contest.php?cid=" + SearchParams.get("cid"));
        } else if (UtilityEnabled("AutoRefresh")) {
            addEventListener("focus", async () => {
                await fetch(location.href)
                    .then((Response) => {
                        return Response.text();
                    })
                    .then((Response) => {
                        let ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
                        let Temp = ParsedDocument.querySelector("#problemset > tbody").children;
                        if (UtilityEnabled("ReplaceYN")) {
                            for (let i = 0; i < Temp.length; i++) {
                                let Status = Temp[i].children[0].innerText;
                                if (Status.indexOf("Y") != -1) {
                                    document.querySelector("#problemset > tbody").children[i].children[0].children[0].className = "status status_y";
                                    document.querySelector("#problemset > tbody").children[i].children[0].children[0].innerText = "✓";
                                } else if (Status.indexOf("N") != -1) {
                                    document.querySelector("#problemset > tbody").children[i].children[0].children[0].className = "status status_n";
                                    document.querySelector("#problemset > tbody").children[i].children[0].children[0].innerText = "✗";
                                }
                            }
                        }
                    });
            });
            document.querySelector("body > div > div.mt-3 > center > br:nth-child(2)").remove();
            document.querySelector("body > div > div.mt-3 > center > br:nth-child(2)").remove();
            document.querySelector("body > div > div.mt-3 > center > div > .red").innerHTML = String(document.querySelector("body > div > div.mt-3 > center > div > .red").innerHTML).replaceAll("<br>", "<br><br>");

            document.querySelector("#problemset > tbody").innerHTML = String(document.querySelector("#problemset > tbody").innerHTML).replaceAll(/\t&nbsp;([0-9]*) &nbsp;&nbsp;&nbsp;&nbsp; 问题 &nbsp;([^<]*)/g, "$2. $1");

            document.querySelector("#problemset > tbody").innerHTML = String(document.querySelector("#problemset > tbody").innerHTML).replaceAll(/\t\*([0-9]*) &nbsp;&nbsp;&nbsp;&nbsp; 问题 &nbsp;([^<]*)/g, "拓展$2. $1");

            if (UtilityEnabled("MoreSTD") && document.querySelector("#problemset > thead > tr").innerHTML.indexOf("标程") != -1) {
                let Temp = document.querySelector("#problemset > thead > tr").children;
                for (let i = 0; i < Temp.length; i++) {
                    if (Temp[i].innerText == "标程") {
                        Temp[i].remove();
                        let Temp2 = document.querySelector("#problemset > tbody").children;
                        for (let j = 0; j < Temp2.length; j++) {
                            if (Temp2[j].children[i] != undefined) {
                                Temp2[j].children[i].remove();
                            }
                        }
                    }
                }
                document.querySelector("#problemset > thead > tr").innerHTML += "<td width=\"5%\">标程</td>";
                Temp = document.querySelector("#problemset > tbody").children;
                for (let i = 0; i < Temp.length; i++) {
                    Temp[i].innerHTML += "<td><a href=\"https://www.xmoj.tech/problem_std.php?cid=" + Number(SearchParams.get("cid")) + "&pid=" + i + "\" target=\"_blank\">打开</a></td>";
                }
            }

            let Temp = document.querySelector("#problemset > tbody").rows;
            for (let i = 0; i < Temp.length; i++) {
                if (Temp[i].childNodes[0].children.length == 0) {
                    Temp[i].childNodes[0].innerHTML = "<div class=\"status\"></div>";
                }
                let PID = Temp[i].childNodes[1].innerHTML;
                if (PID.substring(0, 2) == "拓展") {
                    PID = PID.substring(2);
                }
                Temp[i].children[2].children[0].target = "_blank";
                localStorage.setItem("UserScript-Contest-" + SearchParams.get("cid") + "-Problem-" + i + "-PID", PID.substring(3));
                localStorage.setItem("UserScript-Problem-" + PID.substring(3) + "-Name", Temp[i].childNodes[2].innerText);
            }
            let CheatDiv = document.createElement("div");
            CheatDiv.style.marginTop = "20px";
            CheatDiv.style.textAlign = "left";
            document.querySelector("body > div > div.mt-3 > center").insertBefore(CheatDiv, document.querySelector("#problemset"));
            if (UtilityEnabled("AutoCheat")) {
                let AutoCheatButton = document.createElement("button");
                CheatDiv.appendChild(AutoCheatButton);
                AutoCheatButton.className = "btn btn-outline-secondary";
                AutoCheatButton.innerText = "自动提交当年代码";
                AutoCheatButton.style.marginRight = "5px";
                AutoCheatButton.disabled = true;
                let ACProblems = [], ContestProblems = [];
                const UrlParams = new URLSearchParams(window.location.search);
                const CID = UrlParams.get("cid");
                await fetch("https://www.xmoj.tech/userinfo.php?user=" + window.CurrentUsername)
                    .then((Response) => {
                        return Response.text();
                    }).then((Response) => {
                        let ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
                        let Temp = ParsedDocument.querySelector("#statics > tbody > tr:nth-child(2) > td:nth-child(3) > script").innerText.split("\n")[5].split(";");
                        for (let i = 0; i < Temp.length; i++) {
                            ACProblems.push(Number(Temp[i].substring(2, Temp[i].indexOf(","))));
                        }
                        AutoCheatButton.disabled = false;
                    });
                let Rows = document.querySelector("#problemset > tbody").rows;
                for (let i = 0; i < Rows.length; i++) {
                    ContestProblems.push(Rows[i].children[1].innerText.substring(Rows[i].children[1].innerText.indexOf('.') + 2)).toFixed;
                }
                AutoCheatButton.addEventListener("click", async () => {
                    AutoCheatButton.disabled = true;
                    let Submitted = false;
                    for (let i = 0; i < ContestProblems.length; i++) {
                        let PID = ContestProblems[i];
                        if (ACProblems.indexOf(Number(PID)) == -1) {
                            console.log("Ignoring problem " + PID + " as it has not been solved yet.");
                            continue;
                        }
                        if (Rows[i].children[0].children[0].classList.contains("status_y")) {
                            console.log("Ignoring problem " + PID + " as it has already been solved in this contest.");
                            continue;
                        }
                        console.log("Submitting problem " + PID);
                        Submitted = true;
                        AutoCheatButton.innerHTML = "正在提交 " + PID;
                        let SID = 0;
                        await fetch("https://www.xmoj.tech/status.php?problem_id=" + PID + "&jresult=4")
                            .then((Result) => {
                                return Result.text();
                            }).then((Result) => {
                                let ParsedDocument = new DOMParser().parseFromString(Result, "text/html");
                                SID = ParsedDocument.querySelector("#result-tab > tbody > tr:nth-child(1) > td:nth-child(2)").innerText;
                            });
                        await new Promise(r => setTimeout(r, 500));
                        let Code = "";
                        await fetch("https://www.xmoj.tech/getsource.php?id=" + SID)
                            .then((Response) => {
                                return Response.text();
                            }).then((Response) => {
                                Code = Response.substring(0, Response.indexOf("/**************************************************************")).trim();
                            });
                        await new Promise(r => setTimeout(r, 500));
                        await fetch("https://www.xmoj.tech/submit.php", {
                            "headers": {
                                "content-type": "application/x-www-form-urlencoded"
                            },
                            "referrer": "https://www.xmoj.tech/submitpage.php?id=" + PID,
                            "method": "POST",
                            "body": "cid=" + CID + "&pid=" + i + "&" + "language=1&" + "source=" + encodeURIComponent(Code) + "&" + "enable_O2=on"
                        });
                        await new Promise(r => setTimeout(r, 500));
                    }
                    if (!Submitted) {
                        AutoCheatButton.innerHTML = "没有可以提交的题目!";
                        await new Promise(r => setTimeout(r, 1000));
                    }
                    AutoCheatButton.disabled = false;
                    if (Submitted) location.reload(); else AutoCheatButton.innerHTML = "自动提交当年代码";
                });
                document.addEventListener("keydown", (Event) => {
                    if (Event.code === 'Enter' && (Event.metaKey || Event.ctrlKey)) {
                        AutoCheatButton.click();
                    }
                });
            }
            if (UtilityEnabled("OpenAllProblem")) {
                let OpenAllButton = document.createElement("button");
                OpenAllButton.className = "btn btn-outline-secondary";
                OpenAllButton.innerText = "打开全部题目";
                OpenAllButton.style.marginRight = "5px";
                CheatDiv.appendChild(OpenAllButton);
                OpenAllButton.addEventListener("click", () => {
                    let Rows = document.querySelector("#problemset > tbody").rows;
                    for (let i = 0; i < Rows.length; i++) {
                        open(Rows[i].children[2].children[0].href, "_blank");
                    }
                });
                let OpenUnsolvedButton = document.createElement("button");
                OpenUnsolvedButton.className = "btn btn-outline-secondary";
                OpenUnsolvedButton.innerText = "打开未解决题目";
                CheatDiv.appendChild(OpenUnsolvedButton);
                OpenUnsolvedButton.addEventListener("click", () => {
                    let Rows = document.querySelector("#problemset > tbody").rows;
                    for (let i = 0; i < Rows.length; i++) {
                        if (!Rows[i].children[0].children[0].classList.contains("status_y")) {
                            open(Rows[i].children[2].children[0].href, "_blank");
                        }
                    }
                });
            }
            localStorage.setItem("UserScript-Contest-" + SearchParams.get("cid") + "-ProblemCount", document.querySelector("#problemset > tbody").rows.length);
        }
    }
}
