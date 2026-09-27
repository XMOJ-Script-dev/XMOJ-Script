// Runs XMOJ.user.js on the live site in Chromium, the way a userscript manager would,
// and reports errors, the script's added controls and screenshots for each page.
//
// Usage (Playwright is not a dependency of this repository, install it separately):
//   npm install --no-save playwright && npx playwright install chromium
//   XMOJ_USER=<id> XMOJ_PASSWORD=<password> node tests/userscript-harness.cjs
//
// Environment:
//   XMOJ_USER, XMOJ_PASSWORD  account to log in with (never written to disk)
//   XMOJ_PHPSESSID            an existing session instead of logging in
//   XMOJ_SETTINGS             JSON of script settings, e.g. {"MonochromeUI":true,"DebugMode":true}
//   XMOJ_CONTEST              contest ID to test (default: first one with two or more problems)
//   XMOJ_OUT                  output folder (default: tests/harness-output)
//   XMOJ_CHROMIUM             Chromium executable (default: Playwright's)
//   XMOJ_PROXY                proxy server for the browser (default: $HTTPS_PROXY)
//   XMOJ_TRUSTED_SPKI         comma separated SPKI hashes of a TLS-intercepting proxy's CA
//
// The harness never submits code or changes settings: the script's backend
// (api.xmoj-script.uk, xmoj-bbs) and POSTs to submit, modify, login and logout are blocked,
// and GM_xmlhttpRequest / GM.cookie.set fail without sending anything.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

let chromium;
try {
    ({ chromium } = require("playwright"));
} catch (e) {
    console.error("Playwright is required: npm install --no-save playwright && npx playwright install chromium");
    process.exit(1);
}

const SITE = "https://www.xmoj.tech";
const OUT = process.env.XMOJ_OUT || path.join(__dirname, "harness-output");
const SETTINGS = JSON.parse(process.env.XMOJ_SETTINGS || "{}");
const SOURCE = fs.readFileSync(path.join(__dirname, "../XMOJ.user.js"), "utf8");
const META = SOURCE.slice(0, SOURCE.indexOf("// ==/UserScript=="));
const REQUIRES = [...META.matchAll(/^\/\/ @require\s+(\S+)/gm)].map(m => m[1]);
const RESOURCES = Object.fromEntries([...META.matchAll(/^\/\/ @resource\s+(\S+)\s+(\S+)/gm)].map(m => [m[1], m[2]]));
// The script's backend. Static files such as Update.json stay reachable.
const BLOCKED_HOSTS = /xmoj-bbs|^api\.xmoj-script\.uk$/;
const BLOCKED_POSTS = /\/(submit|modify|login|logout)(\.php)?$|\/api\/logout$/;

// Stand-ins for the userscript manager APIs the script grants.
function Shims(resources) {
    return `
  try { for (const [k, v] of Object.entries(${JSON.stringify(SETTINGS)})) localStorage.setItem("UserScript-Setting-" + k, String(v)); } catch (e) {}
  // Start as a user who has already seen this version's changelog dialog.
  try { localStorage.setItem("UserScript-Update-LastVersion", ${JSON.stringify((META.match(/@version\s+(\S+)/) || [])[1] || "")}); } catch (e) {}
  window.unsafeWindow = window;
  window.GM_info = { script: { version: ${JSON.stringify((META.match(/@version\s+(\S+)/) || [])[1] || "")} } };
  window.GM_registerMenuCommand = () => {};
  window.GM_setClipboard = (text) => { window.__harnessClipboard = text; };
  window.GM_getResourceText = (name) => (${JSON.stringify(resources)})[name] || "";
  window.GM_setValue = () => {};
  window.GM_getValue = (key, fallback) => fallback;
  window.GM_cookie = { list: (query, callback) => callback([], null) };
  window.GM_xmlhttpRequest = (options) => { if (options.onerror) setTimeout(() => options.onerror(new Error("blocked by harness")), 0); };
  window.GM = {
    xmlHttpRequest: () => Promise.reject(new Error("blocked by harness")),
    setClipboard: (text) => { window.__harnessClipboard = text; },
    getValue: async (key, fallback) => fallback,
    setValue: async () => {},
    cookie: { list: async () => [], set: () => Promise.reject(new Error("blocked by harness")) }
  };
`;
}

