async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function getVotes() {
  return JSON.parse(localStorage.getItem('videoVotes') || '{}');
}

function setVote(videoSrc, vote) {
  const votes = getVotes();
  if (vote) {
    votes[videoSrc] = vote;
  } else {
    delete votes[videoSrc];
  }
  localStorage.setItem('videoVotes', JSON.stringify(votes));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

let allVideos = [];
let ads = [];

function playVideo(videoSrc) {
  const modal = document.getElementById('player-modal');
  const player = document.getElementById('player');
  const adPlayer = document.getElementById('ad-player');
  const skipBtn = document.getElementById('skip-btn');

  modal.classList.remove('hidden');

  player.pause();
  player.src = '';
  adPlayer.pause();
  adPlayer.src = '';

  const ad = ads[Math.floor(Math.random() * ads.length)];
  let showingAd = true;

  adPlayer.pause();
  adPlayer.removeAttribute('src');
  adPlayer.load();

  adPlayer.style.display = 'block';
  player.style.display = 'none';

  adPlayer.offsetHeight;

  adPlayer.src = `commercials/${ad}`;
  adPlayer.load();

  requestAnimationFrame(() => {
    adPlayer.play();
  });


  adPlayer.play();

  skipBtn.classList.add('hidden');
  const skipTimer = setTimeout(() => {
    skipBtn.classList.remove('hidden');
  }, 5000);

  skipBtn.onclick = () => {
    clearTimeout(skipTimer);
    showVideo();
  };

  adPlayer.onended = showVideo;

  function showVideo() {
    showingAd = false;
    clearTimeout(skipTimer);

    skipBtn.classList.add('hidden');
    adPlayer.pause();
    adPlayer.style.display = 'none';

    player.src = videoSrc;
    player.style.display = 'block';
    player.play();
  }
}

document.getElementById('close-btn').onclick = () => {
  const modal = document.getElementById('player-modal');
  const player = document.getElementById('player');
  const adPlayer = document.getElementById('ad-player');

  player.pause();
  player.src = '';
  adPlayer.pause();
  adPlayer.src = '';
  modal.classList.add('hidden');
};

async function init() {
  const data = await fetchJSON('videos/index.json');
  allVideos = data.videos;
  ads = await fetchJSON('commercials/index.json');

  shuffle(allVideos);
  renderVideos(allVideos);

  const input = document.getElementById('video-search');
  const btn = document.getElementById('search-btn');

  function runSearch() {
    const q = input.value.trim().toLowerCase();
    if (!q) return renderVideos(allVideos);

    renderVideos(
      allVideos.filter(v => v.src.toLowerCase().includes(q))
    );
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
    const vote = votes[video.src];

    const card = document.createElement('div');
    card.className = 'video-card';

    card.innerHTML = `
      <video class="video-thumb" muted preload="metadata">
        <source src="videos/${video.src}" type="video/mp4">
      </video>

      <div class="video-title">${video.src.replace('.mp4', '')}</div>

      <div class="video-actions">
        <span class="thumb like ${vote === 'like' ? 'active' : ''}">👍</span>
        <span class="thumb dislike ${vote === 'dislike' ? 'active' : ''}">👎</span>
      </div>
    `;

    card.querySelector('.video-thumb').onclick = () =>
      playVideo(`videos/${video.src}`);

    card.querySelector('.like').onclick = (e) => {
      e.stopPropagation();
      setVote(video.src, vote === 'like' ? null : 'like');
      renderVideos(videos);
    };

    card.querySelector('.dislike').onclick = (e) => {
      e.stopPropagation();
      setVote(video.src, vote === 'dislike' ? null : 'dislike');
      renderVideos(videos);
    };

    grid.appendChild(card);
  });
}


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
    return;
  }

  if (currentFilter === 'liked') {
    renderVideos(allVideos.filter(v => votes[v.src] === 'like'));
    return;
  }

  if (currentFilter === 'disliked') {
    renderVideos(allVideos.filter(v => votes[v.src] === 'dislike'));
  }
}

init();
