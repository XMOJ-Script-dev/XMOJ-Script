// xmoj-script.uk 官网脚本：主题切换、浏览器识别、版本号
(function () {
    const root = document.documentElement;

    function ApplyTheme(theme) {
        root.setAttribute("data-bs-theme", theme);
        const toggle = document.getElementById("ThemeToggle");
        if (toggle) {
            toggle.textContent = theme === "dark" ? "亮色" : "暗色";
            toggle.setAttribute("aria-label", theme === "dark" ? "切换到亮色模式" : "切换到暗色模式");
        }
    }

    function DetectBrowser() {
        const ua = navigator.userAgent;
        if (/Firefox\//.test(ua)) return "firefox";
        if (/Edg(e|A|iOS)?\//.test(ua)) return "edge";
        if (/Chrome\/|Chromium\//.test(ua)) return "chrome";
        if (/Safari\//.test(ua)) return "safari";
        return "chrome";
    }

    function ChromeMajorVersion() {
        const match = navigator.userAgent.match(/Chrom(?:e|ium)\/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }

    function SelectBrowser(browser) {
        document.querySelectorAll(".browser-tabs button").forEach((button) => {
            button.setAttribute("aria-pressed", button.dataset.browser === browser ? "true" : "false");
        });
        document.querySelectorAll("[data-for]").forEach((element) => {
            element.hidden = !element.dataset.for.split(" ").includes(browser);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        ApplyTheme(root.getAttribute("data-bs-theme") || "light");
        const toggle = document.getElementById("ThemeToggle");
        if (toggle) {
            toggle.addEventListener("click", () => {
                const next = root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
                ApplyTheme(next);
                try {
                    localStorage.setItem("theme", next);
                } catch (e) {
                }
            });
        }

        const tabs = document.querySelector(".browser-tabs");
        if (tabs) {
            const browser = DetectBrowser();
            const hint = document.getElementById("BrowserHint");
            if (hint) {
                const names = {chrome: "Chrome", edge: "Edge", firefox: "Firefox", safari: "Safari"};
                hint.textContent = "检测到你正在使用 " + names[browser] + "，已自动选择对应步骤。";
            }
            const chromeVersion = ChromeMajorVersion();
            if (browser === "chrome" && chromeVersion > 0) {
                const note = document.getElementById("ChromeVersionNote");
                if (note) {
                    note.textContent = "你的 Chrome 版本是 " + chromeVersion + "，" +
                        (chromeVersion >= 138 ? "请按「Chrome 138 及以上」操作。" : "请按「Chrome 137 及以下」操作。");
                }
            }
            tabs.addEventListener("click", (event) => {
                const button = event.target.closest("button[data-browser]");
                if (button) SelectBrowser(button.dataset.browser);
            });
            SelectBrowser(browser);
        }

        const versionElements = document.querySelectorAll("[data-latest-version]");
        if (versionElements.length > 0) {
            fetch("Update.json", {cache: "no-cache"})
                .then((response) => response.json())
                .then((data) => {
                    // 只显示正式版；全部是预发布版时才退回到最新一条
                    const versions = Object.keys(data.UpdateHistory);
                    const releases = versions.filter((version) => !data.UpdateHistory[version].Prerelease);
                    const latest = releases.length > 0 ? releases[releases.length - 1] : versions[versions.length - 1];
                    versionElements.forEach((element) => {
                        element.textContent = "v" + latest;
                    });
                })
                .catch(() => {
                });
        }
    });
})();
