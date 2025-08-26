import { UtilityEnabled, GetUserInfo, GetUserBadge, SmartAlert } from '../utils.js';
import { RequestAPI } from '../api.js';

export async function handleUserInfoPage() {
    const SearchParams = new URLSearchParams(location.search);
    if (SearchParams.get("ByUserScript") === null) {
        if (UtilityEnabled("RemoveUseless")) {
            let Temp = document.getElementById("submission").childNodes;
            for (let i = 0; i < Temp.length; i++) {
                Temp[i].remove();
            }
        }
        // This eval is necessary to execute the inline script on the page that sets up
        // the solved problems chart. It's a legacy part of the original site.
        eval(document.querySelector("body > script:nth-child(5)").innerHTML);
        document.querySelector("#statics > tbody > tr:nth-child(1)").remove();

        let Temp = document.querySelector("#statics > tbody").children;
        for (let i = 0; i < Temp.length; i++) {
            if (Temp[i].children[0] != undefined) {
                if (Temp[i].children[0].innerText == "Statistics") {
                    Temp[i].children[0].innerText = "统计";
                } else if (Temp[i].children[0].innerText == "Email:") {
                    Temp[i].children[0].innerText = "电子邮箱";
                }
                Temp[i].children[1].removeAttribute("align");
            }
        }

        Temp = document.querySelector("#statics > tbody > tr:nth-child(1) > td:nth-child(3)").childNodes;
        let ACProblems = [];
        for (let i = 0; i < Temp.length; i++) {
            if (Temp[i].tagName == "A" && Temp[i].href.indexOf("problem.php?id=") != -1) {
                ACProblems.push(Number(Temp[i].innerText.trim()));
            }
        }
        document.querySelector("#statics > tbody > tr:nth-child(1) > td:nth-child(3)").remove();

        let UserID, UserNick;
        [UserID, UserNick] = document.querySelector("#statics > caption").childNodes[0].data.trim().split("--");
        document.querySelector("#statics > caption").remove();
        document.title = "用户 " + UserID + " 的个人中心";
        let Row = document.createElement("div");
        Row.className = "row";
        let LeftDiv = document.createElement("div");
        LeftDiv.className = "col-md-5";
        Row.appendChild(LeftDiv);

        let LeftTopDiv = document.createElement("div");
        LeftTopDiv.className = "row mb-2";
        LeftDiv.appendChild(LeftTopDiv);
        let AvatarContainer = document.createElement("div");
        AvatarContainer.classList.add("col-auto");
        let AvatarElement = document.createElement("img");
        let UserEmailHash = (await GetUserInfo(UserID)).EmailHash;
        if (UserEmailHash == undefined) {
            AvatarElement.src = `https://cravatar.cn/avatar/00000000000000000000000000000000?d=mp&f=y`;
        } else {
            AvatarElement.src = `https://cravatar.cn/avatar/${UserEmailHash}?d=retro`;
        }
        AvatarElement.classList.add("rounded", "me-2");
        AvatarElement.style.height = "120px";
        AvatarContainer.appendChild(AvatarElement);
        LeftTopDiv.appendChild(AvatarContainer);

        let UserInfoElement = document.createElement("div");
        UserInfoElement.classList.add("col-auto");
        UserInfoElement.style.lineHeight = "40px";
        UserInfoElement.innerHTML += "用户名：" + UserID + "<br>";
        UserInfoElement.innerHTML += "昵称：" + UserNick + "<br>";
        if (UtilityEnabled("Rating")) {
            UserInfoElement.innerHTML += "评分：" + ((await GetUserInfo(UserID)).Rating) + "<br>";
        }
        // Create a placeholder for the last online time
        let lastOnlineElement = document.createElement('div');
        lastOnlineElement.innerHTML = "最后在线：加载中...<br>";
        UserInfoElement.appendChild(lastOnlineElement);
        let BadgeInfo = await GetUserBadge(UserID);
        if (window.IsAdmin) {
            if (BadgeInfo.Content !== "") {
                let DeleteBadgeButton = document.createElement("button");
                DeleteBadgeButton.className = "btn btn-outline-danger btn-sm";
                DeleteBadgeButton.innerText = "删除标签";
                DeleteBadgeButton.addEventListener("click", async () => {
                    if (confirm("您确定要删除此标签吗？")) {
                        RequestAPI("DeleteBadge", {
                            "UserID": UserID
                        }, (Response) => {
                            if (UtilityEnabled("DebugMode")) console.log(Response);
                            if (Response.Success) {
                                let Temp = [];
                                for (let i = 0; i < localStorage.length; i++) {
                                    if (localStorage.key(i).startsWith("UserScript-User-" + UserID + "-Badge-")) {
                                        Temp.push(localStorage.key(i));
                                    }
                                }
                                for (let i = 0; i < Temp.length; i++) {
                                    localStorage.removeItem(Temp[i]);
                                }
                                window.location.reload();
                            } else {
                                SmartAlert(Response.Message);
                            }
                        });
                    }
                });
                UserInfoElement.appendChild(DeleteBadgeButton);
            } else {
                let AddBadgeButton = document.createElement("button");
                AddBadgeButton.className = "btn btn-outline-primary btn-sm";
                AddBadgeButton.innerText = "添加标签";
                AddBadgeButton.addEventListener("click", async () => {
                    RequestAPI("NewBadge", {
                        "UserID": UserID
                    }, (Response) => {
                        if (Response.Success) {
                            let Temp = [];
                            for (let i = 0; i < localStorage.length; i++) {
                                if (localStorage.key(i).startsWith("UserScript-User-" + UserID + "-Badge-")) {
                                    Temp.push(localStorage.key(i));
                                }
                            }
                            for (let i = 0; i < Temp.length; i++) {
                                localStorage.removeItem(Temp[i]);
                            }
                            window.location.reload();
                        } else {
                            SmartAlert(Response.Message);
                        }
                    });
                });
                UserInfoElement.appendChild(AddBadgeButton);
            }
        }
        RequestAPI("LastOnline", {"Username": UserID}, (result) => {
            if (result.Success) {
                if (UtilityEnabled("DebugMode")) {
                    console.log('lastOnline:' + result.Data.logintime);
                }
                lastOnlineElement.innerHTML = "最后在线：" + GetRelativeTime(result.Data.logintime) + "<br>";
            } else {
                lastOnlineElement.innerHTML = "最后在线：近三个月内从未<br>";
            }
        });
        LeftTopDiv.appendChild(UserInfoElement);
        LeftDiv.appendChild(LeftTopDiv);

        let LeftTable = document.querySelector("body > div > div > center > table");
        LeftDiv.appendChild(LeftTable);
        let RightDiv = document.createElement("div");
        RightDiv.className = "col-md-7";
        Row.appendChild(RightDiv);
        RightDiv.innerHTML = "<h5>已解决题目</h5>";
        for (let i = 0; i < ACProblems.length; i++) {
            RightDiv.innerHTML += "<a href=\"https://www.xmoj.tech/problem.php?id=" + ACProblems[i] + "\" target=\"_blank\">" + ACProblems[i] + "</a> ";
        }
        document.querySelector("body > div > div").innerHTML = "";
        document.querySelector("body > div > div").appendChild(Row);
    } else {
        document.title = "上传标程";
        document.querySelector("body > div > div.mt-3").innerHTML = `<button id="UploadStd" class="btn btn-primary mb-2">上传标程</button>
<div class="alert alert-danger mb-3" role="alert" id="ErrorElement" style="display: none;"></div>
<div class="progress" role="progressbar">
    <div id="UploadProgress" class="progress-bar progress-bar-striped" style="width: 0%">0%</div>
</div>
<p class="mt-2 text-muted">
    您必须要上传标程以后才能使用“查看标程”功能。点击“上传标程”按钮以后，系统会自动上传标程，请您耐心等待。<br>
    首次上传标程可能会比较慢，请耐心等待。后续将可以自动上传AC代码。<br>
    系统每过30天会自动提醒您上传标程，您必须要上传标程，否则将会被禁止使用“查看标程”功能。<br>
</p>`;
        UploadStd.addEventListener("click", async () => {
            UploadStd.disabled = true;
            ErrorElement.style.display = "none";
            ErrorElement.innerText = "";
            UploadProgress.classList.remove("bg-success");
            UploadProgress.classList.remove("bg-warning");
            UploadProgress.classList.remove("bg-danger");
            UploadProgress.classList.add("progress-bar-animated");
            UploadProgress.style.width = "0%";
            UploadProgress.innerText = "0%";
            let ACList = [];
            await fetch("https://www.xmoj.tech/userinfo.php?user=" + window.CurrentUsername)
                .then((Response) => {
                    return Response.text();
                }).then((Response) => {
                    let ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
                    let ScriptData = ParsedDocument.querySelector("#statics > tbody > tr:nth-child(2) > td:nth-child(3) > script").innerText;
                    ScriptData = ScriptData.substr(ScriptData.indexOf("}") + 1).trim();
                    ScriptData = ScriptData.split(";");
                    for (let i = 0; i < ScriptData.length; i++) {
                        ACList.push(Number(ScriptData[i].substring(2, ScriptData[i].indexOf(","))));
                    }
                });
            RequestAPI("GetStdList", {}, async (Result) => {
                if (Result.Success) {
                    let StdList = Result.Data.StdList;
                    for (let i = 0; i < ACList.length; i++) {
                        if (StdList.indexOf(ACList[i]) === -1 && ACList[i] !== 0) {
                            await new Promise((Resolve) => {
                                RequestAPI("UploadStd", {
                                    "ProblemID": Number(ACList[i])
                                }, (Result) => {
                                    if (!Result.Success) {
                                        ErrorElement.style.display = "block";
                                        ErrorElement.innerText += Result.Message + "\n";
                                        UploadProgress.classList.add("bg-warning");
                                    }
                                    UploadProgress.innerText = (i / ACList.length * 100).toFixed(1) + "% (" + ACList[i] + ")";
                                    UploadProgress.style.width = (i / ACList.length * 100) + "%";
                                    Resolve();
                                });
                            });
                        }
                    }
                    UploadProgress.classList.add("bg-success");
                    UploadProgress.classList.remove("progress-bar-animated");
                    UploadProgress.innerText = "100%";
                    UploadProgress.style.width = "100%";
                    UploadStd.disabled = false;
                    localStorage.setItem("UserScript-LastUploadedStdTime", new Date().getTime());
                } else {
                    ErrorElement.style.display = "block";
                    ErrorElement.innerText = Result.Message;
                    UploadStd.disabled = false;
                }
            });
        });
    }
}
