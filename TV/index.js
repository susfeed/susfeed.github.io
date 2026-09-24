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
  if (vote) votes[videoSrc] = vote;
  else delete votes[videoSrc];
  localStorage.setItem('videoVotes', JSON.stringify(votes));
}

function getSubs() {
  const raw = localStorage.getItem('subscriptions');
  if (raw === null) return null;
  return JSON.parse(raw);
}

function setSubs(subs) {
  localStorage.setItem('subscriptions', JSON.stringify(subs));
}

function initSubs() {
  const existing = getSubs();
  if (existing) return existing;
  const all = Object.keys(channels);
  setSubs(all);
  return all;
}

function isSubscribed(channelKey) {
  const subs = getSubs() || [];
  return subs.includes(channelKey);
}

function toggleSubscribe(channelKey) {
  let subs = getSubs() || [];
  if (subs.includes(channelKey)) {
    subs = subs.filter(k => k !== channelKey);
  } else {
    subs.push(channelKey);
  }
  setSubs(subs);
  return subs.includes(channelKey);
}

function getHistory() {
  return JSON.parse(localStorage.getItem('watchHistory') || '[]');
}

function addToHistory(videoSrc) {
  let history = getHistory();
  const existing = history.find(item => item.src === videoSrc);
  const progress = existing ? existing.progress : 0;
  history = history.filter(item => item.src !== videoSrc);
  history.unshift({ src: videoSrc, timestamp: Date.now(), progress });
  if (history.length > 100) history = history.slice(0, 100);
  localStorage.setItem('watchHistory', JSON.stringify(history));
}

function updateProgress(videoSrc, progress) {
  const history = getHistory();
  const item = history.find(h => h.src === videoSrc);
  if (item) {
    item.progress = progress;
    localStorage.setItem('watchHistory', JSON.stringify(history));
  }
}

function removeFromHistory(videoSrc) {
  let history = getHistory();
  history = history.filter(item => item.src !== videoSrc);
  localStorage.setItem('watchHistory', JSON.stringify(history));
}

