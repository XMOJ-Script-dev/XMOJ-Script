import { main } from './legacy.js';
import { CurrentUsername, IsAdmin, ServerURL, diff, AdminUserList } from './globals.js';
import { initTheme } from './theme.js';
import { GM_registerMenuCommand } from '$';
import { clearCredential, UtilityEnabled } from './utils.js';

// Initialization
window.CurrentUsername = document.querySelector("#profile").innerText.replaceAll(/[^a-zA-Z0-9]/g, "");
window.IsAdmin = AdminUserList.includes(window.CurrentUsername);
window.ServerURL = (UtilityEnabled("DebugMode") ? "https://ghpages.xmoj-bbs.me/" : "https://www.xmoj-bbs.me");
window.diff = 0; // This was not initialized in the original script, setting to 0

// Register menu commands
GM_registerMenuCommand("清除缓存", () => {
    let Temp = [];
    for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).startsWith("UserScript-User-")) {
            Temp.push(localStorage.key(i));
        }
    }
    for (let i = 0; i < Temp.length; i++) {
        localStorage.removeItem(Temp[i]);
    }
    location.reload();
});
GM_registerMenuCommand("重置数据", () => {
    if (confirm("确定要重置数据吗？")) {
        localStorage.clear();
        location.reload();
    }
});

// Auto-login check
if (UtilityEnabled("AutoLogin") && document.querySelector("body > a:nth-child(1)") != null && document.querySelector("body > a:nth-child(1)").innerText == "请登录后继续操作") {
    localStorage.setItem("UserScript-LastPage", location.pathname + location.search);
    location.href = "https://www.xmoj.tech/loginpage.php";
}

// Run the application
initTheme();
main().then(() => {
    console.log("XMOJ-Script loaded successfully!");
});
