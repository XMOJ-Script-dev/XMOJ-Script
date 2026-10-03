const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const source = fs.readFileSync(path.join(__dirname, '../XMOJ.user.js'), 'utf8');

test('navbar refreshes keep one resize listener and release replaced navbars', {timeout: 60000}, async () => {
    const start = 'let navbarStyler = null;';
    const end = '// Wrapped in an async IIFE';
    for (const marker of [start, end]) {
        assert.equal(source.split(marker).length - 1, 1, 'expected one navbar extraction marker: ' + marker);
    }
    const navbarSource = source.slice(source.indexOf(start), source.indexOf(end));
    const browser = await chromium.launch({executablePath: process.env.XMOJ_CHROMIUM || undefined});
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    try {
        await page.setContent('<nav class="navbar navbar-expand-lg bg-body-tertiary" style="height:48px">Classic navbar</nav>');
        await page.evaluate(() => {
            window.topBarEnabled = true;
            window.UtilityEnabled = name => name === 'NewTopBar' && window.topBarEnabled;
            window.resizeListeners = new Set();
            const add = window.addEventListener;
            const remove = window.removeEventListener;
            window.addEventListener = function(type, listener, options) {
                if (type === 'resize') window.resizeListeners.add(listener);
                return add.call(this, type, listener, options);
            };
            window.removeEventListener = function(type, listener, options) {
                if (type === 'resize') window.resizeListeners.delete(listener);
                return remove.call(this, type, listener, options);
            };
        });
        await page.addScriptTag({content: navbarSource});
        const result = await page.evaluate(() => {
            const counts = [];
            // Simulate sustained polling without waiting for either UI's timer.
            for (let i = 0; i < 2000; i++) UpdateNavbarStyler();
            counts.push(window.resizeListeners.size);
            const originalListener = [...window.resizeListeners][0];
            const firstNavbar = document.querySelector('nav');
            firstNavbar.outerHTML = '<nav class="navbar navbar-expand-lg bg-body-tertiary" style="height:80px">Vue replacement</nav>';
            window.dispatchEvent(new Event('resize'));
            for (let i = 0; i < 2000; i++) UpdateNavbarStyler();
            counts.push(window.resizeListeners.size);
            const removedOldListener = !window.resizeListeners.has(originalListener);
            const navbar = document.querySelector('nav');
            navbar.style.height = '96px';
            window.dispatchEvent(new Event('resize'));
            const overlayHeightAfterResize = document.getElementById('blur-overlay').style.height;
            UpdateNavbarStyler();
            const spacerHeight = document.getElementById('navbar-spacer').style.height;
            const overlayCount = document.querySelectorAll('#blur-overlay').length;
            const spacerCount = document.querySelectorAll('#navbar-spacer').length;
            window.topBarEnabled = false;
            UpdateNavbarStyler();
            counts.push(window.resizeListeners.size);
            window.topBarEnabled = true;
            UpdateNavbarStyler();
            counts.push(window.resizeListeners.size);
            navbar.remove();
            window.dispatchEvent(new Event('resize'));
            UpdateNavbarStyler();
            counts.push(window.resizeListeners.size);
            const retainedNavbar = navbarStyler !== null;
            return {counts, removedOldListener, overlayHeightAfterResize, spacerHeight, overlayCount, spacerCount, retainedNavbar};
        });
        assert.deepEqual(result.counts, [1, 1, 0, 1, 0]);
        assert.equal(result.removedOldListener, true);
        assert.equal(result.overlayHeightAfterResize, '96px');
        assert.equal(result.spacerHeight, '120px');
        assert.equal(result.overlayCount, 1);
        assert.equal(result.spacerCount, 1);
        assert.equal(result.retainedNavbar, false);
        assert.deepEqual(errors, []);
    } finally {
        await browser.close();
    }
});
