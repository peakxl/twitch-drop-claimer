<h1 align="center">Twitch Drop Claimer</h1>
<p align="center">Watches twitch for you and claim drops automatically (with docker support)</p>
<p align="center">
<img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/peakxl/twitch-drop-claimer"> <img alt="GitHub repo size" src="https://img.shields.io/github/license/peakxl/twitch-drop-claimer"> <img alt="GitHub issues" src="https://img.shields.io/github/issues/peakxl/twitch-drop-claimer">
</p>
<p align="center">


This project is a fork based on [D3vl0per/Twitch-watcher](https://github.com/D3vl0per/Twitch-watcher) with claim drops feature from [frosty5689](https://github.com/frosty5689/twitch-watcher). Claim drops is currently broken with no ETA to fix.

## Features
- 🎥 True HTTP Live Streaming support (Forget the #4000 error code)
- 📦 Periodically check for drops
- 🔐 Cookie-based login
- 📜 Auto accept cookie policy
- 👨‍💻 The choice of a random streamer with drop-enabled tag
- 🤐 Unmuted stream
- 🛠 Detect mature content-based stream and interact with it
- 🛡 Proxy option
- 📽 Automatic lowest possible resolution settings
- 🧰 Highly customizable codebase
- 📦 Deployable to VPS via docker

## Requirements

 - Windows or Linux with [Nodejs](https://nodejs.org/en/download/) and [NPM](https://www.npmjs.com/get-npm)
 - Docker with docker-compose

## Installation
## Docker (Recommended)
<p align="center">
<img alt="Docker Image Version (latest by date)" src="https://img.shields.io/docker/v/peakxy/twitch-watcher/latest"> <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/peakxy/twitch-watcher"> <img alt="Docker Image Size (latest by date)" src="https://img.shields.io/docker/image-size/peakxy/twitch-watcher/latest">
</p>

### Requirements
- [Docker](https://docs.docker.com/get-docker/)
- [Docker-Compose](https://docs.docker.com/compose/install/)
### Usage
1. Download docker-compose.yml
2. Open and replace the **auth_token** environment record
3. Run with `docker-compose up -d` command
### Dependencies
<p align="center">
<img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/peakxl/twitch-drop-claimer/puppeteer-core"> <img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/peakxl/twitch-drop-claimer/cheerio"> <img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/peakxl/twitch-drop-claimer/dotenv"> <img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/peakxl/twitch-drop-claimer/dayjs"> <img alt="GitHub package.json dependency version (prod)" src="https://img.shields.io/github/package-json/dependency-version/peakxl/twitch-drop-claimer/tree-kill">
</p>

## Windows
1. Login to your twitch account
2. Open inspector(F12 or Ctrl+Shift+I) on main site
3. Find the stored cookie section
4. Copy **auth-token**
5. Clone this repo
6. Install Chromium
7. Usually the path to the Chromium executable is: C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe
8. Install the dependencies with `npm install`
9. Start the program with `npm start`

## Linux
1. Login to your twitch account
2. Open inspector(F12 or Ctrl+Shift+I) on main site
3. Find the stored cookie section
4. Copy **auth-token**
5. Clone this repo
6. Install Chromium: [TUTORIAL 🤗](https://www.addictivetips.com/ubuntu-linux-tips/install-chromium-on-linux/)
7. Locate Chromium executable: `whereis chromium` or `whereis chromium-browser`
8. Install the dependencies with `npm install`
9. Start the program with `npm start`
## Troubleshooting

### How does the token look like?
auth-token: `rxk38rh5qtyw95fkvm7kgfceh4mh6u`
___
### How to get the correct category name?
Click on the avatar on top-right, go to "Drops & Rewards".

On "Inventory" page, find the game click on "a participating live channel". Copy the last part of the url as category.

Altenatively, go to "All Campaigns". Find the game and click on "a participating live channel" or "more" at the end of streamers list. Copy the last part of the url as category.

Some examples of category names:
- rust
- lost-ark
- honkai-star-rail
- ea-sports-fc-24
- tom-clancys-rainbow-six-siege
___
### Something went wrong?
Try non-headless mode. Set headless value to `true`, like this:
```javascript
const showBrowser = true;
```
___
### Proxy?

Yes, of course:
```javascript
const proxy = ""; // "ip:port" By https://github.com/Jan710
```

OR

With Docker env:
```
proxy=PROXY_IP_ADDRESS:PROXY_PORT
```
___
### Screenshot without non-headless mode
```javascript
const browserScreenshot = false;
```

## Donation
Please donate to keep alive this project!

Especially the drop farmers who gather tons of money with this software!🤓

<a href="https://www.buymeacoffee.com/peakxl" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>


## Disclaimer
This code is for educational and research purposes only.
Do not attempt to violate the law with anything contained here.
I will not be responsible for any illegal actions.
Reproduction and copy is authorised, provided the source is acknowledged.
