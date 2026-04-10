async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

let allVideos = [];

function playVideo(videoSrc) {
  const modal = document.getElementById('player-modal');
  const player = document.getElementById('player');

  modal.classList.remove('hidden');

  player.src = videoSrc;
  player.style.display = 'block';
  player.play();
}

document.getElementById('close-btn').onclick = () => {
  const modal = document.getElementById('player-modal');
  const player = document.getElementById('player');

  player.pause();
  player.src = '';

  modal.classList.add('hidden');
};

async function init() {
  const videoData = await fetchJSON('../../TV/videos/index.json');
  const adData = await fetchJSON('../../TV/commercials/index.json');

  allVideos = [
    ...videoData.videos.map(v => ({ src: v.src, folder: 'videos' })),
    ...adData.map(v => ({ src: v, folder: 'commercials' }))
  ];

  shuffle(allVideos);
  renderVideos(allVideos);

  const input = document.getElementById('video-search');

  function runSearch() {
    const q = input.value.trim().toLowerCase();
    if (!q) return renderVideos(allVideos);
    renderVideos(allVideos.filter(v => v.src.toLowerCase().includes(q)));
  }

  input.addEventListener('input', runSearch);
}

function renderVideos(videos) {
  const grid = document.getElementById('video-grid');
  grid.innerHTML = '';

  if (!videos.length) {
    grid.innerHTML = '<p>No files found.</p>';
    return;
  }

  videos.forEach(video => {
    const file = document.createElement('div');
    file.className = 'file';

    const videoPath = `../../TV/${video.folder}/${video.src}`;

    file.innerHTML = `
      <video class="file-thumb" muted preload="metadata">
        <source src="${videoPath}" type="video/mp4">
      </video>
      <div class="file-name">${video.src}</div>
    `;

    file.ondblclick = () => {
      playVideo(videoPath);
    };

    grid.appendChild(file);
  });
}

init();