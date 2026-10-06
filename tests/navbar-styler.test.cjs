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

test('downloads stay in the page container below the fixed navbar', {timeout: 60000}, async () => {
    const navbarStart = 'let navbarStyler = null;';
    const navbarEnd = '// Wrapped in an async IIFE';
    const downloadsStart = '} else if (location.pathname == "/downloads.php") {';
    const downloadsEnd = '} else if (location.pathname == "/problemstatus.php") {';
    for (const marker of [navbarStart, navbarEnd, downloadsStart, downloadsEnd]) {
        assert.equal(source.split(marker).length - 1, 1, 'expected one extraction marker: ' + marker);
    }
    const navbarSource = source.slice(source.indexOf(navbarStart), source.indexOf(navbarEnd));
    const downloadsSource = source.slice(source.indexOf(downloadsStart) + downloadsStart.length, source.indexOf(downloadsEnd));
    const browser = await chromium.launch({executablePath: process.env.XMOJ_CHROMIUM || undefined});
    const page = await browser.newPage();
    try {
        // Run the real downloads handler without external image requests or login.
        await page.route('**/*', route => route.abort());
        await page.setContent(`<style>
            body { margin: 0; }
            .navbar { height: 64px; }
            .fixed-top { top: 0; left: 0; right: 0; }
            .mt-3 { margin-top: 16px; }
            .software_list { margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); }
            .software_item { list-style: none; min-height: 150px; }
        </style><div id="page-content"><nav class="navbar navbar-expand-lg bg-body-tertiary">Navbar</nav><ul class="software_list"><li>Original download</li></ul></div>`);
        await page.evaluate(() => { window.UtilityEnabled = name => ['NewTopBar', 'NewDownload', 'MonochromeUI'].includes(name); });
        await page.addScriptTag({content: navbarSource + '\nUpdateNavbarStyler();\n' + downloadsSource});
        const before = await page.evaluate(() => {
            const list = document.querySelector('.software_list');
            return {
                inPageContainer: document.getElementById('page-content').contains(list),
                inSpacer: document.getElementById('navbar-spacer').contains(list),
                navbarBottom: document.querySelector('nav').getBoundingClientRect().bottom,
                firstCardTop: list.firstElementChild.getBoundingClientRect().top,
                cards: list.children.length
            };
        });
        assert.equal(before.inPageContainer, true, 'downloads must not be appended to the spacer');
        assert.equal(before.inSpacer, false);
        assert.equal(before.cards, 15);
        assert.ok(before.firstCardTop >= before.navbarBottom, 'the fixed navbar must not cover the first download row');
        const after = await page.evaluate(() => {
            document.querySelector('nav').style.height = '96px';
            UpdateNavbarStyler();
            return {
                navbarBottom: document.querySelector('nav').getBoundingClientRect().bottom,
                firstCardTop: document.querySelector('.software_item').getBoundingClientRect().top
            };
        });
        assert.ok(after.firstCardTop >= after.navbarBottom, 'the spacing must follow navbar height changes');
    } finally {
        await browser.close();
    }
});

