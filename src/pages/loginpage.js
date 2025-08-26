import { UtilityEnabled, storeCredential, getCredential } from '../utils.js';
import { hex_md5 } from 'crypto-js';

export async function handleLoginPage() {
    if (UtilityEnabled("NewBootstrap")) {
        document.querySelector("#login").innerHTML = `<form id="login" action="login.php" method="post">
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
</form > `;
    }
    let ErrorText = document.createElement("div");
    ErrorText.style.color = "red";
    ErrorText.style.marginBottom = "5px";
    document.querySelector("#login").appendChild(ErrorText);
    let LoginButton = document.getElementsByName("submit")[0];
    LoginButton.addEventListener("click", async () => {
        let Username = document.getElementsByName("user_id")[0].value;
        let Password = document.getElementsByName("password")[0].value;
        if (Username == "" || Password == "") {
            ErrorText.innerText = "用户名或密码不能为空";
        } else {
            await fetch("https://www.xmoj.tech/login.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: "user_id=" + encodeURIComponent(Username) + "&password=" + hex_md5(Password)
            })
                .then((Response) => {
                    return Response.text();
                })
                .then(async (Response) => {
                    if (UtilityEnabled("LoginFailed")) {
                        if (Response.indexOf("history.go(-2);") != -1) {
                            if (UtilityEnabled("SavePassword")) {
                                await storeCredential(Username, Password);
                            }
                            let NewPage = localStorage.getItem("UserScript-LastPage");
                            if (NewPage == null) {
                                NewPage = "https://www.xmoj.tech/index.php";
                            }
                            location.href = NewPage;
                        } else {
                            if (UtilityEnabled("SavePassword")) {
                                clearCredential();
                            }
                            Response = Response.substring(Response.indexOf("alert('") + 7);
                            Response = Response.substring(0, Response.indexOf("');"));
                            if (Response == "UserName or Password Wrong!") {
                                ErrorText.innerText = "用户名或密码错误！";
                            } else {
                                ErrorText.innerText = Response;
                            }
                        }
                    } else {
                        document.innerHTML = Response;
                    }
                });
        }
    });
    if (UtilityEnabled("SavePassword")) {
        (async () => {
            let Credential = await getCredential();
            if (Credential) {
                document.querySelector("#login > div:nth-child(1) > div > input").value = Credential.id;
                document.querySelector("#login > div:nth-child(2) > div > input").value = Credential.password;
                LoginButton.click();
            }
        })();
    }
}
