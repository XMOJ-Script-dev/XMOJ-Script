const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {chromium} = require('playwright');
const source = fs.readFileSync(path.join(__dirname, '../XMOJ.user.js'), 'utf8');
function Between(start, end) {
    for (const marker of [start, end]) assert.equal(source.split(marker).length - 1, 1, 'expected unique marker: ' + marker);
    assert.ok(source.indexOf(start) < source.indexOf(end));
    return source.slice(source.indexOf(start), source.indexOf(end));
}
const language = Between('function InitializeChineseLanguage(', '// The /web application owns its DOM.');
const route = Between('function IsContestWebApp(', 'function GetContestRoute(');

// Check reload behavior without navigating a real page away from its assertions.
function Context({cookie = '', pathname = '/problem.php', english = false, fail = false} = {}) {
    const storage = new Map();
    const requests = [];
    const nodes = [];
    let reloads = 0;
    const location = new URL('https://www.xmoj.tech' + pathname + '?id=1000#samples');
    location.reload = () => { reloads++; };
    const scope = vm.createContext({
        location, console: {error() {}}, RevealPage() {}, AbortController, setTimeout, clearTimeout,
        sessionStorage: {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)},
        fetch: async (url, options) => {
            requests.push({url, options});
            if (fail) throw new Error('Network failed');
            return {ok: true};
        },
        document: {
            cookie, documentElement: {}, head: {appendChild: node => nodes.push(node)}, body: {prepend: node => nodes.push(node)},
            getElementById: id => nodes.find(node => node.id === id),
            querySelectorAll: () => [], querySelector: () => english ? {} : null,
            createElement: () => ({appendChild() {}, addEventListener() {}})
        }
    });
    vm.runInContext(route + language, scope);
    return {scope, requests, storage, nodes, reloads: () => reloads};
}

test('forces the web cookie before requests and reloads an existing English app once', async () => {
    const {scope, requests, reloads} = Context({cookie: 'PHPSESSID=fixture; XMOJ_LANG=en', pathname: '/web/contest/123/A'});
    assert.match(scope.document.cookie, /^XMOJ_LANG=zh; path=/);
    assert.equal(await scope.EnsureChinesePage(), true);
    assert.equal(reloads(), 1);
    assert.equal(scope.location.href, 'https://www.xmoj.tech/web/contest/123/A?id=1000#samples');
    assert.equal(requests.length, 0);
    assert.equal(await scope.EnsureChinesePage(), false);
    assert.equal(reloads(), 1, 'refusing the preference must not create a reload loop');
});

test('switches the classic English session before processing the page', async () => {
    const {scope, requests, reloads} = Context({english: true});
    assert.equal(await scope.EnsureChinesePage(), true);
    assert.equal(requests[0].url, '/change_lang.php?lang=cn');
    assert.equal(requests[0].options.credentials, 'same-origin');
    assert.equal(requests[0].options.cache, 'no-store');
    assert.equal(reloads(), 1);
});

test('Chinese classic pages do not reload merely because html declares lang=en', async () => {
    const {scope, requests, reloads, storage} = Context();
    scope.document.documentElement.lang = 'en';
    storage.set('UserScript-ChineseLanguageReload', scope.location.pathname + scope.location.search + scope.location.hash);
    assert.equal(await scope.EnsureChinesePage(), false);
    assert.equal(scope.document.documentElement.lang, 'zh-CN');
    assert.equal(requests.length, 0);
    assert.equal(reloads(), 0);
    assert.equal(storage.size, 0);
});

test('failed classic language switches show a retry message without reloading', async () => {
    const {scope, reloads, nodes} = Context({english: true, fail: true});
    assert.equal(await scope.EnsureChinesePage(), false);
    assert.equal(reloads(), 0);
    assert.match(nodes.find(node => node.role === 'alert').textContent, /切换中文失败/);
});

test('hides classic and Vue language selectors while preserving forms and Chinese content', {timeout: 60000}, async () => {
    const browser = await chromium.launch({executablePath: process.env.XMOJ_CHROMIUM || undefined});
    const page = await browser.newPage();
    try {
        await page.route('**/*', request => request.fulfill({contentType: 'text/html; charset=utf-8', body: `<html lang="en"><body>
            <a id="lang_cn_to_en" href="/change_lang.php?lang=en">English</a>
            <button id="lang_en_to_cn">中文</button>
            <form><input name="nick" value="Account"><button type="submit">Save account</button></form>
            <span class="lang_cn" style="display:none">中文题面</span><span class="lang_en">English statement</span>
            <div id="app"><nav id="xmoj-navbar"><ul class="navbar-right">
                <li><a href="#" class="dropdown-toggle">English</a></li><li><a href="#">English</a></li>
            </ul></nav><div class="xmoj-lang-switch"><button class="hidden">English</button><button>中文</button></div>
            <div id="statement">English content</div></div>
            </body></html>`}));
        await page.goto('https://chinese-language.test/problem.php');
        await page.evaluate(() => {
            window.accountForm = document.querySelector('form');
            window.submits = 0;
            accountForm.addEventListener('submit', event => { event.preventDefault(); submits++; });
            document.querySelector('.xmoj-lang-switch button:last-child').addEventListener('click', event => {
                event.target.classList.add('hidden');
                document.getElementById('statement').textContent = '中文内容';
                window.chineseClicks = (window.chineseClicks || 0) + 1;
            });
        });
        await page.addScriptTag({content: route + language});
        await page.evaluate(() => { EnforceChineseView(); EnforceChineseView(); });
        assert.equal(await page.locator('#lang_cn_to_en').isHidden(), true);
        assert.equal(await page.locator('#lang_en_to_cn').isHidden(), true);
        assert.equal(await page.locator('#xmoj-navbar li:last-child a').isHidden(), true);
        assert.equal(await page.locator('#xmoj-navbar .dropdown-toggle').isVisible(), true, 'a username named English must remain visible');
        assert.equal(await page.locator('.xmoj-lang-switch').isHidden(), true);
        assert.equal(await page.locator('.lang_cn').isVisible(), true);
        assert.equal(await page.locator('.lang_en').isHidden(), true);
        assert.equal(await page.locator('#statement').innerText(), '中文内容');
        assert.equal(await page.evaluate(() => chineseClicks), 1);
        assert.equal(await page.evaluate(() => document.querySelector('form') === accountForm), true);
        await page.getByRole('button', {name: 'Save account'}).click();
        assert.equal(await page.evaluate(() => submits), 1);
        assert.equal(await page.locator('#UserScript-ChineseLanguage').count(), 1);
        await page.evaluate(() => {
            const item = document.createElement('li');
            item.innerHTML = '<a href="#">中文</a>';
            document.querySelector('#xmoj-navbar ul').appendChild(item);
            EnforceChineseView(document.getElementById('app'));
        });
        assert.equal(await page.locator('#xmoj-navbar li:last-child a').isHidden(), true);
    } finally {
        await browser.close();
    }
});

test('startup enforces Chinese before either UI initializer and Vue refreshes reapply it', () => {
    const startup = Between('(async () => {\nif (GetContestWebRedirect()) return;', '//otherwise CurrentUsername might be undefined');
    assert.ok(startup.indexOf('await EnsureChinesePage()') < startup.indexOf('await InitializeContestWebApp()'));
    const enhance = Between('function Enhance() {', 'function ScheduleEnhance() {');
    assert.match(enhance, /EnforceChineseView\(root\)/);
});
