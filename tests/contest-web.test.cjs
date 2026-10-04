const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../XMOJ.user.js'), 'utf8');
// The tested code is cut out of the userscript between these markers. Each marker
// must appear exactly once, so a rename or move fails here instead of silently
// testing the wrong code.
function between(start, end) {
    for (const marker of [start, end]) {
        assert.equal(source.split(marker).length - 1, 1, 'expected exactly one "' + marker + '" in XMOJ.user.js');
    }
    const from = source.indexOf(start), to = source.indexOf(end);
    assert.ok(from < to, '"' + start + '" must come before "' + end + '"');
    return source.slice(from, to);
}
const helpers = between('function IsContestWebApp(', 'const MonochromeSkinCSS');
const skins = between('const MonochromeSkinCSS', '// Set to true by the early block');
const theme = between('function ApplyContestWebTheme(', '// Enhancements for the Vue contest app.');

function context(overrides = {}) {
    const storage = new Map();
    const styles = [];
    const attributes = new Map();
    const scope = vm.createContext({
        URL, URLSearchParams, AbortController,
        location: new URL('https://www.xmoj.tech/web/contest/123/A'),
        localStorage: {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value))},
        document: {
            head: null, body: null,
            documentElement: {setAttribute: (key, value) => attributes.set(key, value), appendChild: node => styles.push(node)},
            getElementById: id => styles.find(style => style.id === id),
            createElement: () => ({textContent: ''})
        },
        window: {matchMedia: () => ({matches: true})},
        ...overrides
    });
    vm.runInContext(helpers + skins + theme, scope);
    return {scope, storage, styles, attributes};
}

test('recognizes list, contest, lettered problem, rank, solution and std routes', () => {
    const {scope} = context();
    for (const [path, page, cid, num] of [
        ['/web/contest/', 'list', null, null],
        ['/web/contest/123/', 'contest', '123', null],
        ['/web/contest/123/A?lang=en', 'problem', '123', 'A'],
        ['/web/contest/123/%5B', 'problem', '123', '['],
        ['/web/contest/123/rank-correct?user_id=test', 'rank', '123', null],
        ['/web/contest/123/B/std', 'std', '123', 'B'],
        ['/web/contest/123/B/solution/', 'solution', '123', 'B']
    ]) {
        assert.deepEqual(JSON.parse(JSON.stringify(scope.GetContestRoute(path))), {page, cid, num});
    }
    assert.equal(scope.GetContestRoute('/problem.php?cid=123&pid=0'), null);
    assert.equal(scope.IsContestWebApp('/webinar'), false);
    assert.equal(scope.IsContestWebApp('/web'), true);
    assert.equal(scope.IsContestWebApp('/web/contest/123/A'), true);
});

test('maps API letters to submit indexes without relying on row order', () => {
    const {scope, storage} = context();
    scope.CacheContestProblems('123', {contest: {title: 'Contest'}, problems: [
        {num: 'C', problemId: 12345, problemTitle: '<Title>'},
        {num: 'A', problemId: 98765, problemTitle: 'First'}
    ]});
    assert.equal(storage.get('UserScript-Contest-123-Problem-2-PID'), '12345');
    assert.equal(storage.get('UserScript-Contest-123-Problem-0-PID'), '98765');
    assert.equal(storage.get('UserScript-Contest-123-Name'), 'Contest');
    assert.equal(storage.get('UserScript-Problem-12345-Name'), '<Title>');
    assert.equal(storage.get('UserScript-Problem-98765-Name'), 'First');
    // The problem list itself is not cached: the switcher uses the API response.
    assert.equal(storage.get('UserScript-Contest-123-ProblemList'), undefined);
    assert.equal(scope.GetContestProblemURL('123', '['), '/web/contest/123/%5B');
});

