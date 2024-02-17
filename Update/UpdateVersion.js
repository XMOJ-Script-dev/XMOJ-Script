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
var LastVersion = LastJSVersion.split(".");
var LastPR = JSONObject.UpdateHistory[LastJSONVersion].UpdateContents[0].PR;
var LastDescription = JSONObject.UpdateHistory[LastJSONVersion].UpdateContents[0].Description;
var LastReleaseVersionOnline = execSync("gh release list --exclude-pre-releases --limit 1").toString().trim().split("\t")[2];
var NpmVersion = execSync("jq -r '.version' package.json").toString().trim();
console.log("Last JS version    : " + LastJSVersion);
console.log("Last JSON version  : " + LastJSONVersion);
console.log("Last PR            : " + LastPR);
console.log("Last description   : " + LastDescription);
console.log("Last release online: " + LastReleaseVersionOnline);
console.log("npm version        : " + NpmVersion);
execSync("git config --global user.email \"github-actions[bot]@users.noreply.github.com\"");
execSync("git config --global user.name \"github-actions[bot]\"");
if (JSONFileContent.includes('//!ci-no-touch')) {
    var updatedContent = JSONFileContent.replace('//!ci-no-touch', '');
    writeFileSync(JSONFileName, updatedContent, "utf8");
    execSync("git config pull.rebase false");
    execSync("git pull");
    execSync("git commit -a -m \"" + "remove //!ci-no-touch" + "\"");
    execSync("git push -f");
    console.log("Pushed to GitHub.");
    console.log('I won\'t touch this. Exiting process.');
    process.exit(0);
}
if (LastJSONVersion != LastJSVersion) {
    console.error("XMOJ.user.js and Update.json have different patch versions.");
    process.exit(1);
}

execSync("git config --global user.email \"github-actions[bot]@users.noreply.github.com\"");
execSync("git config --global user.name \"github-actions[bot]\"");
var CurrentPR = Number(PRNumber);
var CurrentDescription = String(process.argv[4]);
if (LastJSVersion != NpmVersion) {
    console.warn("Assuming you manually ran npm version.");
} else if (!(LastPR == CurrentPR && NpmVersion == LastJSVersion)) {
    execSync("npm version patch");
}

var CurrentVersion = execSync("jq -r '.version' package.json").toString().trim();

console.log("Current version    : " + CurrentVersion);
console.log("Current PR         : " + CurrentPR);
console.log("Current description: " + CurrentDescription);

var ChangedFileList = execSync("gh pr diff " + CurrentPR + " --name-only").toString().trim().split("\n");
console.log("Changed files      : " + ChangedFileList.join(", "));

let CommitMessage = "";
if (LastPR == CurrentPR && NpmVersion == LastJSVersion) {
    console.warn("Warning: PR is the same as last version.");
    JSONObject.UpdateHistory[LastJSVersion].UpdateDate = Date.now();
    JSONObject.UpdateHistory[LastJSVersion].UpdateContents[0].Description = CurrentDescription;
    CommitMessage = "Update time and description of " + LastJSVersion;
} else if (ChangedFileList.indexOf("XMOJ.user.js") == -1) {
    console.warn("XMOJ.user.js is not changed, so the version should not be updated.");
    process.exit(0);
} else {
    JSONObject.UpdateHistory[CurrentVersion] = {
        "UpdateDate": Date.now(),
        "Prerelease": true,
        "UpdateContents": [{
            "PR": CurrentPR,
            "Description": CurrentDescription
        }],
        "Notes": "No release notes were provided for this release."
    };
    writeFileSync(JSFileName, JSFileContent.replace(/@version(\s+)\d+\.\d+\.\d+/, "@version$1" + CurrentVersion), "utf8");
    console.warn("XMOJ.user.js has been updated.");
    CommitMessage = "Update version info to " + CurrentVersion;
}
console.log("Commit message     : " + CommitMessage);

writeFileSync(JSONFileName, JSON.stringify(JSONObject, null, 4), "utf8");

console.warn("Update.json has been updated.");

execSync("git config pull.rebase false");
execSync("git pull");
execSync("git commit -a -m \"" + CommitMessage + "\"");
execSync("git push -f");
console.log("Pushed to GitHub.");
