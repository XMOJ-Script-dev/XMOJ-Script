import { UtilityEnabled, SizeToStringSize, TimeToStringTime, CodeSizeToStringSize } from '../utils.js';
import { RequestAPI } from '../api.js';

export async function handleStatusPage() {
    const SearchParams = new URLSearchParams(location.search);
    if (SearchParams.get("ByUserScript") == null) {
        document.title = "提交状态";
        document.querySelector("body > script:nth-child(5)").remove();
        if (UtilityEnabled("NewBootstrap")) {
            document.querySelector("#simform").outerHTML = `<form id="simform" class="justify-content-center form-inline row g-2" action="status.php" method="get" style="padding-bottom: 7px;">
    <input class="form-control" type="text" size="4" name="user_id" value="${CurrentUsername} "style="display: none;">
<div class="col-md-1">
    <label for="problem_id" class="form-label">题目编号</label>
    <input type="text" class="form-control" id="problem_id" name="problem_id" size="4">
</div>
<div class="col-md-1">
    <label for="language" class="form-label">语言</label>
    <select id="language" name="language" class="form-select">
        <option value="-1" selected="">全部</option>
        <option value="0">C</option>
        <option value="1">C++</option>
        <option value="2">Pascal</option>
    </select>
</div><div class="col-md-1">
    <label for="jresult" class="form-label">结果</label>
    <select id="jresult" name="jresult" class="form-select">
        <option value="-1" selected="">全部</option>
        <option value="4">正确</option>
        <option value="5">格式错误</option>
        <option value="6">答案错误</option>
        <option value="7">时间超限</option>
        <option value="8">内存超限</option>
        <option value="9">输出超限</option>
        <option value="10">运行错误</option>
        <option value="11">编译错误</option>
        <option value="0">等待</option>
        <option value="1">等待重判</option>
        <option value="2">编译中</option>
        <option value="3">运行并评判</option>
    </select>
</div>
<div class="col-md-1">
    <button type="submit" class="btn btn-primary">查找</button>
</div><div id="csrf"></div></form>`;
        }

        if (UtilityEnabled("ImproveACRate")) {
            let ImproveACRateButton = document.createElement("button");
            document.querySelector("body > div.container > div > div.input-append").appendChild(ImproveACRateButton);
            ImproveACRateButton.className = "btn btn-outline-secondary";
            ImproveACRateButton.innerText = "提高正确率";
            ImproveACRateButton.disabled = true;
            let ACProblems = [];
            await fetch("https://www.xmoj.tech/userinfo.php?user=" + CurrentUsername)
                .then((Response) => {
                    return Response.text();
                }).then((Response) => {
                    let ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
                    ImproveACRateButton.innerText += "(" + (parseInt(ParsedDocument.querySelector("#statics > tbody > tr:nth-child(4) > td:nth-child(2)").innerText) / parseInt(ParsedDocument.querySelector("#statics > tbody > tr:nth-child(3) > td:nth-child(2)").innerText) * 100).toFixed(2) + "%)";
                    let Temp = ParsedDocument.querySelector("#statics > tbody > tr:nth-child(2) > td:nth-child(3) > script").innerText.split("\n")[5].split(";");
                    for (let i = 0; i < Temp.length; i++) {
                        ACProblems.push(Number(Temp[i].substring(2, Temp[i].indexOf(","))));
                    }
                    ImproveACRateButton.disabled = false;
                });
            ImproveACRateButton.addEventListener("click", async () => {
                ImproveACRateButton.disabled = true;
                let SubmitTimes = 3;
                let Count = 0;
                let SubmitInterval = setInterval(async () => {
                    if (Count >= SubmitTimes) {
                        clearInterval(SubmitInterval);
                        location.reload();
                        return;
                    }
                    ImproveACRateButton.innerText = "正在提交 (" + (Count + 1) + "/" + SubmitTimes + ")";
                    let PID = ACProblems[Math.floor(Math.random() * ACProblems.length)];
                    let SID = 0;
                    await fetch("https://www.xmoj.tech/status.php?problem_id=" + PID + "&jresult=4")
                        .then((Result) => {
                            return Result.text();
                        }).then((Result) => {
                            let ParsedDocument = new DOMParser().parseFromString(Result, "text/html");
                            SID = ParsedDocument.querySelector("#result-tab > tbody > tr:nth-child(1) > td:nth-child(2)").innerText;
                        });
                    let Code = "";
                    await fetch("https://www.xmoj.tech/getsource.php?id=" + SID)
                        .then((Response) => {
                            return Response.text();
                        }).then((Response) => {
                            Code = Response.substring(0, Response.indexOf("/**************************************************************")).trim();
                        });
                    await fetch("https://www.xmoj.tech/submit.php", {
                        "headers": {
                            "content-type": "application/x-www-form-urlencoded"
                        },
                        "referrer": "https://www.xmoj.tech/submitpage.php?id=" + PID,
                        "method": "POST",
                        "body": "id=" + PID + "&" + "language=1&" + "source=" + encodeURIComponent(Code) + "&" + "enable_O2=on"
                    });
                    Count++;
                }, 1000);
            });
            ImproveACRateButton.style.marginBottom = ImproveACRateButton.style.marginRight = "7px";
            ImproveACRateButton.style.marginRight = "7px";
        }
        if (UtilityEnabled("CompareSource")) {
            let CompareButton = document.createElement("button");
            document.querySelector("body > div.container > div > div.input-append").appendChild(CompareButton);
            CompareButton.className = "btn btn-outline-secondary";
            CompareButton.innerText = "比较提交记录";
            CompareButton.addEventListener("click", () => {
                location.href = "https://www.xmoj.tech/comparesource.php";
            });
            CompareButton.style.marginBottom = "7px";
        }
        if (UtilityEnabled("ResetType")) {
            document.querySelector("#result-tab > thead > tr > th:nth-child(1)").remove();
            document.querySelector("#result-tab > thead > tr > th:nth-child(2)").remove();
            document.querySelector("#result-tab > thead > tr > th:nth-child(10)").innerHTML = "开启O2";
        }
        let Temp = document.querySelector("#result-tab > tbody").childNodes;
        let SolutionIDs = [];
        for (let i = 1; i < Temp.length; i += 2) {
            let SID = Number(Temp[i].childNodes[1].innerText);
            SolutionIDs.push(SID);
            if (UtilityEnabled("ResetType")) {
                Temp[i].childNodes[0].remove();
                Temp[i].childNodes[0].innerHTML = "<a href=\"https://www.xmoj.tech/showsource.php?id=" + SID + "\">" + SID + "</a> " + "<a href=\"" + Temp[i].childNodes[6].children[1].href + "\">重交</a>";
                Temp[i].childNodes[1].remove();
                Temp[i].childNodes[1].children[0].removeAttribute("class");
                Temp[i].childNodes[3].childNodes[0].innerText = SizeToStringSize(Temp[i].childNodes[3].childNodes[0].innerText);
                Temp[i].childNodes[4].childNodes[0].innerText = TimeToStringTime(Temp[i].childNodes[4].childNodes[0].innerText);
                Temp[i].childNodes[5].innerText = Temp[i].childNodes[5].childNodes[0].innerText;
                Temp[i].childNodes[6].innerText = CodeSizeToStringSize(Temp[i].childNodes[6].innerText.substring(0, Temp[i].childNodes[6].innerText.length - 1));
                Temp[i].childNodes[9].innerText = (Temp[i].childNodes[9].innerText == "" ? "否" : "是");
            }
            if (SearchParams.get("cid") === null) {
                localStorage.setItem("UserScript-Solution-" + SID + "-Problem", Temp[i].childNodes[1].innerText);
            } else {
                localStorage.setItem("UserScript-Solution-" + SID + "-Contest", SearchParams.get("cid"));
                localStorage.setItem("UserScript-Solution-" + SID + "-PID-Contest", Temp[i].childNodes[1].innerText.charAt(0));
            }
        }

        if (UtilityEnabled("RefreshSolution")) {
            let StdList;
            await new Promise((Resolve) => {
                RequestAPI("GetStdList", {}, async (Result) => {
                    if (Result.Success) {
                        StdList = Result.Data.StdList;
                        Resolve();
                    }
                })
            });

            let Rows = document.getElementById("result-tab").rows;
            let Points = Array();
            for (let i = 1; i <= SolutionIDs.length; i++) {
                Rows[i].cells[2].className = "td_result";
                let SolutionID = SolutionIDs[i - 1];
                if (Rows[i].cells[2].children.length == 2) {
                    Points[SolutionID] = Rows[i].cells[2].children[1].innerText;
                    Rows[i].cells[2].children[1].remove();
                }
                Rows[i].cells[2].innerHTML += "<img style=\"margin-left: 10px\" height=\"18\" width=\"18\" src=\"image/loader.gif\">";
                setTimeout(() => {
                    RefreshResult(SolutionID);
                }, 0);
            }

            let RefreshResult = async (SolutionID) => {
                let CurrentRow = null;
                let Rows = document.getElementById("result-tab").rows;
                for (let i = 0; i < SolutionIDs.length; i++) {
                    if (SolutionIDs[i] == SolutionID) {
                        CurrentRow = Rows[i + 1];
                        break;
                    }
                }
                await fetch("status-ajax.php?solution_id=" + SolutionID)
                    .then((Response) => {
                        return Response.text();
                    })
                    .then((Response) => {
                        let PID = 0;
                        if (SearchParams.get("cid") === null) {
                            PID = localStorage.getItem("UserScript-Solution-" + SolutionID + "-Problem");
                        } else {
                            PID = localStorage.getItem("UserScript-Contest-" + SearchParams.get("cid") + "-Problem-" + (CurrentRow.cells[1].innerText.charCodeAt(0) - 65) + "-PID");
                        }
                        let ResponseData = Response.split(",");
                        CurrentRow.cells[3].innerHTML = "<div id=\"center\" class=\"red\">" + SizeToStringSize(ResponseData[1]) + "</div>";
                        CurrentRow.cells[4].innerHTML = "<div id=\"center\" class=\"red\">" + TimeToStringTime(ResponseData[2]) + "</div>";
                        let TempHTML = "<a href=\"" + (ResponseData[0] == 11 ? "ce" : "re") + "info.php?sid=" + SolutionID + "\" class=\"" + judge_color[ResponseData[0]] + "\">";
                        TempHTML += judge_result[ResponseData[0]];
                        TempHTML += "</a>";
                        if (Points[SolutionID] != undefined) {
                            TempHTML += "<span style=\"margin-left: 5px\" class=\"badge text-bg-info\">" + Points[SolutionID] + "</span>";
                            if (Points[SolutionID].substring(0, Points[SolutionID].length - 1) >= 50) {
                                TempHTML += `<a href="https://www.xmoj.tech/showsource.php?pid=${PID}&ByUserScript=1" class="ms-1 link-secondary">查看标程</a>`;
                            }
                        }
                        if (ResponseData[0] < 4) {
                            setTimeout(() => {
                                RefreshResult(SolutionID)
                            }, 500);
                            TempHTML += "<img style=\"margin-left: 5px\" height=\"18\" width=\"18\" src=\"image/loader.gif\">";
                        } else if (ResponseData[0] == 4 && UtilityEnabled("UploadStd")) {
                            if (SearchParams.get("cid") == null) CurrentRow.cells[1].innerText;
                            let Std = StdList.find((Element) => {
                                return Element == Number(PID);
                            });
                            if (Std != undefined) {
                                TempHTML += "✅";
                            } else {
                                RequestAPI("UploadStd", {
                                    "ProblemID": Number(PID),
                                }, (Result) => {
                                    if (Result.Success) {
                                        CurrentRow.cells[2].innerHTML += "🆗";
                                    } else {
                                        CurrentRow.cells[2].innerHTML += "⚠️";
                                    }
                                });
                            }
                        }
                        CurrentRow.cells[2].innerHTML = TempHTML;
                    });
            };
        }
    }
}