function clearHistory() {
  localStorage.removeItem('watchHistory');
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K views`;
  return `${n} view${n !== 1 ? 's' : ''}`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getViews(video) {
  return 1000 + (hashString(video.src) % 4_999_000);
}

function getUploadDate(video) {
  if (video.uploaded) return new Date(video.uploaded).getTime();
  const daysAgo = hashString(video.src + 'u') % 720;
  return Date.now() - daysAgo * 24 * 60 * 60 * 1000;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

let allVideos = [];
let ads = [];
let channels = {};
let currentPage = 'home';
let currentChannelFilter = null;
let hoverTimer = null;
let hoverVideo = null;
let acSelectedIndex = -1;
let acResults = [];

let shortsFeed = [];
let shortsAdEvery = 4;

function getChannelForVideo(video) {
  if (!video.channels || !video.channels.length) return null;

  let best = null;
  for (const key of video.channels) {
    const ch = channels[key];
    if (!ch) continue;
    if (!best || ch.number < best.number) {
      best = { key, name: ch.name, logo: ch.logo, number: ch.number };
    }
  }
  return best;
}

function channelAvatarHTML(video) {
  const ch = getChannelForVideo(video);
  if (!ch) return '<div class="channel-avatar"></div>';
  return `<img class="channel-avatar" src="img/${ch.logo}" alt="${ch.name}" onerror="this.style.display='none'">`;
}

function channelNameHTML(video) {
  const ch = getChannelForVideo(video);
  if (!ch) return '';
  return `<a class="channel-name" href="#" data-channel="${ch.key}">${ch.name}</a>`;
}

function subscribeBtnHTML(video) {
  const ch = getChannelForVideo(video);
  if (!ch) return '';
  const subbed = isSubscribed(ch.key);
  return `<button class="subscribe-btn ${subbed ? 'subscribed' : ''}" data-channel="${ch.key}">${subbed ? 'Subscribed' : 'Subscribe'}</button>`;
}

function filterByChannel(channelKey) {
  const ch = channels[channelKey];
  if (!ch) return;
  showPage('home');
  currentChannelFilter = channelKey;
  const filtered = allVideos.filter(v => v.channels && v.channels.includes(channelKey));
  document.getElementById('video-grid').classList.remove('hidden');
  renderVideos(filtered, document.getElementById('video-grid'));
}

function getRecommendations() {
  const votes = getVotes();
  const likedChannels = {};
  const dislikedChannels = {};

  for (const [src, vote] of Object.entries(votes)) {
    const video = allVideos.find(v => v.src === src);
    if (!video || !video.channels) continue;
    for (const key of video.channels) {
      if (vote === 'like') likedChannels[key] = (likedChannels[key] || 0) + 1;
      if (vote === 'dislike') dislikedChannels[key] = (dislikedChannels[key] || 0) + 1;
    }
  }

  const hasSignal = Object.keys(likedChannels).length > 0 || Object.keys(dislikedChannels).length > 0;
  if (!hasSignal) return allVideos.slice();

  const scored = allVideos.map(video => {
    let score = 0;
    if (video.channels) {
      for (const key of video.channels) {
        score += (likedChannels[key] || 0) * 3;
        score -= (dislikedChannels[key] || 0) * 4;
      }
    }
    score += Math.random() * 2;
    return { video, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.video);
}

function attachDurationBadge(videoEl, badgeEl) {
  const setBadge = () => {
    if (videoEl.duration && isFinite(videoEl.duration)) {
      badgeEl.textContent = formatDuration(videoEl.duration);
    }
  };

  if (videoEl.readyState >= 1) {
    setBadge();
  } else {
    videoEl.addEventListener('loadedmetadata', setBadge, { once: true });
  }
}

function playVideo(videoSrc) {
  const modal = document.getElementById('player-modal');
  const player = document.getElementById('player');
  const skipBtn = document.getElementById('skip-btn');

  modal.classList.remove('hidden');

  player.pause();
  player.removeAttribute('src');
  player.load();

  const ad = ads[Math.floor(Math.random() * ads.length)];
  const playlist = [`commercials/${ad}`, videoSrc];
  let index = 0;

  player.controls = true;
  player.playsInline = true;
  player.muted = false;
  player.src = playlist[index];
  player.style.display = 'block';

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

  let lastSaved = 0;
  player.ontimeupdate = () => {
    if (index !== 1) return;
    if (!player.duration) return;
    const pct = player.currentTime / player.duration;
    if (Math.abs(pct - lastSaved) > 0.02) {
      lastSaved = pct;
      updateProgress(videoSrc, pct);
    }
  };

  player.onended = () => {
    if (index === 0) clearTimeout(skipTimer);
    index++;
    skipBtn.classList.add('hidden');
    if (index < playlist.length) {
      player.src = playlist[index];
      player.play();
    } else {
      updateProgress(videoSrc, 1);
    }
  };

  player.play().catch(err => {
    console.warn('play() rejected:', err);
  });

  addToHistory(videoSrc);

  if (currentPage === 'history') renderHistory();
}

document.getElementById('close-btn').onclick = () => {
  const modal = document.getElementById('player-modal');
  const player = document.getElementById('player');
  const adPlayer = document.getElementById('ad-player');

  player.pause();
  player.src = '';
  player.ontimeupdate = null;
  player.onended = null;

  adPlayer.pause();
  adPlayer.src = '';

  modal.classList.add('hidden');
};

function showPage(page) {
  currentPage = page;
  currentChannelFilter = null;

  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  document.getElementById('shorts-shelf').classList.add('hidden');
  document.getElementById('video-section').classList.add('hidden');
  document.getElementById('subscriptions-section').classList.add('hidden');
  document.getElementById('history-section').classList.add('hidden');
  document.getElementById('video-grid').classList.remove('hidden');

  if (page === 'home') {
    document.getElementById('shorts-shelf').classList.remove('hidden');
    document.getElementById('video-section').classList.remove('hidden');
    renderVideos(getRecommendations(), document.getElementById('video-grid'));
  } else if (page === 'shorts') {
    openShortsPlayer();
  } else if (page === 'subscriptions') {
    document.getElementById('subscriptions-section').classList.remove('hidden');
    renderSubscriptions();
  } else if (page === 'history') {
    document.getElementById('history-section').classList.remove('hidden');
    renderHistory();
  } else if (page === 'liked') {
    const votes = getVotes();
    document.getElementById('video-section').classList.remove('hidden');
    renderVideos(allVideos.filter(v => votes[v.src] === 'like'), document.getElementById('video-grid'));
  } else if (page === 'disliked') {
    const votes = getVotes();
    document.getElementById('video-section').classList.remove('hidden');
    renderVideos(allVideos.filter(v => votes[v.src] === 'dislike'), document.getElementById('video-grid'));
  }

  closeSidebarOnMobile();
}

function renderSubscriptions() {
  const subs = getSubs() || [];
  const chContainer = document.getElementById('subs-channels');
  const feed = document.getElementById('subs-feed');

  chContainer.innerHTML = '';

  if (!subs.length) {
    feed.innerHTML = '<p class="history-empty">You are not subscribed to any channels.</p>';
    return;
  }

  subs.forEach(key => {
    const ch = channels[key];
    if (!ch) return;
    const el = document.createElement('div');
    el.className = 'subs-channel';
    el.innerHTML = `
      <img class="subs-channel-avatar" src="img/${ch.logo}" alt="${ch.name}" onerror="this.style.display='none'">
      <div class="subs-channel-name">${ch.name}</div>
    `;
    el.onclick = () => {
      chContainer.querySelectorAll('.subs-channel').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      const vids = allVideos.filter(v => v.channels && v.channels.includes(key));
      renderVideos(vids, feed);
    };
    chContainer.appendChild(el);
  });

  const firstKey = subs[0];
  const firstVids = allVideos.filter(v => v.channels && v.channels.includes(firstKey));
  renderVideos(firstVids, feed);
}

function renderShortsShelf() {
  const row = document.getElementById('shorts-row');
  row.innerHTML = '';
  const shorts = allVideos.filter(v => v.channels && v.channels.includes('shorts'));

  shorts.forEach(video => {
    const views = getViews(video);
    const card = document.createElement('div');
    card.className = 'short-card';
    card.innerHTML = `
      <div class="short-thumb-wrapper">
        <video class="short-thumb" muted preload="metadata">
          <source src="videos/${video.src}" type="video/mp4">
        </video>
        <div class="duration-badge"></div>
      </div>
      <div class="short-title">${video.src.replace('.mp4', '')}</div>
      <div class="short-views">${formatViews(views)}</div>
    `;

    const thumb = card.querySelector('.short-thumb');
    const badge = card.querySelector('.duration-badge');
    attachDurationBadge(thumb, badge);

    card.onclick = () => openShortsPlayer(video.src);
    row.appendChild(card);
  });
}

function buildShortsFeed(startSrc) {
  const shorts = allVideos.filter(v => v.channels && v.channels.includes('shorts'));
  shortsFeed = [];

  let counter = 0;
  shorts.forEach(video => {
    shortsFeed.push({ type: 'video', video });
    counter++;
    if (counter % shortsAdEvery === 0) {
      const ad = ads[Math.floor(Math.random() * ads.length)];
      shortsFeed.push({ type: 'ad', ad });
    }
  });

  if (startSrc) {
    const idx = shortsFeed.findIndex(item => item.type === 'video' && `videos/${item.video.src}` === startSrc);
    if (idx > 0) {
      shortsFeed = shortsFeed.slice(idx).concat(shortsFeed.slice(0, idx));
    }
  }
}

let shortsCurrentIndex = 0;
let shortsObserver = null;

function openShortsPlayer(startSrc) {
  buildShortsFeed(startSrc);
  shortsCurrentIndex = 0;

  const modal = document.getElementById('shorts-modal');
  modal.classList.remove('hidden');

  renderShortsSlides();

  const container = document.getElementById('shorts-container');
  container.scrollTop = 0;

  setTimeout(() => setupShortsObserver(), 50);
}

function closeShortsPlayer() {
  const modal = document.getElementById('shorts-modal');
  modal.classList.add('hidden');

  const container = document.getElementById('shorts-container');
  container.querySelectorAll('video').forEach(v => {
    v.pause();
    v.src = '';
    v.load();
  });
  container.innerHTML = '';

  if (shortsObserver) {
    shortsObserver.disconnect();
    shortsObserver = null;
  }

  showPage('home');
}

function renderShortsSlides() {
  const container = document.getElementById('shorts-container');
  container.innerHTML = '';

  shortsFeed.forEach((item, idx) => {
    const slide = document.createElement('div');
    slide.className = 'short-slide';
    slide.dataset.index = idx;

    if (item.type === 'ad') {
      slide.innerHTML = `
        <video muted playsinline preload="metadata">
          <source src="commercials/${item.ad}" type="video/mp4">
        </video>
        <div class="short-ad-badge">AD</div>
        <div class="short-ad-timer" id="ad-timer-${idx}">5s</div>
        <div class="short-progress"></div>
      `;
    } else {
      const video = item.video;
      const ch = getChannelForVideo(video);
      const subbed = ch ? isSubscribed(ch.key) : false;
      slide.innerHTML = `
        <video playsinline loop preload="metadata">
          <source src="videos/${video.src}" type="video/mp4">
        </video>
        <div class="short-overlay">
          <div class="short-overlay-title">${video.src.replace('.mp4', '')}</div>
          ${ch ? `
            <div class="short-overlay-channel">
              <img class="short-overlay-avatar" src="img/${ch.logo}" alt="${ch.name}" onerror="this.style.display='none'">
              <span class="short-overlay-name">${ch.name}</span>
              <button class="short-overlay-sub ${subbed ? 'subscribed' : ''}" data-channel="${ch.key}">
                ${subbed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>
          ` : ''}
        </div>
        <div class="short-actions">
          <div class="short-action like-action" data-src="${video.src}">
            <div class="short-action-icon">👍</div>
            <span>Like</span>
          </div>
          <div class="short-action dislike-action" data-src="${video.src}">
            <div class="short-action-icon">👎</div>
            <span>Dislike</span>
          </div>
        </div>
        <div class="short-progress"></div>
      `;
    }

    container.appendChild(slide);
  });

  attachShortsControls();
}

function attachShortsControls() {
  const container = document.getElementById('shorts-container');
  const votes = getVotes();

  container.querySelectorAll('.short-action.like-action').forEach(el => {
    const src = el.dataset.src;
    if (votes[src] === 'like') el.classList.add('active');
    el.onclick = e => {
      e.stopPropagation();
      const current = getVotes();
      setVote(src, current[src] === 'like' ? null : 'like');
      const updated = getVotes();
      container.querySelectorAll(`.short-action.like-action[data-src="${CSS.escape(src)}"]`).forEach(a => {
        a.classList.toggle('active', updated[src] === 'like');
      });
      container.querySelectorAll(`.short-action.dislike-action[data-src="${CSS.escape(src)}"]`).forEach(a => {
        a.classList.remove('active');
      });
    };
  });

  container.querySelectorAll('.short-action.dislike-action').forEach(el => {
    const src = el.dataset.src;
    if (votes[src] === 'dislike') el.classList.add('active');
    el.onclick = e => {
      e.stopPropagation();
      const current = getVotes();
      setVote(src, current[src] === 'dislike' ? null : 'dislike');
      const updated = getVotes();
      container.querySelectorAll(`.short-action.dislike-action[data-src="${CSS.escape(src)}"]`).forEach(a => {
        a.classList.toggle('active', updated[src] === 'dislike');
      });
      container.querySelectorAll(`.short-action.like-action[data-src="${CSS.escape(src)}"]`).forEach(a => {
        a.classList.remove('active');
      });
    };
  });

  container.querySelectorAll('.short-overlay-sub').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      const key = el.dataset.channel;
      const nowSubbed = toggleSubscribe(key);
      el.textContent = nowSubbed ? 'Subscribed' : 'Subscribe';
      el.classList.toggle('subscribed', nowSubbed);
    };
  });
}

function setupShortsObserver() {
  const container = document.getElementById('shorts-container');
  const slides = container.querySelectorAll('.short-slide');

  if (shortsObserver) shortsObserver.disconnect();

  shortsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const slide = entry.target;
      const idx = parseInt(slide.dataset.index, 10);
      const video = slide.querySelector('video');

      if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
        shortsCurrentIndex = idx;
        const item = shortsFeed[idx];

        if (item.type === 'ad') {
          startShortAd(slide, video, idx);
        } else {
          video.muted = false;
          video.loop = true;
          video.play().catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
          attachShortProgress(video, slide);
          addToHistory(`videos/${item.video.src}`);
        }
      } else {
        if (video) {
          video.pause();
          video.muted = true;
        }
      }
    });
  }, {
    root: container,
    threshold: [0, 0.6, 1]
  });

  slides.forEach(s => shortsObserver.observe(s));
}

function startShortAd(slide, video, idx) {
  video.muted = true;
  video.loop = false;
  video.currentTime = 0;
  video.play().catch(() => {});

  const timerEl = slide.querySelector(`#ad-timer-${idx}`);
  let remaining = 5;

  const tick = () => {
    if (remaining > 0) {
      remaining--;
      if (timerEl) timerEl.textContent = `${remaining}s`;
    }
  };

  const interval = setInterval(tick, 1000);

  video.onended = () => {
    clearInterval(interval);
    scrollToNextShort();
  };

  video.ontimeupdate = () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    const bar = slide.querySelector('.short-progress');
    if (bar) bar.style.width = `${pct}%`;
  };
}

