/**
 * Login Page Module
 * Handles all styling and functionality for /loginpage.php
 */

import { UtilityEnabled } from '../core/config.js';
import { storeCredential, clearCredential } from '../utils/credentials.js';

/**
 * Initialize login page
 * @param {Object} context - Page context with utilities
 */
export async function init(context) {
    // Replace login form with Bootstrap-styled version
    if (UtilityEnabled("NewBootstrap")) {
        replaceLoginForm();
    }

    // Attach login button handler
    attachLoginHandler();
}

/**
 * Replace login form with modern Bootstrap styling
 */
function replaceLoginForm() {
    try {
        const loginForm = document.querySelector("#login");
        if (!loginForm) return;

        loginForm.innerHTML = `<form id="login" action="login.php" method="post">
            <div class="row g-3 align-items-center mb-3">
                <div class="col-auto">
                    <label for="user_id" class="col-form-label">用户名（学号）</label>
                </div>
                <div class="col-auto">
                    <input type="text" id="user_id" name="user_id" class="form-control">
                </div>
            </div>
            <div class="row g-3 align-items-center mb-3">
                <div class="col-auto">
                    <label for="password" class="col-form-label">密码</label>
                </div>
                <div class="col-auto">
                    <input type="password" id="password" name="password" class="form-control">
                </div>
            </div>
            <div class="row g-3 align-items-center mb-3">
                <div class="col-auto">
                    <button name="submit" type="button" class="btn btn-primary">登录</button>
                </div>
                <div class="col-auto">
                    <a class="btn btn-warning" href="https://www.xmoj.tech/lostpassword.php">忘记密码</a>
                </div>
            </div>
        </form>`;
    } catch (error) {
        console.error('[Login] Error replacing login form:', error);
    }
}

/**
 * Attach login button click handler
 */
function attachLoginHandler() {
    try {
        // Add error message div
        const errorText = document.createElement("div");
        errorText.style.color = "red";
        errorText.style.marginBottom = "5px";
        const loginForm = document.querySelector("#login");
        if (!loginForm) return;
        loginForm.appendChild(errorText);

        // Get login button
        const loginButton = document.getElementsByName("submit")[0];
        if (!loginButton) {
            console.warn('[Login] Login button not found');
            return;
        }

        // Attach click handler
        loginButton.addEventListener("click", async () => {
            const username = document.getElementsByName("user_id")[0].value;
            const password = document.getElementsByName("password")[0].value;

            if (username === "" || password === "") {
                errorText.innerText = "用户名或密码不能为空";
                return;
            }

            try {
                const response = await fetch("https://www.xmoj.tech/login.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: "user_id=" + encodeURIComponent(username) + "&password=" + hex_md5(password)
                });

                const responseText = await response.text();

                if (UtilityEnabled("LoginFailed")) {
                    if (responseText.indexOf("history.go(-2);") !== -1) {
                        // Login successful
                        if (UtilityEnabled("SavePassword")) {
                            await storeCredential(username, password);
                        }

                        let newPage = localStorage.getItem("UserScript-LastPage");
                        if (newPage === null) {
                            newPage = "https://www.xmoj.tech/index.php";
                        }
                        location.href = newPage;
                    } else {
                        // Login failed
                        if (UtilityEnabled("SavePassword")) {
                            await clearCredential();
                        }

                        let errorMsg = responseText.substring(responseText.indexOf("alert('") + 7);
                        errorMsg = errorMsg.substring(0, errorMsg.indexOf("');"));

                        if (errorMsg === "UserName or Password Wrong!") {
                            errorText.innerText = "用户名或密码错误！";
                        } else {
                            errorText.innerText = errorMsg;
                        }
                    }
                } else {
                    // LoginFailed feature disabled, use default behavior
                    document.innerHTML = responseText;
                }
            } catch (error) {
                console.error('[Login] Error during login:', error);
                errorText.innerText = "登录请求失败，请重试";
            }
        });
    } catch (error) {
        console.error('[Login] Error attaching login handler:', error);
    }
}
