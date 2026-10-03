const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const source = fs.readFileSync(path.join(__dirname, '../XMOJ.user.js'), 'utf8');
const fixture = fs.readFileSync(path.join(__dirname, 'markdown-copy.html'), 'utf8');

// Uses the same browser fixture as the manual checks, with no external requests.
async function RunFixture(browser, script) {
    const page = await browser.newPage();
    try {
        await page.route('https://markdown-copy.test/**', route => {
            const pathname = new URL(route.request().url()).pathname;
            if (pathname === '/tests/markdown-copy.html') {
                return route.fulfill({contentType: 'text/html', body: fixture});
            }
            if (pathname === '/XMOJ.user.js') {
                return route.fulfill({contentType: 'text/javascript', body: script});
            }
            return route.fulfill({status: 404, body: ''});
        });
        await page.goto('https://markdown-copy.test/tests/markdown-copy.html');
        await page.waitForFunction(() => window.markdownCopyResults);
        return await page.evaluate(() => window.markdownCopyResults);
    } finally {
        await page.close();
    }
}

test('Markdown copy browser regressions', {timeout: 60000}, async t => {
    // XMOJ_CHROMIUM also lets developers reuse the browser from the live harness.
    const browser = await chromium.launch({executablePath: process.env.XMOJ_CHROMIUM || undefined});
    try {
        await t.test('preserves math and formatting without changing the DOM', async () => {
            const result = await RunFixture(browser, source);
            assert.equal(result.error, undefined, result.error);
            assert.ok(result.passed >= 16);
            assert.equal(result.passed, result.tests.length);
            t.diagnostic(result.tests.join(', '));
        });
        for (const anchor of ['function GetMDText(', 'function InitializeImageEnlarger(']) {
            await t.test('reports a missing extraction anchor: ' + anchor, async () => {
                const result = await RunFixture(browser, source.replace(anchor, 'function MissingAnchor('));
                assert.match(result.error, /Cannot locate a unique GetMDText function/);
                assert.equal(result.passed, 0);
            });
        }
        await t.test('reports duplicate extraction anchors', async () => {
            const result = await RunFixture(browser, source + '\nfunction GetMDText() {}');
            assert.match(result.error, /Cannot locate a unique GetMDText function/);
            assert.equal(result.passed, 0);
        });
    } finally {
        await browser.close();
    }
});
