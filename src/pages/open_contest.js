export function handleOpenContestPage() {
    let Temp = document.querySelector("body > div > div.mt-3 > div > div.col-md-8").children;
    let NewsData = [];
    for (let i = 0; i < Temp.length; i += 2) {
        let Title = Temp[i].children[0].innerText;
        let Time = 0;
        if (Temp[i].children[1] != null) {
            Time = Temp[i].children[1].innerText;
        }
        let Body = Temp[i + 1].innerHTML;
        NewsData.push({"Title": Title, "Time": new Date(Time), "Body": Body});
    }
    document.querySelector("body > div > div.mt-3 > div > div.col-md-8").innerHTML = "";
    for (let i = 0; i < NewsData.length; i++) {
        let NewsRow = document.createElement("div");
        NewsRow.className = "cnt-row";
        let NewsRowHead = document.createElement("div");
        NewsRowHead.className = "cnt-row-head title";
        NewsRowHead.innerText = NewsData[i].Title;
        if (NewsData[i].Time.getTime() != 0) {
            NewsRowHead.innerHTML += "<small class=\"ms-3\">" + NewsData[i].Time.toLocaleDateString() + "</small>";
        }
        NewsRow.appendChild(NewsRowHead);
        let NewsRowBody = document.createElement("div");
        NewsRowBody.className = "cnt-row-body";
        NewsRowBody.innerHTML = NewsData[i].Body;
        NewsRow.appendChild(NewsRowBody);
        document.querySelector("body > div > div.mt-3 > div > div.col-md-8").appendChild(NewsRow);
    }
    let MyContestData = document.querySelector("body > div > div.mt-3 > div > div.col-md-4 > div:nth-child(2)").innerHTML;
    let CountDownData = document.querySelector("#countdown_list").innerHTML;
    document.querySelector("body > div > div.mt-3 > div > div.col-md-4").innerHTML = `<div class="cnt-row">
<div class="cnt-row-head title">我的月赛</div>
<div class="cnt-row-body">${MyContestData}</div>
</div>
<div class="cnt-row">
<div class="cnt-row-head title">倒计时</div>
<div class="cnt-row-body">${CountDownData}</div>
</div>`;
}
