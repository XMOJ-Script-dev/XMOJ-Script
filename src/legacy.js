import { handleIndexPage } from './pages/index.js';
import { handleProblemsetPage } from './pages/problemset.js';
import { handleProblemPage } from './pages/problem.js';
import { handleStatusPage } from './pages/status.js';
import { handleContestPage } from './pages/contest.js';
import { handleContestRankOIPage } from './pages/contestrank_oi.js';
import { handleContestRankCorrectPage } from './pages/contestrank_correct.js';
import { handleSubmitPage } from './pages/submitpage.js';
import { handleModifyPage } from './pages/modifypage.js';
import { handleUserInfoPage } from './pages/userinfo.js';
import { handleCompareSourcePage } from './pages/comparesource.js';
import { handleLoginPage } from './pages/loginpage.js';
import { handleContestVideoPage } from './pages/contest_video.js';
import { handleReinfoPage } from './pages/reinfo.js';
import { handleDownloadsPage } from './pages/downloads.js';
import { handleProblemStatusPage } from './pages/problemstatus.js';
import { handleProblemSolutionPage } from './pages/problem_solution.js';
import { handleOpenContestPage } from './pages/open_contest.js';
import { handleShowSourcePage } from './pages/showsource.js';
import { handleCeInfoPage } from './pages/ceinfo.js';
import { handleProblemStdPage } from './pages/problem_std.js';
import { handleMailPage } from './pages/mail.js';
import { handleDiscussPage } from './pages/discuss.js';

export async function main() {
    const pathname = location.pathname;

    if (pathname === '/index.php' || pathname === '/') {
        handleIndexPage();
    } else if (pathname === '/problemset.php') {
        handleProblemsetPage();
    } else if (pathname === '/problem.php') {
        handleProblemPage();
    } else if (pathname === '/status.php') {
        handleStatusPage();
    } else if (pathname === '/contest.php') {
        handleContestPage();
    } else if (pathname === '/contestrank-oi.php') {
        handleContestRankOIPage();
    } else if (pathname === '/contestrank-correct.php') {
        handleContestRankCorrectPage();
    } else if (pathname === '/submitpage.php') {
        handleSubmitPage();
    } else if (pathname === '/modifypage.php') {
        handleModifyPage();
    } else if (pathname === '/userinfo.php') {
        handleUserInfoPage();
    } else if (pathname === '/comparesource.php') {
        handleCompareSourcePage();
    } else if (pathname === '/loginpage.php') {
        handleLoginPage();
    } else if (pathname === '/contest_video.php' || pathname === '/problem_video.php') {
        handleContestVideoPage();
    } else if (pathname === '/reinfo.php') {
        handleReinfoPage();
    } else if (pathname === '/downloads.php') {
        handleDownloadsPage();
    } else if (pathname === '/problemstatus.php') {
        handleProblemStatusPage();
    } else if (pathname === '/problem_solution.php') {
        handleProblemSolutionPage();
    } else if (pathname === '/open_contest.php') {
        handleOpenContestPage();
    } else if (pathname === '/showsource.php') {
        handleShowSourcePage();
    } else if (pathname === '/ceinfo.php') {
        handleCeInfoPage();
    } else if (pathname === '/problem_std.php') {
        handleProblemStdPage();
    } else if (pathname === '/mail.php') {
        handleMailPage();
    } else if (pathname.includes('/discuss3')) {
        handleDiscussPage();
    }
}
