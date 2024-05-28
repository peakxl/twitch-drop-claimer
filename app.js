require("dotenv").config();
const fs = require("node:fs");
const puppeteer = require("puppeteer-core");
const dayjs = require("dayjs");
const cheerio = require("cheerio");
const treekill = require("tree-kill");

let run = true;
let cookie = null;
let streamers = null;
// ========================== CONFIG SECTION ==========================
const screenshotFolder = "./screenshots/";
const baseUrl = "https://www.twitch.tv/";
const inventoryUrl = `${baseUrl}drops/inventory`;

const userAgent =
  process.env.userAgent ||
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36";

const watchAlwaysTopStreamer = process.env.watchAlwaysTopStreamer === "true";
const category = sanitizeCategory(process.env.category);
let categoryUrl = `https://www.twitch.tv/directory/category/${category}?filter=drops`;
if (watchAlwaysTopStreamer) {
  categoryUrl += "&sort=VIEWER_COUNT";
}

const minWatching = Number(process.env.minWatching) || 15; // Minutes
const maxWatching = Number(process.env.maxWatching) || 30; // Minutes

const noChannelFoundWait = Number(process.env.noChannelFoundWait) || 5; // Minutes

const claimDrops = process.env.claimDrops || true;

const streamerListRefresh = Number(process.env.streamerListRefresh) || 1;
const streamerListRefreshUnit = process.env.streamerListRefreshUnit || "hour"; // https://day.js.org/docs/en/manipulate/add

const channelsWithPriority = process.env.channelsWithPriority
  ? process.env.channelsWithPriority.split(",")
  : [];

const browserPath = process.env.browserPath || "/usr/bin/chromium-browser";
const proxy = process.env.proxy || ""; // "ip:port" By https://github.com/Jan710
const proxyAuth = process.env.proxyAuth || "";

const browserScreenshot = process.env.browserScreenshot === "true";

const browserClean = 1;
const browserCleanUnit = "hour";

const browserConfig = {
	headless: process.env.headless !== "false",
  args: [
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-setuid-sandbox",
  ],
}; // https://github.com/D3vl0per/Valorant-watcher/issues/24

const matureContentQuery =
  'button[data-a-target="content-classification-gate-overlay-start-watching-button"]';
const channelsQuery = 'a[data-a-target="preview-card-image-link"]';
const campaignInProgressDropClaimQuery =
  '[data-test-selector="DropsCampaignInProgressRewardPresentation-claim-button"]';

// ========================== CONFIG SECTION ==========================

function sanitizeCategory(category) {
  let sanitizedCategory = category.replace(/^"|"$/g, "");
  sanitizedCategory = decodeURIComponent(sanitizedCategory);
  return encodeURIComponent(sanitizedCategory);
}

async function viewRandomPage(browser, page) {
  let streamerLastRefresh = dayjs().add(
    streamerListRefresh,
    streamerListRefreshUnit
  );
  let browserLastRefresh = dayjs().add(browserClean, browserCleanUnit);
  while (run) {
    try {
      if (dayjs(browserLastRefresh).isBefore(dayjs())) {
        const newSpawn = await cleanup(browser, page);
        const newBrowser = newSpawn.browser;
        page = newSpawn.page;
        browserLastRefresh = dayjs().add(browserClean, browserCleanUnit);
        browser = newBrowser;
      }

      if (dayjs(streamerLastRefresh).isBefore(dayjs())) {
        await getAllStreamer(page); // Call getAllStreamer function and refresh the list
        streamerLastRefresh = dayjs().add(
          streamerListRefresh,
          streamerListRefreshUnit
        ); // https://github.com/D3vl0per/Valorant-watcher/issues/25
      }

      let watch;

      if (watchAlwaysTopStreamer) {
        watch = streamers[0];
      } else {
        watch = streamers[getRandomInt(0, streamers.length - 1)]; // https://github.com/D3vl0per/Valorant-watcher/issues/27
      }

      if (channelsWithPriority.length > 0) {
        for (let i = 0; i < channelsWithPriority.length; i += 1) {
          if (streamers.includes(channelsWithPriority[i])) {
            watch = channelsWithPriority[i];
            break;
          }
        }
      }

      if (!watch) {
        console.log(
          `❌ No channels available, retrying in ${noChannelFoundWait} minutes...`
        );
        await new Promise((r) => {
          setTimeout(r, noChannelFoundWait * 60 * 1000);
        });
      } else {
        const sleep = getRandomInt(minWatching, maxWatching) * 60000; // Set watuching timer
        await page.goto(baseUrl + watch, {
          waitUntil: "networkidle2",
        }); // https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagegobackoptions
        await clickWhenExist(page, matureContentQuery);
        console.log("🔗 Now watching streamer: ", baseUrl + watch);
        console.log("✅ Stream loaded!");
        if (browserScreenshot) {
          await new Promise((r) => {
            setTimeout(r, 1000);
          });
          fs.access(screenshotFolder, (error) => {
            if (error) {
              fs.promises.mkdir(screenshotFolder);
            }
          });
          await page.screenshot({
            path: `${screenshotFolder}${watch}.png`,
          });
          console.log(`📸 Screenshot created: ${watch}.png`);
        }

        console.log(`🕒 Time: ${dayjs().format("HH:mm:ss")}`);
        console.log(`💤 Watching stream for ${sleep / 60000} minutes\n`);

        await new Promise((r) => {
          setTimeout(r, sleep);
        });
        if (claimDrops) {
          await claimDropsIfAny(page);
        }
      }
    } catch (e) {
      console.log("🤬 Error: ", e);
    }
  }
}

