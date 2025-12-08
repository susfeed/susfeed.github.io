/* =========================
   HELPERS
   ========================= */

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/* =========================
   GLOBAL STATE
   ========================= */

let ads = [];

/* =========================
   INIT
   ========================= */

async function init() {
  let videos = await fetchJSON('videos/index.json');
  ads = await fetchJSON('commercials/index.json');

  shuffle(videos);

  const grid = document.getElementById('video-grid');
  grid.innerHTML = '';

  videos.forEach(video => {
    const card = document.createElement('div');
    card.className = 'video-card';

    card.innerHTML = `
      <img 
        src="videos/${video.replace('.mp4', '.jpg')}" 
        class="video-thumb" 
        alt="${video}"
        onerror="this.src='img/fallback.jpg'"
      />
      <div class="video-title">${video.replace('.mp4','')}</div>
    `;

    card.onclick = () => playVideo(`videos/${video}`);

    grid.appendChild(card);
  });
}

/* =========================
   PLAYER + ADS
   ========================= */

function playVideo(videoSrc) {
  const modal = document.getElementById('player-modal');
  const adPlayer = document.getElementById('ad-player');
  const player = document.getElementById('player');
  const skipBtn = document.getElementById('skip-btn');

  modal.classList.remove('hidden');

  // Reset players
  player.pause();
  adPlayer.pause();
  player.style.display = 'none';
  skipBtn.classList.add('hidden');

  // Pick random ad
  const ad = ads[Math.floor(Math.random() * ads.length)];
  adPlayer.src = `commercials/${ad}`;
  adPlayer.currentTime = 0;
  adPlayer.play();

  // Enable skip after 5s if needed
  const skipTimer = setTimeout(() => {
    if (adPlayer.duration > 5) {
      skipBtn.classList.remove('hidden');
    }
  }, 5000);

  skipBtn.onclick = () => adPlayer.dispatchEvent(new Event('ended'));

  adPlayer.onended = () => {
    clearTimeout(skipTimer);
    skipBtn.classList.add('hidden');

    adPlayer.pause();
    adPlayer.src = '';

    player.src = videoSrc;
    player.style.display = 'block';
    player.play();
  };
}

init();
