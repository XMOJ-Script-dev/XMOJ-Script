import { UtilityEnabled, SmartAlert } from './utils';

export class NavbarStyler {
    constructor() {
        try {
            this.navbar = document.querySelector('.navbar.navbar-expand-lg.bg-body-tertiary');
            if (this.navbar && UtilityEnabled("NewTopBar")) {
                this.init();
            }
        } catch (e) {
            console.error(e);
            if (UtilityEnabled("DebugMode")) {
                SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
            }
        }
    }

    init() {
        try {
            this.applyStyles();
            this.createOverlay();
            this.createSpacer();
            window.addEventListener('resize', () => this.updateBlurOverlay());
            this.updateBlurOverlay();
        } catch (e) {
            console.error(e);
            if (UtilityEnabled("DebugMode")) {
                SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
            }
        }
    }

    applyStyles() {
        try {
            let n = this.navbar;
            n.classList.add('fixed-top', 'container', 'ml-auto');
            Object.assign(n.style, {
                position: 'fixed',
                borderRadius: '28px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
                margin: '16px auto',
                backgroundColor: 'rgba(255, 255, 255, 0)',
                opacity: '0.75',
                zIndex: '1000'
            });
        } catch (e) {
            console.error(e);
            if (UtilityEnabled("DebugMode")) {
                SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
            }
        }
    }

    createOverlay() {
        try {
            if (!document.getElementById('blur-overlay')) {
                let overlay = document.createElement('div');
                overlay.id = 'blur-overlay';
                document.body.appendChild(overlay);

                let style = document.createElement('style');
                style.textContent = `
                #blur-overlay {
                    position: fixed;
                    backdrop-filter: blur(4px);
                    z-index: 999;
                    pointer-events: none;
                    border-radius: 28px;
                }
            `;
                document.head.appendChild(style);
            }
        } catch (e) {
            console.error(e);
            if (UtilityEnabled("DebugMode")) {
                SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
            }
        }
    }

    updateBlurOverlay() {
        try {
            let overlay = document.getElementById('blur-overlay');
            let n = this.navbar;
            Object.assign(overlay.style, {
                top: `${n.offsetTop}px`,
                left: `${n.offsetLeft}px`,
                width: `${n.offsetWidth}px`,
                height: `${n.offsetHeight}px`
            });
        } catch (e) {
            console.error(e);
            if (UtilityEnabled("DebugMode")) {
                SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
            }
        }
    }

    createSpacer() {
        try {
            let spacer = document.getElementById('navbar-spacer');
            let newHeight = this.navbar.offsetHeight + 24;
            if (!spacer) {
                spacer = document.createElement('div');
                spacer.id = 'navbar-spacer';
                spacer.style.height = `${newHeight}px`;
                spacer.style.width = '100%';
                document.body.insertBefore(spacer, document.body.firstChild);
            } else {
                let currentHeight = parseInt(spacer.style.height, 10);
                if (currentHeight !== newHeight) {
                    document.body.removeChild(spacer);
                    spacer = document.createElement('div');
                    spacer.id = 'navbar-spacer';
                    spacer.style.height = `${newHeight}px`;
                    spacer.style.width = '100%';
                    document.body.insertBefore(spacer, document.body.firstChild);
                }
            }
        } catch (e) {
            console.error(e);
            if (UtilityEnabled("DebugMode")) {
                SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
            }
        }
    }
}

export function replaceMarkdownImages(text, string) {
    return text.replace(/!\[.*?\]\(.*?\)/g, string);
}
