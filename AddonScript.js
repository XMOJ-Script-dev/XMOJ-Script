console.log(GM_info.script.version);
if (localStorage.getItem("UserScript-domainchange202407") == null) {
    let InputValue = prompt("脚本发生API重大更新，请现在立刻更新脚本！输入“我已知晓”关闭 \nPowered by xmoj-script version " + GM_info.script.version);
    if (InputValue != "2024") {
        alert("脚本发生API重大更新，请现在立刻更新脚本！输入“我已知晓”关闭");
        window.location.href = "https://xmoj-bbs.me/#Install";
    }
    else {
        localStorage.setItem("UserScript-domainchange202407", "true")
        window.location.href = "https://xmoj-bbs.me/#Install";
    }
}
