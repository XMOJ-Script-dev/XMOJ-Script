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

    function MajorVersion(browser) {
        // Chromium Edge 的标识是 Edg/（以及 EdgA/、EdgiOS/）；旧版 EdgeHTML 的 Edge/18 不参与版本判断
        const pattern = browser === "edge" ? /Edg(?:A|iOS)?\/(\d+)/ : /Chrom(?:e|ium)\/(\d+)/;
        const match = navigator.userAgent.match(pattern);
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
            // Chrome 和 Edge 都从 138 起改用「允许用户脚本」开关
            const version = MajorVersion(browser);
            if ((browser === "chrome" || browser === "edge") && version > 0) {
                const name = browser === "edge" ? "Edge" : "Chrome";
                const note = document.getElementById(name + "VersionNote");
                if (note) {
                    note.textContent = "你的 " + name + " 版本是 " + version + "，" +
                        (version >= 138 ? "请按「" + name + " 138 及以上」操作。" : "请按「" + name + " 137 及以下」操作。");
                }
            }
            tabs.addEventListener("click", (event) => {
                const button = event.target.closest("button[data-browser]");
                if (button) SelectBrowser(button.dataset.browser);
            });
            SelectBrowser(browser);
        }

        // 手机上展开的菜单占据页面高度：先收起菜单，再跳到对应章节，标题才不会被导航栏挡住
        const siteNav = document.getElementById("SiteNav");
        if (siteNav && window.bootstrap) {
            siteNav.addEventListener("click", (event) => {
                const link = event.target.closest("a[href]");
                if (!link || !link.hash || link.pathname !== location.pathname || !siteNav.classList.contains("show")) return;
                const target = document.getElementById(link.hash.slice(1));
                if (!target) return;
                event.preventDefault();
                siteNav.addEventListener("hidden.bs.collapse", () => {
                    history.pushState(null, "", link.hash);
                    target.scrollIntoView();
                }, {once: true});
                bootstrap.Collapse.getOrCreateInstance(siteNav).hide();
            });
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
