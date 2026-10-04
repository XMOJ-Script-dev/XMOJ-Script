const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const source = fs.readFileSync(path.join(__dirname, '../XMOJ.user.js'), 'utf8');
function Between(start, end) {
    for (const marker of [start, end]) {
        assert.equal(source.split(marker).length - 1, 1, 'expected a unique extraction marker: ' + marker);
    }
    assert.ok(source.indexOf(start) < source.indexOf(end));
    return source.slice(source.indexOf(start), source.indexOf(end));
}
const helpers = Between('function IsAccountSettingsPage(', 'function InitializeUserMenu(');
const earlyRedirect = Between('function GetAccountSettingsRedirect(', 'function InitializeAccountFeatures(') +
    Between('// Set to true by the early block', 'const CaptchaSiteKey');
const api = Between('let RequestAPI = (', 'let SyncSettingsToCloud = (');
const preprocessing = 'window.RunAccountPreprocessing = () => {' + Between(
    '// Preserve native account listeners during page-wide customization.',
    '// Bootstrap stylesheet and markup migration.') + '};';
const handler = 'window.RunAccountPage = async () => { if (false) {' +
    Between('} else if (IsAccountSettingsPage(location.pathname) &&', '} else if (location.pathname == "/userinfo.php" &&') + '}};';
const nativeForm = `<form action="/modify_user_info.php" method="post">
    <input name="nick" value="Nickname"><input name="school" value="School">
    <input name="email" value="user@example.test"><input name="csrf" value="token">
    <button type="submit">Save account</button></form>`;
const startup = 'window.RunAccountStartup = authenticated => { const logined = authenticated; ' + Between(
    '// Initialize migrated account tools independently of the legacy navbar/layout handler.',
    'let IsAdmin = AdminUserList.indexOf(CurrentUsername)') + '};';