async function claimDropsIfAny(page) {
  console.log("🔎 Checking for drops...");

  await page.goto(inventoryUrl, {
    waitUntil: "networkidle0",
  }); // https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagegobackoptions

  const drops = await queryOnWebsite(page, campaignInProgressDropClaimQuery);
  if (drops.length > 0) {
    console.log(`🔎 ${drops.length} drop(s) found!`);
    for (let i = 0; i < drops.length; i += 1) {
      // Claim drop X times based on how many drops are available
      await clickWhenExist(page, campaignInProgressDropClaimQuery);
    }
    console.log(`✅ ${drops.length} drop(s) claimed!`);
  }
  //
}

async function readLoginData() {
  const cookie = [
    {
      domain: ".twitch.tv",
      hostOnly: false,
      httpOnly: false,
      name: "auth-token",
      path: "/",
      sameSite: "no_restriction",
      secure: true,
      session: false,
      storeId: "0",
      id: 1,
    },
  ];
  try {
    console.log("🔎 Checking env...");

    if (process.env.auth_token) {
      console.log("✅ Cookie found!");

      if (proxy) browserConfig.args.push(`--proxy-server=${proxy}`);
      cookie[0].value = process.env.auth_token; // Set cookie from env
      browserConfig.executablePath = browserPath; // Set browser path from env

      return cookie;
    }
  } catch (err) {
    console.log("🤬 Error: ", err);
  }
  return cookie;
}

async function spawnBrowser() {
  console.log("=========================");
  console.log("📱 Launching browser...");
  const browser = await puppeteer.launch(browserConfig);
  const page = await browser.newPage();

  console.log("🔧 Setting User-Agent...");
  await page.setUserAgent(userAgent); // Set userAgent

  console.log("🔧 Setting auth token...");
  await page.setCookie(...cookie); // Set cookie

  console.log("⏰ Setting timeouts...");
  await page.setDefaultNavigationTimeout(process.env.timeout || 0);
  await page.setDefaultTimeout(process.env.timeout || 0);

  if (proxyAuth) {
    await page.setExtraHTTPHeaders({
      "Proxy-Authorization": `Basic ${Buffer.from(proxyAuth).toString(
        "base64"
      )}`,
    });
  }

  return {
    browser,
    page,
  };
}

async function getAllStreamer(page) {
  console.log("=========================");
  await page.goto(categoryUrl, {
    waitUntil: "networkidle0",
  });
  console.log("🔐 Checking login...");
  await page.evaluate(() => {
    localStorage.setItem("video-quality", '{"default":"160p30"}');
    localStorage.setItem("volume", "0.0");
    localStorage.setItem("video-muted", '{"default":true}');
    localStorage.setItem("directoryAllChannelPageSort", '"VIEWER_COUNT"');
    localStorage.setItem("directoryGameChannelPageSort", '"VIEWER_COUNT"');
  });
  await checkLogin(page);
  console.log("📡 Checking active streamers...");
  const jquery = await queryOnWebsite(page, channelsQuery);
  streamers = null;
  streamers = [];

  console.log("🧹 Filtering out html codes...");
  for (let i = 0; i < jquery.length; i += 1) {
    streamers[i] = jquery[i].attribs.href.split("/")[1];
  }
}

// eslint-disable-next-line consistent-return
async function checkLogin(page) {
  const cookieSetByServer = await page.cookies();
  for (let i = 0; i < cookieSetByServer.length; i += 1) {
    if (cookieSetByServer[i].name === "twilight-user") {
      console.log("✅ Login successful!");
      return true;
    }
  }
  console.log("🛑 Login failed!");
  console.log("🔑 Invalid token!");
  console.log(
    "\nPlease ensure that you have a valid twitch auth-token.\nhttps://github.com/D3vl0per/Valorant-watcher#how-token-does-it-look-like"
  );
  process.exit();
}

function getRandomInt(min, max) {
  const minInt = Math.ceil(min);
  const maxInt = Math.floor(max);
  return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;
}

async function clickWhenExist(page, query) {
  const result = await queryOnWebsite(page, query);

  try {
    if (result[0].type === "tag" && result[0].name === "button") {
      await page.click(query);
      await new Promise((r) => {
        setTimeout(r, 500);
      });
    }
  } catch (e) {}
}

async function queryOnWebsite(page, query) {
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  const $ = cheerio.load(bodyHTML);
  const jquery = $(query);
  return jquery;
}

async function cleanup(browser) {
  const pages = await browser.pages();
  await pages.map((page) => page.close());
  await treekill(browser.process().pid, "SIGKILL");
  // await browser.close();
  return spawnBrowser();
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
  const { browser, page } = await spawnBrowser();
  await getAllStreamer(page);
  console.log("=========================");
  console.log("🔭 Running watcher...");
  await viewRandomPage(browser, page);
}

main();

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
