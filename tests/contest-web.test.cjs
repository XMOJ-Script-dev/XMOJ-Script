const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../XMOJ.user.js'), 'utf8');
const helpers = source.slice(source.indexOf('function IsContestWebApp('), source.indexOf('const MonochromeSkinCSS'));
const skins = source.slice(source.indexOf('const MonochromeSkinCSS'), source.indexOf('// Set to true by the early block'));
const theme = source.slice(source.indexOf('function ApplyContestWebTheme('), source.indexOf('// Enhancements for the Vue contest app.'));

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
    assert.deepEqual(JSON.parse(storage.get('UserScript-Contest-123-ProblemList')), [
        {title: '<Title>', url: 'https://www.xmoj.tech/web/contest/123/C'},
        {title: 'First', url: 'https://www.xmoj.tech/web/contest/123/A'}
    ]);
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
    assert.match(styles[0].textContent, /html\[data-bs-theme='dark'\] \{ background: #1a1a1a !important; color-scheme: dark;/);
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