test('account-page migration browser regressions', {timeout: 60000}, async t => {
    const browser = await chromium.launch({executablePath: process.env.XMOJ_CHROMIUM || undefined});
    async function Page(route, content = nativeForm, options = {}) {
        const page = await browser.newPage();
        await page.route('**/*', request => request.fulfill({contentType: 'text/html; charset=utf-8', body:
            options.markup || `<div class="container"><nav></nav><div class="mt-3">${content}</div></div>`}));
        await page.goto('https://account-settings.test' + route);
        await page.evaluate(options => {
            window.CurrentUsername = options.signedOut ? 'Login' : 'Tester';
            window.SearchParams = new URL(location.href).searchParams;
            window.UtilityEnabled = name => ['ReplaceLinks', 'ReplaceXM'].includes(name) || (name === 'ExportACCode' && options.export);
            window.ServerURL = 'https://updates.test';
            window.GetRelativeTime = () => 'today';
            window.escapeHTML = value => value;
            window.GetUserInfo = async () => ({EmailHash: 'hash'});
            window.apiCalls = [];
            document.cookie = 'PHPSESSID=fixture; path=/';
            window.GM_info = {script: {version: 'test'}};
            window.badgeFailureMode = options.badgeFailureMode;
            window.badgeLoadFailureMode = options.badgeLoadFailureMode;
            window.badgeAccessDenied = options.noBadge;
            window.GM_xmlhttpRequest = request => {
                const action = new URL(request.url).pathname.slice(1);
                if (action !== 'SendData') apiCalls.push({action, data: JSON.parse(request.data).Data});
                if (action === 'EditBadge' || action === 'GetBadge') {
                    const mode = action === 'GetBadge' ? window.badgeLoadFailureMode : window.badgeFailureMode;
                    if (mode === 'pending') {
                        window.pendingBadgeRequest = request;
                        return;
                    }
                    if (['network', 'timeout', 'abort'].includes(mode)) {
                        window.requestTimeout = request.timeout;
                        request[{network: 'onerror', timeout: 'ontimeout', abort: 'onabort'}[mode]]();
                        // A late callback must not turn a failed save into success.
                        request.onload({status: 200, responseText: '{"Success":true}'});
                        return;
                    }
                    if (mode === 'throw') throw new Error('Transport initialization failed');
                    if (['invalid-json', 'invalid-response', 'http'].includes(mode)) {
                        request.onload({status: mode === 'http' ? 503 : 200,
                            responseText: mode === 'invalid-json' ? '<html>Error</html>' : 'null'});
                        return;
                    }
                }
                request.onload({status: 200, responseText: JSON.stringify(action === 'GetBadge' ? {
                    Success: !window.badgeAccessDenied, Message: 'Load denied', Data: Object.hasOwn(options, 'badgeData') ? options.badgeData :
                        {Content: 'Badge', BackgroundColor: '#112233', Color: '#ffffff'}
                } : {Success: !options.badgeFailure, Message: 'Save failed'})});
            };
            window.requests = [];
            window.fetch = async url => {
                requests.push(url);
                return {json: async () => ({UpdateHistory: {'1.0.0': {
                    UpdateDate: '2026-01-01', UpdateContents: [{PR: 920, Description: 'Account migration'}]
                }}})};
            };
            window.nativeAccountForm = document.querySelector('form');
            nativeAccountForm?.addEventListener('submit', event => {
                event.preventDefault();
                window.nativeSubmitCount = (window.nativeSubmitCount || 0) + 1;
            });
        }, {...options, signedOut: options.signedOut || content === 'Please log in'});
        await page.addScriptTag({content: api + helpers + preprocessing + handler + startup});
        await page.evaluate(async authenticated => {
            RunAccountStartup(authenticated);
            RunAccountPreprocessing();
            await RunAccountPage();
        }, !options.signedOut && content !== 'Please log in');
        return page;
    }
    try {
        await t.test('preserves migrated fields, CSRF, action and native submit listener', async () => {
            const page = await Page('/modify_user_info.php', nativeForm, {export: true});
            assert.equal(await page.evaluate(() => document.querySelector('form') === nativeAccountForm), true);
            assert.equal(await page.locator('form').getAttribute('action'), '/modify_user_info.php');
            assert.equal(await page.locator('[name="csrf"]').inputValue(), 'token');
            assert.equal(await page.locator('[name="nick"]').inputValue(), 'Nickname');
            assert.equal(await page.locator('[name="school"]').inputValue(), 'School');
            assert.equal(await page.locator('[name="email"]').inputValue(), 'user@example.test');
            assert.equal(await page.locator('input[type="password"]').count(), 0);
            await page.getByRole('button', {name: 'Save account'}).click();
            assert.equal(await page.evaluate(() => nativeSubmitCount), 1);
            assert.equal(await page.getByRole('button', {name: '导出AC代码', exact: true}).count(), 1);
            assert.deepEqual(await page.evaluate(() => requests), []);
            await page.close();
        });
        for (const [layout, markup] of [
            ['main without a form', '<main><section><input name="nick" value="Nickname"></section></main>'],
            ['direct body form', nativeForm],
            ['changed container and navbar', '<div class="container"><header></header><section>' + nativeForm + '</section></div>']
        ]) {
            await t.test('shows and saves the badge editor with ' + layout, async () => {
                const page = await Page('/modify_user_info.php', nativeForm, {markup});
                assert.equal(await page.locator('#UserScriptBadgeEditor').isVisible(), true);
                assert.equal(await page.getByRole('heading', {name: '标签编辑'}).isVisible(), true);
                assert.equal(await page.locator('#UserScriptBadgeContent').inputValue(), 'Badge');
                assert.equal(await page.locator('form #UserScriptBadgeEditor').count(), 0);
                await page.evaluate(() => RunAccountStartup(true));
                assert.equal(await page.locator('#UserScriptBadgeEditor').count(), 1);
                await page.locator('#UserScriptBadgeContent').fill('Restored badge');
                await page.getByRole('button', {name: '修改标签', exact: true}).click();
                assert.equal(await page.getByRole('status').innerText(), '修改成功');
                assert.deepEqual(await page.evaluate(() => apiCalls.filter(call => call.action === 'EditBadge').map(call => call.data.Content)), ['Restored badge']);
                assert.equal(await page.locator('[name="nick"]').inputValue(), 'Nickname');
                await page.close();
            });
        }
        await t.test('uses the signed-in profile if the old login check no longer matches', async () => {
            const page = await Page('/modify_user_info.php');
            await page.evaluate(() => {
                document.getElementById('UserScriptBadgeEditor').remove();
                RunAccountStartup(false);
            });
            assert.equal(await page.locator('#UserScriptBadgeEditor').isVisible(), true);
            assert.equal(await page.locator('#UserScriptBadgeContent').inputValue(), 'Badge');
            await page.close();
        });
        for (const failure of [false, true]) {
            await t.test('badge save ' + (failure ? 'reports failure and retains cache' : 'clears only this user’s badge cache'), async () => {
                const page = await Page('/modify_user_info.php', nativeForm, {badgeFailure: failure});
                await page.evaluate(() => {
                    localStorage.setItem('UserScript-User-Tester-Badge-Content', 'stale');
                    localStorage.setItem('UserScript-User-Other-Badge-Content', 'keep');
                });
                await page.locator('#UserScriptBadgeContent').fill('<New badge>');
                await page.getByRole('button', {name: '修改标签', exact: true}).click();
                assert.deepEqual(await page.evaluate(() => apiCalls[1]), {action: 'EditBadge', data: {
                    UserID: 'Tester', Content: '<New badge>', BackgroundColor: '#112233', Color: '#ffffff'
                }});
                assert.equal(await page.getByRole('status').innerText(), failure ? 'Save failed' : '修改成功');
                assert.equal(await page.getByRole('button', {name: '修改标签', exact: true}).isEnabled(), true);
                assert.equal(await page.evaluate(() => localStorage.getItem('UserScript-User-Tester-Badge-Content')), failure ? 'stale' : null);
                assert.equal(await page.evaluate(() => localStorage.getItem('UserScript-User-Other-Badge-Content')), 'keep');
                assert.equal(await page.evaluate(() => window.nativeSubmitCount || 0), 0);
                await page.close();
            });
        }
        for (const route of ['/modify_user_info.php']) {
            const button = 'button:has-text("修改标签")';
            const content = '#UserScriptBadgeContent';
            const background = '#UserScriptBadgeBackground';
            const color = '#UserScriptBadgeColor';
            for (const badgeData of [null, {}, {Content: null, BackgroundColor: '', Color: 'invalid'}]) {
                await t.test('normalizes incomplete badge data on ' + route + ': ' + JSON.stringify(badgeData), async () => {
                    const page = await Page(route, nativeForm, {badgeData});
                    assert.equal(await page.locator(content).inputValue(), '');
                    assert.equal(await page.locator(background).inputValue(), '#000000');
                    assert.equal(await page.locator(color).inputValue(), '#ffffff');
                    await page.locator(button).click();
                    assert.deepEqual(await page.evaluate(() => apiCalls.find(call => call.action === 'EditBadge').data), {
                        UserID: 'Tester', Content: '', BackgroundColor: '#000000', Color: '#ffffff'
                    });
                    assert.equal(await page.locator(button).isEnabled(), true);
                    await page.close();
                });
            }
            for (const [mode, message] of [
                ['network', '网络错误，请重试'], ['timeout', '请求超时，请重试'],
                ['abort', '请求已取消，请重试'], ['throw', '请求失败，请重试'],
                ['invalid-json', '服务器响应异常，请重试'], ['invalid-response', '服务器响应异常，请重试'],
                ['http', '请求失败（HTTP 503），请重试']
            ]) {
                await t.test('recovers and retries a ' + mode + ' badge failure on ' + route, async () => {
                    const page = await Page(route, nativeForm, {badgeFailureMode: mode});
                    await page.evaluate(() => {
                        localStorage.setItem('UserScript-User-Tester-Badge-Content', 'stale');
                        localStorage.setItem('UserScript-User-Other-Badge-Content', 'keep');
                    });
                    await page.locator(content).fill('New badge');
                    await page.locator(button).click();
                    assert.equal(await page.locator(button).isEnabled(), true);
                    assert.equal(await page.locator('[role="status"]').innerText(), message);
                    assert.equal(await page.evaluate(() => localStorage.getItem('UserScript-User-Tester-Badge-Content')), 'stale');
                    assert.deepEqual(await page.evaluate(() => requests), []);
                    if (['network', 'timeout', 'abort'].includes(mode)) {
                        assert.equal(await page.evaluate(() => requestTimeout), 15000);
                    }
                    await page.evaluate(() => { window.badgeFailureMode = null; });
                    await page.locator(button).click();
                    assert.equal(await page.locator(button).isEnabled(), true);
                    assert.equal(await page.locator('[role="status"]').innerText(), '修改成功');
                    assert.equal(await page.evaluate(() => localStorage.getItem('UserScript-User-Tester-Badge-Content')), null);
                    assert.equal(await page.evaluate(() => localStorage.getItem('UserScript-User-Other-Badge-Content')), 'keep');
                    assert.deepEqual(await page.evaluate(() => requests), []);
                    await page.close();
                });
            }
        }
        await t.test('badge access denial leaves the native form usable', async () => {
            const page = await Page('/modify_user_info.php', nativeForm, {noBadge: true});
            assert.equal(await page.locator('#UserScriptBadgeContent').isDisabled(), true);
            assert.match(await page.getByRole('status').innerText(), /Load denied/);
            await page.getByRole('button', {name: 'Save account'}).click();
            assert.equal(await page.evaluate(() => nativeSubmitCount), 1);
            await page.close();
        });
        for (const route of ['/modify_user_info.php']) {
            const content = '#UserScriptBadgeContent';
            const save = 'button:has-text("修改标签")';
            const status = '[role="status"]';
            for (const mode of ['network', 'timeout', 'abort', 'throw', 'invalid-json', 'invalid-response', 'http', 'denied']) {
                await t.test('protects existing badges and retries a ' + mode + ' load failure on ' + route, async () => {
                    const page = await Page(route, nativeForm,
                        {badgeLoadFailureMode: mode, noBadge: mode === 'denied'});
                    assert.match(await page.locator(status).innerText(), /标签加载失败：/);
                    assert.equal(await page.locator(content).isDisabled(), true);
                    assert.equal(await page.getByRole('button', {name: '重试加载标签', exact: true}).isVisible(), true);
                    await page.evaluate(() => localStorage.setItem('UserScript-User-Tester-Badge-Content', 'existing badge'));
                    assert.equal(await page.locator(save).isDisabled(), true);
                    await page.locator(save).dispatchEvent('click');
                    await page.getByRole('button', {name: 'Save account'}).click();
                    assert.equal(await page.evaluate(() => nativeSubmitCount), 1);
                    assert.deepEqual(await page.evaluate(() => apiCalls.filter(call => call.action === 'EditBadge')), []);
                    assert.equal(await page.evaluate(() => localStorage.getItem('UserScript-User-Tester-Badge-Content')), 'existing badge');
                    await page.evaluate(() => {
                        window.badgeLoadFailureMode = null;
                        window.badgeAccessDenied = false;
                    });
                    await page.getByRole('button', {name: '重试加载标签', exact: true}).click();
                    assert.equal(await page.locator(content).isEnabled(), true);
                    assert.equal(await page.locator(content).inputValue(), 'Badge');
                    assert.equal(await page.getByRole('button', {name: '重试加载标签', exact: true}).isHidden(), true);
                    await page.locator(content).fill('Recovered badge');
                    await page.locator(save).click();
                    assert.equal(await page.evaluate(() => apiCalls.find(call => call.action === 'EditBadge').data.Content), 'Recovered badge');
                    assert.equal(await page.evaluate(() => localStorage.getItem('UserScript-User-Tester-Badge-Content')), null);
                    await page.close();
                });
            }
            await t.test('blocks badge writes while the initial load is pending on ' + route, async () => {
                const page = await Page(route, nativeForm, {badgeLoadFailureMode: 'pending'});
                assert.match(await page.locator(status).innerText(), /正在加载标签/);
                assert.equal(await page.locator(content).isDisabled(), true);
                await page.locator(save).dispatchEvent('click');
                assert.deepEqual(await page.evaluate(() => apiCalls.filter(call => call.action === 'EditBadge')), []);
                await page.evaluate(() => pendingBadgeRequest.onload({status: 200, responseText: JSON.stringify({
                    Success: true, Data: {Content: 'Existing badge', BackgroundColor: '#112233', Color: '#ffffff'}
                })}));
                assert.equal(await page.locator(content).isEnabled(), true);
                assert.equal(await page.locator(content).inputValue(), 'Existing badge');
                await page.close();
            });
        }
        for (const route of ['/modify_user_info.php']) {
            await t.test('renders changelog on ' + route + ' even without an account form', async () => {
                const page = await Page(route + '?ByUserScript=1', 'Please log in', {export: true});
                assert.equal(await page.title(), 'XMOJ-Script 更新日志');
                assert.equal(await page.locator('.card-title').innerText(), '1.0.0');
                assert.match(await page.locator('.list-group-item').innerText(), /Account migration/);
                assert.deepEqual(await page.evaluate(() => apiCalls), []);
                assert.equal(await page.locator('button').count(), 0);
                await page.close();
            });
            await t.test('leaves login and error messages intact on ' + route, async () => {
                const page = await Page(route, 'Please log in', {export: true});
                assert.equal(await page.locator('.mt-3').innerText(), 'Please log in');
                assert.deepEqual(await page.evaluate(() => apiCalls), []);
                await page.evaluate(async () => {
                    document.body.innerHTML = '<h1>403</h1>';
                    await RunAccountPage();
                });
                assert.equal(await page.locator('h1').innerText(), '403');
                await page.close();
            });
        }
        await t.test('redirects defunct account links to the current page preserving the query and fragment', async () => {
            const page = await browser.newPage();
            await page.route('**/*', request => request.fulfill({contentType: 'text/html', body: nativeForm}));
            // Run the actual document-start block, rather than redirecting from the test.
            await page.addInitScript({content: 'function GetContestWebRedirect() { return null; }\nfunction IsContestWebApp() { return false; }\nlocalStorage.setItem("UserScript-Setting-NewBootstrap", "false");\n' + earlyRedirect});
            await page.goto('https://account-settings.test/modifypage.php?ByUserScript=1#latest');
            await page.waitForURL('https://account-settings.test/modify_user_info.php?ByUserScript=1#latest');
            assert.equal(await page.locator('form').getAttribute('action'), '/modify_user_info.php');
            await page.close();
        });
        await t.test('leaves the separate password form intact', async () => {
            const page = await Page('/modify_password.php', '<form><input type="password" name="password"></form>', {export: true});
            assert.equal(await page.evaluate(() => document.querySelector('form') === nativeAccountForm), true);
            assert.deepEqual(await page.evaluate(() => apiCalls), []);
            assert.equal(await page.locator('button').count(), 0);
            await page.close();
        });
        for (const [label, route] of [['修改帐号', '/modify_user_info.php'], ['插件更新日志', '/modify_user_info.php?ByUserScript=1']]) {
            await t.test('user menu sends ' + label + ' to the migrated route', async () => {
                const page = await Page('/index.php');
                await page.evaluate(() => CreateUserMenuItems().forEach(item => document.body.appendChild(item)));
                await Promise.all([page.waitForURL('https://www.xmoj.tech' + route), page.getByText(label, {exact: true}).click()]);
                assert.equal(page.url(), 'https://www.xmoj.tech' + route);
                await page.close();
            });
        }
    } finally {
        await browser.close();
    }
});

test('current account tools initialize before the monolithic page handler', () => {
    const call = source.indexOf('InitializeAccountFeatures(logined');
    const main = source.indexOf('await main();');
    assert.ok(call >= 0);
    assert.ok(main >= 0);
    assert.ok(call < main);
    assert.match(source, /const AccountRedirect = GetAccountSettingsRedirect\(\);/);
});
