export const escapeHTML = (str) => {
    return str.replace(/[&<>"']/g, function (match) {
        const escape = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escape[match];
    });
};

export const PurifyHTML = (Input) => {
    try {
        return DOMPurify.sanitize(Input, {
            "ALLOWED_TAGS": ["a", "b", "big", "blockquote", "br", "code", "dd", "del", "div", "dl", "dt", "em", "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8", "hr", "i", "img", "ins", "kbd", "li", "ol", "p", "pre", "q", "rp", "rt", "ruby", "s", "samp", "strike", "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "tt", "ul", "var"],
            "ALLOWED_ATTR": ["abbr", "accept", "accept-charset", "accesskey", "action", "align", "alt", "axis", "border", "cellpadding", "cellspacing", "char", "charoff", "charset", "checked", "cite", "clear", "color", "cols", "colspan", "compact", "coords", "datetime", "dir", "disabled", "enctype", "for", "frame", "headers", "height", "href", "hreflang", "hspace", "ismap", "itemprop", "label", "lang", "longdesc", "maxlength", "media", "method", "multiple", "name", "nohref", "noshade", "nowrap", "prompt", "readonly", "rel", "rev", "rows", "rowspan", "rules", "scope", "selected", "shape", "size", "span", "src", "start", "summary", "tabindex", "target", "title", "type", "usemap", "valign", "value", "vspace", "width"]
        });
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
}

export const SmartAlert = (Message) => {
    if (localStorage.getItem("UserScript-Alert") !== Message) {
        alert(Message);
    }
    localStorage.setItem("UserScript-Alert", Message);
}

export const GetRelativeTime = (Input) => {
    try {
        Input = new Date(Input);
        let Now = new Date().getTime();
        let Delta = Now - Input.getTime();
        let RelativeName = "";
        if (Delta < 0) {
            RelativeName = "未来";
        } else if (Delta <= 1000 * 60) {
            RelativeName = "刚刚";
        } else if (Delta <= 1000 * 60 * 60) {
            RelativeName = Math.floor((Now - Input) / 1000 / 60) + "分钟前";
        } else if (Delta <= 1000 * 60 * 60 * 24) {
            RelativeName = Math.floor((Now - Input) / 1000 / 60 / 60) + "小时前";
        } else if (Delta <= 1000 * 60 * 60 * 24 * 31) {
            RelativeName = Math.floor((Now - Input) / 1000 / 60 / 60 / 24) + "天前";
        } else if (Delta <= 1000 * 60 * 60 * 24 * 365) {
            RelativeName = Math.floor((Now - Input) / 1000 / 60 / 60 / 24 / 31) + "个月前";
        } else {
            RelativeName = Math.floor((Now - Input) / 1000 / 60 / 60 / 24 / 365) + "年前";
        }
        return "<span title=\"" + Input.toLocaleString() + "\">" + RelativeName + "</span>";
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

export function compareVersions(currVer, remoteVer) {
    const currParts = currVer.split('.').map(Number);
    const remoteParts = remoteVer.split('.').map(Number);

    const maxLen = Math.max(currParts.length, remoteParts.length);
    for (let i = 0; i < maxLen; i++) {
        const curr = currParts[i] !== undefined ? currParts[i] : 0;
        const remote = remoteParts[i] !== undefined ? remoteParts[i] : 0;
        if (remote > curr) {
            return true; // update needed
        } else if (remote < curr) {
            return false; // no update needed
        }
    }
    return false; // versions are equal
}

export const RenderMathJax = async () => {
    try {
        if (document.getElementById("MathJax-script") === null) {
            var ScriptElement = document.createElement("script");
            ScriptElement.id = "MathJax-script";
            ScriptElement.type = "text/javascript";
            ScriptElement.src = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.0.5/es5/tex-chtml.js";
            document.body.appendChild(ScriptElement);
            await new Promise((Resolve) => {
                ScriptElement.onload = () => {
                    Resolve();
                };
            });
        }
        if (MathJax !== undefined) { //If there is a Math expression
            MathJax.startup.input[0].findTeX.options.inlineMath.push(["$", "$"]);
            MathJax.startup.input[0].findTeX.getPatterns();
            MathJax.typeset();
        }
    } catch (e) {
        console.error(e);
    }
};

export const GetUserInfo = async (Username) => {
    try {
        if (localStorage.getItem("UserScript-User-" + Username + "-UserRating") != null && new Date().getTime() - parseInt(localStorage.getItem("UserScript-User-" + Username + "-LastUpdateTime")) < 1000 * 60 * 60 * 24) {
            return {
                "Rating": localStorage.getItem("UserScript-User-" + Username + "-UserRating"),
                "EmailHash": localStorage.getItem("UserScript-User-" + Username + "-EmailHash")
            }
        }
        return await fetch("https://www.xmoj.tech/userinfo.php?user=" + Username).then((Response) => {
            return Response.text();
        }).then((Response) => {
            if (Response.indexOf("No such User!") !== -1) {
                return null;
            }
            const ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
            let Rating = (parseInt(ParsedDocument.querySelector("#statics > tbody > tr:nth-child(4) > td:nth-child(2)").innerText.trim()) / parseInt(ParsedDocument.querySelector("#statics > tbody > tr:nth-child(3) > td:nth-child(2)").innerText.trim())).toFixed(3) * 1000;
            let Temp = ParsedDocument.querySelector("#statics > tbody").children;
            let Email = Temp[Temp.length - 1].children[1].innerText.trim();
            let EmailHash = CryptoJS.MD5(Email).toString();
            localStorage.setItem("UserScript-User-" + Username + "-UserRating", Rating);
            if (Email == "") {
                EmailHash = undefined;
            } else {
                localStorage.setItem("UserScript-User-" + Username + "-EmailHash", EmailHash);
            }
            localStorage.setItem("UserScript-User-" + Username + "-LastUpdateTime", new Date().getTime());
            return {
                "Rating": Rating, "EmailHash": EmailHash
            }
        });
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

export const GetUserBadge = async (Username) => {
    try {
        if (localStorage.getItem("UserScript-User-" + Username + "-Badge-LastUpdateTime") != null && new Date().getTime() - parseInt(localStorage.getItem("UserScript-User-" + Username + "-Badge-LastUpdateTime")) < 1000 * 60 * 60 * 24) {
            return {
                "BackgroundColor": localStorage.getItem("UserScript-User-" + Username + "-Badge-BackgroundColor"),
                "Color": localStorage.getItem("UserScript-User-" + Username + "-Badge-Color"),
                "Content": localStorage.getItem("UserScript-User-" + Username + "-Badge-Content")
            }
        } else {
            let BackgroundColor = "";
            let Color = "";
            let Content = "";
            await new Promise((Resolve) => {
                RequestAPI("GetBadge", {
                    "UserID": String(Username)
                }, (Response) => {
                    if (Response.Success) {
                        BackgroundColor = Response.Data.BackgroundColor;
                        Color = Response.Data.Color;
                        Content = Response.Data.Content;
                    }
                    Resolve();
                });
            });
            localStorage.setItem("UserScript-User-" + Username + "-Badge-BackgroundColor", BackgroundColor);
            localStorage.setItem("UserScript-User-" + Username + "-Badge-Color", Color);
            localStorage.setItem("UserScript-User-" + Username + "-Badge-Content", Content);
            localStorage.setItem("UserScript-User-" + Username + "-Badge-LastUpdateTime", String(new Date().getTime()));
            return {
                "BackgroundColor": BackgroundColor, "Color": Color, "Content": Content
            }
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

export const GetUsernameHTML = async (Element, Username, Simple = false, Href = "https://www.xmoj.tech/userinfo.php?user=") => {
    try {
        //Username = Username.replaceAll(/[^a-zA-Z0-9]/g, "");
        let ID = "Username-" + Username + "-" + Math.random();
        Element.id = ID;
        Element.innerHTML = `<div class="spinner-border spinner-border-sm me-2" role="status"></div>`;
        Element.appendChild(document.createTextNode(Username));
        let UserInfo = await GetUserInfo(Username);
        if (UserInfo === null) {
            document.getElementById(ID).innerHTML = "";
            document.getElementById(ID).appendChild(document.createTextNode(Username));
            return;
        }
        let HTMLData = "";
        if (!Simple) {
            HTMLData += `<img src="`;
            if (UserInfo.EmailHash == undefined) {
                HTMLData += `https://cravatar.cn/avatar/00000000000000000000000000000000?d=mp&f=y`;
            } else {
                HTMLData += `https://cravatar.cn/avatar/${UserInfo.EmailHash}?d=retro`;
            }
            HTMLData += `" class="rounded me-2" style="width: 20px; height: 20px; ">`;
        }
        HTMLData += `<a href="${Href}${Username}" class="link-offset-2 link-underline-opacity-50 `
        if (UtilityEnabled("Rating")) {
            let Rating = UserInfo.Rating;
            // if(AdminUserList.includes(Username)){
            //     HTMLData += "link-fuchsia"
            // }
            // else
            if (Rating > 500) {
                HTMLData += "link-danger";
            } else if (Rating >= 400) {
                HTMLData += "link-warning";
            } else if (Rating >= 300) {
                HTMLData += "link-success";
            } else {
                HTMLData += "link-info";
            }
        } else {
            HTMLData += "link-info";
        }
        HTMLData += `\";"></a>`;
        if (!Simple) {
            if (AdminUserList.includes(Username)) {
                HTMLData += `<span class="badge text-bg-danger ms-2">脚本管理员</span>`;
            }
            let BadgeInfo = await GetUserBadge(Username);
            if (BadgeInfo.Content != "") {
                HTMLData += `<span class="badge ms-2" style="background-color: ${BadgeInfo.BackgroundColor}; color: ${BadgeInfo.Color}">${BadgeInfo.Content}</span>`;
            }
        }
        if (document.getElementById(ID) !== null) {
            document.getElementById(ID).innerHTML = HTMLData;
            document.getElementById(ID).getElementsByTagName("a")[0].appendChild(document.createTextNode(Username));
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

export const SecondsToString = (InputSeconds) => {
    try {
        let Hours = Math.floor(InputSeconds / 3600);
        let Minutes = Math.floor((InputSeconds % 3600) / 60);
        let Seconds = InputSeconds % 60;
        return (Hours < 10 ? "0" : "") + Hours + ":" + (Minutes < 10 ? "0" : "") + Minutes + ":" + (Seconds < 10 ? "0" : "") + Seconds;
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
}

export const StringToSeconds = (InputString) => {
    try {
        let SplittedString = InputString.split(":");
        return parseInt(SplittedString[0]) * 60 * 60 + parseInt(SplittedString[1]) * 60 + parseInt(SplittedString[2]);
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
}

export const SizeToStringSize = (Memory) => {
    try {
        if (UtilityEnabled("AddUnits")) {
            if (Memory < 1024) {
                return Memory + "KB";
            } else if (Memory < 1024 * 1024) {
                return (Memory / 1024).toFixed(2) + "MB";
            } else if (Memory < 1024 * 1024 * 1024) {
                return (Memory / 1024 / 1024).toFixed(2) + "GB";
            } else {
                return (Memory / 1024 / 1024 / 1024).toFixed(2) + "TB";
            }
        } else {
            return Memory;
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

export const CodeSizeToStringSize = (Memory) => {
    try {
        if (UtilityEnabled("AddUnits")) {
            if (Memory < 1024) {
                return Memory + "B";
            } else if (Memory < 1024 * 1024) {
                return (Memory / 1024).toFixed(2) + "KB";
            } else if (Memory < 1024 * 1024 * 1024) {
                return (Memory / 1024 / 1024).toFixed(2) + "MB";
            } else {
                return (Memory / 1024 / 1024 / 1024).toFixed(2) + "GB";
            }
        } else {
            return Memory;
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

export const TimeToStringTime = (Time) => {
    try {
        if (UtilityEnabled("AddUnits")) {
            if (Time < 1000) {
                return Time + "ms";
            } else if (Time < 1000 * 60) {
                return (Time / 1000).toFixed(2) + "s";
            }
        } else {
            return Time;
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

export const TidyTable = (Table) => {
    try {
        if (UtilityEnabled("NewBootstrap") && Table != null) {
            Table.className = "table table-hover";
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

export const UtilityEnabled = (Name) => {
    try {
        if (localStorage.getItem("UserScript-Setting-" + Name) == null) {
            const defaultOffItems = ["DebugMode", "SuperDebug", "ReplaceXM"];
            localStorage.setItem("UserScript-Setting-" + Name, defaultOffItems.includes(Name) ? "false" : "true");
        }
        return localStorage.getItem("UserScript-Setting-" + Name) == "true";
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

export const storeCredential = async (username, password) => {
    if ('credentials' in navigator && window.PasswordCredential) {
        try {
            const credential = new PasswordCredential({ id: username, password: password });
            await navigator.credentials.store(credential);
        } catch (e) {
            console.error(e);
        }
    }
};

export const getCredential = async () => {
    if ('credentials' in navigator && window.PasswordCredential) {
        try {
            return await navigator.credentials.get({ password: true, mediation: 'optional' });
        } catch (e) {
            console.error(e);
        }
    }
    return null;
};

export const clearCredential = async () => {
    if ('credentials' in navigator && window.PasswordCredential) {
        try {
            await navigator.credentials.preventSilentAccess();
        } catch (e) {
            console.error(e);
        }
    }
};