test('Chinese navbar glyphs use the same fonts under legacy and web document languages', {timeout: 60000}, async () => {
    const skin = source.match(/const MonochromeSkinCSS = `([\s\S]*?)`;/)[1];
    const font = fs.readFileSync(path.join(__dirname, "fixtures/fonts/source-serif-4-latin.woff2")).toString("base64");
    const browser = await chromium.launch({executablePath: process.env.XMOJ_CHROMIUM || undefined});
    try {
        const rendered = [];
        for (const language of ['en', 'zh-CN']) {
            const page = await browser.newPage();
            // The public legacy page declares en, while /web declares zh-CN. Source
            // Serif 4 has no Chinese glyphs: compare the fonts Chromium actually uses,
            // not just getComputedStyle().fontFamily, which matched before the fix.
            const html = `<html lang="${language}"><head><style>@font-face { font-family: "Source Serif 4"; src: url(data:font/woff2;base64,${font}) format("woff2"); } ${skin}</style></head><body><nav class="navbar"><a class="navbar-brand">小明的OJ</a><ul class="navbar-nav"><li><a class="nav-link">竞赛&amp;作业</a></li></ul><a class="nav-link dropdown-toggle"><span>测试用户</span></a><ul class="dropdown-menu"><li><a class="dropdown-item">我的作业</a></li></ul></nav></body></html>`;
            await page.route("https://navbar-font.test/**", route => route.fulfill({contentType: "text/html; charset=utf-8", body: html}));
            await page.goto("https://navbar-font.test/" + language);
            await page.evaluate(() => document.fonts.ready);
            const session = await page.context().newCDPSession(page);
            await session.send('DOM.enable');
            await session.send('CSS.enable');
            const {root} = await session.send('DOM.getDocument');
            const fonts = {};
            for (const selector of ['.navbar-brand', '.navbar-nav .nav-link', '.dropdown-toggle span', '.dropdown-item']) {
                const {nodeId} = await session.send('DOM.querySelector', {nodeId: root.nodeId, selector});
                const result = await session.send('CSS.getPlatformFontsForNode', {nodeId});
                fonts[selector] = result.fonts.map(font => ({name: font.familyName, glyphs: font.glyphCount})).sort((a, b) => a.name.localeCompare(b.name));
                assert.ok(fonts[selector].length, 'must inspect rendered glyphs: ' + selector);
            }
            assert.ok(fonts[".navbar-brand"].some(font => font.name === "Source Serif 4"), "the Latin webfont must be loaded to exercise Chinese fallback");
            rendered.push(fonts);
            await session.detach();
            await page.close();
        }
        assert.deepEqual(rendered[1], rendered[0], 'document language must not change the navbar Chinese fallback font');
    } finally {
        await browser.close();
    }
});

test('navbar reserves content space before Bootstrap CSS loads and restores its original top', {timeout: 60000}, async () => {
    const start = 'let navbarStyler = null;';
    const end = '// Wrapped in an async IIFE';
    const navbarSource = source.slice(source.indexOf(start), source.indexOf(end));
    const browser = await chromium.launch({executablePath: process.env.XMOJ_CHROMIUM || undefined});
    try {
        for (const width of [375, 1440]) {
            const page = await browser.newPage({viewport: {width, height: 800}});
            for (const mono of [false, true]) {
                // The resource cache can be empty and the CDN fallback can be slow
                // or fail. No .fixed-top rule is available yet in this fixture.
                await page.setContent('<div class="container"><nav class="navbar navbar-expand-lg bg-body-tertiary" style="height:64px">Navbar</nav><main id="content">Page content</main></div>');
                await page.evaluate(mono => { window.UtilityEnabled = name => name === 'MonochromeUI' ? mono : name === 'NewTopBar'; }, mono);
                await page.addScriptTag({content: '{\n' + navbarSource + '\nUpdateNavbarStyler(); window.testStyler = navbarStyler;\n}'});
                const Measure = () => page.evaluate(() => ({
                    navbarTop: document.querySelector('nav').getBoundingClientRect().top,
                    navbarBottom: document.querySelector('nav').getBoundingClientRect().bottom,
                    contentTop: document.getElementById('content').getBoundingClientRect().top
                }));
                const before = await Measure();
                assert.equal(before.navbarTop, mono ? 0 : 16, 'the navbar must anchor to the viewport without Bootstrap');
                assert.ok(before.contentTop >= before.navbarBottom, 'the navbar must not cover content while CSS is unavailable');
                // When Bootstrap finally arrives, the reserved space still works.
                await page.addStyleTag({content: '.fixed-top { position: fixed; top: 0; right: 0; left: 0; }'});
                const after = await Measure();
                assert.ok(after.contentTop >= after.navbarBottom);
                await page.evaluate(() => window.testStyler.destroy());
                assert.equal(await page.locator('nav').evaluate(node => node.style.top), '', 'remove the owned offset on teardown');
            }
            await page.close();
        }
        const page = await browser.newPage();
        await page.setContent('<nav class="navbar navbar-expand-lg bg-body-tertiary" style="height:64px;top:7px!important">Navbar</nav>');
        await page.evaluate(() => { window.UtilityEnabled = () => true; });
        await page.addScriptTag({content: navbarSource + '\nUpdateNavbarStyler(); navbarStyler.destroy();'});
        assert.deepEqual(await page.locator('nav').evaluate(node => [node.style.top, node.style.getPropertyPriority('top')]), ['7px', 'important']);
    } finally {
        await browser.close();
    }
});

