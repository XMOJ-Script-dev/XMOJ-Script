/**
 * Menu command registrations
 */

/**
 * Register Greasemonkey menu commands
 */
export function registerMenuCommands() {
    GM_registerMenuCommand("清除缓存", () => {
        let Temp = [];
        for (let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).startsWith("UserScript-User-")) {
                Temp.push(localStorage.key(i));
            }
        }
        for (let i = 0; i < Temp.length; i++) {
            localStorage.removeItem(Temp[i]);
        }
        location.reload();
    });

    GM_registerMenuCommand("重置数据", () => {
        if (confirm("确定要重置数据吗？")) {
            localStorage.clear();
            location.reload();
        }
    });
}