function attachShortProgress(video, slide) {
  const bar = slide.querySelector('.short-progress');
  video.ontimeupdate = () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    if (bar) bar.style.width = `${pct}%`;
  };
}

function scrollToNextShort() {
  const container = document.getElementById('shorts-container');
  const next = shortsCurrentIndex + 1;
  if (next < shortsFeed.length) {
    const slide = container.querySelector(`.short-slide[data-index="${next}"]`);
    if (slide) slide.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollToPrevShort() {
  const container = document.getElementById('shorts-container');
  const prev = shortsCurrentIndex - 1;
  if (prev >= 0) {
    const slide = container.querySelector(`.short-slide[data-index="${prev}"]`);
    if (slide) slide.scrollIntoView({ behavior: 'smooth' });
  }
}

document.getElementById('shorts-close-btn').onclick = closeShortsPlayer;
document.getElementById('shorts-up').onclick = scrollToPrevShort;
document.getElementById('shorts-down').onclick = scrollToNextShort;

document.addEventListener('keydown', e => {
  const shortsModal = document.getElementById('shorts-modal');
  if (shortsModal.classList.contains('hidden')) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    scrollToNextShort();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    scrollToPrevShort();
  } else if (e.key === 'Escape') {
    closeShortsPlayer();
  }
});

function renderHistory() {
  const list = document.getElementById('history-list');
  const history = getHistory();
  const votes = getVotes();

  list.innerHTML = '';

  if (!history.length) {
    list.innerHTML = '<p class="history-empty">No watch history yet.</p>';
    return;
  }

  history.forEach(item => {
    const video = allVideos.find(v => `videos/${v.src}` === item.src);
    if (!video) return;

    const vote = votes[video.src];
    const progress = item.progress || 0;
    const el = document.createElement('div');
    el.className = 'history-item';

    el.innerHTML = `
      <div class="history-thumb-wrapper">
        <video class="history-thumb" muted preload="metadata">
          <source src="videos/${video.src}" type="video/mp4">
        </video>
        <div class="duration-badge"></div>
        ${progress > 0 && progress < 1 ? `<div class="watched-bar" style="width:${progress * 100}%"></div>` : ''}
      </div>
      <div class="history-info">
        <div class="history-item-title">${video.src.replace('.mp4', '')}</div>
        <div class="history-item-meta">${channelNameHTML(video)} Watched ${timeAgo(item.timestamp)}</div>
        <div class="history-item-actions">
          <button class="thumb like ${vote === 'like' ? 'active' : ''}">
            <span class="thumb-icon">👍</span>
            <span>Like</span>
          </button>
          <button class="thumb dislike ${vote === 'dislike' ? 'active' : ''}">
            <span class="thumb-icon">👎</span>
            <span>Dislike</span>
          </button>
          ${subscribeBtnHTML(video)}
        </div>
      </div>
      <button class="history-remove-btn" title="Remove from watch history">✕</button>
    `;

    const histThumb = el.querySelector('.history-thumb');
    const histBadge = el.querySelector('.duration-badge');
    attachDurationBadge(histThumb, histBadge);

    histThumb.onclick = () => playVideo(`videos/${video.src}`);
    el.querySelector('.history-item-title').onclick = () => playVideo(`videos/${video.src}`);

    el.querySelector('.like').onclick = e => {
      e.stopPropagation();
      setVote(video.src, vote === 'like' ? null : 'like');
      renderHistory();
    };

    el.querySelector('.dislike').onclick = e => {
      e.stopPropagation();
      setVote(video.src, vote === 'dislike' ? null : 'dislike');
      renderHistory();
    };

    const subBtn = el.querySelector('.subscribe-btn');
    if (subBtn) {
      subBtn.onclick = e => {
        e.stopPropagation();
        const key = subBtn.dataset.channel;
        const nowSubbed = toggleSubscribe(key);
        subBtn.textContent = nowSubbed ? 'Subscribed' : 'Subscribe';
        subBtn.classList.toggle('subscribed', nowSubbed);
      };
    }

    el.querySelector('.history-remove-btn').onclick = e => {
      e.stopPropagation();
      removeFromHistory(`videos/${video.src}`);
      renderHistory();
    };

    list.appendChild(el);
  });
}

document.getElementById('clear-history-btn').onclick = () => {
  if (confirm('Clear all watch history?')) {
    clearHistory();
    renderHistory();
  }
};

document.querySelectorAll('.sidebar-item').forEach(item => {
  item.onclick = e => {
    if (item.dataset.page === 'live') return;
    e.preventDefault();
    showPage(item.dataset.page);
  };
});

function closeSidebarOnMobile() {
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.add('collapsed');
    document.getElementById('sidebar-overlay').classList.remove('active');
  }
}

