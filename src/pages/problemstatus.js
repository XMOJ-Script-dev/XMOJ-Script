import { GetUsernameHTML } from '../utils.js';

export function handleProblemStatusPage() {
    const SearchParams = new URLSearchParams(location.search);
    document.querySelector("body > div > div.mt-3 > center").insertBefore(document.querySelector("#statics"), document.querySelector("body > div > div.mt-3 > center > table"));
    document.querySelector("body > div > div.mt-3 > center").insertBefore(document.querySelector("#problemstatus"), document.querySelector("body > div > div.mt-3 > center > table"));

    document.querySelector("body > div > div.mt-3 > center > table:nth-child(3)").remove();
    let Temp = document.querySelector("#statics").rows;
    for (let i = 0; i < Temp.length; i++) {
        Temp[i].removeAttribute("class");
    }

    document.querySelector("#problemstatus > thead > tr").innerHTML = document.querySelector("#problemstatus > thead > tr").innerHTML.replaceAll("td", "th");
    document.querySelector("#problemstatus > thead > tr > th:nth-child(2)").innerText = "运行编号";
    document.querySelector("#problemstatus > thead > tr > th:nth-child(4)").remove();
    document.querySelector("#problemstatus > thead > tr > th:nth-child(4)").remove();
    document.querySelector("#problemstatus > thead > tr > th:nth-child(4)").remove();
    document.querySelector("#problemstatus > thead > tr > th:nth-child(4)").remove();
    Temp = document.querySelector("#problemstatus > thead > tr").children;
    for (let i = 0; i < Temp.length; i++) {
        Temp[i].removeAttribute("class");
    }
    Temp = document.querySelector("#problemstatus > tbody").children;
    for (let i = 0; i < Temp.length; i++) {
        if (Temp[i].children[5].children[0] != null) {
            Temp[i].children[1].innerHTML = `<a href="${Temp[i].children[5].children[0].href}">${escapeHTML(Temp[i].children[1].innerText.trim())}</a>`;
        }
        GetUsernameHTML(Temp[i].children[2], Temp[i].children[2].innerText);
        Temp[i].children[3].remove();
        Temp[i].children[3].remove();
        Temp[i].children[3].remove();
        Temp[i].children[3].remove();
    }


    let CurrentPage = parseInt(SearchParams.get("page") || 0);
    let PID = Number(SearchParams.get("id"));
    document.title = "问题 " + PID + " 状态";
    let Pagination = `<nav class="center"><ul class="pagination justify-content-center">`;
    if (CurrentPage !== 0) {
        Pagination += `<li class="page-item"><a href="https://www.xmoj.tech/problemstatus.php?id=${PID + `&page=0" class="page-link">&laquo;</a></li><li class="page-item"><a href="https://www.xmoj.tech/problemstatus.php?id=` + PID + `&page=` + (CurrentPage - 1) + `" class="page-link">` + (CurrentPage)}</a></li>`;
    }
    Pagination += `<li class="active page-item"><a href="https://www.xmoj.tech/problemstatus.php?id=${PID + `&page=` + CurrentPage + `" class="page-link">` + (CurrentPage + 1)}</a></li>`;
    if (document.querySelector("#problemstatus > tbody").children != null && document.querySelector("#problemstatus > tbody").children.length == 20) {
        Pagination += `<li class="page-item"><a href="https://www.xmoj.tech/problemstatus.php?id=${PID + `&page=` + (CurrentPage + 1) + `" class="page-link">` + (CurrentPage + 2) + `</a></li><li class="page-item"><a href="https://www.xmoj.tech/problemstatus.php?id=` + PID + `&page=` + (CurrentPage + 1)}" class="page-link">&raquo;</a></li>`;
    }
    Pagination += `</ul></nav>`;
    document.querySelector("body > div > div.mt-3 > center").innerHTML += Pagination;
}
