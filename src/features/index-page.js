// Index page handler
import { UtilityEnabled } from '../core/config.js';
import { RequestAPI } from '../utils/api.js';
import { TidyTable } from '../utils/table.js';
import { RenderMathJax } from '../utils/mathjax.js';
import { GetUsernameHTML } from '../utils/user.js';

/**
 * Handle index page (/index.php or /)
 * @param {Object} context - Execution context
 */
export async function handleIndexPage(context) {
    const { location, SearchParams, initTheme, marked } = context;

    if (location.pathname == "/index.php" || location.pathname == "/") {
        if (new URL(location.href).searchParams.get("ByUserScript") != null) {
            // Script settings page
            document.title = "脚本设置";
            localStorage.setItem("UserScript-Opened", "true");
            let Container = document.getElementsByClassName("mt-3")[0];
            Container.innerHTML = "";
            let Alert = document.createElement("div");
            Alert.classList.add("alert");
            Alert.classList.add("alert-primary");
            Alert.role = "alert";
            Alert.innerHTML = `欢迎您使用XMOJ增强脚本！点击
                <a class="alert-link" href="https://www.xmoj.tech/modifypage.php?ByUserScript=1" target="_blank">此处</a>
                查看更新日志。`;
            Container.appendChild(Alert);
            let UtilitiesCard = document.createElement("div");
            UtilitiesCard.classList.add("card");
            UtilitiesCard.classList.add("mb-3");
            let UtilitiesCardHeader = document.createElement("div");
            UtilitiesCardHeader.classList.add("card-header");
            UtilitiesCardHeader.innerText = "XMOJ增强脚本功能列表";
            UtilitiesCard.appendChild(UtilitiesCardHeader);
            let UtilitiesCardBody = document.createElement("div");
            UtilitiesCardBody.classList.add("card-body");
            let CreateList = (Data) => {
                let List = document.createElement("ul");
                List.classList.add("list-group");
                for (let i = 0; i < Data.length; i++) {
                    let Row = document.createElement("li");
                    Row.classList.add("list-group-item");
                    if (Data[i].Type == "A") {
                        Row.classList.add("list-group-item-success");
                    } else if (Data[i].Type == "F") {
                        Row.classList.add("list-group-item-warning");
                    } else if (Data[i].Type == "D") {
                        Row.classList.add("list-group-item-danger");
                    }
                    if (Data[i].ID == "Theme") {
                        let Label = document.createElement("label");
                        Label.classList.add("me-2");
                        Label.htmlFor = "UserScript-Setting-Theme";
                        Label.innerText = Data[i].Name;
                        Row.appendChild(Label);
                        let Select = document.createElement("select");
                        Select.classList.add("form-select", "form-select-sm", "w-auto", "d-inline");
                        Select.id = "UserScript-Setting-Theme";
                        [
                            ["light", "亮色"],
                            ["dark", "暗色"],
                            ["auto", "跟随系统"]
                        ].forEach(opt => {
                            let option = document.createElement("option");
                            option.value = opt[0];
                            option.innerText = opt[1];
                            Select.appendChild(option);
                        });
                        Select.value = localStorage.getItem("UserScript-Setting-Theme") || "auto";
                        Select.addEventListener("change", () => {
                            localStorage.setItem("UserScript-Setting-Theme", Select.value);
                            initTheme();
                        });
                        Row.appendChild(Select);
                    } else if (Data[i].Children == undefined) {
                        let CheckBox = document.createElement("input");
                        CheckBox.classList.add("form-check-input");
                        CheckBox.classList.add("me-1");
                        CheckBox.type = "checkbox";
                        CheckBox.id = Data[i].ID;
                        if (localStorage.getItem("UserScript-Setting-" + Data[i].ID) == null) {
                            localStorage.setItem("UserScript-Setting-" + Data[i].ID, "true");
                        }
                        if (localStorage.getItem("UserScript-Setting-" + Data[i].ID) == "false") {
                            CheckBox.checked = false;
                        } else {
                            CheckBox.checked = true;
                        }
                        CheckBox.addEventListener("change", () => {
                            return localStorage.setItem("UserScript-Setting-" + Data[i].ID, CheckBox.checked);
                        });

                        Row.appendChild(CheckBox);
                        let Label = document.createElement("label");
                        Label.classList.add("form-check-label");
                        Label.htmlFor = Data[i].ID;
                        Label.innerText = Data[i].Name;
                        Row.appendChild(Label);
                    } else {
                        let Label = document.createElement("label");
                        Label.innerText = Data[i].Name;
                        Row.appendChild(Label);
                    }
                    if (Data[i].Children != undefined) {
                        Row.appendChild(CreateList(Data[i].Children));
                    }
                    List.appendChild(Row);
                }
                return List;
            };
            UtilitiesCardBody.appendChild(CreateList([{
                "ID": "Discussion",
                "Type": "F",
                "Name": "恢复讨论与短消息功能"
            }, {
                "ID": "MoreSTD", "Type": "F", "Name": "查看到更多标程"
            }, {"ID": "ApplyData", "Type": "A", "Name": "获取数据功能"}, {
                "ID": "AutoCheat", "Type": "A", "Name": "自动提交当年代码"
            }, {"ID": "Rating", "Type": "A", "Name": "添加用户评分和用户名颜色"}, {
                "ID": "AutoRefresh", "Type": "A", "Name": "比赛列表、比赛排名界面自动刷新"
            }, {
                "ID": "AutoCountdown", "Type": "A", "Name": "比赛列表等界面的时间自动倒计时"
            }, {"ID": "DownloadPlayback", "Type": "A", "Name": "回放视频增加下载功能"}, {
                "ID": "ImproveACRate", "Type": "A", "Name": "自动提交已AC题目以提高AC率"
            }, {"ID": "AutoO2", "Type": "F", "Name": "代码提交界面自动选择O2优化"}, {
                "ID": "Beautify", "Type": "F", "Name": "美化界面", "Children": [{
                    "ID": "NewTopBar", "Type": "F", "Name": "使用新的顶部导航栏"
                }, {
                    "ID": "NewBootstrap", "Type": "F", "Name": "使用新版的Bootstrap样式库*"
                }, {"ID": "ResetType", "Type": "F", "Name": "重新排版*"}, {
                    "ID": "AddColorText", "Type": "A", "Name": "增加彩色文字"
                }, {"ID": "AddUnits", "Type": "A", "Name": "状态界面内存与耗时添加单位"}, {
                    "ID": "Theme", "Type": "A", "Name": "界面主题"
                }, {"ID": "AddAnimation", "Type": "A", "Name": "增加动画"}, {
                    "ID": "ReplaceYN", "Type": "F", "Name": "题目前状态提示替换为好看的图标"
                }, {"ID": "RemoveAlerts", "Type": "D", "Name": "去除多余反复的提示"}, {
                    "ID": "Translate", "Type": "F", "Name": "统一使用中文，翻译了部分英文*"
                }, {
                    "ID": "ReplaceLinks", "Type": "F", "Name": "将网站中所有以方括号包装的链接替换为按钮"
                }, {"ID": "RemoveUseless", "Type": "D", "Name": "删去无法使用的功能*"}, {
                    "ID": "ReplaceXM",
                    "Type": "F",
                    "Name": "将网站中所有\"小明\"和\"我\"关键字替换为\"高老师\"，所有\"小红\"替换为\"徐师娘\"，所有\"小粉\"替换为\"彩虹\"，所有\"下海\"、\"海上\"替换为\"上海\" (此功能默认关闭)"
                }]
            }, {
                "ID": "AutoLogin", "Type": "A", "Name": "在需要登录的界面自动跳转到登录界面"
            }, {
                "ID": "SavePassword", "Type": "A", "Name": "自动保存用户名与密码，免去每次手动输入密码的繁琐"
            }, {
                "ID": "CopySamples", "Type": "F", "Name": "题目界面测试样例有时复制无效"
            }, {
                "ID": "RefreshSolution", "Type": "F", "Name": "状态页面结果自动刷新每次只能刷新一个"
            }, {"ID": "CopyMD", "Type": "A", "Name": "复制题目或题解内容"}, {
                "ID": "ProblemSwitcher", "Type": "A", "Name": "比赛题目切换器"
            }, {
                "ID": "OpenAllProblem", "Type": "A", "Name": "比赛题目界面一键打开所有题目"
            }, {
                "ID": "CheckCode", "Type": "A", "Name": "提交代码前对代码进行检查", "Children": [{
                    "ID": "IOFile", "Type": "A", "Name": "是否使用了文件输入输出（如果需要使用）"
                }, {"ID": "CompileError", "Type": "A", "Name": "是否有编译错误"}]
            }, {
                "ID": "ExportACCode", "Type": "F", "Name": "导出AC代码每一道题目一个文件"
            }, {"ID": "LoginFailed", "Type": "F", "Name": "修复登录后跳转失败*"}, {
                "ID": "NewDownload", "Type": "A", "Name": "下载页面增加下载内容"
            }, {"ID": "CompareSource", "Type": "A", "Name": "比较代码"}, {
                "ID": "BBSPopup", "Type": "A", "Name": "讨论提醒"
            }, {"ID": "MessagePopup", "Type": "A", "Name": "短消息提醒"}, {
                "ID": "DebugMode", "Type": "A", "Name": "调试模式（仅供开发者使用）"
            }, {
                "ID": "SuperDebug", "Type": "A", "Name": "本地调试模式（仅供开发者使用) (未经授权的擅自开启将导致大部分功能不可用！)"
            }]));
            let UtilitiesCardFooter = document.createElement("div");
            UtilitiesCardFooter.className = "card-footer text-muted";
            UtilitiesCardFooter.innerText = "* 不建议关闭，可能会导致系统不稳定、界面错乱、功能缺失等问题\n绿色：增加功能　黄色：修改功能　红色：删除功能";
            UtilitiesCardBody.appendChild(UtilitiesCardFooter);
            UtilitiesCard.appendChild(UtilitiesCardBody);
            Container.appendChild(UtilitiesCard);
            let FeedbackCard = document.createElement("div");
            FeedbackCard.className = "card mb-3";
            let FeedbackCardHeader = document.createElement("div");
            FeedbackCardHeader.className = "card-header";
            FeedbackCardHeader.innerText = "反馈、源代码、联系作者";
            FeedbackCard.appendChild(FeedbackCardHeader);
            let FeedbackCardBody = document.createElement("div");
            FeedbackCardBody.className = "card-body";
            let FeedbackCardText = document.createElement("p");
            FeedbackCardText.className = "card-text";
            FeedbackCardText.innerText = "如果您有任何建议或者发现了 bug，请前往本项目的 GitHub 页面并提交 issue。提交 issue 前请先搜索是否有相同的 issue，如果有请在该 issue 下留言。请在 issue 中尽可能详细地描述您的问题，并且附上您的浏览器版本、操作系统版本、脚本版本、复现步骤等信息。谢谢您支持本项目。";
            FeedbackCardBody.appendChild(FeedbackCardText);
            let FeedbackCardLink = document.createElement("a");
            FeedbackCardLink.className = "card-link";
            FeedbackCardLink.innerText = "GitHub";
            FeedbackCardLink.href = "https://github.com/XMOJ-Script-dev/XMOJ-Script";
            FeedbackCardBody.appendChild(FeedbackCardLink);
            FeedbackCard.appendChild(FeedbackCardBody);
            Container.appendChild(FeedbackCard);
        } else {
            // Normal index page
            let Temp = document.querySelector("body > div > div.mt-3 > div > div.col-md-8").children;
            let NewsData = [];
            for (let i = 0; i < Temp.length; i += 2) {
                let Title = Temp[i].children[0].innerText;
                let Time = 0;
                if (Temp[i].children[1] != null) {
                    Time = Temp[i].children[1].innerText;
                }
                let Body = Temp[i + 1].innerHTML;
                NewsData.push({"Title": Title, "Time": new Date(Time), "Body": Body});
            }
            document.querySelector("body > div > div.mt-3 > div > div.col-md-8").innerHTML = "";
            for (let i = 0; i < NewsData.length; i++) {
                let NewsRow = document.createElement("div");
                NewsRow.className = "cnt-row";
                let NewsRowHead = document.createElement("div");
                NewsRowHead.className = "cnt-row-head title";
                NewsRowHead.innerText = NewsData[i].Title;
                if (NewsData[i].Time != 0) {
                    NewsRowHead.innerHTML += "<small class=\"ms-3\">" + NewsData[i].Time.toLocaleDateString() + "</small>";
                }
                NewsRow.appendChild(NewsRowHead);
                let NewsRowBody = document.createElement("div");
                NewsRowBody.className = "cnt-row-body";
                NewsRowBody.innerHTML = NewsData[i].Body;
                NewsRow.appendChild(NewsRowBody);
                document.querySelector("body > div > div.mt-3 > div > div.col-md-8").appendChild(NewsRow);
            }
            let CountDownData = document.querySelector("#countdown_list").innerHTML;
            document.querySelector("body > div > div.mt-3 > div > div.col-md-4").innerHTML = `<div class="cnt-row">
                        <div class="cnt-row-head title">倒计时</div>
                        <div class="cnt-row-body">${CountDownData}</div>
                    </div>`;
            let Tables = document.getElementsByTagName("table");
            for (let i = 0; i < Tables.length; i++) {
                TidyTable(Tables[i]);
            }
            document.querySelector("body > div > div.mt-3 > div > div.col-md-4").innerHTML += `<div class="cnt-row">
                        <div class="cnt-row-head title">公告</div>
                        <div class="cnt-row-body">加载中...</div>
                    </div>`;
            RequestAPI("GetNotice", {}, (Response) => {
                if (Response.Success) {
                    document.querySelector("body > div.container > div > div > div.col-md-4 > div:nth-child(2) > div.cnt-row-body").innerHTML = marked.parse(Response.Data["Notice"]).replaceAll(/@([a-zA-Z0-9]+)/g, `<b>@</b><span class="ms-1 Usernames">$1</span>`);
                    RenderMathJax();
                    let UsernameElements = document.getElementsByClassName("Usernames");
                    for (let i = 0; i < UsernameElements.length; i++) {
                        GetUsernameHTML(UsernameElements[i], UsernameElements[i].innerText, true);
                    }
                } else {
                    document.querySelector("body > div.container > div > div > div.col-md-4 > div:nth-child(2) > div.cnt-row-body").innerHTML = "加载失败: " + Response.Message;
                }
            });
        }
    }
}
