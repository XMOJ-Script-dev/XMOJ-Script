import { readFileSync } from "fs";
import { execSync } from "child_process";

const JSONFileName = "./Update.json";
const JSFileName = "./XMOJ.user.js";
var JSONFileContent = readFileSync(JSONFileName, "utf8");
var JSFileContent = readFileSync(JSFileName, "utf8");
var NpmVersion = execSync("npm show xmoj-script version").toString().trim();

var JSONObject = JSON.parse(JSONFileContent);

var LastJSONVersion = Object.keys(JSONObject.UpdateHistory)[Object.keys(JSONObject.UpdateHistory).length - 1];
var LastJSVersion = JSFileContent.match(/@version\s+(\d+\.\d+\.\d+)/)[1];
if (LastJSONVersion != LastJSVersion || LastJSONVersion != NpmVersion || LastJSVersion != NpmVersion) {
    console.log("Error: XMOJ.user.js and Update.json and npm have different versions.");
    console.log("XMOJ.user.js: " + LastJSVersion);
    console.log("Update.json: " + LastJSONVersion);
    console.log("npm: " + NpmVersion);
    process.exit(1);
}
console.log("Latest version: " + LastJSONVersion);
execSync("echo version=" + LastJSONVersion + " >> $GITHUB_OUTPUT");