function openSidebarOnMobile() {
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('collapsed');
    document.getElementById('sidebar-overlay').classList.add('active');
  }
}

document.getElementById('menu-toggle').onclick = () => {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    if (sidebar.classList.contains('collapsed')) {
      openSidebarOnMobile();
    } else {
      closeSidebarOnMobile();
    }
  } else {
    sidebar.classList.toggle('collapsed');
  }
};

document.getElementById('sidebar-overlay').onclick = closeSidebarOnMobile;

function renderSkeletons(container) {
  container.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
      <div class="skeleton-thumb"></div>
      <div class="skeleton-info">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text">
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    `;
    container.appendChild(card);
  }
}

async function init() {
  renderSkeletons(document.getElementById('video-grid'));

  const data = await fetchJSON('videos/index.json');
  allVideos = data.videos;
  channels = data.channels || {};
  ads = await fetchJSON('commercials/index.json');

  initSubs();
  shuffle(allVideos);

  renderShortsShelf();

  showPage('home');

  setupSearch();
}

function setupSearch() {
  const input = document.getElementById('video-search');
  const btn = document.getElementById('search-btn');
  const acBox = document.getElementById('autocomplete');

  function runSearch() {
    const q = input.value.trim().toLowerCase();
    hideAutocomplete();
    if (currentPage !== 'home') showPage('home');
    currentChannelFilter = null;
    document.getElementById('video-section').classList.remove('hidden');
    document.getElementById('video-grid').classList.remove('hidden');
    if (!q) {
      renderVideos(getRecommendations(), document.getElementById('video-grid'));
      return;
    }
    renderVideos(allVideos.filter(v => v.src.toLowerCase().includes(q)), document.getElementById('video-grid'));
  }

  function showAutocomplete(q) {
    const lower = q.toLowerCase();
    const matches = allVideos.filter(v => v.src.toLowerCase().includes(lower)).slice(0, 8);

    if (!matches.length) {
      hideAutocomplete();
      return;
    }

    acResults = matches;
    acSelectedIndex = -1;
    acBox.innerHTML = '';

    matches.forEach((video, idx) => {
      const ch = getChannelForVideo(video);
      const el = document.createElement('div');
      el.className = 'autocomplete-item';
      el.dataset.index = idx;
      el.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <span class="ac-text">${video.src.replace('.mp4', '')}</span>
        ${ch ? `<span class="ac-channel">${ch.name}</span>` : ''}
      `;
      el.onmousedown = (e) => {
        e.preventDefault();
        input.value = video.src.replace('.mp4', '');
        hideAutocomplete();
        runSearch();
      };
      acBox.appendChild(el);
    });

    acBox.classList.remove('hidden');
  }

  function hideAutocomplete() {
    acBox.classList.add('hidden');
    acSelectedIndex = -1;
  }

  function updateAcSelection() {
    acBox.querySelectorAll('.autocomplete-item').forEach((el, i) => {
      el.classList.toggle('selected', i === acSelectedIndex);
    });
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (q.length < 1) {
      hideAutocomplete();
      return;
    }
    showAutocomplete(q);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (acBox.classList.contains('hidden')) return;
      acSelectedIndex = Math.min(acSelectedIndex + 1, acResults.length - 1);
      updateAcSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (acBox.classList.contains('hidden')) return;
      acSelectedIndex = Math.max(acSelectedIndex - 1, 0);
      updateAcSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (acSelectedIndex >= 0 && acResults[acSelectedIndex]) {
        input.value = acResults[acSelectedIndex].src.replace('.mp4', '');
        hideAutocomplete();
      }
      runSearch();
    } else if (e.key === 'Escape') {
      hideAutocomplete();
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(hideAutocomplete, 150);
  });

  btn.onclick = runSearch;
}

