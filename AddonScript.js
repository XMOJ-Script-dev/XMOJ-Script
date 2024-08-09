if (localStorage.getItem("UserScript-handin-alert") == null) {
    let InputValue = prompt("请勿滥用脚本的提交功能！参与模拟赛时请自觉！发生问题，脚本开发组概不负责");
    if (InputValue != "2024") {
        alert("请勿滥用脚本的提交功能！参与模拟赛时请自觉！发生问题，脚本开发组概不负责");
    }
    else {
        localStorage.setItem("UserScript-handin-alert", "true")
    }
}