test('direct submission lookup uses JSON and clears stale file names for standard input', async () => {
    const requests = [];
    const {scope, storage} = context({fetch: async (url, options) => {
        requests.push({url, options});
        return {ok: true, json: async () => ({problem: {problemId: 123456, title: 'Problem', name: ''}, problems: []})};
    }});
    storage.set('UserScript-Problem-123456-IOFilename', 'stale');
    const signal = new AbortController().signal;
    const result = await scope.GetContestProblemData('123', '1', signal);
    assert.equal(result.problemId, 123456);
    assert.equal(requests[0].url, '/api/contest/123/B');
    assert.equal(requests[0].options.signal, signal);
    assert.equal(requests[0].options.credentials, 'same-origin');
    assert.equal(storage.get('UserScript-Contest-123-Problem-1-PID'), '123456');
    assert.equal(storage.get('UserScript-Problem-123456-IOFilename'), '');
    await assert.rejects(scope.GetContestProblemData('123', '-1'), /无效/);
    await assert.rejects(scope.GetContestProblemData(null, '0'), /无效/);
});

test('API failures are reported without caching bogus metadata', async () => {
    const {scope, storage} = context({fetch: async () => ({ok: false, status: 403, json: async () => ({detail: '比赛尚未开始'})})});
    await assert.rejects(scope.GetContestProblemData('123', '0'), /比赛尚未开始/);
    assert.equal(storage.size, 0);
});

