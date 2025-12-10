/**
 * Discussion Feature
 * Provides discussion forum functionality including discussion list, threads, and replies
 * Feature ID: Discussion
 * Type: A (Add)
 * Description: Adds discussion forum with navbar link, problem page integration, and full forum pages
 *
 * Extracted from: /home/user/XMOJ-Script/src/core/bootstrap.js
 * - Lines 205-210: Navbar link creation
 * - Lines 1284-1317: Discussion button on problem pages
 * - Lines 3609-4386: Discussion forum pages (list, new post, thread view)
 */

import { UtilityEnabled } from '../core/config.js';
import { RequestAPI } from '../utils/api.js';
import { GetRelativeTime } from '../utils/time.js';

/**
 * Initialize discussion feature
 * @param {Object} context - Context object containing required dependencies
 * @param {string} context.CurrentUsername - Current logged in username
 * @param {URLSearchParams} context.SearchParams - URL search parameters
 * @param {boolean} context.IsAdmin - Whether current user is admin
 * @param {HTMLStyleElement} context.Style - Style element for adding CSS
 * @param {string} context.CaptchaSiteKey - Cloudflare turnstile site key
 * @param {Function} context.GetUsernameHTML - Function to render username with profile link
 * @param {Function} context.PurifyHTML - Function to sanitize HTML content
 * @param {Function} context.RenderMathJax - Function to render math formulas
 */
