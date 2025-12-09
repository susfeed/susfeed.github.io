async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function getVotes() {
  return JSON.parse(localStorage.getItem('videoVotes') || '{}');
}

function setVote(video, vote) {
  const votes = getVotes();
  votes[video] = vote;
  localStorage.setItem('videoVotes', JSON.stringify(votes));
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

let allVideos = [];


async function init() {
allVideos = await fetchJSON('videos/index.json');
ads = await fetchJSON('commercials/index.json');


shuffle(allVideos);
renderVideos(allVideos);


const input = document.getElementById('video-search');
const btn = document.getElementById('search-btn');


function runSearch() {
const q = input.value.trim().toLowerCase();
if (!q) {
renderVideos(allVideos);
return;
}
const filtered = allVideos.filter(v => v.toLowerCase().includes(q));
renderVideos(filtered);
}


btn.onclick = runSearch;


input.addEventListener('keydown', e => {
if (e.key === 'Enter') runSearch();
});
}


function renderVideos(videos) {
  const grid = document.getElementById('video-grid');
  grid.innerHTML = '';

  if (!videos.length) {
    grid.innerHTML = '<p>No results found.</p>';
    return;
  }

  const votes = getVotes();

  videos.forEach(video => {
    const card = document.createElement('div');
    card.className = 'video-card';

    const vote = votes[video];

    card.innerHTML = `
      <video class="video-thumb" muted preload="metadata">
        <source src="videos/${video}" type="video/mp4">
      </video>

      <div class="video-title">${video.replace('.mp4','')}</div>

      <div class="video-actions">
        <span class="thumb like ${vote === 'like' ? 'active' : ''}">👍</span>
        <span class="thumb dislike ${vote === 'dislike' ? 'active' : ''}">👎</span>
      </div>
    `;

    card.querySelector('.video-thumb').onclick = () => {
      playVideo(`videos/${video}`);
    };

    const likeBtn = card.querySelector('.like');
    const dislikeBtn = card.querySelector('.dislike');

    likeBtn.onclick = () => {
      setVote(video, vote === 'like' ? null : 'like');
      renderVideos(videos);
    };

    dislikeBtn.onclick = () => {
      setVote(video, vote === 'dislike' ? null : 'dislike');
      renderVideos(videos);
    };

    grid.appendChild(card);
  });
}

init();

let currentFilter = 'all';

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.onclick = () => {
    currentFilter = btn.dataset.filter;
    applyFilter();
  };
});

function applyFilter() {
  const votes = getVotes();

  if (currentFilter === 'all') {
    renderVideos(allVideos);
  }

  if (currentFilter === 'liked') {
    renderVideos(allVideos.filter(v => votes[v] === 'like'));
  }

  if (currentFilter === 'disliked') {
    renderVideos(allVideos.filter(v => votes[v] === 'dislike'));
  }
}
