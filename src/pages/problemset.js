import { UtilityEnabled } from '../utils.js';

export function handleProblemsetPage() {
    if (UtilityEnabled("Translate")) {
        document.querySelector("body > div > div.mt-3 > center > table:nth-child(2) > tbody > tr > td:nth-child(2) > form > input").placeholder = "题目编号";
        document.querySelector("body > div > div.mt-3 > center > table:nth-child(2) > tbody > tr > td:nth-child(2) > form > button").innerText = "确认";
        document.querySelector("body > div > div.mt-3 > center > table:nth-child(2) > tbody > tr > td:nth-child(3) > form > input").placeholder = "标题或内容";
        document.querySelector("#problemset > thead > tr > th:nth-child(1)").innerText = "状态";
    }
    if (UtilityEnabled("ResetType")) {
        document.querySelector("#problemset > thead > tr > th:nth-child(1)").style.width = "5%";
        document.querySelector("#problemset > thead > tr > th:nth-child(2)").style.width = "10%";
        document.querySelector("#problemset > thead > tr > th:nth-child(3)").style.width = "75%";
        document.querySelector("#problemset > thead > tr > th:nth-child(4)").style.width = "5%";
        document.querySelector("#problemset > thead > tr > th:nth-child(5)").style.width = "5%";
    }
    document.querySelector("body > div > div.mt-3 > center > table:nth-child(2)").outerHTML = `
<div class="row">
<div class="center col-md-3"></div>
<div class="col-md-2">
    <form action="problem.php" class="input-group">
        <input class="form-control" type="number" name="id" placeholder="题目编号" min="0">
        <button class="btn btn-outline-secondary" type="submit">跳转</button>
    </form>
</div>
<div class="col-md-4">
    <form action="problemset.php" class="input-group">
        <input class="form-control" type="text" name="search" placeholder="标题或内容">
        <button class="btn btn-outline-secondary" type="submit">查找</button>
    </form>
</div>
</div>`;
    const SearchParams = new URLSearchParams(location.search);
    if (SearchParams.get("search") != null) {
        document.querySelector("body > div > div.mt-3 > center > div > div:nth-child(3) > form > input").value = SearchParams.get("search");
    }

    let Temp = document.querySelector("#problemset").rows;
    for (let i = 1; i < Temp.length; i++) {
        localStorage.setItem("UserScript-Problem-" + Temp[i].children[1].innerText + "-Name", Temp[i].children[2].innerText);
    }
}
