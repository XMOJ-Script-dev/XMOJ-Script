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
            const overlayBeforeDetachedResize = document.getElementById('blur-overlay').style.cssText;
            firstNavbar.outerHTML = '<nav class="navbar navbar-expand-lg bg-body-tertiary container" style="height:80px;position:relative!important;opacity:0.9;margin:1px 2px 3px 4px;border-radius:1px 2px 3px 4px">Vue replacement</nav>';
            window.dispatchEvent(new Event('resize'));
            const detachedResizePreservedOverlay = document.getElementById('blur-overlay').style.cssText === overlayBeforeDetachedResize;
            for (let i = 0; i < 2000; i++) UpdateNavbarStyler();
            counts.push(window.resizeListeners.size);
            const removedOldListener = !window.resizeListeners.has(originalListener);
            const navbar = document.querySelector('nav');
            navbar.style.height = '96px';
            navbar.style.color = 'red';
            navbar.classList.add('page-added');
            window.dispatchEvent(new Event('resize'));
            const overlayHeightAfterResize = document.getElementById('blur-overlay').style.height;
            UpdateNavbarStyler();
            const spacerHeight = document.getElementById('navbar-spacer').style.height;
            const overlayCount = document.querySelectorAll('#blur-overlay').length;
            const spacerCount = document.querySelectorAll('#navbar-spacer').length;
            window.topBarEnabled = false;
            UpdateNavbarStyler();
            counts.push(window.resizeListeners.size);
            const disabled = {
                artifacts: document.querySelectorAll('#blur-overlay, #navbar-spacer').length,
                styles: document.head.querySelectorAll('style').length,
                fixedTop: navbar.classList.contains('fixed-top'),
                container: navbar.classList.contains('container'),
                pageClass: navbar.classList.contains('page-added'),
                position: navbar.style.position,
                positionPriority: navbar.style.getPropertyPriority('position'),
                margin: navbar.style.margin,
                borderRadius: navbar.style.borderRadius,
                opacity: navbar.style.opacity,
                color: navbar.style.color,
                height: navbar.style.height
            };
            window.topBarEnabled = true;
            UpdateNavbarStyler();
            counts.push(window.resizeListeners.size);
            navbar.remove();
            window.dispatchEvent(new Event('resize'));
            UpdateNavbarStyler();
            counts.push(window.resizeListeners.size);
            const retainedNavbar = navbarStyler !== null;
            const artifactsAfterRemoval = document.querySelectorAll('#blur-overlay, #navbar-spacer').length;
            document.body.innerHTML = '<nav class="navbar navbar-expand-lg bg-body-tertiary" style="height:48px">Navbar</nav><div id="blur-overlay" style="top:2px!important;left:3px;width:11px;height:12px"></div><div id="navbar-spacer" style="height:9px!important;width:17px"></div>';
            const pageOverlay = document.getElementById('blur-overlay');
            const pageSpacer = document.getElementById('navbar-spacer');
            UpdateNavbarStyler();
            const pageSpacerReused = document.getElementById('navbar-spacer') === pageSpacer;
            window.topBarEnabled = false;
            UpdateNavbarStyler();
            const borrowed = {
                overlayPreserved: document.getElementById('blur-overlay') === pageOverlay,
                spacerPreserved: document.getElementById('navbar-spacer') === pageSpacer,
                top: pageOverlay.style.top,
                topPriority: pageOverlay.style.getPropertyPriority('top'),
                left: pageOverlay.style.left,
                width: pageOverlay.style.width,
                height: pageOverlay.style.height,
                spacerHeight: pageSpacer.style.height,
                spacerPriority: pageSpacer.style.getPropertyPriority('height'),
                spacerWidth: pageSpacer.style.width,
                listeners: window.resizeListeners.size
            };
            return {counts, removedOldListener, detachedResizePreservedOverlay, overlayHeightAfterResize, spacerHeight, overlayCount, spacerCount, retainedNavbar, disabled, artifactsAfterRemoval, pageSpacerReused, borrowed};
        });
        assert.deepEqual(result.counts, [1, 1, 0, 1, 0]);
        assert.equal(result.removedOldListener, true);
        assert.equal(result.detachedResizePreservedOverlay, true);
        assert.equal(result.overlayHeightAfterResize, '96px');
        assert.equal(result.spacerHeight, '120px');
        assert.equal(result.overlayCount, 1);
        assert.equal(result.spacerCount, 1);
        assert.equal(result.retainedNavbar, false);
        assert.equal(result.artifactsAfterRemoval, 0);
        assert.deepEqual(result.disabled, {
            artifacts: 0, styles: 0, fixedTop: false, container: true, pageClass: true,
            position: 'relative', positionPriority: 'important', margin: '1px 2px 3px 4px',
            borderRadius: '1px 2px 3px 4px', opacity: '0.9', color: 'red', height: '96px'
        });
        assert.equal(result.pageSpacerReused, true);
        assert.deepEqual(result.borrowed, {
            overlayPreserved: true, spacerPreserved: true,
            top: '2px', topPriority: 'important', left: '3px', width: '11px', height: '12px',
            spacerHeight: '9px', spacerPriority: 'important', spacerWidth: '17px', listeners: 0
        });
        assert.deepEqual(errors, []);
    } finally {
        await browser.close();
    }
});
