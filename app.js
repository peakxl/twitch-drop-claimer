require('dotenv').config();
const puppeteer = require('puppeteer-core');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
var fs = require('fs');
const inquirer = require('./input');
const treekill = require('tree-kill');

var run = true;
var cookie = null;
var streamers = null;
// ========================================== CONFIG SECTION =================================================================
const configPath = './config.json'
const screenshotFolder = './screenshots/';
const baseUrl = 'https://www.twitch.tv/';
const inventoryUrl = `${baseUrl}drops/inventory`;

const userAgent = (process.env.userAgent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
const streamersUrl = (process.env.streamersUrl || 'https://www.twitch.tv/directory/game/VALORANT?tl=c2542d6d-cd10-4532-919b-3d19f30a768b');



const minWatching = (Number(process.env.minWatching) || 15); // Minutes
const maxWatching = (Number(process.env.maxWatching) || 30); //Minutes

const noChannelFoundWait = (Number(process.env.noChannelFoundWait) || 5); // Minutes

const checkForDrops = (process.env.checkForDrops || true);

const streamerListRefresh = (Number(process.env.streamerListRefresh) || 1);
const streamerListRefreshUnit = (process.env.streamerListRefreshUnit || 'hour'); //https://day.js.org/docs/en/manipulate/add

const channelsWithPriority = process.env.channelsWithPriority ? process.env.channelsWithPriority.split(",") : [];
const watchAlwaysTopStreamer = (process.env.watchAlwaysTopStreamer || false);

const showBrowser = false; // false state equ headless mode;
const proxy = (process.env.proxy || ""); // "ip:port" By https://github.com/Jan710
const proxyAuth = (process.env.proxyAuth || "");

const browserScreenshot = (process.env.browserScreenshot || false);

const browserClean = 1;
const browserCleanUnit = 'hour';

var browserConfig = {
  headless: !showBrowser,
  args: [
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
}; //https://github.com/D3vl0per/Valorant-watcher/issues/24

const cookiePolicyQuery = 'button[data-a-target="consent-banner-accept"]';
const sidebarQuery = '*[data-test-selector="user-menu__toggle"]';
const userStatusQuery = 'span[data-a-target="presence-text"]';
const channelsQuery = 'a[data-test-selector*="ChannelLink"]';
const campaignInProgressDropClaimQuery = '[data-test-selector="DropsCampaignInProgressRewardPresentation-claim-button"]';

// ========================================== CONFIG SECTION =================================================================



async function viewRandomPage(browser, page) {
  var streamer_last_refresh = dayjs().add(streamerListRefresh, streamerListRefreshUnit);
  var browser_last_refresh = dayjs().add(browserClean, browserCleanUnit);
  while (run) {
    try {
      if (dayjs(browser_last_refresh).isBefore(dayjs())) {
        var newSpawn = await cleanup(browser, page);
        browser = newSpawn.browser;
        page = newSpawn.page;
        browser_last_refresh = dayjs().add(browserClean, browserCleanUnit);
      }

      if (dayjs(streamer_last_refresh).isBefore(dayjs())) {
        await getAllStreamer(page); //Call getAllStreamer function and refresh the list
        streamer_last_refresh = dayjs().add(streamerListRefresh, streamerListRefreshUnit); //https://github.com/D3vl0per/Valorant-watcher/issues/25
      }

      let watch;

      if (watchAlwaysTopStreamer) {
        watch = streamers[0];
      } else {
        watch = streamers[getRandomInt(0, streamers.length - 1)]; //https://github.com/D3vl0per/Valorant-watcher/issues/27
      }

      if (channelsWithPriority.length > 0) {
        for (let i = 0; i < channelsWithPriority.length; i++) {
          if (streamers.includes(channelsWithPriority[i])) {
            watch = channelsWithPriority[i];
            break;
          }
        }
      }

      if (!watch) {
        console.log(`❌ No channels available, retrying in ${noChannelFoundWait} minutes...`)
        await page.waitForTimeout(noChannelFoundWait * 60 * 1000);
      }
      else {

        var sleep = getRandomInt(minWatching, maxWatching) * 60000; //Set watuching timer

        console.log('\n🔗 Now watching streamer: ', baseUrl + watch);

        await page.goto(baseUrl + watch, {
          "waitUntil": "networkidle2"
        }); //https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagegobackoptions
        console.log('✅ Stream loaded!');
        await clickWhenExist(page, cookiePolicyQuery);

        if (browserScreenshot) {
          await page.waitForTimeout(1000);
          fs.access(screenshotFolder, error => {
            if (error) {
              fs.promises.mkdir(screenshotFolder);
            }
          });
          await page.screenshot({
            path: `${screenshotFolder}${watch}.png`
          });
          console.log(`📸 Screenshot created: ${watch}.png`);
        }

        await clickWhenExist(page, sidebarQuery); //Open sidebar
        await page.waitForSelector(userStatusQuery); //Waiting for sidebar
        let status = await queryOnWebsite(page, userStatusQuery); //status jQuery
        await clickWhenExist(page, sidebarQuery); //Close sidebar

        console.log('💡 Account status:', status[0] ? status[0].children[0].data : "Unknown");
        console.log(`🕒 Time: ${dayjs().format('HH:mm:ss')}`);
        console.log(`💤 Watching stream for ${sleep / 60000} minutes\n`);

        await page.waitForTimeout(sleep);
        if (checkForDrops) {
          await claimDropsIfAny(page);
        }

      }
    } catch (e) {
      console.log('🤬 Error: ', e);
      console.log('Please visit the discord channel to receive help: https://discord.gg/s8AH4aZ');
    }
  }
}

async function claimDropsIfAny(page) {
  console.log('🔎 Checking for drops...');

  await page.goto(inventoryUrl, {
    "waitUntil": "networkidle0"
  }); //https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagegobackoptions

  var claimDrops = await queryOnWebsite(page, campaignInProgressDropClaimQuery);
  if (claimDrops.length > 0) {
    console.log(`🔎 ${claimDrops.length} drop(s) found!`);
    for (var i = 0; i < claimDrops.length; i++) {
      await clickWhenExist(page, campaignInProgressDropClaimQuery); // Claim drop X times based on how many drops are available
    }
    console.log(`✅ ${claimDrops.length} drop(s) claimed!`);
  }
  //
}

async function readLoginData() {
  const cookie = [{
    "domain": ".twitch.tv",
    "hostOnly": false,
    "httpOnly": false,
    "name": "auth-token",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "id": 1
  }];
  try {
    console.log('🔎 Checking config file...');

    if (fs.existsSync(configPath)) {
      console.log('✅ Json config found!');

      let configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'))

      if (proxy) browserConfig.args.push('--proxy-server=' + proxy);
      browserConfig.executablePath = configFile.exec;
      cookie[0].value = configFile.token;

      return cookie;
    } else if (process.env.token) {
      console.log('✅ Env config found');

      if (proxy) browserConfig.args.push('--proxy-server=' + proxy);
      cookie[0].value = process.env.token; //Set cookie from env
      browserConfig.executablePath = '/usr/bin/chromium-browser'; //For docker container

      return cookie;
    } else {
      console.log('❌ No config file found!');

      let input = await inquirer.askLogin();

      fs.writeFile(configPath, JSON.stringify(input), function (err) {
        if (err) {
          console.log(err);
        }
      });

      if (proxy) browserConfig.args[6] = '--proxy-server=' + proxy;
      browserConfig.executablePath = input.exec;
      cookie[0].value = input.token;

      return cookie;
    }
  } catch (err) {
    console.log('🤬 Error: ', e);
    console.log('Please visit my discord channel to solve this problem: https://discord.gg/s8AH4aZ');
  }
}



async function spawnBrowser() {
  console.log("=========================");
  console.log('📱 Launching browser...');
  var browser = await puppeteer.launch(browserConfig);
  var page = await browser.newPage();

  console.log('🔧 Setting User-Agent...');
  await page.setUserAgent(userAgent); //Set userAgent

  console.log('🔧 Setting auth token...');
  await page.setCookie(...cookie); //Set cookie

  console.log('⏰ Setting timeouts...');
  await page.setDefaultNavigationTimeout(process.env.timeout || 0);
  await page.setDefaultTimeout(process.env.timeout || 0);

  if (proxyAuth) {
    await page.setExtraHTTPHeaders({
      'Proxy-Authorization': 'Basic ' + Buffer.from(proxyAuth).toString('base64')
    })
  }

  return {
    browser,
    page
  };
}



async function getAllStreamer(page) {
  console.log("=========================");
  await page.goto(streamersUrl, {
    "waitUntil": "networkidle0"
  });
  console.log('🔐 Checking login...');
  await page.evaluate(() => {
    localStorage.setItem('mature', 'true');
    localStorage.setItem('video-quality', '{"default":"160p30"}');
    localStorage.setItem('volume', '0.0');
    localStorage.setItem('video-muted', '{"default":true}');
    localStorage.setItem('directoryAllChannelPageSort', '"VIEWER_COUNT"');
    localStorage.setItem('directoryGameChannelPageSort', '"VIEWER_COUNT"');
  });
  await checkLogin(page);
  console.log('📡 Checking active streamers...');
  const jquery = await queryOnWebsite(page, channelsQuery);
  streamers = null;
  streamers = new Array();

  console.log('🧹 Filtering out html codes...');
  for (var i = 0; i < jquery.length; i++) {
    streamers[i] = jquery[i].attribs.href.split("/")[1];
  }
  return;
}



async function checkLogin(page) {
  let cookieSetByServer = await page.cookies();
  for (var i = 0; i < cookieSetByServer.length; i++) {
    if (cookieSetByServer[i].name == 'twilight-user') {
      console.log('✅ Login successful!');
      return true;
    }
  }
  console.log('🛑 Login failed!');
  console.log('🔑 Invalid token!');
  console.log('\nPleas ensure that you have a valid twitch auth-token.\nhttps://github.com/D3vl0per/Valorant-watcher#how-token-does-it-look-like');
  if (!process.env.token) {
    fs.unlinkSync(configPath);
  }
  process.exit();
}



function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



async function clickWhenExist(page, query) {
  let result = await queryOnWebsite(page, query);

  try {
    if (result[0].type == 'tag' && result[0].name == 'button') {
      await page.click(query);
      await page.waitForTimeout(500);
      return;
    }
  } catch (e) { }
}



async function queryOnWebsite(page, query) {
  let bodyHTML = await page.evaluate(() => document.body.innerHTML);
  let $ = cheerio.load(bodyHTML);
  const jquery = $(query);
  return jquery;
}



async function cleanup(browser, page) {
  const pages = await browser.pages();
  await pages.map((page) => page.close());
  await treekill(browser.process().pid, 'SIGKILL');
  //await browser.close();
  return await spawnBrowser();
}



async function killBrowser(browser, page) {
  const pages = await browser.pages();
  await pages.map((page) => page.close());
  treekill(browser.process().pid, 'SIGKILL');
  return;
}



async function shutDown() {
  console.log("\n👋Bye Bye👋");
  run = false;
  process.exit();
}



async function main() {
  console.clear();
  console.log("=========================");
  cookie = await readLoginData();
  var {
    browser,
    page
  } = await spawnBrowser();
  await getAllStreamer(page);
  console.log("=========================");
  console.log('🔭 Running watcher...');
  await viewRandomPage(browser, page);
};

main();

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
