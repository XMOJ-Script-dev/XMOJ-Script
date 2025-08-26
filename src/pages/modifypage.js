import { UtilityEnabled, GetUserInfo, GetRelativeTime, SmartAlert } from '../utils.js';
import { RequestAPI } from '../api.js';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export async function handleModifyPage() {
    const SearchParams = new URLSearchParams(location.search);
    if (SearchParams.get("ByUserScript") != null) {
        document.title = "XMOJ-Script 更新日志";
        document.querySelector("body > div > div.mt-3").innerHTML = "";
        await fetch(window.ServerURL + "/Update.json", {cache: "no-cache"})
            .then((Response) => {
                return Response.json();
            })
            .then((Response) => {
                for (let i = Object.keys(Response.UpdateHistory).length - 1; i >= 0; i--) {
                    let Version = Object.keys(Response.UpdateHistory)[i];
                    let Data = Response.UpdateHistory[Version];
                    let UpdateDataCard = document.createElement("div");
                    document.querySelector("body > div > div.mt-3").appendChild(UpdateDataCard);
                    UpdateDataCard.className = "card mb-3";
                    if (Data.Prerelease) UpdateDataCard.classList.add("text-secondary");
                    let UpdateDataCardBody = document.createElement("div");
                    UpdateDataCard.appendChild(UpdateDataCardBody);
                    UpdateDataCardBody.className = "card-body";
                    let UpdateDataCardTitle = document.createElement("h5");
                    UpdateDataCardBody.appendChild(UpdateDataCardTitle);
                    UpdateDataCardTitle.className = "card-title";
                    UpdateDataCardTitle.innerText = Version;
                    if (Data.Prerelease) {
                        UpdateDataCardTitle.innerHTML += "（预览版）";
                    }
                    let UpdateDataCardSubtitle = document.createElement("h6");
                    UpdateDataCardBody.appendChild(UpdateDataCardSubtitle);
                    UpdateDataCardSubtitle.className = "card-subtitle mb-2 text-muted";
                    UpdateDataCardSubtitle.innerHTML = GetRelativeTime(Data.UpdateDate);
                    let UpdateDataCardText = document.createElement("p");
                    UpdateDataCardBody.appendChild(UpdateDataCardText);
                    UpdateDataCardText.className = "card-text";
                    //release notes
                    if (Data.Notes != undefined) {
                        UpdateDataCardText.innerHTML = Data.Notes;
                    }
                    let UpdateDataCardList = document.createElement("ul");
                    UpdateDataCardText.appendChild(UpdateDataCardList);
                    UpdateDataCardList.className = "list-group list-group-flush";
                    for (let j = 0; j < Data.UpdateContents.length; j++) {
                        let UpdateDataCardListItem = document.createElement("li");
                        UpdateDataCardList.appendChild(UpdateDataCardListItem);
                        UpdateDataCardListItem.className = "list-group-item";
                        UpdateDataCardListItem.innerHTML = "(<a href=\"https://github.com/XMOJ-Script-dev/XMOJ-Script/pull/" + Data.UpdateContents[j].PR + "\" target=\"_blank\">" + "#" + Data.UpdateContents[j].PR + "</a>) " + Data.UpdateContents[j].Description;
                    }
                    let UpdateDataCardLink = document.createElement("a");
                    UpdateDataCardBody.appendChild(UpdateDataCardLink);
                    UpdateDataCardLink.className = "card-link";
                    UpdateDataCardLink.href = "https://github.com/XMOJ-Script-dev/XMOJ-Script/releases/tag/" + Version;
                    UpdateDataCardLink.target = "_blank";
                    UpdateDataCardLink.innerText = "查看该版本";
                }
            });
    } else {
        document.title = "修改账号";
        let Nickname = document.getElementsByName("nick")[0].value;
        let School = document.getElementsByName("school")[0].value;
        let EmailAddress = document.getElementsByName("email")[0].value;
        let CodeforcesAccount = document.getElementsByName("acc_cf")[0].value;
        let AtcoderAccount = document.getElementsByName("acc_atc")[0].value;
        let USACOAccount = document.getElementsByName("acc_usaco")[0].value;
        let LuoguAccount = document.getElementsByName("acc_luogu")[0].value;
        document.querySelector("body > div > div").innerHTML = `<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="UserID" class="col-form-label">用户ID</label></div>
    <div class="col-9"><input id="UserID" class="form-control" disabled readonly value="${window.CurrentUsername}"></div>
</div>
<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="Avatar" class="col-form-label">头像</label></div>
    <div class="col-9">
        <img width="64" height="64" src="https://cravatar.cn/avatar/` + (await GetUserInfo(window.CurrentUsername)).EmailHash + `?d=retro">
        <a href="https://cravatar.cn/avatars" target="_blank">修改头像</a>
    </div>
</div>
<div class="row g-2 align-items-center col-6 pb-1 ps-2 pe-2 mt-3 mb-3 border" id="BadgeRow" style="display: none">
    <div class="col-3">标签</div>
    <div class="col-9">
        <div class="row g-2 align-items-center mb-1">
            <div class="col-3"><label for="BadgeContent" class="col-form-label">内容</label></div>
            <div class="col-9"><input class="form-control" id="BadgeContent"></div>
        </div>
        <div class="row g-2 align-items-center mb-1">
            <div class="col-3"><label for="BadgeBackgroundColor" class="col-form-label">背景颜色</label></div>
            <div class="col-9"><input class="form-control form-control-color" type="color" id="BadgeBackgroundColor"></div>
        </div>
        <div class="row g-2 align-items-center mb-1">
            <div class="col-3"><label for="BadgeColor" class="col-form-label">文字颜色</label></div>
            <div class="col-9"><input class="form-control form-control-color" type="color" id="BadgeColor"></div>
        </div>
    </div>
</div>
<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="Nickname" class="col-form-label">昵称</label></div>
    <div class="col-9"><input id="Nickname" class="form-control"></div>
</div>
<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="OldPassword" class="col-form-label">旧密码</label></div>
    <div class="col-9"><input type="password" id="OldPassword" class="form-control"></div>
</div>
<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="NewPassword" class="col-form-label">新密码</label></div>
    <div class="col-9"><input type="password" id="NewPassword" class="form-control"></div>
</div>
<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="NewPasswordAgain" class="col-form-label">请重复密码</label></div>
    <div class="col-9"><input type="password" id="NewPasswordAgain" class="form-control"></div>
</div>
<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="School" class="col-form-label">学校</label></div>
    <div class="col-9"><input id="School" class="form-control"></div>
</div>
<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="EmailAddress" class="col-form-label">电子邮箱</label></div>
    <div class="col-9"><input id="EmailAddress" class="form-control"></div>
</div>
<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="CodeforcesAccount" class="col-form-label">Codeforces账号</label></div>
    <div class="col-9"><input id="CodeforcesAccount" class="form-control"></div>
</div>
<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="AtcoderAccount" class="col-form-label">Atcoder账号</label></div>
    <div class="col-9"><input id="AtcoderAccount" class="form-control"></div>
</div>
<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="USACOAccount" class="col-form-label">USACO账号</label></div>
    <div class="col-9"><input id="USACOAccount" class="form-control"></div>
</div>
<div class="row g-2 align-items-center col-6 mb-1">
    <div class="col-3"><label for="LuoguAccount" class="col-form-label">洛谷账号</label></div>
    <div class="col-9"><input id="LuoguAccount" class="form-control"></div>
</div>
<button type="submit" class="btn btn-primary mb-2" id="ModifyInfo">
    修改
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="display: none"></span>
</button>
<div class="alert alert-danger mb-3" role="alert" id="ErrorElement" style="display: none;"></div>
<div class="alert alert-success mb-3" role="alert" id="SuccessElement" style="display: none;">修改成功</div>
<br>`;
        document.getElementById("Nickname").value = Nickname;
        document.getElementById("School").value = School;
        document.getElementById("EmailAddress").value = EmailAddress;
        document.getElementById("CodeforcesAccount").value = CodeforcesAccount;
        document.getElementById("AtcoderAccount").value = AtcoderAccount;
        document.getElementById("USACOAccount").value = USACOAccount;
        document.getElementById("LuoguAccount").value = LuoguAccount;
        RequestAPI("GetBadge", {
            "UserID": String(window.CurrentUsername)
        }, (Response) => {
            if (Response.Success) {
                BadgeRow.style.display = "";
                BadgeContent.value = Response.Data.Content;
                BadgeBackgroundColor.value = Response.Data.BackgroundColor;
                BadgeColor.value = Response.Data.Color;
                let Temp = [];
                for (let i = 0; i < localStorage.length; i++) {
                    if (localStorage.key(i).startsWith("UserScript-User-" + window.CurrentUsername + "-Badge-")) {
                        Temp.push(localStorage.key(i));
                    }
                }
                for (let i = 0; i < Temp.length; i++) {
                    localStorage.removeItem(Temp[i]);
                }
            }
        });
        ModifyInfo.addEventListener("click", async () => {
            ModifyInfo.disabled = true;
            ModifyInfo.querySelector("span").style.display = "";
            ErrorElement.style.display = "none";
            SuccessElement.style.display = "none";
            let BadgeContent = document.querySelector("#BadgeContent").value;
            let BadgeBackgroundColor = document.querySelector("#BadgeBackgroundColor").value;
            let BadgeColor = document.querySelector("#BadgeColor").value;
            await new Promise((Resolve) => {
                RequestAPI("EditBadge", {
                    "UserID": String(window.CurrentUsername),
                    "Content": String(BadgeContent),
                    "BackgroundColor": String(BadgeBackgroundColor),
                    "Color": String(BadgeColor)
                }, (Response) => {
                    if (Response.Success) {
                        Resolve();
                    } else {
                        ModifyInfo.disabled = false;
                        ModifyInfo.querySelector("span").style.display = "none";
                        ErrorElement.style.display = "block";
                        ErrorElement.innerText = Response.Message;
                    }
                });
            });
            let Nickname = document.querySelector("#Nickname").value;
            let OldPassword = document.querySelector("#OldPassword").value;
            let NewPassword = document.querySelector("#NewPassword").value;
            let NewPasswordAgain = document.querySelector("#NewPasswordAgain").value;
            let School = document.querySelector("#School").value;
            let EmailAddress = document.querySelector("#EmailAddress").value;
            let CodeforcesAccount = document.querySelector("#CodeforcesAccount").value;
            let AtcoderAccount = document.querySelector("#AtcoderAccount").value;
            let USACOAccount = document.querySelector("#USACOAccount").value;
            let LuoguAccount = document.querySelector("#LuoguAccount").value;
            await fetch("https://www.xmoj.tech/modify.php", {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded"
                },
                "referrer": location.href,
                "method": "POST",
                "body": "nick=" + encodeURIComponent(Nickname) + "&" + "opassword=" + encodeURIComponent(OldPassword) + "&" + "npassword=" + encodeURIComponent(NewPassword) + "&" + "rptpassword=" + encodeURIComponent(NewPasswordAgain) + "&" + "school=" + encodeURIComponent(School) + "&" + "email=" + encodeURIComponent(EmailAddress) + "&" + "acc_cf=" + encodeURIComponent(CodeforcesAccount) + "&" + "acc_atc=" + encodeURIComponent(AtcoderAccount) + "&" + "acc_usaco=" + encodeURIComponent(USACOAccount) + "&" + "acc_luogu=" + encodeURIComponent(LuoguAccount)
            });
            ModifyInfo.disabled = false;
            ModifyInfo.querySelector("span").style.display = "none";
            SuccessElement.style.display = "block";
        });
        if (UtilityEnabled("ExportACCode")) {
            let ExportACCode = document.createElement("button");
            document.querySelector("body > div.container > div").appendChild(ExportACCode);
            ExportACCode.innerText = "导出AC代码";
            ExportACCode.className = "btn btn-outline-secondary";
            ExportACCode.addEventListener("click", () => {
                ExportACCode.disabled = true;
                ExportACCode.innerText = "正在导出...";
                let Request = new XMLHttpRequest();
                Request.addEventListener("readystatechange", () => {
                    if (Request.readyState == 4) {
                        if (Request.status == 200) {
                            let Response = Request.responseText;
                            let ACCode = Response.split("------------------------------------------------------\r\n");
                            let ScriptElement = document.createElement("script");
                            ScriptElement.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
                            document.head.appendChild(ScriptElement);
                            ScriptElement.onload = () => {
                                var Zip = new JSZip();
                                for (let i = 0; i < ACCode.length; i++) {
                                    let CurrentCode = ACCode[i];
                                    if (CurrentCode != "") {
                                        let CurrentQuestionID = CurrentCode.substring(7, 11);
                                        CurrentCode = CurrentCode.substring(14);
                                        CurrentCode = CurrentCode.replaceAll("\r", "");
                                        Zip.file(CurrentQuestionID + ".cpp", CurrentCode);
                                    }
                                }
                                ExportACCode.innerText = "正在生成压缩包……";
                                Zip.generateAsync({type: "blob"})
                                    .then(function (Content) {
                                        saveAs(Content, "ACCodes.zip");
                                        ExportACCode.innerText = "AC代码导出成功";
                                        ExportACCode.disabled = false;
                                        setTimeout(() => {
                                            ExportACCode.innerText = "导出AC代码";
                                        }, 1000);
                                    });
                            };
                        } else {
                            ExportACCode.disabled = false;
                            ExportACCode.innerText = "AC代码导出失败";
                            setTimeout(() => {
                                ExportACCode.innerText = "导出AC代码";
                            }, 1000);
                        }
                    }
                });
                Request.open("GET", "https://www.xmoj.tech/export_ac_code.php", true);
                Request.send();
            });
        }
    }
}
