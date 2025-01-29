const cheerio = require('cheerio');
let newestContest = 8218;
for (let i = 1000; i <= newestContest; i++) {
  let url = `https://www.xmoj.tech/contestrank.xls.php?cid=${i}`;
  let page = await fetch(url);
  let html = await page.text();
  let $ = cheerio.load(html);
  let contestName = $('title').text().split(' - ')[0]; //test gpg
  let contest = await Contest.findOne({ contestId: i });
  contest.contestName = contestName;
  await contest.save();
}
