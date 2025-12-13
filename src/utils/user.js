/**
 * User information utilities
 */

import { UtilityEnabled } from '../core/config.js';
import { SmartAlert } from './alerts.js';
import { RequestAPI } from './api.js';
import { AdminUserList } from '../core/constants.js';

/**
 * Get user information
 * @param {string} Username - The username
 * @returns {Promise<Object>} User info object with Rating and EmailHash
 */
export let GetUserInfo = async (Username) => {
    try {
        if (localStorage.getItem("UserScript-User-" + Username + "-UserRating") != null && new Date().getTime() - parseInt(localStorage.getItem("UserScript-User-" + Username + "-LastUpdateTime")) < 1000 * 60 * 60 * 24) {
            return {
                "Rating": localStorage.getItem("UserScript-User-" + Username + "-UserRating"),
                "EmailHash": localStorage.getItem("UserScript-User-" + Username + "-EmailHash")
            }
        }
        return await fetch("https://www.xmoj.tech/userinfo.php?user=" + Username).then((Response) => {
            return Response.text();
        }).then((Response) => {
            if (Response.indexOf("No such User!") !== -1) {
                return null;
            }
            const ParsedDocument = new DOMParser().parseFromString(Response, "text/html");
            let Rating = (parseInt(ParsedDocument.querySelector("#statics > tbody > tr:nth-child(4) > td:nth-child(2)").innerText.trim()) / parseInt(ParsedDocument.querySelector("#statics > tbody > tr:nth-child(3) > td:nth-child(2)").innerText.trim())).toFixed(3) * 1000;
            let Temp = ParsedDocument.querySelector("#statics > tbody").children;
            let Email = Temp[Temp.length - 1].children[1].innerText.trim();
            let EmailHash = CryptoJS.MD5(Email).toString();
            localStorage.setItem("UserScript-User-" + Username + "-UserRating", Rating);
            if (Email === "") {
                EmailHash = undefined;
            } else {
                localStorage.setItem("UserScript-User-" + Username + "-EmailHash", EmailHash);
            }
            localStorage.setItem("UserScript-User-" + Username + "-LastUpdateTime", new Date().getTime());
            return {
                "Rating": Rating, "EmailHash": EmailHash
            }
        });
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

/**
 * Retrieves the badge information for a given user.
 *
 * @param {string} Username - The username of the user.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the badge information.
 * @property {string} BackgroundColor - The background color of the badge.
 * @property {string} Color - The color of the badge.
 * @property {string} Content - The content of the badge.
 */
export let GetUserBadge = async (Username) => {
    try {
        if (localStorage.getItem("UserScript-User-" + Username + "-Badge-LastUpdateTime") != null && new Date().getTime() - parseInt(localStorage.getItem("UserScript-User-" + Username + "-Badge-LastUpdateTime")) < 1000 * 60 * 60 * 24) {
            return {
                "BackgroundColor": localStorage.getItem("UserScript-User-" + Username + "-Badge-BackgroundColor"),
                "Color": localStorage.getItem("UserScript-User-" + Username + "-Badge-Color"),
                "Content": localStorage.getItem("UserScript-User-" + Username + "-Badge-Content")
            }
        } else {
            let BackgroundColor = "";
            let Color = "";
            let Content = "";
            await new Promise((Resolve) => {
                RequestAPI("GetBadge", {
                    "UserID": String(Username)
                }, (Response) => {
                    if (Response.Success) {
                        BackgroundColor = Response.Data.BackgroundColor;
                        Color = Response.Data.Color;
                        Content = Response.Data.Content;
                    }
                    Resolve();
                });
            });
            localStorage.setItem("UserScript-User-" + Username + "-Badge-BackgroundColor", BackgroundColor);
            localStorage.setItem("UserScript-User-" + Username + "-Badge-Color", Color);
            localStorage.setItem("UserScript-User-" + Username + "-Badge-Content", Content);
            localStorage.setItem("UserScript-User-" + Username + "-Badge-LastUpdateTime", String(new Date().getTime()));
            return {
                "BackgroundColor": BackgroundColor, "Color": Color, "Content": Content
            }
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};

/**
 * Sets the HTML content of an element to display a username with optional additional information.
 * @param {HTMLElement} Element - The element to set the HTML content.
 * @param {string} Username - The username to display.
 * @param {boolean} [Simple=false] - Indicates whether to display additional information or not.
 * @param {string} [Href="https://www.xmoj.tech/userinfo.php?user="] - The URL to link the username to.
 * @returns {Promise<void>} - A promise that resolves when the HTML content is set.
 */
export let GetUsernameHTML = async (Element, Username, Simple = false, Href = "https://www.xmoj.tech/userinfo.php?user=") => {
    try {
        //Username = Username.replaceAll(/[^a-zA-Z0-9]/g, "");
        let ID = "Username-" + Username + "-" + Math.random();
        Element.id = ID;
        Element.innerHTML = `<div class="spinner-border spinner-border-sm me-2" role="status"></div>`;
        Element.appendChild(document.createTextNode(Username));
        let UserInfo = await GetUserInfo(Username);
        if (UserInfo === null) {
            document.getElementById(ID).innerHTML = "";
            document.getElementById(ID).appendChild(document.createTextNode(Username));
            return;
        }
        let HTMLData = "";
        if (!Simple) {
            HTMLData += `<img src="`;
            if (UserInfo.EmailHash === undefined) {
                HTMLData += `https://cravatar.cn/avatar/00000000000000000000000000000000?d=mp&f=y`;
            } else {
                HTMLData += `https://cravatar.cn/avatar/${UserInfo.EmailHash}?d=retro`;
            }
            HTMLData += `" class="rounded me-2" style="width: 20px; height: 20px; ">`;
        }
        HTMLData += `<a href="${Href}${Username}" class="link-offset-2 link-underline-opacity-50 `
        if (UtilityEnabled("Rating")) {
            let Rating = UserInfo.Rating;
            // if(AdminUserList.includes(Username)){
            //     HTMLData += "link-fuchsia"
            // }
            // else
            if (Rating > 500) {
                HTMLData += "link-danger";
            } else if (Rating >= 400) {
                HTMLData += "link-warning";
            } else if (Rating >= 300) {
                HTMLData += "link-success";
            } else {
                HTMLData += "link-info";
            }
        } else {
            HTMLData += "link-info";
        }
        HTMLData += `"></a>`;
        if (!Simple) {
            if (AdminUserList.includes(Username)) {
                HTMLData += `<span class="badge text-bg-danger ms-2">脚本管理员</span>`;
            }
            let BadgeInfo = await GetUserBadge(Username);
            if (BadgeInfo.Content !== "") {
                HTMLData += `<span class="badge ms-2" style="background-color: ${BadgeInfo.BackgroundColor}; color: ${BadgeInfo.Color}">${BadgeInfo.Content}</span>`;
            }
        }
        if (document.getElementById(ID) !== null) {
            document.getElementById(ID).innerHTML = HTMLData;
            document.getElementById(ID).getElementsByTagName("a")[0].appendChild(document.createTextNode(Username));
        }
    } catch (e) {
        console.error(e);
        if (UtilityEnabled("DebugMode")) {
            SmartAlert("XMOJ-Script internal error!\n\n" + e + "\n\n" + "If you see this message, please report it to the developer.\nDon't forget to include console logs and a way to reproduce the error!\n\nDon't want to see this message? Disable DebugMode.");
        }
    }
};
