const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const source = fs.readFileSync(path.join(__dirname, '../XMOJ.user.js'), 'utf8');
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/profile.html'), 'utf8');
function Between(start, end) {
    for (const marker of [start, end]) assert.equal(source.split(marker).length - 1, 1, 'unique extraction marker: ' + marker);
    assert.ok(source.indexOf(start) < source.indexOf(end));
    return source.slice(source.indexOf(start), source.indexOf(end));
}
const profile = Between('function GetProfileSolvedProblems(', 'function IsAccountSettingsPage(');
const api = Between('let RequestAPI = (', 'let SyncSettingsToCloud = (');
const relativeTime = Between('let GetRelativeTime = (', 'function compareVersions(');
const preprocessing = 'window.RunProfilePreprocessing = () => {' + Between(
    '// Preserve native account listeners during page-wide customization.',
    '// Bootstrap stylesheet and markup migration.') + '};';

test('profile page browser regressions', {timeout: 60000}, async t => {
    const browser = await chromium.launch({executablePath: process.env.XMOJ_CHROMIUM || undefined});
    async function Page(options = {}) {
        const page = await browser.newPage();
        await page.route('**/*', route => route.fulfill({contentType: 'text/html; charset=utf-8', body: options.html ?? fixture}));
        await page.goto('https://profile.test/userinfo.php?user=ProfileTarget' + (options.upload ? '&ByUserScript=1' : ''));
        await page.evaluate(options => {
            window.CurrentUsername = 'Viewer';
            window.GM_info = {script: {version: 'test'}};
            document.cookie = 'PHPSESSID=fixture; path=/';
            window.UtilityEnabled = name => ['Rating', 'ReplaceLinks', 'ReplaceXM'].includes(name) || (name === 'RemoveUseless' && options.removeActivity !== false);
            window.CryptoJS = {MD5: email => { window.avatarEmail = email; return {toString: () => '123456789012345678901234567890abcf'}; }};
            window.GetUserInfo = window.GetUserBadge = () => { throw new Error('Profile must not wait for these APIs'); };
            window.onlineTimestamp = options.onlineTimestamp ?? 1234;
            window.confirm = () => true;
            window.apiCalls = [];
            window.requests = {};
            window.badgeMode = options.badgeMode;
            window.onlineMode = options.onlineMode;
            window.badgeData = Object.hasOwn(options, 'badgeData') ? options.badgeData : {Content: '省一', BackgroundColor: '#112233', Color: '#ffffff'};
            window.actionMode = options.actionMode;
            window.GM_xmlhttpRequest = request => {
                const action = new URL(request.url).pathname.slice(1);
                const data = JSON.parse(request.data).Data;
                if (action === 'SendData') return;
                apiCalls.push({action, data, timeout: request.timeout});
                requests[action] = request;
                const mode = action === 'GetBadge' ? badgeMode : action === 'LastOnline' ? onlineMode : actionMode;
                if (mode === 'pending') return;
                if (mode === 'throw') throw new Error('Transport failure');
                if (['network', 'timeout', 'abort'].includes(mode)) {
                    request[{network: 'onerror', timeout: 'ontimeout', abort: 'onabort'}[mode]]();
                    request.onload({status: 200, responseText: '{"Success":true,"Data":{"Content":"late"}}'});
                    return;
                }
                if (mode === 'invalid-json' || mode === 'http') {
                    request.onload({status: mode === 'http' ? 503 : 200, responseText: '<html>Error</html>'});
                    return;
                }
                if (!mode && action === 'NewBadge') window.badgeData = {Content: 'New badge'};
                if (!mode && action === 'DeleteBadge') window.badgeData = null;
                request.onload({status: 200, responseText: JSON.stringify({Success: mode !== 'denied', Message: 'Denied',
                    Data: action === 'GetBadge' ? badgeData : action === 'LastOnline' ? {logintime: onlineTimestamp} : {}})});
            };
            window.nativeStats = document.getElementById('statics');
            window.nativePie = document.getElementById('PieDiv');
            window.nativeActivity = document.getElementById('submission');
            window.nativeCountLink = document.querySelector('a[href*="problem_id=1000"]');
            window.pieClicks = window.countClicks = 0;
            nativePie?.addEventListener('click', () => { pieClicks++; });
            nativeCountLink?.addEventListener('click', event => { event.preventDefault(); countClicks++; });
        }, options);
        await page.addScriptTag({content: api + relativeTime + profile + preprocessing});
        await page.evaluate(isAdmin => {
            InitializeUserProfile(isAdmin);
            RunProfilePreprocessing();
        }, !!options.admin);
        return page;
    }
    const AssertCore = async page => {
        assert.equal(await page.locator('#UserScriptProfile').isVisible(), true);
        assert.equal(await page.title(), '用户 ProfileTarget 的个人中心');
        assert.equal(await page.getByText('用户名：ProfileTarget', {exact: true}).isVisible(), true);
        assert.equal(await page.getByText('昵称：昵称--后缀', {exact: true}).isVisible(), true);
        assert.equal(await page.getByText('评分：400', {exact: true}).isVisible(), true);
        assert.equal(await page.locator('#UserScriptProfile img').isVisible(), true);
        assert.match(await page.locator('#UserScriptProfile img').getAttribute('src'), /123456789012345678901234567890abcf/);
        assert.equal(await page.evaluate(() => avatarEmail), 'profile@example.test');
        assert.deepEqual(await page.locator('#UserScriptProfileSolved a[href*="problem.php"]').allTextContents(), ['1000 ', '1010 ']);
        assert.equal(await page.getByRole('link', {name: '短消息', exact: true}).getAttribute('href'), 'mail.php?to_user=ProfileTarget');
        assert.equal(await page.locator('#statics tr').count(), 6);
        assert.equal(await page.locator('#statics a[href*="jresult=4"]').allTextContents().then(values => values.join(',')), '2,8');
        assert.equal(await page.evaluate(() => document.getElementById('statics') === nativeStats), true);
        assert.equal(await page.evaluate(() => document.getElementById('PieDiv') === nativePie), true);
        assert.equal(await page.evaluate(() => document.querySelector('a[href*="problem_id=1000"]') === nativeCountLink), true);
        assert.equal(await page.evaluate(() => nativeProfileRuns), 1, 'never re-evaluate native document.write scripts');
    };
    try {
        await t.test('restores identity, rating, badge, last online, solved links and statistics', async () => {
            const page = await Page();
            await AssertCore(page);
            assert.equal(await page.locator('#UserScriptProfileBadge').innerText(), '省一');
            assert.match(await page.locator('#UserScriptProfileLastOnline').innerText(), /^最后在线：\d+年前$/);
            assert.deepEqual(await page.evaluate(() => apiCalls), [
                {action: 'GetBadge', data: {UserID: 'ProfileTarget'}, timeout: 15000},
                {action: 'LastOnline', data: {Username: 'ProfileTarget'}, timeout: 15000}
            ]);
            assert.equal(await page.getByRole('button', {name: '添加标签'}).count(), 0);
            await page.getByRole('link', {name: '7', exact: true}).click();
            await page.locator('#PieDiv').click();
            assert.deepEqual(await page.evaluate(() => [countClicks, pieClicks]), [1, 1]);
            await page.evaluate(() => InitializeUserProfile());
            assert.equal(await page.locator('#UserScriptProfile').count(), 1);
            assert.equal(await page.evaluate(() => apiCalls.length), 2);
            await page.close();
        });
        await t.test('renders core content immediately while optional requests are pending', async () => {
            const page = await Page({badgeMode: 'pending', onlineMode: 'pending'});
            await AssertCore(page);
            assert.match(await page.getByRole('status').innerText(), /正在加载标签/);
            await page.evaluate(() => requests.LastOnline.ontimeout());
            assert.equal(await page.locator('#UserScriptProfileLastOnline').innerText(), '最后在线：暂不可用');
            await page.close();
        });
        await t.test('renders relative timestamps as readable text with the formatter tooltip', async () => {
            const timestamp = Date.now() - 90 * 60 * 1000;
            const page = await Page({onlineTimestamp: timestamp});
            const lastOnline = page.locator('#UserScriptProfileLastOnline');
            assert.equal(await lastOnline.innerText(), '最后在线：1小时前');
            assert.equal(await lastOnline.locator('span').count(), 1);
            assert.equal(await lastOnline.locator('span').getAttribute('title'), await page.evaluate(value => new Date(value).toLocaleString(), timestamp));
            await page.close();
        });
        for (const mode of ['network', 'timeout', 'abort', 'throw', 'invalid-json', 'http', 'denied']) {
            await t.test('preserves the profile and retries a ' + mode + ' badge failure', async () => {
                const page = await Page({badgeMode: mode, onlineMode: mode});
                await AssertCore(page);
                assert.match(await page.getByRole('status').innerText(), /标签暂不可用/);
                assert.equal(await page.getByRole('button', {name: '重试加载标签'}).isVisible(), true);
                await page.evaluate(() => { window.badgeMode = null; });
                await page.getByRole('button', {name: '重试加载标签'}).click();
                assert.equal(await page.locator('#UserScriptProfileBadge').innerText(), '省一');
                assert.equal(await page.getByRole('button', {name: '重试加载标签'}).isHidden(), true);
                await page.close();
            });
        }
        for (const badgeData of [null, {}, {Content: null, BackgroundColor: '', Color: 'invalid'}]) {
            await t.test('handles missing badge data: ' + JSON.stringify(badgeData), async () => {
                const page = await Page({badgeData, admin: true});
                await AssertCore(page);
                assert.equal(await page.locator('#UserScriptProfileBadge').isHidden(), true);
                assert.equal(await page.getByRole('button', {name: '添加标签'}).isVisible(), true);
                await page.close();
            });
        }
        await t.test('admin badge actions target the viewed user and recover from failures', async () => {
            const page = await Page({admin: true, actionMode: 'network'});
            await page.evaluate(() => {
                localStorage.setItem('UserScript-User-ProfileTarget-Badge-Content', 'cached');
                localStorage.setItem('UserScript-User-Viewer-Badge-Content', 'keep');
            });
            await page.getByRole('button', {name: '删除标签'}).click();
            assert.equal(await page.getByRole('button', {name: '删除标签'}).isEnabled(), true);
            assert.equal(await page.getByRole('status').innerText(), '网络错误，请重试');
            assert.equal(await page.evaluate(() => localStorage.getItem('UserScript-User-ProfileTarget-Badge-Content')), 'cached');
            await page.evaluate(() => { window.actionMode = null; });
            await page.getByRole('button', {name: '删除标签'}).click();
            assert.equal(await page.getByRole('button', {name: '添加标签'}).isVisible(), true);
            await page.getByRole('button', {name: '添加标签'}).click();
            assert.equal(await page.locator('#UserScriptProfileBadge').innerText(), 'New badge');
            assert.equal(await page.evaluate(() => localStorage.getItem('UserScript-User-ProfileTarget-Badge-Content')), null);
            assert.equal(await page.evaluate(() => localStorage.getItem('UserScript-User-Viewer-Badge-Content')), 'keep');
            assert.equal(await page.evaluate(() => apiCalls.filter(call => ['NewBadge', 'DeleteBadge'].includes(call.action)).every(call => call.data.UserID === 'ProfileTarget')), true);
            await page.close();
        });
        await t.test('uses query identity with no caption and tolerates missing email, history and header rows', async () => {
            const html = '<main><table id="statics"><tr><td>正确</td><td>0</td></tr><tr><td>提交</td><td>0</td></tr></table></main>';
            const page = await Page({html});
            assert.equal(await page.getByText('用户名：ProfileTarget', {exact: true}).isVisible(), true);
            assert.equal(await page.getByText('评分：0', {exact: true}).isVisible(), true);
            assert.equal(await page.locator('#statics tr').count(), 2);
            assert.equal(await page.locator('#UserScriptProfileSolved a').count(), 0);
            assert.match(await page.locator('#UserScriptProfile img').getAttribute('src'), /d=mp/);
            await page.close();
        });
        for (const removeActivity of [false, true]) {
            await t.test('draws submission history without Flot with cleanup=' + removeActivity, async () => {
                const page = await Page({removeActivity});
                const graph = page.getByRole('img', {name: '提交与正确数量随时间的变化'});
                assert.equal(await graph.isVisible(), true);
                assert.equal(await page.evaluate(() => document.getElementById('submission') === nativeActivity), true);
                assert.equal(await page.locator('#submission canvas').count(), 0);
                assert.equal(await page.evaluate(() => window.jQuery), undefined);
                assert.equal(await page.evaluate(() => window.nativeHistoryRuns), undefined, 'never execute the broken native graph script');
                assert.deepEqual(await page.evaluate(() => GetProfileActivityData()), [
                    [[1704067200000, 20], [1704153600000, 5], [1704240000000, 12]],
                    [[1704067200000, 8], [1704153600000, 2], [1704240000000, 4]]
                ]);
                assert.equal(await graph.locator('path[data-series="submitted"]').count(), 1);
                assert.equal(await graph.locator('circle[data-series="submitted"]').count(), 3);
                assert.equal(await graph.locator('rect[data-series="accepted"]').count(), 3);
                assert.deepEqual(await graph.locator('circle title').allTextContents(), ['2024-01-01 提交：20', '2024-01-02 提交：5', '2024-01-03 提交：12']);
                assert.deepEqual(await graph.locator('rect title').allTextContents(), ['2024-01-01 正确：8', '2024-01-02 正确：2', '2024-01-03 正确：4']);
                assert.ok((await graph.locator('path').getAttribute('d')).startsWith('M'));
                await page.addStyleTag({content: '#UserScriptProfile {display:flex} #UserScriptProfile > div {width:50%;min-width:0}'});
                await page.setViewportSize({width: 640, height: 800});
                await page.waitForFunction(() => Number(document.querySelector('#submission svg').getAttribute('viewBox').split(' ')[2]) < 400);
                const boxes = await graph.locator('text').evaluateAll(nodes => nodes.map(node => ({x: node.getBBox().x, right: node.getBBox().x + node.getBBox().width})));
                assert.ok(boxes.every(box => box.x >= 0 && box.right <= 320), 'axis labels must fit the narrow viewBox');
                assert.ok(await graph.locator('rect').evaluateAll(nodes => nodes.every(node => Number(node.getAttribute('height')) > 0)));
                await page.close();
            });
        }
        await t.test('history parsing ignores executable values, sorts dates and handles empty or missing data', async () => {
            const page = await Page();
            const parsed = await page.evaluate(() => {
                window.historyScriptExecuted = false;
                const doc = new DOMParser().parseFromString('<script>window.historyScriptExecuted=true;var d1=[],d2=[];d1.push([1704067200000,3]);d1.push([1704067200000,4]);d2.push([1704153600000,2]);d1.push([0,1]);d1.push([99999999999999999,1]);d2.push([1704067200000,-1]);d1.push([1704067200000,evil()]);$.plot($("#submission"),[]);<\/script>', 'text/html');
                return GetProfileActivityData(doc);
            });
            assert.deepEqual(parsed, [[[1704067200000, 4]], [[1704153600000, 2]]]);
            assert.equal(await page.evaluate(() => historyScriptExecuted), false);
            await page.close();
            for (const [script, message] of [
                ['<script>var d1=[],d2=[];if(false) $.plot($("#submission"),[]);<\/script>', '暂无提交记录'],
                ['', '暂时无法读取提交记录']
            ]) {
                const empty = await Page({html: fixture.replace(/<script>\n\/\/ Match the history[\s\S]*?<\/script>/, script)});
                assert.equal(await empty.locator('#submission').innerText(), message);
                await empty.close();
            }
        });
        await t.test('chart legend uses separate non-overlapping rows', async () => {
            const page = await Page();
            await page.addScriptTag({content: Between('const MonochromeSkinCSS', 'const NewBootstrapSkinCSS')});
            await page.addStyleTag({content: await page.evaluate(() => MonochromeSkinCSS)});
            assert.deepEqual(await page.locator('#PieDiv li').allTextContents(), ['正确 [40%]', '答案错误 [60%]']);
            const boxes = await page.locator('#PieDiv li').evaluateAll(items => items.map(item => ({top: item.getBoundingClientRect().top, bottom: item.getBoundingClientRect().bottom})));
            assert.ok(boxes[1].top >= boxes[0].bottom);
            assert.equal(await page.getByRole('img', {name: '判题结果分布'}).isVisible(), true);
            assert.equal(await page.getByRole('img', {name: '判题结果分布'}).evaluate(element => getComputedStyle(element).borderRadius), '50%');
            await page.close();
        });
        await t.test('parses raw solved-problem calls for standard uploads without executing scripts', async () => {
            const page = await Page({upload: true});
            assert.equal(await page.locator('#UserScriptProfile').count(), 0);
            assert.deepEqual(await page.evaluate(() => apiCalls), []);
            const ids = await page.evaluate(() => {
                window.shouldNeverRun = false;
                const doc = new DOMParser().parseFromString('<table id="statics"><tr><td><script>window.shouldNeverRun=true;p(1000,7);p(1000,2);p(1010,1);p(0,1);p(999999999999999999999,1);</script><a href="problem.php?id=1020">1020</a><a href="http://[">bad</a></td></tr></table>', 'text/html');
                return GetProfileSolvedProblems(doc);
            });
            assert.deepEqual(ids, [1020, 1000, 1010]);
            assert.equal(await page.evaluate(() => shouldNeverRun), false);
            await page.close();
        });
        await t.test('leaves missing-user and error pages intact', async () => {
            const page = await Page({html: '<h1>No such User!</h1>'});
            assert.equal(await page.locator('h1').innerText(), 'No such User!');
            assert.equal(await page.locator('#UserScriptProfile').count(), 0);
            assert.deepEqual(await page.evaluate(() => apiCalls), []);
            await page.close();
        });
    } finally { await browser.close(); }
});

test('profile startup precedes the general page handler and standard uploads reuse solved parsing', () => {
    const startup = source.indexOf('InitializeUserProfile(IsAdmin);');
    const main = source.indexOf('await main();');
    assert.ok(startup >= 0 && main >= 0 && startup < main);
    assert.match(source, /ACList = GetProfileSolvedProblems\(ParsedDocument\);/);
});