test('browser cosmetic filtering does not hide the navbar spacer', {timeout: 60000}, async () => {
    const start = 'let navbarStyler = null;';
    const end = '// Wrapped in an async IIFE';
    const navbarSource = source.slice(source.indexOf(start), source.indexOf(end));
    const browser = await chromium.launch({executablePath: process.env.XMOJ_CHROMIUM || undefined});
    const page = await browser.newPage();
    try {
        // The reporter's video shows this browser-injected cosmetic rule. A block
        // spacer whose inline style begins with these declarations is hidden.
        await page.setContent(`<style>
            body > [style^="display: block; width: 100%; height:"]:empty { display: none !important; }
            body { margin: 0; }
            .navbar { height: 64px; }
            .fixed-top { top: 0; left: 0; right: 0; }
        </style><div id="content"><nav class="navbar navbar-expand-lg bg-body-tertiary">Navbar</nav><main>Page content</main></div>`);
        await page.evaluate(() => { window.UtilityEnabled = () => true; });
        await page.addScriptTag({content: navbarSource + '\nUpdateNavbarStyler();'});
        const Measure = () => page.evaluate(() => {
            const spacer = document.getElementById('navbar-spacer');
            return {
                display: getComputedStyle(spacer).display,
                height: spacer.getBoundingClientRect().height,
                filtered: spacer.matches('body > [style^="display: block; width: 100%; height:"]:empty'),
                navbarBottom: document.querySelector('nav').getBoundingClientRect().bottom,
                contentTop: document.querySelector('main').getBoundingClientRect().top
            };
        });
        for (const height of [64, 96]) {
            await page.evaluate(height => { document.querySelector('nav').style.height = height + 'px'; UpdateNavbarStyler(); }, height);
            const result = await Measure();
            assert.equal(result.display, 'block');
            assert.equal(result.filtered, false, 'our spacer must not match the recorded browser filter');
            assert.equal(result.height, height + 24);
            assert.ok(result.contentTop >= result.navbarBottom, 'the first content must remain below the navbar');
        }
        // Switching navbars releases and recreates the spacer and its stylesheet.
        await page.evaluate(() => {
            document.querySelector('nav').outerHTML = '<nav class="navbar navbar-expand-lg bg-body-tertiary" style="height:48px">Replacement</nav>';
            UpdateNavbarStyler();
        });
        assert.equal((await Measure()).height, 72);
        await page.evaluate(() => { window.UtilityEnabled = () => false; UpdateNavbarStyler(); });
        assert.equal(await page.locator('#navbar-spacer').count(), 0);
        assert.equal(await page.locator('head style').count(), 1, 'remove the owned styles but keep the browser-rule fixture');
        // An existing spacer from an earlier initializer can carry the old inline
        // fingerprint. Borrow it without losing its styles or page-added changes.
        await page.evaluate(() => {
            document.body.innerHTML = '<span id="navbar-spacer" style="display: block; width: 100%; height: 9px;"></span><div id="content"><nav class="navbar navbar-expand-lg bg-body-tertiary" style="height:64px">Navbar</nav><main>Page content</main></div>';
            window.originalSpacer = document.getElementById('navbar-spacer');
            window.UtilityEnabled = () => true;
        });
        assert.equal((await Measure()).display, 'none', 'the old borrowed spacer must reproduce the filter');
        await page.evaluate(() => UpdateNavbarStyler());
        const borrowed = await Measure();
        assert.equal(borrowed.display, 'block');
        assert.equal(borrowed.filtered, false);
        assert.equal(borrowed.height, 88);
        assert.ok(borrowed.contentTop >= borrowed.navbarBottom);
        await page.evaluate(() => {
            document.getElementById('navbar-spacer').style.color = 'red';
            window.UtilityEnabled = () => false;
            UpdateNavbarStyler();
        });
        assert.deepEqual(await page.locator('#navbar-spacer').evaluate(node => ({
            sameNode: node === window.originalSpacer,
            display: node.style.display, width: node.style.width, height: node.style.height,
            color: node.style.color,
            originalOrder: node.getAttribute('style').startsWith('display: block; width: 100%; height:'),
            filteredAgain: getComputedStyle(node).display === 'none'
        })), {sameNode: true, display: 'block', width: '100%', height: '9px', color: 'red', originalOrder: true, filteredAgain: true});
        assert.equal(await page.locator('head style').count(), 1);
    } finally {
        await browser.close();
    }
});