// Userscript managers only inject on @match pages, wrap each script in a function,
// and run document-start scripts once <html> exists. Playwright's init scripts run
// earlier and in every frame, so do the same here. Waiting for <html> is done with a
// task rather than inside the MutationObserver callback: Chromium's renderer crashes
// when a page navigates (the script's old contest page redirects) from that callback.
function InitScript(requires, resources) {
    return [
        "if (location.hostname === 'www.xmoj.tech') {",
        "const __harnessRun = function () {",
        Shims(resources), requires.join("\n;\n"), ";", SOURCE,
        "};",
        "if (document.documentElement) __harnessRun.call(window);",
        "else new MutationObserver((m, o) => { if (document.documentElement) { o.disconnect(); setTimeout(() => __harnessRun.call(window), 0); } }).observe(document, { childList: true });",
        "}"
    ].join("\n");
}

async function Download(request, url) {
    const response = await request.get(url);
    if (!response.ok()) throw new Error("Could not download " + url + " (" + response.status() + ")");
    return response.text();
}

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const launch = { executablePath: process.env.XMOJ_CHROMIUM || undefined, args: [] };
    const proxy = process.env.XMOJ_PROXY || process.env.HTTPS_PROXY;
    if (proxy) launch.proxy = { server: proxy };
    if (process.env.XMOJ_TRUSTED_SPKI) launch.args.push("--ignore-certificate-errors-spki-list=" + process.env.XMOJ_TRUSTED_SPKI);
    const browser = await chromium.launch(launch);
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

    // Log in through the site's own form endpoint; the password leaves only as its MD5.
    if (process.env.XMOJ_PHPSESSID) {
        await context.addCookies([{ name: "PHPSESSID", value: process.env.XMOJ_PHPSESSID, domain: "www.xmoj.tech", path: "/", secure: true, httpOnly: true }]);
    } else if (process.env.XMOJ_USER && process.env.XMOJ_PASSWORD) {
        const response = await context.request.post(SITE + "/login.php", {
            form: { user_id: process.env.XMOJ_USER, password: crypto.createHash("md5").update(process.env.XMOJ_PASSWORD).digest("hex") }
        });
        if ((await response.text()).indexOf("history.go(-2)") === -1) throw new Error("Login failed");
    } else {
        console.warn("No XMOJ_USER/XMOJ_PASSWORD or XMOJ_PHPSESSID: testing logged out.");
    }

    const requires = [];
    for (const url of REQUIRES) {
        try { requires.push(await Download(context.request, url)); } catch (e) { console.warn("Could not download " + url + " (" + e.message.split("\n")[0] + "), skipped"); }
    }
    const resources = {};
    for (const [name, url] of Object.entries(RESOURCES)) {
        try { resources[name] = await Download(context.request, url); } catch (e) { console.warn("Could not download " + url + " (" + e.message.split("\n")[0] + "), skipped"); }
    }

    const blocked = new Set();
    await context.route("**/*", route => {
        const request = route.request();
        const url = new URL(request.url());
        if (BLOCKED_HOSTS.test(url.hostname) || (request.method() === "POST" && BLOCKED_POSTS.test(url.pathname))) {
            blocked.add(request.method() + " " + url.hostname + url.pathname);
            return route.abort();
        }
        return route.continue();
    });
    await context.addInitScript(InitScript(requires, resources));

    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push("pageerror: " + e.message));
    // Requests the harness blocks on purpose are not reported as errors.
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|blocked by harness/.test(m.text())) errors.push("console: " + m.text()); });
    page.on("dialog", d => { errors.push("dialog: " + d.message().slice(0, 300)); d.dismiss(); });

    const report = [];
    async function Check(label, extra) {
        await page.waitForTimeout(2500);
        const info = await page.evaluate(() => {
            const nav = document.querySelector("nav.navbar");
            return {
                url: location.pathname + location.search,
                theme: document.documentElement.getAttribute("data-bs-theme"),
                navClasses: nav && nav.className,
                navPosition: nav && getComputedStyle(nav).position,
                bootstrap3Loaded: [...document.styleSheets].some(sheet => /bootstrap(-theme)?\.min\.css/.test(sheet.href || "") && !/5\.\d/.test(sheet.href || "")),
                added: [...new Set([...document.querySelectorAll("[data-xmoj-script]")].map(e => e.getAttribute("data-xmoj-script")))]
            };
        });
        if (extra) Object.assign(info, await extra());
        try { await page.screenshot({ path: path.join(OUT, label.replace(/\W+/g, "_") + ".png"), timeout: 15000 }); } catch (e) { info.screenshot = "failed: " + e.message.split("\n")[0]; }
        report.push({ label, ...info, errors: errors.splice(0) });
    }
    async function MenuCheck(label) {
        await page.waitForTimeout(1500);
        const toggle = await page.$(".navbar-nav .dropdown-toggle");
        if (!toggle) { report.push({ label, error: "no dropdown toggle" }); return; }
        await toggle.click();
        await page.waitForTimeout(800);
        const items = await page.evaluate(() => {
            const menu = document.querySelector(".navbar-nav .dropdown-menu");
            const visible = el => el && getComputedStyle(el).display !== "none" && el.getBoundingClientRect().height > 0;
            return menu && visible(menu) ? [...menu.children].filter(visible).map(li => li.textContent.trim()) : null;
        });
        try { await page.screenshot({ path: path.join(OUT, label.replace(/\W+/g, "_") + ".png"), timeout: 15000 }); } catch (e) {}
        await page.mouse.click(5, 600);
        report.push({ label, menuItems: items, errors: errors.splice(0) });
    }
    async function Visit(url) {
        await page.goto(SITE + url, { waitUntil: "domcontentloaded" });
    }

    await Visit("/web/contest");
    await Check("web contest list");
    const cid = process.env.XMOJ_CONTEST || await page.evaluate(async () => {
        const list = await (await fetch("/api/contest/list?pageNum=1&pageSize=20&keyword=")).json();
        for (const contest of list.list || []) {
            const response = await fetch("/api/contest/" + contest.contestId);
            if (response.ok && ((await response.json()).problems || []).length >= 2) return contest.contestId;
        }
        return null;
    });
    report.push({ label: "contest", cid });
    if (cid) {
        await Visit("/web/contest/" + cid);
        await Check("web contest");
        await Visit("/web/contest/" + cid + "/A");
        await Check("web problem A");
        await MenuCheck("web user menu");
        // In-app (Vue router) navigation, without a page load.
        const navigated = await page.evaluate(() => {
            const link = [...document.querySelectorAll(".xmoj-problem-nav a")].find(a => a.textContent.trim() === "B");
            if (link) link.click();
            return !!link;
        });
        await Check("web problem B via router", async () => ({ navigatedInApp: navigated }));
        await page.goBack();
        await Check("web back to A");
        await Visit("/web/contest/" + cid + "/rank-correct");
        await Check("web rank-correct");
        await Visit("/web/contest/" + cid + "/A/std");
        await Check("web std A");
        await Visit("/web/contest/" + cid + "/A/solution");
        await Check("web solution A");
        // The old contest pages are no longer linked from the site: they must
        // redirect to the /web app.
        for (const [from, to] of [
            ["/contest.php", "/web/contest"],
            ["/contest.php?cid=" + cid, "/web/contest/" + cid],
            ["/problem.php?cid=" + cid + "&pid=1", "/web/contest/" + cid + "/B"],
            ["/problem_std.php?cid=" + cid + "&pid=0", "/web/contest/" + cid + "/A/std"],
            ["/problem_solution.php?cid=" + cid + "&pid=0", "/web/contest/" + cid + "/A/solution"],
            ["/contestrank-correct.php?cid=" + cid, "/web/contest/" + cid + "/rank-correct"]
        ]) {
            await Visit(from);
            await page.waitForURL(url => url.pathname === to.split("?")[0], { timeout: 15000 }).catch(() => {});
            const landed = new URL(page.url());
            report.push({ label: "redirect " + from, landed: landed.pathname + landed.search, ok: landed.pathname + landed.search === to, errors: errors.splice(0) });
        }
    }
    await Visit("/problem.php?id=1000");
    await Check("legacy problem", async () => ({ discussButton: await page.evaluate(() => [...document.querySelectorAll("button")].some(b => b.textContent.trim().startsWith("讨论"))) }));
    await MenuCheck("legacy user menu");
    await Visit("/problemset.php");
    await Check("legacy problemset");
    report.push({ label: "blocked requests", blocked: [...blocked] });

    fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
    for (const entry of report) {
        const { label, errors: pageErrors = [], ...rest } = entry;
        console.log(label + ": " + JSON.stringify(rest));
        for (const error of pageErrors) console.log("    " + error.split("\n")[0]);
    }
    console.log("Screenshots and report.json: " + OUT);
    await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
