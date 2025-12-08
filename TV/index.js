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

let ads = [];

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
  <video class="video-thumb" muted preload="metadata">
    <source src="videos/${video}" type="video/mp4">
  </video>
  <div class="video-title">${video.replace('.mp4','')}</div>
`;

    card.onclick = (e) => {
      e.preventDefault();
      playVideo(`videos/${video}`);
    };

    grid.appendChild(card);
  });
}

function hideSkip(skipBtn, skipTimer) {
  if (skipTimer) clearTimeout(skipTimer);
  skipBtn.classList.add('hidden');
  skipBtn.onclick = null;
}

function playVideo(videoSrc) {
  const modal = document.getElementById('player-modal');
  const adPlayer = document.getElementById('ad-player');
  const player = document.getElementById('player');
  const skipBtn = document.getElementById('skip-btn');

  modal.classList.remove('hidden');

  [adPlayer, player].forEach(v => {
    v.pause();
    v.src = '';
    v.style.display = 'none';
  });

  skipBtn.classList.add('hidden');
  skipBtn.onclick = null;

  const ad = ads[Math.floor(Math.random() * ads.length)];
  adPlayer.src = `commercials/${ad}`;
  adPlayer.currentTime = 0;
  adPlayer.style.display = 'block';
  adPlayer.muted = false;

  let skipTimer = setTimeout(() => {
    skipBtn.classList.remove('hidden');
  }, 5000);

  function endAd() {
    clearTimeout(skipTimer);
    skipBtn.classList.add('hidden');

    adPlayer.pause();
    adPlayer.src = '';
    adPlayer.style.display = 'none';

    player.src = videoSrc;
    player.currentTime = 0;
    player.style.display = 'block';
    player.play();
  }

  skipBtn.onclick = endAd;
  adPlayer.onended = endAd;

  adPlayer.play().catch(err => {
    console.warn('Ad play blocked:', err);
  });
}

document.getElementById('close-btn').onclick = () => {
  const modal = document.getElementById('player-modal');
  const ad = document.getElementById('ad-player');
  const video = document.getElementById('player');
  const skipBtn = document.getElementById('skip-btn');

  ad.pause();
  video.pause();

  ad.src = '';
  video.src = '';

  skipBtn.classList.add('hidden');
  modal.classList.add('hidden');
};

init();
