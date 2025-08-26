import { UtilityEnabled, GetRelativeTime, GetUsernameHTML, PurifyHTML } from '../utils.js';
import { RequestAPI } from '../api.js';
import { marked } from 'marked';

export async function handleMailPage() {
    const SearchParams = new URLSearchParams(location.search);
    if (SearchParams.get("to_user") == null) {
        document.querySelector("body > div > div.mt-3").innerHTML = `<div class="row g-2 align-items-center">
<div class="col-auto form-floating">
    <input class="form-control" id="Username" placeholder=" " spellcheck="false" data-ms-editor="true">
    <label for="Username">搜索新用户</label>
</div>
<div class="col-auto form-floating">
    <button class="btn btn-outline-secondary" id="AddUser">
        添加
        <div class="spinner-border spinner-border-sm" role="status" style="display: none;">
    </button>
</div>
</div>
<table class="table mb-3" id="ReceiveTable">
<thead>
    <tr>
        <td class="col-3">接收者</td>
        <td class="col-7">最新消息</td>
        <td class="col-2">最后联系时间</td>
    </tr>
</thead>
<tbody></tbody>
</table>
<div class="alert alert-danger mb-3" role="alert" id="ErrorElement" style="display: none;"></div>`;
        let RefreshMessageList = (Silent = true) => {
            if (!Silent) {
                ReceiveTable.children[1].innerHTML = "";
                for (let i = 0; i < 10; i++) {
                    let Row = document.createElement("tr");
                    ReceiveTable.children[1].appendChild(Row);
                    for (let j = 0; j < 3; j++) {
                        let Cell = document.createElement("td");
                        Row.appendChild(Cell);
                        Cell.innerHTML = `<span class="placeholder col-${Math.ceil(Math.random() * 12)}"></span>`;
                    }
                }
            }
            RequestAPI("GetMailList", {}, async (ResponseData) => {
                if (ResponseData.Success) {
                    ErrorElement.style.display = "none";
                    let Data = ResponseData.Data.MailList;
                    ReceiveTable.children[1].innerHTML = "";
                    for (let i = 0; i < Data.length; i++) {
                        let Row = document.createElement("tr");
                        ReceiveTable.children[1].appendChild(Row);
                        let UsernameCell = document.createElement("td");
                        Row.appendChild(UsernameCell);
                        let UsernameSpan = document.createElement("span");
                        UsernameCell.appendChild(UsernameSpan);
                        GetUsernameHTML(UsernameSpan, Data[i].OtherUser, false, "https://www.xmoj.tech/mail.php?to_user=");
                        if (Data[i].UnreadCount != 0) {
                            let UnreadCountSpan = document.createElement("span");
                            UsernameCell.appendChild(UnreadCountSpan);
                            UnreadCountSpan.className = "ms-1 badge text-bg-danger";
                            UnreadCountSpan.innerText = Data[i].UnreadCount;
                        }
                        let LastsMessageCell = document.createElement("td");
                        Row.appendChild(LastsMessageCell);
                        LastsMessageCell.innerText = replaceMarkdownImages(Data[i].LastsMessage, '[image]');
                        let SendTimeCell = document.createElement("td");
                        Row.appendChild(SendTimeCell);
                        SendTimeCell.innerHTML = GetRelativeTime(Data[i].SendTime);
                    }
                } else {
                    ErrorElement.innerText = ResponseData.Message;
                    ErrorElement.style.display = "";
                }
            });
        };
        Username.addEventListener("input", () => {
            Username.classList.remove("is-invalid");
        });
        AddUser.addEventListener("click", () => {
            let UsernameData = Username.value;
            if (UsernameData == "") {
                Username.classList.add("is-invalid");
                return;
            }
            AddUser.children[0].style.display = "";
            AddUser.disabled = true;
            RequestAPI("SendMail", {
                "ToUser": String(UsernameData),
                "Content": String("您好，我是" + window.CurrentUsername)
            }, (ResponseData) => {
                AddUser.children[0].style.display = "none";
                AddUser.disabled = false;
                if (ResponseData.Success) {
                    ErrorElement.style.display = "none";
                    RefreshMessageList();
                } else {
                    ErrorElement.innerText = ResponseData.Message;
                    ErrorElement.style.display = "";
                }
            });
        });
        RefreshMessageList(false);
        addEventListener("focus", RefreshMessageList);
    } else {
        document.querySelector("body > div > div.mt-3").innerHTML = `<div class="row g-2 mb-3">
<div class="col-md form-floating">
    <div class="form-control" id="ToUser"></div>
    <label for="ToUser">接收用户</label>
</div>
<div class="col-md form-floating">
    <input spellcheck="true" class="form-control" id="Content" placeholder=" ">
    <label for="Content">内容</label>
</div>
</div>
<button id="Send" type="submit" class="btn btn-primary mb-1">
发送
<div class="spinner-border spinner-border-sm" role="status" style="display: none;">
</button>
<div id="ErrorElement" class="alert alert-danger mb-3" role="alert" style="display: none;"></div>
<table class="table mb-3" id="MessageTable">
<thead>
    <tr>
        <td class="col-3">发送者</td>
        <td class="col-7">内容</td>
        <td class="col-1">发送时间</td>
        <td class="col-1">阅读状态</td>
    </tr>
</thead>
<tbody></tbody>
</table>`;
        GetUsernameHTML(ToUser, SearchParams.get("to_user"));
        let RefreshMessage = (Silent = true) => {
            if (!Silent) {
                MessageTable.children[1].innerHTML = "";
                for (let i = 0; i < 10; i++) {
                    let Row = document.createElement("tr");
                    MessageTable.children[1].appendChild(Row);
                    for (let j = 0; j < 4; j++) {
                        let Cell = document.createElement("td");
                        Row.appendChild(Cell);
                        Cell.innerHTML = `<span class="placeholder col-${Math.ceil(Math.random() * 12)}"></span>`;
                    }
                }
            }
            RequestAPI("ReadUserMailMention", {
                "UserID": String(SearchParams.get("to_user"))
            });
            RequestAPI("GetMail", {
                "OtherUser": String(SearchParams.get("to_user"))
            }, async (ResponseData) => {
                if (ResponseData.Success) {
                    ErrorElement.style.display = "none";
                    let Data = ResponseData.Data.Mail;
                    MessageTable.children[1].innerHTML = "";
                    for (let i = 0; i < Data.length; i++) {
                        let Row = document.createElement("tr");
                        MessageTable.children[1].appendChild(Row);
                        if (!Data[i].IsRead && Data[i].FromUser != window.CurrentUsername) {
                            Row.className = "table-info";
                        }
                        let UsernameCell = document.createElement("td");
                        Row.appendChild(UsernameCell);
                        GetUsernameHTML(UsernameCell, Data[i].FromUser);
                        let ContentCell = document.createElement("td");
                        let ContentDiv = document.createElement("div");
                        ContentDiv.style.display = "flex";
                        ContentDiv.style.maxWidth = window.innerWidth - 300 + "px";
                        ContentDiv.style.maxHeight = "500px";
                        ContentDiv.style.overflowX = "auto";
                        ContentDiv.style.overflowY = "auto";
                        ContentDiv.innerHTML = PurifyHTML(marked.parse(Data[i].Content));
                        let mediaElements = ContentDiv.querySelectorAll('img, video');
                        for (let media of mediaElements) {
                            media.style.objectFit = 'contain';
                            media.style.maxWidth = '100%';
                            media.style.maxHeight = '100%';
                        }
                        ContentCell.appendChild(ContentDiv);
                        Row.appendChild(ContentCell);
                        let SendTimeCell = document.createElement("td");
                        Row.appendChild(SendTimeCell);
                        SendTimeCell.innerHTML = GetRelativeTime(Data[i].SendTime);
                        let IsReadCell = document.createElement("td");
                        Row.appendChild(IsReadCell);
                        IsReadCell.innerHTML = (Data[i].IsRead ? "已读" : "未读");
                    }
                } else {
                    ErrorElement.innerText = ResponseData.Message;
                    ErrorElement.style.display = "";
                }
            });
        };
        Content.addEventListener("input", () => {
            Content.classList.remove("is-invalid");
        });
        Content.addEventListener("paste", (EventData) => {
            let Items = EventData.clipboardData.items;
            if (Items.length !== 0) {
                for (let i = 0; i < Items.length; i++) {
                    if (Items[i].type.indexOf("image") != -1) {
                        let Reader = new FileReader();
                        Reader.readAsDataURL(Items[i].getAsFile());
                        Reader.onload = () => {
                            let Before = Content.value.substring(0, Content.selectionStart);
                            let After = Content.value.substring(Content.selectionEnd, Content.value.length);
                            const UploadMessage = "![正在上传图片...]()";
                            Content.value = Before + UploadMessage + After;
                            Content.dispatchEvent(new Event("input"));
                            RequestAPI("UploadImage", {
                                "Image": Reader.result
                            }, (ResponseData) => {
                                if (ResponseData.Success) {
                                    Content.value = Before + `![](https://assets.xmoj-bbs.me/GetImage?ImageID=${ResponseData.Data.ImageID})` + After;
                                    Content.dispatchEvent(new Event("input"));
                                } else {
                                    Content.value = Before + `![上传失败！` + ResponseData.Message + `]()` + After;
                                    Content.dispatchEvent(new Event("input"));
                                }
                            });
                        };
                    }
                }
            }
        });
        Content.addEventListener("keydown", (Event) => {
            if (Event.keyCode == 13) {
                Send.click();
            }
        });
        Send.addEventListener("click", () => {
            if (Content.value == "") {
                Content.classList.add("is-invalid");
                return;
            }
            Send.disabled = true;
            Send.children[0].style.display = "";
            let ContentData = Content.value;
            RequestAPI("SendMail", {
                "ToUser": String(SearchParams.get("to_user")), "Content": String(ContentData)
            }, (ResponseData) => {
                Send.disabled = false;
                Send.children[0].style.display = "none";
                if (ResponseData.Success) {
                    ErrorElement.style.display = "none";
                    Content.value = "";
                    RefreshMessage();
                } else {
                    ErrorElement.innerText = ResponseData.Message;
                    ErrorElement.style.display = "";
                }
            });
        });
        RefreshMessage(false);
        addEventListener("focus", RefreshMessage);
    }
}
