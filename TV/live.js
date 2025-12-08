async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CONTENT_BLOCK = 8 * 60; // 8 minutes minimum
const AD_BLOCK = 2 * 60;      // max ad time

const player = document.getElementById('live-player');
const watermark = document.querySelector('.live-watermark');
const titleBox = document.getElementById('live-title');
const fsBtn = document.getElementById('fs-btn');

let videos = [];
let ads = [];

let mode = 'content';
let blockTime = CONTENT_BLOCK;
let blockExpired = false;

async function init() {
  videos = await fetchJSON('videos/index.json');
  ads = await fetchJSON('commercials/index.json');
  startContent();
}

function startContent() {
  mode = 'content';
  blockTime = CONTENT_BLOCK;
  blockExpired = false;
  watermark.style.display = 'block';
  playRandomVideo(true);
}

function playRandomVideo(startMid = false) {
  const vid = rand(videos);
  titleBox.textContent = vid.replace('.mp4', '');

  player.src = `videos/${vid}`;
  player.onloadedmetadata = () => {
    if (startMid) {
      player.currentTime =
        player.duration * (0.25 + Math.random() * 0.5);
    }
    player.play();
  };
}

function startAds() {
  mode = 'ads';
  blockTime = AD_BLOCK;
  watermark.style.display = 'none';
  titleBox.textContent = 'Advertisement';
  playRandomAd();
}

function playRandomAd() {
  const ad = rand(ads);
  titleBox.textContent = 'Advertisement';
  player.src = `commercials/${ad}`;
  player.currentTime = 0;
  player.play();
}

player.onended = () => {
  if (mode === 'content') {
    blockExpired ? startAds() : playRandomVideo();
  } else {
    playRandomAd();
  }
};

setInterval(() => {
  blockTime--;
  if (blockTime <= 0) {
    blockExpired = true;

    if (mode === 'ads') startContent();
  }
}, 1000);

fsBtn.onclick = () => {
  if (!document.fullscreenElement) {
    player.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
};

init();