export function init(context) {
    // Only execute if Discussion feature is enabled
    if (!UtilityEnabled("Discussion")) {
        return;
    }

    const {
        CurrentUsername,
        SearchParams,
        IsAdmin,
        Style,
        CaptchaSiteKey,
        GetUsernameHTML,
        PurifyHTML,
        RenderMathJax
    } = context;

    // Part 1: Create navbar link (lines 205-210)
    let Discussion = null;
    if (document.querySelector("#navbar > ul:nth-child(1)")) {
        Discussion = document.createElement("li");
        document.querySelector("#navbar > ul:nth-child(1)").appendChild(Discussion);
        Discussion.innerHTML = "<a href=\"https://www.xmoj.tech/discuss3/discuss.php\">讨论</a>";
    }

    // Part 2: Discussion button on problem pages (lines 1284-1317)
    if (location.pathname === "/problem.php") {
        const centerElement = document.querySelector("body > div > div.mt-3 > center");
        if (centerElement) {
            let PID = null;
            if (SearchParams.get("cid") != null) {
                PID = localStorage.getItem("UserScript-Contest-" + SearchParams.get("cid") + "-Problem-" + SearchParams.get("pid") + "-PID");
            } else {
                PID = SearchParams.get("id");
            }

            if (PID) {
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
                centerElement.appendChild(DiscussButton);

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
        }
    }

    // Part 3: Discussion forum pages (lines 3609-4386)
    if (location.pathname.indexOf("/discuss3") != -1) {
        if (Discussion) {
            Discussion.classList.add("active");
        }

        // Discussion list page
        if (location.pathname == "/discuss3/discuss.php") {
            document.title = "讨论列表";
            let ProblemID = parseInt(SearchParams.get("pid"));
            let BoardID = parseInt(SearchParams.get("bid"));
            let Page = Number(SearchParams.get("page")) || 1;
            document.querySelector("body > div > div").innerHTML = `<h3>讨论列表${(isNaN(ProblemID) ? "" : ` - 题目` + ProblemID)}</h3>
                    <button id="NewPost" type="button" class="btn btn-primary">发布新讨论</button>
                    <nav>
                    <ul class="pagination justify-content-center" id="DiscussPagination">
                    <li class="page-item"><a class="page-link" href="#"><span>&laquo;</span></a></li>
                    <li class="page-item"><a class="page-link" href="#">${Page - 1}</a></li>
                    <li class="page-item"><a class="page-link active" href="#">${Page}</a></li>
                    <li class="page-item"><a class="page-link" href="#">${Page + 1}</a></li>
                    <li class="page-item"><a class="page-link" href="#"><span>&raquo;</span></a></li>
                    </ul>
                    </nav>
                    <div id="GotoBoard"></div>
                    <div id="ErrorElement" class="alert alert-danger" role="alert" style="display: none;"></div>
                    <table id="PostList" class="table table-hover">
                        <thead>
                            <tr>
                                <th class="col-1">编号</th>
                                <th class="col-3">标题</th>
                                <th class="col-3">作者</th>
                                <th class="col-1">题目编号</th>
                                <th class="col-1">发布时间</th>
                                <th class="col-1">回复数</th>
                                <th class="col-1">最后回复</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>`;
            NewPost.addEventListener("click", () => {
                if (!isNaN(ProblemID)) {
                    location.href = "https://www.xmoj.tech/discuss3/newpost.php?pid=" + ProblemID;
                } else if (SearchParams.get("bid") != null) {
                    location.href = "https://www.xmoj.tech/discuss3/newpost.php?bid=" + SearchParams.get("bid");
                } else {
                    location.href = "https://www.xmoj.tech/discuss3/newpost.php";
                }
            });
            const RefreshPostList = (Silent = true) => {
                if (!Silent) {
                    PostList.children[1].innerHTML = "";
                    for (let i = 0; i < 10; i++) {
                        let Row = document.createElement("tr");
                        PostList.children[1].appendChild(Row);
                        for (let j = 0; j < 7; j++) {
                            let Cell = document.createElement("td");
                            Row.appendChild(Cell);
                            Cell.innerHTML = `<span class="placeholder col-${Math.ceil(Math.random() * 12)}"></span>`;
                        }
                    }
                }
                RequestAPI("GetPosts", {
                    "ProblemID": Number(ProblemID || 0),
                    "Page": Number(Page),
                    "BoardID": Number(SearchParams.get("bid") || -1)
                }, async (ResponseData) => {
                    if (ResponseData.Success == true) {
                        ErrorElement.style.display = "none";
                        if (!Silent) {
                            DiscussPagination.children[0].children[0].href = "https://www.xmoj.tech/discuss3/discuss.php?" + (isNaN(ProblemID) ? "" : "pid=" + ProblemID + "&") + (isNaN(BoardID) ? "" : "bid=" + BoardID + "&") + "page=1";
                            DiscussPagination.children[1].children[0].href = "https://www.xmoj.tech/discuss3/discuss.php?" + (isNaN(ProblemID) ? "" : "pid=" + ProblemID + "&") + (isNaN(BoardID) ? "" : "bid=" + BoardID + "&") + "page=" + (Page - 1);
                            DiscussPagination.children[2].children[0].href = "https://www.xmoj.tech/discuss3/discuss.php?" + (isNaN(ProblemID) ? "" : "pid=" + ProblemID + "&") + (isNaN(BoardID) ? "" : "bid=" + BoardID + "&") + "page=" + Page;
                            DiscussPagination.children[3].children[0].href = "https://www.xmoj.tech/discuss3/discuss.php?" + (isNaN(ProblemID) ? "" : "pid=" + ProblemID + "&") + (isNaN(BoardID) ? "" : "bid=" + BoardID + "&") + "page=" + (Page + 1);
                            DiscussPagination.children[4].children[0].href = "https://www.xmoj.tech/discuss3/discuss.php?" + (isNaN(ProblemID) ? "" : "pid=" + ProblemID + "&") + (isNaN(BoardID) ? "" : "bid=" + BoardID + "&") + "page=" + ResponseData.Data.PageCount;
                            if (Page <= 1) {
                                DiscussPagination.children[0].classList.add("disabled");
                                DiscussPagination.children[1].remove();
                            }
                            if (Page >= ResponseData.Data.PageCount) {
                                DiscussPagination.children[DiscussPagination.children.length - 1].classList.add("disabled");
                                DiscussPagination.children[DiscussPagination.children.length - 2].remove();
                            }
                        }
                        let Posts = ResponseData.Data.Posts;
                        PostList.children[1].innerHTML = "";
                        if (Posts.length == 0) {
                            PostList.children[1].innerHTML = `<tr><td colspan="7">暂无数据</td></tr>`;
                        }
                        for (let i = 0; i < Posts.length; i++) {
                            let Row = document.createElement("tr");
                            PostList.children[1].appendChild(Row);
                            let IDCell = document.createElement("td");
                            Row.appendChild(IDCell);
                            IDCell.innerText = Posts[i].PostID + " " + Posts[i].BoardName;
                            let TitleCell = document.createElement("td");
                            Row.appendChild(TitleCell);
                            let TitleLink = document.createElement("a");
                            TitleCell.appendChild(TitleLink);
                            TitleLink.href = "https://www.xmoj.tech/discuss3/thread.php?tid=" + Posts[i].PostID;
                            if (Posts[i].Lock.Locked) {
                                TitleLink.classList.add("link-secondary");
                                TitleLink.innerHTML = "🔒 ";
                            }
                            // Avoid re-parsing by appending a text node
                            TitleLink.appendChild(document.createTextNode(Posts[i].Title));
                            let AuthorCell = document.createElement("td");
                            Row.appendChild(AuthorCell);
                            GetUsernameHTML(AuthorCell, Posts[i].UserID);
                            let ProblemIDCell = document.createElement("td");
                            Row.appendChild(ProblemIDCell);
                            if (Posts[i].ProblemID != 0) {
                                let ProblemIDLink = document.createElement("a");
                                ProblemIDCell.appendChild(ProblemIDLink);
                                ProblemIDLink.href = "https://www.xmoj.tech/problem.php?id=" + Posts[i].ProblemID;
                                ProblemIDLink.innerText = Posts[i].ProblemID;
                            }
                            let PostTimeCell = document.createElement("td");
                            Row.appendChild(PostTimeCell);
                            PostTimeCell.innerHTML = GetRelativeTime(Posts[i].PostTime);
                            let ReplyCountCell = document.createElement("td");
                            Row.appendChild(ReplyCountCell);
                            ReplyCountCell.innerText = Posts[i].ReplyCount;
                            let LastReplyTimeCell = document.createElement("td");
                            Row.appendChild(LastReplyTimeCell);
                            LastReplyTimeCell.innerHTML = GetRelativeTime(Posts[i].LastReplyTime);
                        }
                    } else {
                        ErrorElement.innerText = ResponseData.Message;
                        ErrorElement.style.display = "block";
                    }
                });
            };
            RefreshPostList(false);
            addEventListener("focus", RefreshPostList);
            RequestAPI("GetBoards", {}, (ResponseData) => {
                if (ResponseData.Success === true) {
                    let LinkElement = document.createElement("a");
                    LinkElement.href = "https://www.xmoj.tech/discuss3/discuss.php";
                    LinkElement.classList.add("me-2");
                    LinkElement.innerText = "全部";
                    GotoBoard.appendChild(LinkElement);
                    for (let i = 0; i < ResponseData.Data.Boards.length; i++) {
                        let LinkElement = document.createElement("a");
                        LinkElement.href = "https://www.xmoj.tech/discuss3/discuss.php?bid=" + ResponseData.Data.Boards[i].BoardID;
                        LinkElement.classList.add("me-2");
                        LinkElement.innerText = ResponseData.Data.Boards[i].BoardName;
                        GotoBoard.appendChild(LinkElement);
                    }
                }
            });
        } else if (location.pathname == "/discuss3/newpost.php") {
            // New post page implementation
            let ProblemID = parseInt(SearchParams.get("pid"));
            document.querySelector("body > div > div").innerHTML = `<h3>发布新讨论` + (!isNaN(ProblemID) ? ` - 题目` + ProblemID : ``) + `</h3>
                    <div class="form-group mb-3" id="BoardSelect">
                        <label for="Board" class="mb-1">请选择要发布的板块</label>
                        <div class="row ps-3" id="Board">
                        </div>
                    </div>
                    <div class="form-group mb-3">
                        <label for="Title" class="mb-1">标题</label>
                        <input spellcheck="true" type="text" class="form-control" id="TitleElement" placeholder="请输入标题">
                    </div>
                    <div>
                        <label for="ContentElement" class="mb-1">回复</label>
                        <div class="input-group">
                            <textarea spellcheck="true" class="col-6 form-control" id="ContentElement" rows="3" placeholder="请输入内容"></textarea>
                            <div class="col-6 form-control" id="PreviewTab"></div>
                        </div>
                        <div class="cf-turnstile mt-2" id="CaptchaContainer"></div>
                        <button id="SubmitElement" type="button" class="btn btn-primary mb-2" disabled>
                            发布
                            <div class="spinner-border spinner-border-sm" role="status" style="display: none;">
                        </button>
                    </div>
                    <div id="ErrorElement" class="alert alert-danger" role="alert" style="display: none;"></div>`;
            let CaptchaSecretKey = "";
            unsafeWindow.CaptchaLoadedCallback = () => {
                turnstile.render("#CaptchaContainer", {
                    sitekey: CaptchaSiteKey, callback: function (CaptchaSecretKeyValue) {
                        CaptchaSecretKey = CaptchaSecretKeyValue;
                        SubmitElement.disabled = false;
                    },
                });
            };
            let TurnstileScript = document.createElement("script");
            TurnstileScript.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=CaptchaLoadedCallback";
            document.body.appendChild(TurnstileScript);
            ContentElement.addEventListener("keydown", (Event) => {
                if ((Event.metaKey || Event.ctrlKey) && Event.keyCode == 13) {
                    SubmitElement.click();
                }
            });
            ContentElement.addEventListener("input", () => {
                ContentElement.classList.remove("is-invalid");
                PreviewTab.innerHTML = PurifyHTML(marked.parse(ContentElement.value));
                RenderMathJax();
            });
            TitleElement.addEventListener("input", () => {
                TitleElement.classList.remove("is-invalid");
            });
            ContentElement.addEventListener("paste", (EventData) => {
                let Items = EventData.clipboardData.items;
                if (Items.length !== 0) {
                    for (let i = 0; i < Items.length; i++) {
                        if (Items[i].type.indexOf("image") != -1) {
                            let Reader = new FileReader();
                            Reader.readAsDataURL(Items[i].getAsFile());
                            Reader.onload = () => {
                                let Before = ContentElement.value.substring(0, ContentElement.selectionStart);
                                let After = ContentElement.value.substring(ContentElement.selectionEnd, ContentElement.value.length);
                                const UploadMessage = "![正在上传图片...]()";
                                ContentElement.value = Before + UploadMessage + After;
                                ContentElement.dispatchEvent(new Event("input"));
                                RequestAPI("UploadImage", {
                                    "Image": Reader.result
                                }, (ResponseData) => {
                                    if (ResponseData.Success) {
                                        ContentElement.value = Before + `![](https://assets.xmoj-bbs.me/GetImage?ImageID=${ResponseData.Data.ImageID})` + After;
                                        ContentElement.dispatchEvent(new Event("input"));
                                    } else {
                                        ContentElement.value = Before + `![上传失败！]()` + After;
                                        ContentElement.dispatchEvent(new Event("input"));
                                    }
                                });
                            };
                        }
                    }
                }
            });
            SubmitElement.addEventListener("click", async () => {
                ErrorElement.style.display = "none";
                let Title = TitleElement.value;
                let Content = ContentElement.value;
                let ProblemID = parseInt(SearchParams.get("pid"));
                if (Title === "") {
                    TitleElement.classList.add("is-invalid");
                    return;
                }
                if (Content === "") {
                    ContentElement.classList.add("is-invalid");
                    return;
                }
                if (document.querySelector("#Board input:checked") === null) {
                    ErrorElement.innerText = "请选择要发布的板块";
                    ErrorElement.style.display = "block";
                    return;
                }
                SubmitElement.disabled = true;
                SubmitElement.children[0].style.display = "inline-block";
                RequestAPI("NewPost", {
                    "Title": String(Title),
                    "Content": String(Content),
                    "ProblemID": Number(isNaN(ProblemID) ? 0 : ProblemID),
                    "CaptchaSecretKey": String(CaptchaSecretKey),
                    "BoardID": Number(document.querySelector("#Board input:checked").value)
                }, (ResponseData) => {
                    SubmitElement.disabled = false;
                    SubmitElement.children[0].style.display = "none";
                    if (ResponseData.Success == true) {
                        location.href = "https://www.xmoj.tech/discuss3/thread.php?tid=" + ResponseData.Data.PostID;
                    } else {
                        ErrorElement.innerText = ResponseData.Message;
                        ErrorElement.style.display = "block";
                    }
                });
            });
            RequestAPI("GetBoards", {}, (ResponseData) => {
                if (ResponseData.Success === true) {
                    let Data = ResponseData.Data.Boards;
                    for (let i = 0; i < Data.length; i++) {
                        let RadioElement = document.createElement("div");
                        RadioElement.className = "col-auto form-check form-check-inline";
                        let RadioInput = document.createElement("input");
                        RadioInput.className = "form-check-input";
                        RadioInput.type = "radio";
                        RadioInput.name = "Board";
                        RadioInput.id = "Board" + Data[i].BoardID;
                        RadioInput.value = Data[i].BoardID;
                        RadioElement.appendChild(RadioInput);
                        if (SearchParams.get("bid") !== null && SearchParams.get("bid") == Data[i].BoardID) {
                            RadioInput.checked = true;
                        }
                        if (!isNaN(ProblemID)) {
                            RadioInput.disabled = true;
                        }
                        if (Data[i].BoardID == 4) {
                            if (!isNaN(ProblemID)) RadioInput.checked = true;
                            RadioInput.disabled = true;
                        }
                        let RadioLabel = document.createElement("label");
                        RadioLabel.className = "form-check-label";
                        RadioLabel.htmlFor = "Board" + Data[i].BoardID;
                        RadioLabel.innerText = Data[i].BoardName;
                        RadioElement.appendChild(RadioLabel);
                        Board.appendChild(RadioElement);
                    }
                }
            });
        } else if (location.pathname == "/discuss3/thread.php") {
            // Thread view page implementation
            if (SearchParams.get("tid") == null) {
                location.href = "https://www.xmoj.tech/discuss3/discuss.php";
            } else {
                let ThreadID = SearchParams.get("tid");
                let Page = Number(SearchParams.get("page")) || 1;
                document.querySelector("body > div > div").innerHTML = `<h3 id="PostTitle"></h3>
                        <div class="row mb-3">
                            <span class="col-5 text-muted">作者：<div style="display: inline-block;" id="PostAuthor"></div></span>
                            <span class="col-3 text-muted">发布时间：<span id="PostTime"></span></span>
                            <span class="col-2 text-muted">板块：<span id="PostBoard"></span></span>
                            <span class="col-2">
                                <button id="Delete" type="button" class="btn btn-sm btn-danger" style="display: none;">
                                    删除
                                    <div class="spinner-border spinner-border-sm" role="status" style="display: none;">
                                </button>
                            </span>
                        </div>
                        <div id="PostReplies"></div>
                        <nav>
                            <ul class="pagination justify-content-center" id="DiscussPagination">
                                <li class="page-item"><a class="page-link" href="#"><span>&laquo;</span></a></li>
                                <li class="page-item"><a class="page-link" href="#">${(Page - 1)}</a></li>
                                <li class="page-item"><a class="page-link active" href="#">${Page}</a></li>
                                <li class="page-item"><a class="page-link" href="#">${(Page + 1)}</a></li>
                                <li class="page-item"><a class="page-link" href="#"><span>&raquo;</span></a></li>
                            </ul>
                        </nav>
                        <div>
                            <div class="container p-0 m-0">
                                <div class="row">
                                    <div class="col">
                                        <label for="ContentElement" class="mb-1">回复</label>
                                    </div>
                                    <div class="col">
                                        <div class="form-check form-switch" id="ToggleLock" style="display: none">
                                            <input class="form-check-input" type="checkbox" role="switch" id="ToggleLockButton">
                                            <label class="form-check-label" for="ToggleLockButton">锁定本讨论</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="input-group">
                                <textarea spellcheck="true" class="col-6 form-control" id="ContentElement" rows="3" placeholder="请输入内容"></textarea>
                                <div class="col-6 form-control" id="PreviewTab"></div>
                            </div>
                            <div class="cf-turnstile mt-2" id="CaptchaContainer"></div>
                            <button id="SubmitElement" type="button" class="btn btn-primary mb-2" disabled>
                                发布
                                <div class="spinner-border spinner-border-sm" role="status" style="display: none;">
                            </button>
                        </div>
                        <div id="ErrorElement" class="alert alert-danger" role="alert" style="display: none;"></div>`;
                let CaptchaSecretKey = "";
                unsafeWindow.CaptchaLoadedCallback = () => {
                    turnstile.render("#CaptchaContainer", {
                        theme: UtilityEnabled("DarkMode") ? "dark" : "light", language: "zh-cn",
                        sitekey: CaptchaSiteKey, callback: function (CaptchaSecretKeyValue) {
                            CaptchaSecretKey = CaptchaSecretKeyValue;
                            SubmitElement.disabled = false;
                        },
                    });
                };
                let TurnstileScript = document.createElement("script");
                TurnstileScript.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=CaptchaLoadedCallback";
                document.body.appendChild(TurnstileScript);
                ContentElement.addEventListener("keydown", (Event) => {
                    if ((Event.metaKey || Event.ctrlKey) && Event.keyCode == 13) {
                        SubmitElement.click();
                    }
                });
                ContentElement.addEventListener("input", () => {
                    PreviewTab.innerHTML = PurifyHTML(marked.parse(ContentElement.value));
                    RenderMathJax();
                });
                ContentElement.addEventListener("paste", (EventData) => {
                    let Items = EventData.clipboardData.items;
                    if (Items.length !== 0) {
                        for (let i = 0; i < Items.length; i++) {
                            if (Items[i].type.indexOf("image") != -1) {
                                let Reader = new FileReader();
                                Reader.readAsDataURL(Items[i].getAsFile());
                                Reader.onload = () => {
                                    let Before = ContentElement.value.substring(0, ContentElement.selectionStart);
                                    let After = ContentElement.value.substring(ContentElement.selectionEnd, ContentElement.value.length);
                                    const UploadMessage = "![正在上传图片...]()";
                                    ContentElement.value = Before + UploadMessage + After;
                                    ContentElement.dispatchEvent(new Event("input"));
                                    RequestAPI("UploadImage", {
                                        "Image": Reader.result
                                    }, (ResponseData) => {
                                        if (ResponseData.Success) {
                                            ContentElement.value = Before + `![](https://assets.xmoj-bbs.me/GetImage?ImageID=${ResponseData.Data.ImageID})` + After;
                                            ContentElement.dispatchEvent(new Event("input"));
                                        } else {
                                            ContentElement.value = Before + `![上传失败！]()` + After;
                                            ContentElement.dispatchEvent(new Event("input"));
                                        }
                                    });
                                };
                            }
                        }
                    }
                });
                let RefreshReply = (Silent = true) => {
                    if (!Silent) {
                        PostTitle.innerHTML = `<span class="placeholder col-${Math.ceil(Math.random() * 6)}"></span>`;
                        PostAuthor.innerHTML = `<span class="placeholder col-${Math.ceil(Math.random() * 6)}"></span>`;
                        PostTime.innerHTML = `<span class="placeholder col-${Math.ceil(Math.random() * 6)}"></span>`;
                        PostBoard.innerHTML = `<span class="placeholder col-${Math.ceil(Math.random() * 6)}"></span>`;
                        PostReplies.innerHTML = "";
                        for (let i = 0; i < 10; i++) {
                            PostReplies.innerHTML += `<div class="card mb-3">
                                        <div class="card-body">
                                            <div class="row mb-3">
                                            <span class="col-6"><span class="placeholder col-${Math.ceil(Math.random() * 6)}"></span></span>
                                            <span class="col-6"><span class="placeholder col-${Math.ceil(Math.random() * 6)}"></span></span>
                                            </div>
                                            <hr>
                                            <span class="placeholder col-${Math.ceil(Math.random() * 12)}"></span>
                                            <span class="placeholder col-${Math.ceil(Math.random() * 12)}"></span>
                                            <span class="placeholder col-${Math.ceil(Math.random() * 12)}"></span>
                                        </div>
                                    </div>`;
                        }
                    }
                    RequestAPI("GetPost", {
                        "PostID": Number(ThreadID), "Page": Number(Page)
                    }, async (ResponseData) => {
                        if (ResponseData.Success == true) {
                            let OldScrollTop = document.documentElement.scrollTop;
                            let LockButtons = !IsAdmin && ResponseData.Data.Lock.Locked;
                            if (!Silent) {
                                DiscussPagination.children[0].children[0].href = "https://www.xmoj.tech/discuss3/thread.php?tid=" + ThreadID + "&page=1";
                                DiscussPagination.children[1].children[0].href = "https://www.xmoj.tech/discuss3/thread.php?tid=" + ThreadID + "&page=" + (Page - 1);
                                DiscussPagination.children[2].children[0].href = "https://www.xmoj.tech/discuss3/thread.php?tid=" + ThreadID + "&page=" + Page;
                                DiscussPagination.children[3].children[0].href = "https://www.xmoj.tech/discuss3/thread.php?tid=" + ThreadID + "&page=" + (Page + 1);
                                DiscussPagination.children[4].children[0].href = "https://www.xmoj.tech/discuss3/thread.php?tid=" + ThreadID + "&page=" + ResponseData.Data.PageCount;
                                if (Page <= 1) {
                                    DiscussPagination.children[0].classList.add("disabled");
                                    DiscussPagination.children[1].remove();
                                }
                                if (Page >= ResponseData.Data.PageCount) {
                                    DiscussPagination.children[DiscussPagination.children.length - 1].classList.add("disabled");
                                    DiscussPagination.children[DiscussPagination.children.length - 2].remove();
                                }
                                if (IsAdmin || ResponseData.Data.UserID == CurrentUsername) {
                                    Delete.style.display = "";
                                }
                            }
                            PostTitle.innerHTML = ResponseData.Data.Title + (ResponseData.Data.ProblemID == 0 ? "" : ` - 题目` + ` <a href="https://www.xmoj.tech/problem.php?id=` + ResponseData.Data.ProblemID + `">` + ResponseData.Data.ProblemID + `</a>`);
                            document.title = "讨论" + ThreadID + ": " + ResponseData.Data.Title;
                            PostAuthor.innerHTML = "<span></span>";
                            GetUsernameHTML(PostAuthor.children[0], ResponseData.Data.UserID);
                            PostTime.innerHTML = GetRelativeTime(ResponseData.Data.PostTime);
                            PostBoard.innerHTML = ResponseData.Data.BoardName;
                            let Replies = ResponseData.Data.Reply;
                            PostReplies.innerHTML = "";
                            for (let i = 0; i < Replies.length; i++) {
                                let CardElement = document.createElement("div");
                                PostReplies.appendChild(CardElement);
                                CardElement.className = "card mb-3";
                                let CardBodyElement = document.createElement("div");
                                CardElement.appendChild(CardBodyElement);
                                CardBodyElement.className = "card-body row";
                                let CardBodyRowElement = document.createElement("div");
                                CardBodyElement.appendChild(CardBodyRowElement);
                                CardBodyRowElement.className = "row mb-3";
                                let AuthorElement = document.createElement("span");
                                CardBodyRowElement.appendChild(AuthorElement);
                                AuthorElement.className = "col-4 text-muted";
                                let AuthorSpanElement = document.createElement("span");
                                AuthorElement.appendChild(AuthorSpanElement);
                                AuthorSpanElement.innerText = "作者：";
                                let AuthorUsernameElement = document.createElement("span");
                                AuthorElement.appendChild(AuthorUsernameElement);
                                GetUsernameHTML(AuthorUsernameElement, Replies[i].UserID);
                                let SendTimeElement = document.createElement("span");
                                CardBodyRowElement.appendChild(SendTimeElement);
                                SendTimeElement.className = "col-4 text-muted";
                                SendTimeElement.innerHTML = "发布时间：" + GetRelativeTime(Replies[i].ReplyTime);

                                let OKButton;
                                if (!LockButtons) {
                                    let ButtonsElement = document.createElement("span");
                                    CardBodyRowElement.appendChild(ButtonsElement);
                                    ButtonsElement.className = "col-4";
                                    let ReplyButton = document.createElement("button");
                                    ButtonsElement.appendChild(ReplyButton);
                                    ReplyButton.type = "button";
                                    ReplyButton.className = "btn btn-sm btn-info";
                                    ReplyButton.innerText = "回复";
                                    ReplyButton.addEventListener("click", () => {
                                        let Content = Replies[i].Content;
                                        Content = Content.split("\n").map((Line) => {
                                            // Count the number of '>' characters at the beginning of the line
                                            let nestingLevel = 0;
                                            while (Line.startsWith(">")) {
                                                nestingLevel++;
                                                Line = Line.substring(1).trim();
                                            }
                                            // If the line is nested more than 2 levels deep, skip it
                                            if (nestingLevel > 2) {
                                                return null;
                                            }
                                            // Reconstruct the line with the appropriate number of '>' characters
                                            return "> ".repeat(nestingLevel + 1) + Line;
                                        }).filter(Line => Line !== null)  // Remove null entries
                                            .join("\n");
                                        ContentElement.value += Content + `\n\n@${Replies[i].UserID} `;
                                        ContentElement.focus();
                                    });
                                    let DeleteButton = document.createElement("button");
                                    ButtonsElement.appendChild(DeleteButton);
                                    DeleteButton.type = "button";
                                    DeleteButton.className = "btn btn-sm btn-danger ms-1";
                                    DeleteButton.innerText = "删除";
                                    DeleteButton.style.display = (IsAdmin || Replies[i].UserID == CurrentUsername ? "" : "none");
                                    DeleteButton.addEventListener("click", () => {
                                        DeleteButton.disabled = true;
                                        DeleteButton.lastChild.style.display = "";
                                        RequestAPI("DeleteReply", {
                                            "ReplyID": Number(Replies[i].ReplyID)
                                        }, (ResponseData) => {
                                            if (ResponseData.Success == true) {
                                                RefreshReply();
                                            } else {
                                                DeleteButton.disabled = false;
                                                DeleteButton.lastChild.style.display = "none";
                                                ErrorElement.innerText = ResponseData.Message;
                                                ErrorElement.style.display = "";
                                            }
                                        });
                                    });
                                    let DeleteSpin = document.createElement("div");
                                    DeleteButton.appendChild(DeleteSpin);
                                    DeleteSpin.className = "spinner-border spinner-border-sm";
                                    DeleteSpin.role = "status";
                                    DeleteSpin.style.display = "none";
                                    OKButton = document.createElement("button");
                                    ButtonsElement.appendChild(OKButton);
                                    OKButton.type = "button";
                                    OKButton.style.display = "none";
                                    OKButton.className = "btn btn-sm btn-success ms-1";
                                    OKButton.innerText = "确认";
                                    let OKSpin = document.createElement("div");
                                    OKButton.appendChild(OKSpin);
                                    OKSpin.className = "spinner-border spinner-border-sm";
                                    OKSpin.role = "status";
                                    OKSpin.style.display = "none";
                                    OKButton.addEventListener("click", () => {
                                        OKButton.disabled = true;
                                        OKButton.lastChild.style.display = "";
                                        RequestAPI("EditReply", {
                                            ReplyID: Number(Replies[i].ReplyID),
                                            Content: String(ContentEditor.value)
                                        }, (ResponseData) => {
                                            if (ResponseData.Success == true) {
                                                RefreshReply();
                                            } else {
                                                OKButton.disabled = false;
                                                OKButton.lastChild.style.display = "none";
                                                ErrorElement.innerText = ResponseData.Message;
                                                ErrorElement.style.display = "";
                                            }
                                        });
                                    });
                                    let CancelButton = document.createElement("button");
                                    ButtonsElement.appendChild(CancelButton);
                                    CancelButton.type = "button";
                                    CancelButton.style.display = "none";
                                    CancelButton.className = "btn btn-sm btn-secondary ms-1";
                                    CancelButton.innerText = "取消";
                                    CancelButton.addEventListener("click", () => {
                                        CardBodyElement.children[2].style.display = "";
                                        CardBodyElement.children[3].style.display = "none";
                                        EditButton.style.display = "";
                                        OKButton.style.display = "none";
                                        CancelButton.style.display = "none";
                                    });
                                    let EditButton = document.createElement("button");
                                    ButtonsElement.appendChild(EditButton);
                                    EditButton.type = "button";
                                    EditButton.className = "btn btn-sm btn-warning ms-1";
                                    EditButton.innerText = "编辑";
                                    EditButton.style.display = (IsAdmin || Replies[i].UserID == CurrentUsername ? "" : "none");
                                    EditButton.addEventListener("click", () => {
                                        CardBodyElement.children[2].style.display = "none";
                                        CardBodyElement.children[3].style.display = "";
                                        EditButton.style.display = "none";
                                        OKButton.style.display = "";
                                        CancelButton.style.display = "";
                                    });
                                }

                                let CardBodyHRElement = document.createElement("hr");
                                CardBodyElement.appendChild(CardBodyHRElement);

                                let ReplyContentElement = document.createElement("div");
                                CardBodyElement.appendChild(ReplyContentElement);
                                ReplyContentElement.innerHTML = PurifyHTML(marked.parse(Replies[i].Content)).replaceAll(/@([a-zA-Z0-9]+)/g, `<b>@</b><span class="ms-1 Usernames">$1</span>`);
                                if (Replies[i].EditTime != null) {
                                    if (Replies[i].EditPerson == Replies[i].UserID) {
                                        {
                                            const span = document.createElement('span');
                                            span.className = 'text-muted';
                                            span.style.fontSize = '12px';
                                            span.appendChild(document.createTextNode(`最后编辑于${GetRelativeTime(Replies[i].EditTime)}`));
                                            ReplyContentElement.appendChild(span);
                                        }
                                    } else {
                                        {
                                            const outer = document.createElement('span');
                                            outer.className = 'text-muted';
                                            outer.style.fontSize = '12px';
                                            outer.appendChild(document.createTextNode('最后被'));
                                            const userSpan = document.createElement('span');
                                            userSpan.className = 'Usernames';
                                            userSpan.appendChild(document.createTextNode(Replies[i].EditPerson));
                                            outer.appendChild(userSpan);
                                            outer.appendChild(document.createTextNode(`编辑于${GetRelativeTime(Replies[i].EditTime)}`));
                                            ReplyContentElement.appendChild(outer);
                                        }
                                    }
                                }
                                let ContentEditElement = document.createElement("div");
                                CardBodyElement.appendChild(ContentEditElement);
                                ContentEditElement.classList.add("input-group");
                                ContentEditElement.style.display = "none";
                                let ContentEditor = document.createElement("textarea");
                                ContentEditElement.appendChild(ContentEditor);
                                ContentEditor.className = "form-control col-6";
                                ContentEditor.rows = 3;
                                ContentEditor.value = Replies[i].Content;
                                if (ContentEditor.value.indexOf("<br>") != -1) {
                                    ContentEditor.value = ContentEditor.value.substring(0, ContentEditor.value.indexOf("<br>"));
                                }
                                ContentEditor.addEventListener("keydown", (Event) => {
                                    if ((Event.metaKey || Event.ctrlKey) && Event.keyCode == 13) {
                                        OKButton.click();
                                    }
                                });
                                let PreviewTab = document.createElement("div");
                                ContentEditElement.appendChild(PreviewTab);
                                PreviewTab.className = "form-control col-6";
                                PreviewTab.innerHTML = PurifyHTML(marked.parse(ContentEditor.value));
                                ContentEditor.addEventListener("input", () => {
                                    PreviewTab.innerHTML = PurifyHTML(marked.parse(ContentEditor.value));
                                    RenderMathJax();
                                });
                                ContentEditor.addEventListener("paste", (EventData) => {
                                    let Items = EventData.clipboardData.items;
                                    if (Items.length !== 0) {
                                        for (let i = 0; i < Items.length; i++) {
                                            if (Items[i].type.indexOf("image") != -1) {
                                                let Reader = new FileReader();
                                                Reader.readAsDataURL(Items[i].getAsFile());
                                                Reader.onload = () => {
                                                    let Before = ContentEditor.value.substring(0, ContentEditor.selectionStart);
                                                    let After = ContentEditor.value.substring(ContentEditor.selectionEnd, ContentEditor.value.length);
                                                    const UploadMessage = "![正在上传图片...]()";
                                                    ContentEditor.value = Before + UploadMessage + After;
                                                    ContentEditor.dispatchEvent(new Event("input"));
                                                    RequestAPI("UploadImage", {
                                                        "Image": Reader.result
                                                    }, (ResponseData) => {
                                                        if (ResponseData.Success) {
                                                            ContentEditor.value = Before + `![](https://assets.xmoj-bbs.me/GetImage?ImageID=${ResponseData.Data.ImageID})` + After;
                                                            ContentEditor.dispatchEvent(new Event("input"));
                                                        } else {
                                                            ContentEditor.value = Before + `![上传失败！]()` + After;
                                                            ContentEditor.dispatchEvent(new Event("input"));
                                                        }
                                                    });
                                                };
                                            }
                                        }
                                    }
                                });
                            }

                            let UsernameElements = document.getElementsByClassName("Usernames");
                            for (let i = 0; i < UsernameElements.length; i++) {
                                GetUsernameHTML(UsernameElements[i], UsernameElements[i].innerText, true);
                            }

                            let CodeElements = document.querySelectorAll("#PostReplies > div > div > div:nth-child(3) > pre > code");
                            for (let i = 0; i < CodeElements.length; i++) {
                                let ModeName = "text/x-c++src";
                                if (CodeElements[i].className == "language-c") {
                                    ModeName = "text/x-csrc";
                                } else if (CodeElements[i].className == "language-cpp") {
                                    ModeName = "text/x-c++src";
                                }
                                CodeMirror(CodeElements[i].parentElement, {
                                    value: CodeElements[i].innerText,
                                    mode: ModeName,
                                    theme: (UtilityEnabled("DarkMode") ? "darcula" : "default"),
                                    lineNumbers: true,
                                    readOnly: true
                                }).setSize("100%", "auto");
                                CodeElements[i].remove();
                            }

                            if (LockButtons) {
                                let LockElement = ContentElement.parentElement.parentElement;
                                LockElement.innerHTML = "讨论已于 " + await GetRelativeTime(ResponseData.Data.Lock.LockTime) + " 被 ";
                                let LockUsernameSpan = document.createElement("span");
                                LockElement.appendChild(LockUsernameSpan);
                                GetUsernameHTML(LockUsernameSpan, ResponseData.Data.Lock.LockPerson);
                                LockElement.appendChild(document.createTextNode(" 锁定"));
                                LockElement.classList.add("mb-5");
                            }

                            if (IsAdmin) {
                                ToggleLock.style.display = "inline-block";
                                ToggleLockButton.checked = ResponseData.Data.Lock.Locked;
                                ToggleLockButton.onclick = () => {
                                    ToggleLockButton.disabled = true;
                                    ErrorElement.style.display = "none";
                                    RequestAPI((ToggleLockButton.checked ? "LockPost" : "UnlockPost"), {
                                        "PostID": Number(ThreadID)
                                    }, (LockResponseData) => {
                                        ToggleLockButton.disabled = false;
                                        if (LockResponseData.Success) {
                                            RefreshReply();
                                        } else {
                                            ErrorElement.style.display = "";
                                            ErrorElement.innerText = "错误：" + LockResponseData.Message;
                                            ToggleLockButton.checked = !ToggleLockButton.checked;
                                        }
                                    });
                                };
                            }

                            Style.innerHTML += "img {";
                            Style.innerHTML += "    width: 50%;";
                            Style.innerHTML += "}";

                            RenderMathJax();

                            if (Silent) {
                                scrollTo({
                                    top: OldScrollTop, behavior: "instant"
                                });
                            }
                        } else {
                            PostTitle.innerText = "错误：" + ResponseData.Message;
                        }
                    });
                };
                Delete.addEventListener("click", () => {
                    Delete.disabled = true;
                    Delete.children[0].style.display = "inline-block";
                    RequestAPI("DeletePost", {
                        "PostID": Number(SearchParams.get("tid"))
                    }, (ResponseData) => {
                        Delete.disabled = false;
                        Delete.children[0].style.display = "none";
                        if (ResponseData.Success == true) {
                            location.href = "https://www.xmoj.tech/discuss3/discuss.php";
                        } else {
                            ErrorElement.innerText = ResponseData.Message;
                            ErrorElement.style.display = "block";
                        }
                    });
                });
                SubmitElement.addEventListener("click", async () => {
                    ErrorElement.style.display = "none";
                    SubmitElement.disabled = true;
                    SubmitElement.children[0].style.display = "inline-block";
                    RequestAPI("NewReply", {
                        "PostID": Number(SearchParams.get("tid")),
                        "Content": String(ContentElement.value),
                        "CaptchaSecretKey": String(CaptchaSecretKey)
                    }, async (ResponseData) => {
                        SubmitElement.disabled = false;
                        SubmitElement.children[0].style.display = "none";
                        if (ResponseData.Success == true) {
                            RefreshReply();
                            ContentElement.value = "";
                            PreviewTab.innerHTML = "";
                            while (PostReplies.innerHTML.indexOf("placeholder") != -1) {
                                await new Promise((resolve) => {
                                    setTimeout(resolve, 100);
                                });
                            }
                            ContentElement.focus();
                            ContentElement.scrollIntoView();
                            turnstile.reset();
                        } else {
                            ErrorElement.innerText = ResponseData.Message;
                            ErrorElement.style.display = "block";
                        }
                    });
                });
                RefreshReply(false);
                addEventListener("focus", RefreshReply);
            }
        }
    }
}
