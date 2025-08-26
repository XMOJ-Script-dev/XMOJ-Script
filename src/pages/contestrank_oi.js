import { UtilityEnabled, GetUsernameHTML, TidyTable } from '../utils.js';

export async function handleContestRankOIPage() {
    const SearchParams = new URLSearchParams(location.search);
    let Style = document.createElement("style");
    document.body.appendChild(Style);
    if (document.querySelector("#rank") == null) {
        document.querySelector("body > div > div.mt-3").innerHTML = "<center><h3>比赛排名</h3><a></a><table id=\"rank\"></table>";
    }
    if (SearchParams.get("ByUserScript") == null) {
        if (document.querySelector("body > div > div.mt-3 > center > h3").innerText == "比赛排名") {
            document.querySelector("#rank").innerText = "比赛暂时还没有排名";
        } else {
            document.querySelector("body > div > div.mt-3 > center > h3").innerText = document.querySelector("body > div > div.mt-3 > center > h3").innerText.substring(document.querySelector("body > div > div.mt-3 > center > h3").innerText.indexOf(" -- ") + 4) + "（OI排名）";
            document.querySelector("#rank > thead > tr > :nth-child(1)").innerText = "排名";
            document.querySelector("#rank > thead > tr > :nth-child(2)").innerText = "用户";
            document.querySelector("#rank > thead > tr > :nth-child(3)").innerText = "昵称";
            document.querySelector("#rank > thead > tr > :nth-child(4)").innerText = "AC数";
            document.querySelector("#rank > thead > tr > :nth-child(5)").innerText = "得分";
            let RefreshOIRank = async () => {
                await fetch(location.href)
                    .then((Response) => {
                        return Response.text()
                    })
                    .then(async (Response) => {
                        let ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
                        TidyTable(ParsedDocument.getElementById("rank"));
                        let Temp = ParsedDocument.getElementById("rank").rows;
                        for (var i = 1; i < Temp.length; i++) {
                            let MetalCell = Temp[i].cells[0];
                            let Metal = document.createElement("span");
                            Metal.innerText = MetalCell.innerText;
                            Metal.className = "badge text-bg-primary";
                            MetalCell.innerText = "";
                            MetalCell.appendChild(Metal);
                            GetUsernameHTML(Temp[i].cells[1], Temp[i].cells[1].innerText);
                            Temp[i].cells[2].innerHTML = Temp[i].cells[2].innerText;
                            Temp[i].cells[3].innerHTML = Temp[i].cells[3].innerText;
                            for (let j = 5; j < Temp[i].cells.length; j++) {
                                let InnerText = Temp[i].cells[j].innerText;
                                let BackgroundColor = Temp[i].cells[j].style.backgroundColor;
                                let Red = BackgroundColor.substring(4, BackgroundColor.indexOf(","));
                                let Green = BackgroundColor.substring(BackgroundColor.indexOf(",") + 2, BackgroundColor.lastIndexOf(","));
                                let Blue = BackgroundColor.substring(BackgroundColor.lastIndexOf(",") + 2, BackgroundColor.lastIndexOf(")"));
                                let NoData = (Red == 238 && Green == 238 && Blue == 238);
                                let FirstBlood = (Red == 170 && Green == 170 && Blue == 255);
                                let Solved = (Green == 255);
                                let ErrorCount = "";
                                if (Solved) {
                                    ErrorCount = (Blue == 170 ? 5 : (Blue - 51) / 32);
                                } else {
                                    ErrorCount = (Blue == 22 ? 15 : (170 - Blue) / 10);
                                }
                                if (NoData) {
                                    BackgroundColor = "";
                                } else if (FirstBlood) {
                                    BackgroundColor = "rgb(127, 127, 255)";
                                } else if (Solved) {
                                    BackgroundColor = "rgb(0, 255, 0, " + Math.max(1 / 10 * (10 - ErrorCount), 0.2) + ")";
                                    if (ErrorCount != 0) {
                                        InnerText += " (" + (ErrorCount == 5 ? "4+" : ErrorCount) + ")";
                                    }
                                } else {
                                    BackgroundColor = "rgba(255, 0, 0, " + Math.min(ErrorCount / 10 + 0.2, 1) + ")";
                                    if (ErrorCount != 0) {
                                        InnerText += " (" + (ErrorCount == 15 ? "14+" : ErrorCount) + ")";
                                    }
                                }
                                Temp[i].cells[j].innerHTML = InnerText;
                                Temp[i].cells[j].style.backgroundColor = BackgroundColor;
                                Temp[i].cells[j].style.color = (UtilityEnabled("DarkMode") ? "white" : "black");
                            }
                        }
                        document.querySelector("#rank > tbody").innerHTML = ParsedDocument.querySelector("#rank > tbody").innerHTML;
                    });
            };
            RefreshOIRank();
            document.title = document.querySelector("body > div.container > div > center > h3").innerText;
            if (UtilityEnabled("AutoRefresh")) {
                addEventListener("focus", RefreshOIRank);
            }
        }
    }
    Style.innerHTML += "td {";
    Style.innerHTML += "   white-space: nowrap;";
    Style.innerHTML += "}";
    document.querySelector("body > div.container > div > center").style.paddingBottom = "10px";
    document.querySelector("body > div.container > div > center > a").style.display = "none";
    document.title = document.querySelector("body > div.container > div > center > h3").innerText;
}
