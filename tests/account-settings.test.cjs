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
const handler = 'window.RunAccountPage = async () => { if (false) {' +
    Between('} else if (IsAccountSettingsPage(location.pathname) &&', '} else if (location.pathname == "/userinfo.php" &&') + '}};';
const nativeForm = `<form action="/modify_user_info.php" method="post">
    <input name="nick" value="Nickname"><input name="school" value="School">
    <input name="email" value="user@example.test"><input name="csrf" value="token">
    <button type="submit">Save account</button></form>`;

test('account-page migration browser regressions', {timeout: 60000}, async t => {
    const browser = await chromium.launch({executablePath: process.env.XMOJ_CHROMIUM || undefined});
    async function Page(route, content = nativeForm, options = {}) {
        const page = await browser.newPage();
        await page.route('**/*', request => request.fulfill({contentType: 'text/html', body:
            `<div class="container"><nav></nav><div class="mt-3">${content}</div></div>`}));
        await page.goto('https://account-settings.test' + route);
        await page.evaluate(options => {
            window.CurrentUsername = 'Tester';
            window.SearchParams = new URL(location.href).searchParams;
            window.UtilityEnabled = name => name === 'ExportACCode' && options.export;
            window.ServerURL = 'https://updates.test';
            window.GetRelativeTime = () => 'today';
            window.escapeHTML = value => value;
            window.GetUserInfo = async () => ({EmailHash: 'hash'});
            window.apiCalls = [];
            window.RequestAPI = (action, data, callback) => {
                apiCalls.push({action, data});
                callback(action === 'GetBadge' ? {
                    Success: !options.noBadge, Data: {Content: 'Badge', BackgroundColor: '#112233', Color: '#ffffff'}
                } : {Success: !options.badgeFailure, Message: 'Save failed'});
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
        }, options);
        await page.addScriptTag({content: helpers + handler});
        await page.evaluate(() => RunAccountPage());
        return page;
    }
    try {
        await t.test('preserves migrated fields, CSRF, action and native submit listener', async () => {
            const page = await Page('/modify_user_info.php', nativeForm, {export: true});
            assert.equal(await page.evaluate(() => document.querySelector('form') === nativeAccountForm), true);
            assert.equal(await page.locator('form').getAttribute('action'), '/modify_user_info.php');
            assert.equal(await page.locator('[name="csrf"]').inputValue(), 'token');
            assert.equal(await page.locator('[name="nick"]').inputValue(), 'Nickname');
            assert.equal(await page.locator('input[type="password"]').count(), 0);
            await page.getByRole('button', {name: 'Save account'}).click();
            assert.equal(await page.evaluate(() => nativeSubmitCount), 1);
            assert.equal(await page.getByRole('button', {name: '导出AC代码', exact: true}).count(), 1);
            assert.deepEqual(await page.evaluate(() => requests), []);
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
        await t.test('badge access denial leaves the native form usable', async () => {
            const page = await Page('/modify_user_info.php', nativeForm, {noBadge: true});
            assert.equal(await page.locator('#UserScriptBadgeContent').count(), 0);
            await page.getByRole('button', {name: 'Save account'}).click();
            assert.equal(await page.evaluate(() => nativeSubmitCount), 1);
            await page.close();
        });
        for (const route of ['/modify_user_info.php', '/modifypage.php']) {
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
        await t.test('retains the legacy account enhancement', async () => {
            const legacy = nativeForm.replace('</form>', '<input name="acc_cf"><input name="acc_atc"><input name="acc_usaco"><input name="acc_luogu"></form>');
            const page = await Page('/modifypage.php', legacy, {noBadge: true});
            assert.equal(await page.locator('#Nickname').inputValue(), 'Nickname');
            assert.equal(await page.locator('#ModifyInfo').count(), 1);
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
