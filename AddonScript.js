console.log(GM_info.script.version); //small test
if (localStorage.getItem("UserScript-2024newyear") == null) {
    let InputValue = prompt("小明的OJ增强脚本开发组祝您新年快乐！输入2024确认");
    if (InputValue != "2024") {
        alert("小明的OJ增强脚本开发组祝您新年快乐！");
        window.location.href = "https://www.seanoj.edu.eu.org/#Install";
    }
    else {
        localStorage.setItem("UserScript-2024newyear", "true")
    }
}
