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

function playVideo(videoSrc) {
  const modal = document.getElementById('player-modal');
  const player = document.getElementById('player');
  const skipBtn = document.getElementById('skip-btn');

  modal.classList.remove('hidden');

  player.pause();
  player.src = '';

  const ad = ads[Math.floor(Math.random() * ads.length)];

  const playlist = [`commercials/${ad}`, videoSrc];
  let index = 0;

  player.src = playlist[index];
  player.style.display = 'block';
  player.controls = true;

  // skip button logic (ads only)
  skipBtn.classList.add('hidden');
  skipBtn.onclick = null;

  const skipTimer = setTimeout(() => {
    skipBtn.classList.remove('hidden');
  }, 5000);

  skipBtn.onclick = () => {
    clearTimeout(skipTimer);
    index = 1;
    skipBtn.classList.add('hidden');
    player.src = playlist[index];
    player.play();
  };

  player.onended = () => {
    if (index === 0) clearTimeout(skipTimer);
    index++;
    skipBtn.classList.add('hidden');
    if (index < playlist.length) {
      player.src = playlist[index];
      player.play();
    }
  };

  player.play();
}

document.getElementById('close-btn').onclick = () => {
  const modal = document.getElementById('player-modal');
  const video = document.getElementById('player');

  video.pause();
  video.src = '';

  modal.classList.add('hidden');
};

init();
