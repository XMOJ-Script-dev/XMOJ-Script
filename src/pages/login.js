/**
 * Login Page Module
 * Handles all styling and functionality for /loginpage.php
 *
 * Note: Login functionality is handled by LoginFailed and SavePassword features
 * This module only handles page styling
 */

import { UtilityEnabled } from '../core/config.js';

/**
 * Initialize login page
 * @param {Object} context - Page context with utilities
 */
export async function init(context) {
    // Replace login form with Bootstrap-styled version
    if (UtilityEnabled("NewBootstrap")) {
        replaceLoginForm();
    }

    // Login handling and SavePassword are handled by feature modules
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
