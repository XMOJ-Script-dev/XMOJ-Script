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
function Context({cookie = '', pathname = '/problem.php', fail = false} = {}) {
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
            querySelectorAll: () => [], querySelector: () => null,
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

test('classic English pages do not call the broken language endpoint or reload', async () => {
    const {scope, requests, reloads} = Context({cookie: 'XMOJ_LANG=en'});
    assert.equal(await scope.EnsureChinesePage(), false);
    assert.equal(scope.document.documentElement.lang, 'zh-CN');
    assert.equal(requests.length, 0);
    assert.equal(reloads(), 0);
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

test('an English web app refusing Chinese shows a retry message without reloading again', async () => {
    const {scope, reloads, nodes, storage, requests} = Context({cookie: 'XMOJ_LANG=en', pathname: '/web/contest/123/A'});
    storage.set('UserScript-ChineseLanguageReload', scope.location.pathname + scope.location.search + scope.location.hash);
    assert.equal(await scope.EnsureChinesePage(), false);
    assert.equal(reloads(), 0);
    assert.equal(requests.length, 0);
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

test('hides the native account language group and submits Chinese with other account fields intact', {timeout: 60000}, async t => {
    const browser = await chromium.launch({executablePath: process.env.XMOJ_CHROMIUM || undefined});
    try {
        for (const [layout, fields, value] of [
            ['radio row', '<label>界面语言</label><div class="row"><div><label><input type="radio" name="lang" value="cn"> 中文</label></div><div><label><input type="radio" name="lang" value="en" checked> English</label></div></div>', 'cn'],
            ['fieldset with numeric values', '<fieldset><legend>界面语言</legend><label><input type="radio" name="lang" value="0">中文</label><label><input type="radio" name="lang" value="1" checked>English</label></fieldset>', '0'],
            ['direct form children', '<label>界面语言</label><input id="cn" type="radio" name="lang" value="zh"><label for="cn">中文</label><input id="en" type="radio" name="lang" value="en" checked><label for="en">English</label>', 'zh']
        ]) {
            await t.test(layout, async () => {
                const page = await browser.newPage();
                await page.route('**/*', route => route.fulfill({contentType: 'text/html; charset=utf-8', body: '<form><label>昵称<input name="nick" value="boomzero"></label><input type="hidden" name="csrf" value="token">' + fields + '<button type="submit">提交</button></form>'}));
                await page.goto('https://chinese-language.test/modify_user_info.php');
                await page.evaluate(() => {
                    window.accountForm = document.querySelector('form');
                    window.nativeSubmits = 0;
                    accountForm.addEventListener('submit', event => {
                        event.preventDefault();
                        nativeSubmits++;
                        window.submittedData = Object.fromEntries(new FormData(accountForm));
                    });
                });
                await page.addScriptTag({content: route + language});
                await page.evaluate(() => { EnforceChineseView(); EnforceChineseView(); });
                assert.equal(await page.getByText('界面语言', {exact: true}).isHidden(), true);
                assert.equal(await page.getByText('English', {exact: true}).isHidden(), true);
                assert.equal(await page.getByText('中文', {exact: true}).isHidden(), true);
                assert.equal(await page.locator('input[type="radio"]:checked').inputValue(), value);
                assert.equal(await page.locator('input[type="radio"]').evaluateAll(inputs => inputs.every(input => !input.disabled)), true);
                assert.equal(await page.locator('[name="nick"]').isVisible(), true);
                assert.equal(await page.getByRole('button', {name: '提交'}).isVisible(), true);
                assert.equal(await page.evaluate(() => document.querySelector('form') === accountForm), true);
                // Native submit handlers and FormData must receive Chinese even if
                // another script reselects English after initialization.
                await page.evaluate(() => { document.querySelector('input[value="en"], input[value="1"]').checked = true; });
                await page.getByRole('button', {name: '提交'}).click();
                assert.equal(await page.evaluate(() => nativeSubmits), 1);
                assert.deepEqual(await page.evaluate(() => submittedData), {nick: 'boomzero', csrf: 'token', lang: value});
                assert.equal(await page.evaluate(() => {
                    document.querySelector('input[value="en"], input[value="1"]').checked = true;
                    return new FormData(accountForm).get('lang');
                }), value);
                await page.close();
            });
        }
    } finally { await browser.close(); }
});

test('startup enforces Chinese before either UI initializer and Vue refreshes reapply it', () => {
    const startup = Between('(async () => {\nif (GetContestWebRedirect()) return;', '//otherwise CurrentUsername might be undefined');
    const enforce = startup.indexOf('await EnsureChinesePage()');
    const initialize = startup.indexOf('await InitializeContestWebApp()');
    assert.ok(enforce >= 0, 'Chinese initialization must exist');
    assert.ok(initialize >= 0, 'Vue initialization must exist');
    assert.ok(enforce < initialize);
    const enhance = Between('function Enhance() {', 'function ScheduleEnhance() {');
    assert.match(enhance, /EnforceChineseView\(root\)/);
});
