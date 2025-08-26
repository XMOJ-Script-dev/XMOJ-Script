import { UtilityEnabled, GetUsernameHTML, TidyTable } from '../utils.js';

export async function handleContestRankCorrectPage() {
    let Style = document.createElement("style");
    document.body.appendChild(Style);
    if (document.querySelector("#rank") == null) {
        document.querySelector("body > div > div.mt-3").innerHTML = "<center><h3>比赛排名</h3><a></a><table id=\"rank\"></table>";
    }
    if (document.querySelector("body > div > div.mt-3 > center > h3").innerText == "比赛排名") {
        document.querySelector("#rank").innerText = "比赛暂时还没有排名";
    } else {
        if (UtilityEnabled("ResetType")) {
            document.querySelector("body > div > div.mt-3 > center > h3").innerText = document.querySelector("body > div > div.mt-3 > center > h3").innerText.substring(document.querySelector("body > div > div.mt-3 > center > h3").innerText.indexOf(" -- ") + 4) + "（订正排名）";
            document.querySelector("body > div > div.mt-3 > center > a").remove();
        }
        document.querySelector("#rank > thead > tr > :nth-child(1)").innerText = "排名";
        document.querySelector("#rank > thead > tr > :nth-child(2)").innerText = "用户";
        document.querySelector("#rank > thead > tr > :nth-child(3)").innerText = "昵称";
        document.querySelector("#rank > thead > tr > :nth-child(4)").innerText = "AC数";
        document.querySelector("#rank > thead > tr > :nth-child(5)").innerText = "得分";
        let RefreshCorrectRank = async () => {
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
                                ErrorCount = (Blue == 170 ? "4+" : (Blue - 51) / 32);
                            } else {
                                ErrorCount = (Blue == 22 ? "14+" : (170 - Blue) / 10);
                            }
                            if (NoData) {
                                BackgroundColor = "";
                            } else if (FirstBlood) {
                                BackgroundColor = "rgba(127, 127, 255, 0.5)";
                            } else if (Solved) {
                                BackgroundColor = "rgba(0, 255, 0, 0.5)";
                                if (ErrorCount != 0) {
                                    InnerText += " (" + ErrorCount + ")";
                                }
                            } else {
                                BackgroundColor = "rgba(255, 0, 0, 0.5)";
                                if (ErrorCount != 0) {
                                    InnerText += " (" + ErrorCount + ")";
                                }
                            }
                            Temp[i].cells[j].innerHTML = InnerText;
                            Temp[i].cells[j].style.backgroundColor = BackgroundColor;
                        }
                    }
                    document.querySelector("#rank > tbody").innerHTML = ParsedDocument.querySelector("#rank > tbody").innerHTML;
                });
        };
        RefreshCorrectRank();
        document.title = document.querySelector("body > div.container > div > center > h3").innerText;
        if (UtilityEnabled("AutoRefresh")) {
            addEventListener("focus", RefreshCorrectRank);
        }
    }
}
