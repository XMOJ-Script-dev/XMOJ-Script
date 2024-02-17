import {readFileSync, writeFileSync} from "fs";
import {execSync} from "child_process";

var GithubToken = process.argv[2];
var PRNumber = process.argv[3];
process.env.GITHUB_TOKEN = GithubToken;
execSync("gh pr checkout " + PRNumber);
console.info("PR #" + PRNumber + " has been checked out.");

const JSONFileName = "./Update.json";
const JSFileName = "./XMOJ.user.js";
var JSONFileContent = readFileSync(JSONFileName, "utf8");
var JSFileContent = readFileSync(JSFileName, "utf8");
var JSONObject = JSON.parse(JSONFileContent);

var LastJSONVersion = Object.keys(JSONObject.UpdateHistory)[Object.keys(JSONObject.UpdateHistory).length - 1];
var LastJSVersion = JSFileContent.match(/@version\s+(\d+\.\d+\.\d+)/)[1];
var NpmVersion = execSync("jq -r '.version' package.json").toString().trim();
var LastVersion = LastJSVersion.split(".");
var LastPR = JSONObject.UpdateHistory[LastJSONVersion].UpdateContents[0].PR;
var LastType = JSONObject.UpdateHistory[LastJSONVersion].Prerelease ? "Prerelease" : "Release";
console.log("Last JS version    : " + LastJSVersion);
console.log("Last JSON version  : " + LastJSONVersion);
console.log("Last PR            : " + LastPR);
console.log("Last type          : " + LastType);
console.log("npm version        : " + NpmVersion);
execSync("git config --global user.email \"github-actions[bot]@users.noreply.github.com\"");
execSync("git config --global user.name \"github-actions[bot]\"");
if (JSONFileContent.includes('//!ci-no-touch')) {
    var updatedContent = JSONFileContent.replace('//!ci-no-touch', '');
    writeFileSync(JSONFileName, updatedContent, "utf8");
    execSync("git config pull.rebase false");
    execSync("git pull");
    execSync("git push origin --delete actions/temp || true");
    execSync("git checkout -b actions/temp");
    execSync("git commit -a -m \"remove //!ci-no-touch\"");
    execSync("git push -u origin actions/temp -f");
    console.warn("Pushed to actions/temp.");

    var PRNumber = execSync("gh pr create --title \"Update to release " + CurrentVersion + "\" --body \"Update to release " + CurrentVersion + "\" --base dev --head actions/temp").toString().split("/")[6].trim();
    console.warn("PR #" + PRNumber + " has been created.");

    execSync("gh pr merge " + PRNumber + " --merge --auto");
    console.warn("PR #" + PRNumber + " has enabled auto merge.");
    console.log('I won\'t touch this. Exiting process.');
    process.exit(0);
}
if (LastJSONVersion != LastJSVersion) {
    console.error("XMOJ.user.js and Update.json have different patch versions.");
    process.exit(1);
}
if (LastType == "Release") {
    console.error("Last release is not a prerelease.");
    execSync("gh pr comment " + PRNumber + " --body \"请重新提交PR, 谢谢");
    execSync("gh pr close " + PRNumber);
    process.exit(1);
}

if (LastJSVersion != NpmVersion) {
    console.warn("Assuming you manually ran npm version.");
} else {
    execSync("npm version patch");
}
var CurrentVersion = execSync("jq -r '.version' package.json").toString().trim();
console.log("Current version    : " + CurrentVersion);

JSONObject.UpdateHistory[CurrentVersion] = {
    "UpdateDate": Date.now(),
    "Prerelease": false,
    "UpdateContents": [],
    "Notes": "No release notes were provided for this release."
};

for (var i = Object.keys(JSONObject.UpdateHistory).length - 2; i >= 0; i--) {
    var Version = Object.keys(JSONObject.UpdateHistory)[i];
    if (JSONObject.UpdateHistory[Version].Prerelease == false) {
        break;
    }
    for (var j = 0; j < JSONObject.UpdateHistory[Version].UpdateContents.length; j++) {
        JSONObject.UpdateHistory[CurrentVersion].UpdateContents.push(JSONObject.UpdateHistory[Version].UpdateContents[j]);
        console.log("Add update content #" + JSONObject.UpdateHistory[Version].UpdateContents[j].PR + ": " + JSONObject.UpdateHistory[Version].UpdateContents[j].Description);
    }
}
JSONObject.UpdateHistory[CurrentVersion].UpdateContents.reverse();
writeFileSync(JSONFileName, JSON.stringify(JSONObject, null, 4), "utf8");
console.warn("Update.json has been updated.");

var NewJSFileContent = JSFileContent.replace(/@version(\s+)\d+\.\d+\.\d+/, "@version$1" + CurrentVersion);
writeFileSync(JSFileName, NewJSFileContent, "utf8");
console.warn("XMOJ.user.js has been updated.");

execSync("git config pull.rebase false");
execSync("git pull");
execSync("git push origin --delete actions/temp || true");
execSync("git checkout -b actions/temp");
execSync("git commit -a -m \"Update to release " + CurrentVersion + "\"");
execSync("git push -u origin actions/temp -f");
console.warn("Pushed to actions/temp.");

var PRNumber = execSync("gh pr create --title \"Update to release " + CurrentVersion + "\" --body \"Update to release " + CurrentVersion + "\" --base dev --head actions/temp").toString().split("/")[6].trim();
console.warn("PR #" + PRNumber + " has been created.");

execSync("gh pr merge " + PRNumber + " --merge --auto");
console.warn("PR #" + PRNumber + " has enabled auto merge.");
