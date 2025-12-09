async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CONTENT_BLOCK = 8 * 60;
const AD_BLOCK = 2 * 60;

const player = document.getElementById('live-player');
const titleBox = document.getElementById('live-title');
const channelNumBox = document.querySelector('.channel-num');
const watermark = document.querySelector('.live-watermark');

let allVideos = [];
let videos = [];
let ads = [];
let channels = {};
let channelKeys = [];
let currentChannelIndex = 0;

let mode = 'content';
let blockTime = CONTENT_BLOCK;
let blockExpired = false;

async function init() {
  const data = await fetchJSON('videos/index.json');
  allVideos = data.videos;
  channels = data.channels;
  ads = await fetchJSON('commercials/index.json');

  channelKeys = Object.keys(channels).sort(
    (a, b) => channels[a].number - channels[b].number
  );

  const idx = channelKeys.findIndex(
    k => channels[k].number === 69
  );
  currentChannelIndex = idx !== -1 ? idx : 0;

  loadChannel();
}

function loadChannel() {
  const key = channelKeys[currentChannelIndex];
  const ch = channels[key];

  videos = allVideos.filter(v =>
    v.channels.includes(key)
  );

  channelNumBox.textContent = `CH ${ch.number}`;
  titleBox.textContent = ch.name || 'Now Playing';

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
  if (!videos.length) return;

  const vid = rand(videos);
  titleBox.textContent = vid.src.replace('.mp4', '');
  player.src = `videos/${vid.src}`;

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
  player.src = `commercials/${ad}`;
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

document.getElementById('ch-up')?.addEventListener('click', () => {
  currentChannelIndex =
    (currentChannelIndex + 1) % channelKeys.length;
  loadChannel();
});

document.getElementById('ch-down')?.addEventListener('click', () => {
  currentChannelIndex =
    (currentChannelIndex - 1 + channelKeys.length) % channelKeys.length;
  loadChannel();
});

const fsBtn = document.getElementById('fs-btn');
const liveWrapper = document.querySelector('.live-wrapper');

if (fsBtn && liveWrapper) {
  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      liveWrapper.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  });
}

init();