test('sets dark canvas synchronously before head/body exist and reuses its style', () => {
    const {scope, styles, attributes, storage} = context();
    storage.set('UserScript-Setting-Theme', 'dark');
    assert.equal(scope.ApplyContestWebTheme(), true);
    assert.equal(attributes.get('data-bs-theme'), 'dark');
    assert.equal(storage.get('UserScript-Setting-DarkMode'), 'true');
    assert.match(styles[0].textContent, /html\[data-bs-theme='dark'\] \{ background: var\(--mono-white, var\(--bs-body-bg, #1a1a1a\)\) !important; color-scheme: dark;/);
    assert.doesNotMatch(styles[0].textContent, /opacity: 0 !important/);
    scope.ApplyContestWebTheme();
    assert.equal(styles.length, 1);
});

test('explicit light overrides the system and auto follows system changes', () => {
    const {scope, storage, attributes} = context();
    storage.set('UserScript-Setting-Theme', 'light');
    assert.equal(scope.ApplyContestWebTheme(), false);
    assert.equal(attributes.get('data-bs-theme'), 'light');
    storage.set('UserScript-Setting-Theme', 'auto');
    assert.equal(scope.ApplyContestWebTheme(), true);
    scope.window.matchMedia = () => ({matches: false});
    assert.equal(scope.ApplyContestWebTheme(), false);
});

test('dark mode works with both skin settings disabled and never requests Bootstrap 5', () => {
    const {scope, storage, styles} = context();
    storage.set('UserScript-Setting-NewBootstrap', 'false');
    storage.set('UserScript-Setting-MonochromeUI', 'false');
    assert.equal(scope.ApplyContestWebTheme(), true);
    assert.doesNotMatch(styles[0].textContent, /--mono-black:/);
    assert.match(styles[0].textContent, /background: #1a1a1a !important/);
});

test('redirects the old contest pages to the /web app and leaves other pages alone', () => {
    const {scope} = context();
    const site = 'https://www.xmoj.tech';
    for (const [from, to] of [
        ['/contest.php', '/web/contest'],
        ['/contest.php?page=3', '/web/contest?page=3'],
        ['/contest.php?cid=9979', '/web/contest/9979'],
        ['/problem.php?cid=9979&pid=0', '/web/contest/9979/A'],
        ['/problem.php?cid=9979&pid=25', '/web/contest/9979/Z'],
        ['/problem_std.php?cid=9979&pid=1', '/web/contest/9979/B/std'],
        ['/problem_solution.php?cid=9979&pid=2', '/web/contest/9979/C/solution'],
        ['/contestrank-correct.php?cid=9979', '/web/contest/9979/rank-correct'],
        ['/contestrank-correct.php?cid=9979&user_id=a b', '/web/contest/9979/rank-correct?user_id=a%20b']
    ]) {
        assert.equal(scope.GetContestWebRedirect(site + from), site + to, from);
    }
    for (const url of [
        '/problem.php?id=1000', '/problem.php?cid=9979', '/problem.php?cid=9979&pid=26', '/problem.php?cid=abc&pid=0',
        '/contest.php?cid=x', '/contestrank-correct.php', '/contestrank-oi.php?cid=9979', '/submitpage.php?cid=9979&pid=0',
        '/status.php?cid=9979', '/problem_solution.php?id=1000', '/web/contest/9979'
    ]) {
        assert.equal(scope.GetContestWebRedirect(site + url), null, url);
    }
});

test('with NewBootstrap and without MonochromeUI, only the app-specific rules are added', () => {
    const {scope, storage, styles} = context();
    storage.set('UserScript-Setting-NewBootstrap', 'true');
    storage.set('UserScript-Setting-MonochromeUI', 'false');
    storage.set('UserScript-Setting-Theme', 'light');
    assert.equal(scope.ApplyContestWebTheme(), false);
    const css = styles[0].textContent;
    // The skins come from the early block; the /web style only maps the app's markup.
    assert.match(css, /#app \.navbar-header \{ display: flex;/);
    assert.match(css, /html\[data-bs-theme='light'\] \{ background: var\(--mono-white, var\(--bs-body-bg, #fff\)\)/);
    assert.doesNotMatch(css, /--mono-black:/);
    assert.doesNotMatch(css, /\[data-bs-theme='dark'\] #app \.btn \{/);
});

test('the load-time hide keeps innerText readable for the page handlers', () => {
    // innerText skips text under visibility: hidden, which emptied the status.php scores.
    const hide = between('_foucStyle = document.createElement("style");', 'head.appendChild(_foucStyle);');
    assert.match(hide, /body \{ opacity: 0 !important; \}/);
    assert.doesNotMatch(hide, /visibility/);
});

test('web and classic pages load the same monochrome fonts before either Bootstrap path', () => {
    const early = between('function GetAccountSettingsRedirect(', 'function InitializeAccountFeatures(') +
        between('// Set to true by the early block', 'const CaptchaSiteKey');
    const fontURLs = new Set();
    for (const pathname of ['/web/contest', '/problem.php?id=1000']) {
        for (const cachedBootstrap of [false, true]) {
            for (const headReady of [false, true]) {
                const errors = [];
                const {scope, styles} = context({
                    location: new URL('https://www.xmoj.tech' + pathname),
                    GM_getResourceText: () => cachedBootstrap ? 'body { color: black; }' : '',
                    MutationObserver: class { observe() {} },
                    console: {error: (...args) => errors.push(args)}
                });
                if (headReady) scope.document.head = {appendChild: node => styles.push(node)};
                scope.document.querySelectorAll = () => [];
                vm.runInContext(early, scope);
                const fonts = styles.filter(node => node.id === 'xmoj-monochrome-fonts');
                assert.equal(fonts.length, 1, pathname + ': font loading must not depend on the Bootstrap cache or head readiness');
                assert.equal(fonts[0].rel, 'stylesheet');
                fontURLs.add(fonts[0].href);
                scope.LoadMonochromeFonts();
                scope.LoadMonochromeFonts();
                assert.equal(styles.filter(node => node.id === 'xmoj-monochrome-fonts').length, 1, 'late initializers must reuse the early font link');
                assert.deepEqual(errors, []);
            }
        }
    }
    assert.equal(fontURLs.size, 1);
    const url = [...fontURLs][0];
    assert.match(url, /Source\+Serif\+4/);
    assert.match(url, /Playfair\+Display/);
    assert.match(url, /JetBrains\+Mono/);
    for (const disabled of ['NewBootstrap', 'MonochromeUI']) {
        const {scope, storage, styles} = context({
            GM_getResourceText: () => '',
            location: new URL('https://www.xmoj.tech/web/contest')
        });
        storage.set('UserScript-Setting-' + disabled, 'false');
        vm.runInContext(early, scope);
        assert.equal(styles.filter(node => node.id === 'xmoj-monochrome-fonts').length, 0, 'do not load fonts for a disabled skin');
    }
});