function attachHoverPreview(thumb, videoSrc) {
  thumb.addEventListener('mouseenter', () => {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      if (hoverVideo) {
        hoverVideo.pause();
        hoverVideo.remove();
        hoverVideo = null;
      }
      const preview = document.createElement('video');
      preview.src = videoSrc;
      preview.muted = true;
      preview.playsInline = true;
      preview.className = 'video-thumb';
      preview.style.position = 'absolute';
      preview.style.inset = '0';
      preview.style.zIndex = '2';
      thumb.parentElement.appendChild(preview);
      preview.play().catch(() => {});
      hoverVideo = preview;
      setTimeout(() => {
        if (hoverVideo === preview) {
          preview.pause();
          preview.remove();
          hoverVideo = null;
        }
      }, 4000);
    }, 600);
  });

  thumb.addEventListener('mouseleave', () => {
    clearTimeout(hoverTimer);
    if (hoverVideo) {
      hoverVideo.pause();
      hoverVideo.remove();
      hoverVideo = null;
    }
  });
}

function renderVideos(videos, container) {
  if (!container) container = document.getElementById('video-grid');
  container.innerHTML = '';

  if (!videos.length) {
    container.innerHTML = '<p class="history-empty">No results found.</p>';
    return;
  }

  const votes = getVotes();
  const history = getHistory();
  const watchedSrcs = new Set(history.map(h => h.src));

  videos.forEach(video => {
    const vote = votes[video.src];
    const views = getViews(video);
    const uploaded = getUploadDate(video);
    const watched = watchedSrcs.has(`videos/${video.src}`);
    const historyItem = history.find(h => h.src === `videos/${video.src}`);
    const progress = historyItem ? historyItem.progress : 0;

    const card = document.createElement('div');
    card.className = 'video-card';

    card.innerHTML = `
      <div class="thumb-wrapper">
        <video class="video-thumb" muted preload="metadata">
          <source src="videos/${video.src}" type="video/mp4">
        </video>
        <div class="duration-badge"></div>
        ${progress > 0 && progress < 1 ? `<div class="watched-bar" style="width:${progress * 100}%"></div>` : ''}
        ${watched && progress >= 1 ? '<div class="watched-check">Watched</div>' : ''}
      </div>
      <div class="video-info">
        ${channelAvatarHTML(video)}
        <div class="video-text">
          <div class="video-title">${video.src.replace('.mp4', '')}</div>
          <div class="video-meta">
            ${channelNameHTML(video)}
            <span class="meta-line">${formatViews(views)} • ${timeAgo(uploaded)}</span>
          </div>
          <div class="video-actions">
            <button class="thumb like ${vote === 'like' ? 'active' : ''}">
              <span class="thumb-icon">👍</span>
              <span>Like</span>
            </button>
            <button class="thumb dislike ${vote === 'dislike' ? 'active' : ''}">
              <span class="thumb-icon">👎</span>
              <span>Dislike</span>
            </button>
            ${subscribeBtnHTML(video)}
          </div>
        </div>
      </div>
    `;

    const thumb = card.querySelector('.video-thumb');
    const badge = card.querySelector('.duration-badge');
    attachDurationBadge(thumb, badge);

    thumb.onclick = () => playVideo(`videos/${video.src}`);
    attachHoverPreview(thumb, `videos/${video.src}`);

    card.querySelector('.like').onclick = e => {
      e.stopPropagation();
      setVote(video.src, vote === 'like' ? null : 'like');
      renderVideos(videos, container);
    };

    card.querySelector('.dislike').onclick = e => {
      e.stopPropagation();
      setVote(video.src, vote === 'dislike' ? null : 'dislike');
      renderVideos(videos, container);
    };

    const subBtn = card.querySelector('.subscribe-btn');
    if (subBtn) {
      subBtn.onclick = e => {
        e.stopPropagation();
        const key = subBtn.dataset.channel;
        const nowSubbed = toggleSubscribe(key);
        subBtn.textContent = nowSubbed ? 'Subscribed' : 'Subscribe';
        subBtn.classList.toggle('subscribed', nowSubbed);
      };
    }

    const chName = card.querySelector('.channel-name');
    if (chName) {
      chName.onclick = e => {
        e.stopPropagation();
        e.preventDefault();
        filterByChannel(chName.dataset.channel);
      };
    }

    container.appendChild(card);
  });
}

init();