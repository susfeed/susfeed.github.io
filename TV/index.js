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
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setSubs(subs) {
  localStorage.setItem('subscriptions', JSON.stringify(subs));
}

function isSubscribed(channelKey) {
  return getSubs().includes(channelKey);
}

function toggleSubscribe(channelKey) {
  let subs = getSubs();
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

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

function formatSubs(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M subscribers`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K subscribers`;
  return `${n} subscriber${n !== 1 ? 's' : ''}`;
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

function getChannelSubs(key) {
  const ch = channels[key];
  if (!ch) return 0;
  return 10_000 + (hashString('subs' + key) % 9_990_000);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function isShort(video) {
  return !!(video.channels && video.channels.includes('shorts'));
}

function scrollToTop() {
  window.scrollTo(0, 0);
}

function makeCache(compute) {
  let value = null;
  let dirty = true;
  return {
    get() {
      if (dirty || value === null) {
        value = compute();
        dirty = false;
      }
      return value;
    },
    invalidate() {
      dirty = true;
    }
  };
}

function watchedBarHTML(progress) {
  if (progress > 0 && progress < 1) {
    return `<div class="watched-bar" style="width:${progress * 100}%"></div>`;
  }
  return '';
}

function wireSubscribeBtn(btn) {
  if (!btn) return;
  btn.onclick = e => {
    e.stopPropagation();
    const key = btn.dataset.channel;
    const now = toggleSubscribe(key);
    btn.textContent = now ? 'Subscribed' : 'Subscribe';
    btn.classList.toggle('subscribed', now);
    invalidateRecommendations();
  };
}

function wireVoteButtons(scope, videoSrc, onChange) {
  const likeBtn = scope.querySelector('.thumb.like');
  const dislikeBtn = scope.querySelector('.thumb.dislike');
  const refresh = () => {
    const vote = getVotes()[videoSrc];
    if (likeBtn) likeBtn.classList.toggle('active', vote === 'like');
    if (dislikeBtn) dislikeBtn.classList.toggle('active', vote === 'dislike');
  };
  if (likeBtn) {
    likeBtn.onclick = e => {
      e.stopPropagation();
      const cur = getVotes()[videoSrc];
      setVote(videoSrc, cur === 'like' ? null : 'like');
      invalidateRecommendations();
      refresh();
      if (onChange) onChange();
    };
  }
  if (dislikeBtn) {
    dislikeBtn.onclick = e => {
      e.stopPropagation();
      const cur = getVotes()[videoSrc];
      setVote(videoSrc, cur === 'dislike' ? null : 'dislike');
      invalidateRecommendations();
      refresh();
      if (onChange) onChange();
    };
  }
  refresh();
}

let allVideos = [];
let ads = [];
let channels = {};
let acSelectedIndex = -1;
let acResults = [];

let shortsFeed = [];
let shortsAdEvery = 4;

let homeFeed = [];
let homeFeedIndex = 0;
let homeFeedBatch = 12;
let infiniteObserver = null;

let autoplayTimer = null;
let autoplayCountdown = 5;

let activeWatchPlayer = null;
let watchSkipTimer = null;

let shortsResumeIndex = 0;

function computeRecommendations() {
  const nonShortsVideos = allVideos.filter(v => !isShort(v));

  const votes = getVotes();
  const likedChannels = {};
  const dislikedChannels = {};

  for (const [src, vote] of Object.entries(votes)) {
    const video = allVideos.find(v => v.src === src);
    if (!video || !video.channels) continue;
    for (const key of video.channels) {
      if (key === 'shorts') continue;
      if (vote === 'like') likedChannels[key] = (likedChannels[key] || 0) + 1;
      if (vote === 'dislike') dislikedChannels[key] = (dislikedChannels[key] || 0) + 1;
    }
  }

  const subs = getSubs();
  subs.forEach(key => {
    likedChannels[key] = (likedChannels[key] || 0) + 2;
  });

  const hasSignal = Object.keys(likedChannels).length > 0 || Object.keys(dislikedChannels).length > 0;
  if (!hasSignal) return nonShortsVideos.slice();

  const scored = nonShortsVideos.map(video => {
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

function computeShortsRecommendations() {
  const shorts = allVideos.filter(v => isShort(v));
  const votes = getVotes();

  const likedChannels = {};
  const dislikedChannels = {};

  for (const [src, vote] of Object.entries(votes)) {
    const video = allVideos.find(v => v.src === src);
    if (!video || !video.channels) continue;
    for (const key of video.channels) {
      if (key === 'shorts') continue;
      if (vote === 'like') likedChannels[key] = (likedChannels[key] || 0) + 1;
      if (vote === 'dislike') dislikedChannels[key] = (dislikedChannels[key] || 0) + 1;
    }
  }

  const scored = shorts.map(video => {
    let score = 0;
    if (video.channels) {
      for (const key of video.channels) {
        if (key === 'shorts') continue;
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

const recCache = makeCache(computeRecommendations);
const shortsCache = makeCache(computeShortsRecommendations);

function getRecommendations() {
  return recCache.get();
}

function getShortsRecommendations() {
  return shortsCache.get();
}

function invalidateRecommendations() {
  recCache.invalidate();
  shortsCache.invalidate();
}

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
  return `<img class="channel-avatar" src="img/${ch.logo}" alt="${ch.name}" data-channel="${ch.key}" onerror="this.style.display='none'">`;
}

function channelNameHTML(video) {
  const ch = getChannelForVideo(video);
  if (!ch) return '';
  return `<a class="channel-name" href="#/channel/${ch.key}" data-channel="${ch.key}">${ch.name}</a>`;
}

function subscribeBtnHTML(video) {
  const ch = getChannelForVideo(video);
  if (!ch) return '';
  const subbed = isSubscribed(ch.key);
  return `<button class="subscribe-btn ${subbed ? 'subscribed' : ''}" data-channel="${ch.key}">${subbed ? 'Subscribed' : 'Subscribe'}</button>`;
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

function pauseAllMedia() {
  document.querySelectorAll('video').forEach(v => {
    try {
      if (!v.paused) v.pause();
    } catch {}
  });
}

function clearWatchSkipTimer() {
  if (watchSkipTimer) {
    clearTimeout(watchSkipTimer);
    watchSkipTimer = null;
  }
}

function navigate(path, replace) {
  const target = path.startsWith('#') ? path : `#${path}`;
  const url = `${location.pathname}${location.search}${target}`;
  if (replace) history.replaceState({}, '', url);
  else history.pushState({}, '', url);
  route();
}

function route() {
  destroyInfiniteScroll();
  clearAutoplayTimer();
  clearWatchSkipTimer();

  const hash = location.hash || '';
  const isWatchRoute = hash.startsWith('#/watch/');
  const isShortsRoute = hash.startsWith('#/shorts');

  if (!isWatchRoute && !isShortsRoute) {
    pauseAllMedia();
  }

  if (isWatchRoute) {
    const src = decodeURIComponent(hash.slice('#/watch/'.length));
    showWatchPage(src);
    return;
  }
  if (hash.startsWith('#/channel/')) {
    const key = decodeURIComponent(hash.slice('#/channel/'.length));
    showChannelPage(key);
    return;
  }
  if (isShortsRoute) {
    openShortsPlayer();
    return;
  }
  if (hash.startsWith('#/search/')) {
    const q = decodeURIComponent(hash.slice('#/search/'.length));
    document.getElementById('video-search').value = q;
    runSearchInternal(q);
    return;
  }
  if (hash.startsWith('#/page/')) {
    const page = hash.slice('#/page/'.length);
    showPage(page);
    return;
  }

  showPage('home');
}

function showPage(page) {
  destroyInfiniteScroll();
  scrollToTop();

  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  document.getElementById('shorts-shelf').classList.add('hidden');
  document.getElementById('video-section').classList.add('hidden');
  document.getElementById('subscriptions-section').classList.add('hidden');
  document.getElementById('history-section').classList.add('hidden');
  document.getElementById('watch-section').classList.add('hidden');
  document.getElementById('channel-section').classList.add('hidden');

  if (page === 'home') {
    document.getElementById('shorts-shelf').classList.remove('hidden');
    document.getElementById('video-section').classList.remove('hidden');
    renderShortsShelf();
    startHomeFeed();
  } else if (page === 'shorts') {
    openShortsPlayer();
    return;
  } else if (page === 'subscriptions') {
    document.getElementById('subscriptions-section').classList.remove('hidden');
    renderSubscriptions();
  } else if (page === 'history') {
    document.getElementById('history-section').classList.remove('hidden');
    renderHistory();
  } else if (page === 'liked') {
    const votes = getVotes();
    document.getElementById('video-section').classList.remove('hidden');
    const liked = allVideos.filter(v => votes[v.src] === 'like' && !isShort(v));
    renderVideos(liked, document.getElementById('video-grid'));
  } else if (page === 'disliked') {
    const votes = getVotes();
    document.getElementById('video-section').classList.remove('hidden');
    const disliked = allVideos.filter(v => votes[v.src] === 'dislike' && !isShort(v));
    renderVideos(disliked, document.getElementById('video-grid'));
  }

  closeSidebarOnMobile();
}

function startHomeFeed() {
  const grid = document.getElementById('video-grid');
  homeFeed = getRecommendations();
  homeFeedIndex = 0;
  grid.innerHTML = '';
  appendHomeBatch();
  setupInfiniteScroll(appendHomeBatch);
}

function appendHomeBatch() {
  const grid = document.getElementById('video-grid');
  const batch = homeFeed.slice(homeFeedIndex, homeFeedIndex + homeFeedBatch);
  if (!batch.length) return;
  renderVideos(batch, grid, true);
  homeFeedIndex += homeFeedBatch;
}

function setupInfiniteScroll(loader) {
  destroyInfiniteScroll();
  const sentinel = document.getElementById('scroll-sentinel');
  if (!sentinel) return;
  infiniteObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) loader();
    });
  }, { rootMargin: '600px' });
  infiniteObserver.observe(sentinel);
}

function destroyInfiniteScroll() {
  if (infiniteObserver) {
    infiniteObserver.disconnect();
    infiniteObserver = null;
  }
}

function renderSubscriptions() {
  const subs = getSubs();
  const chContainer = document.getElementById('subs-channels');
  const feed = document.getElementById('subs-feed');
  const shortsBlock = document.getElementById('subs-shorts');
  const shortsRow = document.getElementById('subs-shorts-row');

  chContainer.innerHTML = '';
  feed.innerHTML = '';
  shortsRow.innerHTML = '';
  shortsBlock.classList.add('hidden');

  if (!subs.length) {
    feed.innerHTML = '<p class="history-empty">You are not subscribed to any channels. Subscribe to see their videos here.</p>';
    return;
  }

  function renderChannelFeed(key) {
    const vids = allVideos.filter(v =>
      v.channels &&
      v.channels.includes(key) &&
      !v.channels.includes('shorts')
    );
    const sh = allVideos.filter(v =>
      v.channels &&
      v.channels.includes(key) &&
      v.channels.includes('shorts')
    );

    if (vids.length) {
      feed.classList.remove('hidden');
      renderVideos(vids, feed);
    } else {
      feed.innerHTML = '<p class="history-empty">No videos from this channel yet.</p>';
    }

    if (sh.length) {
      shortsBlock.classList.remove('hidden');
      shortsRow.innerHTML = '';
      sh.forEach(video => {
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
          <div class="short-views">${formatViews(getViews(video))}</div>
        `;
        const t = card.querySelector('.short-thumb');
        const b = card.querySelector('.duration-badge');
        attachDurationBadge(t, b);
        card.onclick = () => openShortsPlayer(video.src);
        shortsRow.appendChild(card);
      });
    } else {
      shortsBlock.classList.add('hidden');
    }
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
      renderChannelFeed(key);
    };
    chContainer.appendChild(el);
  });

  const first = chContainer.querySelector('.subs-channel');
  if (first) {
    first.classList.add('active');
    renderChannelFeed(subs[0]);
  }
}

function renderShortsShelf() {
  const row = document.getElementById('shorts-row');
  row.innerHTML = '';
  const shorts = getShortsRecommendations();

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
  const shorts = getShortsRecommendations();
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
    const target = startSrc.startsWith('videos/') ? startSrc : `videos/${startSrc}`;
    const idx = shortsFeed.findIndex(item => item.type === 'video' && `videos/${item.video.src}` === target);
    if (idx > 0) {
      shortsFeed = shortsFeed.slice(idx).concat(shortsFeed.slice(0, idx));
    }
  }
}

let shortsCurrentIndex = 0;
let shortsObserver = null;

function openShortsPlayer(startSrc) {
  if (!location.hash.startsWith('#/shorts')) {
    history.pushState({}, '', `${location.pathname}${location.search}#/shorts`);
  }

  const modal = document.getElementById('shorts-modal');
  const container = document.getElementById('shorts-container');
  const wasOpen = !modal.classList.contains('hidden');

  if (startSrc) {
    buildShortsFeed(startSrc);
    shortsCurrentIndex = 0;
    shortsResumeIndex = 0;
  } else if (!wasOpen) {
    if (shortsFeed.length === 0) {
      buildShortsFeed();
      shortsResumeIndex = 0;
    }
    shortsCurrentIndex = Math.min(shortsResumeIndex, Math.max(0, shortsFeed.length - 1));
  }

  modal.classList.remove('hidden');

  renderShortsSlides();

  requestAnimationFrame(() => {
    const slide = container.querySelector(`.short-slide[data-index="${shortsCurrentIndex}"]`);
    if (slide) {
      container.scrollTop = slide.offsetTop;
    } else {
      container.scrollTop = 0;
    }
    setTimeout(() => setupShortsObserver(), 50);
  });
}

function closeShortsPlayer() {
  const modal = document.getElementById('shorts-modal');
  const container = document.getElementById('shorts-container');

  shortsResumeIndex = shortsCurrentIndex;

  container.querySelectorAll('video').forEach(v => {
    v.pause();
    v.removeAttribute('src');
    v.load();
  });

  modal.classList.add('hidden');

  if (shortsObserver) {
    shortsObserver.disconnect();
    shortsObserver = null;
  }

  if (location.hash.startsWith('#/shorts')) {
    navigate('/', true);
  }
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
      const votes = getVotes();
      const likeActive = votes[video.src] === 'like' ? 'active' : '';
      const dislikeActive = votes[video.src] === 'dislike' ? 'active' : '';
      slide.innerHTML = `
        <video playsinline loop preload="metadata">
          <source src="videos/${video.src}" type="video/mp4">
        </video>
        <div class="short-overlay">
          <div class="short-overlay-title">${video.src.replace('.mp4', '')}</div>
          ${ch ? `
            <div class="short-overlay-channel" data-channel="${ch.key}">
              <img class="short-overlay-avatar" src="img/${ch.logo}" alt="${ch.name}" onerror="this.style.display='none'">
              <span class="short-overlay-name">${ch.name}</span>
              <button class="short-overlay-sub ${subbed ? 'subscribed' : ''}" data-channel="${ch.key}">
                ${subbed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>
          ` : ''}
        </div>
        <div class="short-actions">
          <div class="short-action like-action ${likeActive}" data-src="${video.src}">
            <div class="short-action-icon">👍</div>
            <span>Like</span>
          </div>
          <div class="short-action dislike-action ${dislikeActive}" data-src="${video.src}">
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
      invalidateRecommendations();
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
      invalidateRecommendations();
    };
  });

  container.querySelectorAll('.short-overlay-sub').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      const key = el.dataset.channel;
      const nowSubbed = toggleSubscribe(key);
      el.textContent = nowSubbed ? 'Subscribed' : 'Subscribe';
      el.classList.toggle('subscribed', nowSubbed);
      invalidateRecommendations();
    };
  });

  container.querySelectorAll('.short-overlay-channel').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      const key = el.dataset.channel;
      if (!key) return;
      closeShortsPlayer();
      navigate(`#/channel/${key}`);
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
        shortsResumeIndex = idx;
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

  const interval = setInterval(() => {
    remaining--;
    if (timerEl) timerEl.textContent = `${Math.max(remaining, 0)}s`;
    if (remaining <= 0) clearInterval(interval);
  }, 1000);

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

function renderHistory() {
  const list = document.getElementById('history-list');
  const history = getHistory();

  list.innerHTML = '';

  if (!history.length) {
    list.innerHTML = '<p class="history-empty">No watch history yet.</p>';
    return;
  }

  history.forEach(item => {
    const video = allVideos.find(v => `videos/${v.src}` === item.src);
    if (!video) return;

    const progress = item.progress || 0;
    const el = document.createElement('div');
    el.className = 'history-item';

    el.innerHTML = `
      <div class="history-thumb-wrapper">
        <video class="history-thumb" muted preload="metadata">
          <source src="videos/${video.src}" type="video/mp4">
        </video>
        <div class="duration-badge"></div>
        ${watchedBarHTML(progress)}
      </div>
      <div class="history-info">
        <div class="history-item-title">${video.src.replace('.mp4', '')}</div>
        <div class="history-item-meta">${channelNameHTML(video)} Watched ${timeAgo(item.timestamp)}</div>
        <div class="history-item-actions">
          <button class="thumb like">
            <span class="thumb-icon">👍</span>
            <span>Like</span>
          </button>
          <button class="thumb dislike">
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

    histThumb.onclick = () => navigate(`#/watch/${encodeURIComponent(`videos/${video.src}`)}`);
    el.querySelector('.history-item-title').onclick = () => navigate(`#/watch/${encodeURIComponent(`videos/${video.src}`)}`);

    wireVoteButtons(el.querySelector('.history-item-actions'), video.src, renderHistory);
    wireSubscribeBtn(el.querySelector('.subscribe-btn'));

    const chName = el.querySelector('.channel-name');
    if (chName) {
      chName.onclick = e => {
        e.stopPropagation();
        e.preventDefault();
        navigate(`#/channel/${chName.dataset.channel}`);
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

function showWatchPage(videoSrc) {
  const src = videoSrc.startsWith('videos/') ? videoSrc : `videos/${videoSrc}`;
  const video = allVideos.find(v => `videos/${v.src}` === src);
  if (!video) {
    navigate('/', true);
    return;
  }

  const existingPlayer = document.getElementById('watch-player');
  const existingSrc = existingPlayer ? existingPlayer.dataset.currentSrc : null;

  if (existingPlayer && existingSrc === src) {
    return;
  }

  destroyInfiniteScroll();
  clearAutoplayTimer();
  clearWatchSkipTimer();
  scrollToTop();

  if (activeWatchPlayer) {
    try {
      activeWatchPlayer.pause();
      activeWatchPlayer.removeAttribute('src');
      activeWatchPlayer.load();
    } catch {}
    activeWatchPlayer = null;
  }

  document.getElementById('shorts-shelf').classList.add('hidden');
  document.getElementById('video-section').classList.add('hidden');
  document.getElementById('subscriptions-section').classList.add('hidden');
  document.getElementById('history-section').classList.add('hidden');
  document.getElementById('channel-section').classList.add('hidden');
  const watchSection = document.getElementById('watch-section');
  watchSection.classList.remove('hidden');

  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));

  const ch = getChannelForVideo(video);
  const vote = getVotes()[video.src];
  const views = getViews(video);
  const uploaded = getUploadDate(video);
  const subbed = ch ? isSubscribed(ch.key) : false;
  const historyItem = getHistory().find(h => h.src === src);
  const progress = historyItem ? historyItem.progress : 0;

  const recs = allVideos
    .filter(v => !isShort(v) && v.src !== video.src)
    .map(v => {
      let score = 0;
      if (ch && v.channels && v.channels.includes(ch.key)) score += 5;
      score += Math.random() * 2;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(s => s.v);

  watchSection.innerHTML = `
    <div class="watch-main">
      <div class="watch-player-wrap ambient" id="watch-player-wrap">
        <video id="watch-player" controls playsinline preload="metadata" data-current-src="${src}"></video>
        <button class="watch-skip-btn hidden" id="watch-skip-btn">Skip Ad</button>
        <div class="autoplay-overlay hidden" id="autoplay-overlay">
          <div class="autoplay-title" id="autoplay-title">Up next</div>
          <div class="autoplay-countdown" id="autoplay-countdown">5</div>
          <div class="autoplay-actions">
            <button id="autoplay-cancel">Cancel</button>
            <button id="autoplay-play">Play now</button>
          </div>
        </div>
      </div>
      <h1 class="watch-title">${video.src.replace('.mp4', '')}</h1>
      <div class="watch-meta">${formatViews(views)} • ${formatDate(uploaded)}</div>
      <div class="watch-channel-row">
        ${ch ? `<img class="watch-channel-avatar" src="img/${ch.logo}" alt="${ch.name}" onerror="this.style.display='none'" data-channel="${ch.key}">` : '<div class="watch-channel-avatar"></div>'}
        <div class="watch-channel-info" ${ch ? `data-channel="${ch.key}"` : ''}>
          <div class="watch-channel-name">${ch ? ch.name : 'Unknown'}</div>
          <div class="watch-channel-subs">${ch ? formatSubs(getChannelSubs(ch.key)) : ''}</div>
        </div>
        ${ch ? `<button class="subscribe-btn ${subbed ? 'subscribed' : ''}" data-channel="${ch.key}">${subbed ? 'Subscribed' : 'Subscribe'}</button>` : ''}
        <div class="watch-actions">
          <button class="thumb like ${vote === 'like' ? 'active' : ''}">
            <span class="thumb-icon">👍</span>
            <span>Like</span>
          </button>
          <button class="thumb dislike ${vote === 'dislike' ? 'active' : ''}">
            <span class="thumb-icon">👎</span>
            <span>Dislike</span>
          </button>
        </div>
      </div>
      <div class="watch-desc">Uploaded ${timeAgo(uploaded)} • ${formatViews(views)}
${ch ? '\nChannel: ' + ch.name : ''}</div>
    </div>
    <aside class="watch-sidebar">
      <div class="watch-sidebar-title">Up next</div>
      <div class="watch-recs" id="watch-recs"></div>
    </aside>
  `;

  const player = document.getElementById('watch-player');
  activeWatchPlayer = player;
  const skipBtn = document.getElementById('watch-skip-btn');

  const ad = ads.length ? ads[Math.floor(Math.random() * ads.length)] : null;
  const playlist = ad ? [`commercials/${ad}`, src] : [src];
  let adIndex = 0;

  player.controls = true;
  player.playsInline = true;
  player.src = playlist[adIndex];

  if (ad) {
    watchSkipTimer = setTimeout(() => {
      skipBtn.classList.remove('hidden');
    }, 5000);
  }

  skipBtn.onclick = () => {
    clearWatchSkipTimer();
    skipBtn.classList.add('hidden');
    if (adIndex === 0 && ad) {
      adIndex = 1;
      player.src = playlist[adIndex];
      player.play().catch(() => {});
    }
  };

  player.addEventListener('loadedmetadata', () => {
    if (adIndex === 0 && ad) return;
    if (progress > 0 && progress < 1) {
      try { player.currentTime = progress * player.duration; } catch {}
    }
  });

  let lastSaved = 0;
  player.ontimeupdate = () => {
    if (adIndex === 0 && ad) return;
    if (!player.duration) return;
    const pct = player.currentTime / player.duration;
    if (Math.abs(pct - lastSaved) > 0.02) {
      lastSaved = pct;
      updateProgress(src, pct);
    }
  };

  player.onended = () => {
    adIndex++;
    if (adIndex < playlist.length) {
      clearWatchSkipTimer();
      skipBtn.classList.add('hidden');
      player.src = playlist[adIndex];
      player.play().catch(() => {});
      return;
    }
    updateProgress(src, 1);
    startAutoplay(recs[0]);
  };

  player.play().catch(() => {});

  addToHistory(src);

  wireSubscribeBtn(watchSection.querySelector('.subscribe-btn'));
  wireVoteButtons(watchSection.querySelector('.watch-actions'), video.src);

  watchSection.querySelectorAll('.watch-channel-avatar, .watch-channel-info').forEach(el => {
    el.style.cursor = 'pointer';
    el.onclick = () => {
      const key = el.dataset.channel;
      if (key) navigate(`#/channel/${key}`);
    };
  });

  const recsContainer = document.getElementById('watch-recs');
  recs.forEach(r => {
    const rch = getChannelForVideo(r);
    const card = document.createElement('div');
    card.className = 'rec-card';
    card.innerHTML = `
      <div class="rec-thumb-wrap">
        <video muted preload="metadata">
          <source src="videos/${r.src}" type="video/mp4">
        </video>
        <div class="duration-badge"></div>
      </div>
      <div class="rec-info">
        <div class="rec-title">${r.src.replace('.mp4', '')}</div>
        <div class="rec-meta">${rch ? rch.name : ''}<br>${formatViews(getViews(r))} • ${timeAgo(getUploadDate(r))}</div>
      </div>
    `;
    const rv = card.querySelector('video');
    const rb = card.querySelector('.duration-badge');
    attachDurationBadge(rv, rb);
    card.onclick = () => navigate(`#/watch/${encodeURIComponent(`videos/${r.src}`)}`);
    recsContainer.appendChild(card);
  });
}

function startAutoplay(nextVideo) {
  if (!nextVideo) return;
  const overlay = document.getElementById('autoplay-overlay');
  const titleEl = document.getElementById('autoplay-title');
  const countEl = document.getElementById('autoplay-countdown');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  titleEl.textContent = nextVideo.src.replace('.mp4', '');
  autoplayCountdown = 5;
  countEl.textContent = autoplayCountdown;

  autoplayTimer = setInterval(() => {
    autoplayCountdown--;
    countEl.textContent = autoplayCountdown;
    if (autoplayCountdown <= 0) {
      clearAutoplayTimer();
      navigate(`#/watch/${encodeURIComponent(`videos/${nextVideo.src}`)}`);
    }
  }, 1000);

  document.getElementById('autoplay-cancel').onclick = e => {
    e.stopPropagation();
    clearAutoplayTimer();
    overlay.classList.add('hidden');
  };

  document.getElementById('autoplay-play').onclick = e => {
    e.stopPropagation();
    clearAutoplayTimer();
    navigate(`#/watch/${encodeURIComponent(`videos/${nextVideo.src}`)}`);
  };
}

function clearAutoplayTimer() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function showChannelPage(channelKey) {
  const ch = channels[channelKey];
  if (!ch) {
    navigate('/', true);
    return;
  }

  destroyInfiniteScroll();
  clearAutoplayTimer();
  clearWatchSkipTimer();
  scrollToTop();

  document.getElementById('shorts-shelf').classList.add('hidden');
  document.getElementById('video-section').classList.add('hidden');
  document.getElementById('subscriptions-section').classList.add('hidden');
  document.getElementById('history-section').classList.add('hidden');
  document.getElementById('watch-section').classList.add('hidden');
  const section = document.getElementById('channel-section');
  section.classList.remove('hidden');

  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));

  const subbed = isSubscribed(channelKey);
  const vids = allVideos.filter(v => v.channels && v.channels.includes(channelKey) && !v.channels.includes('shorts'));
  const shorts = allVideos.filter(v => v.channels && v.channels.includes(channelKey) && v.channels.includes('shorts'));
  const totalVideos = vids.length + shorts.length;
  const totalViews = vids.reduce((sum, v) => sum + getViews(v), 0);

  section.innerHTML = `
    <div class="channel-banner"${ch.banner ? ` style="background-image:url('img/${ch.banner}')"` : ''}></div>
    <div class="channel-header">
      <img class="channel-big-avatar" src="img/${ch.logo}" alt="${ch.name}" onerror="this.style.display='none'">
      <div class="channel-details">
        <h1 class="channel-name-big">${ch.name}</h1>
        <div class="channel-stats">@${channelKey} • ${formatSubs(getChannelSubs(channelKey))} • ${totalVideos} videos • ${formatViews(totalViews)}</div>
        <div class="channel-desc">Welcome to ${ch.name}. Subscribe for more content.</div>
      </div>
      <button class="subscribe-btn ${subbed ? 'subscribed' : ''}" id="channel-sub-btn">${subbed ? 'Subscribed' : 'Subscribe'}</button>
    </div>
    <div class="channel-tabs">
      <div class="channel-tab active" data-tab="videos">Videos</div>
      ${shorts.length ? '<div class="channel-tab" data-tab="shorts">Shorts</div>' : ''}
      <div class="channel-tab" data-tab="about">About</div>
    </div>
    <div id="channel-tab-content"></div>
  `;

  document.getElementById('channel-sub-btn').onclick = () => {
    const now = toggleSubscribe(channelKey);
    const btn = document.getElementById('channel-sub-btn');
    btn.textContent = now ? 'Subscribed' : 'Subscribe';
    btn.classList.toggle('subscribed', now);
    invalidateRecommendations();
  };

  const tabContent = document.getElementById('channel-tab-content');

  function renderTab(tab) {
    if (tab === 'videos') {
      tabContent.innerHTML = '<div class="video-grid" id="channel-grid"></div>';
      const grid = document.getElementById('channel-grid');
      if (vids.length) renderVideos(vids, grid);
      else grid.innerHTML = '<p class="history-empty">No videos yet.</p>';
    } else if (tab === 'shorts') {
      tabContent.innerHTML = '<div class="shorts-row" id="channel-shorts"></div>';
      const row = document.getElementById('channel-shorts');
      shorts.forEach(video => {
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
          <div class="short-views">${formatViews(getViews(video))}</div>
        `;
        const t = card.querySelector('.short-thumb');
        const b = card.querySelector('.duration-badge');
        attachDurationBadge(t, b);
        card.onclick = () => openShortsPlayer(video.src);
        row.appendChild(card);
      });
    } else if (tab === 'about') {
      tabContent.innerHTML = `
        <div class="watch-desc">
          <strong>About ${ch.name}</strong>
          <p>Channel handle: @${channelKey}</p>
          <p>Subscribers: ${formatSubs(getChannelSubs(channelKey))}</p>
          <p>Total videos: ${totalVideos}</p>
          <p>Total views: ${formatViews(totalViews)}</p>
        </div>
      `;
    }
  }

  section.querySelectorAll('.channel-tab').forEach(tab => {
    tab.onclick = () => {
      section.querySelectorAll('.channel-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderTab(tab.dataset.tab);
    };
  });

  renderTab('videos');
}

document.getElementById('clear-history-btn').onclick = () => {
  if (confirm('Clear all watch history?')) {
    clearHistory();
    renderHistory();
  }
};

document.getElementById('logo-link').onclick = e => {
  e.preventDefault();
  navigate('/');
};

document.querySelectorAll('.sidebar-item').forEach(item => {
  item.onclick = e => {
    if (item.dataset.page === 'live') return;
    e.preventDefault();
    const page = item.dataset.page;
    if (page === 'home') navigate('/');
    else if (page === 'shorts') navigate('#/shorts');
    else navigate(`#/page/${page}`);
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
    if (sidebar.classList.contains('collapsed')) openSidebarOnMobile();
    else closeSidebarOnMobile();
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

  shuffle(allVideos);

  document.getElementById('shorts-close-btn').onclick = closeShortsPlayer;
  document.getElementById('shorts-up').onclick = scrollToPrevShort;
  document.getElementById('shorts-down').onclick = scrollToNextShort;

  document.addEventListener('keydown', e => {
    const shortsModal = document.getElementById('shorts-modal');
    if (!shortsModal.classList.contains('hidden')) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToNextShort();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToPrevShort();
      } else if (e.key === 'Escape') {
        closeShortsPlayer();
      }
    }
  });

  window.addEventListener('pagehide', pauseAllMedia);
  window.addEventListener('beforeunload', pauseAllMedia);

  setupShortsSwipe();
  setupSearch();

  window.addEventListener('popstate', route);

  route();
}

function setupShortsSwipe() {
  const container = document.getElementById('shorts-container');
  let touchStartY = 0;
  let touchEndY = 0;

  container.addEventListener('touchstart', e => {
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  container.addEventListener('touchend', e => {
    touchEndY = e.changedTouches[0].screenY;
    const diff = touchStartY - touchEndY;
    if (Math.abs(diff) > 60) {
      if (diff > 0) scrollToNextShort();
      else scrollToPrevShort();
    }
  }, { passive: true });

  let wheelLocked = false;
  container.addEventListener('wheel', e => {
    if (wheelLocked) return;
    if (Math.abs(e.deltaY) < 20) return;
    wheelLocked = true;
    if (e.deltaY > 0) scrollToNextShort();
    else scrollToPrevShort();
    setTimeout(() => { wheelLocked = false; }, 600);
  }, { passive: true });
}

function setupSearch() {
  const input = document.getElementById('video-search');
  const btn = document.getElementById('search-btn');
  const acBox = document.getElementById('autocomplete');

  function runSearch() {
    const q = input.value.trim();
    hideAutocomplete();
    if (!q) {
      navigate('/');
      return;
    }
    navigate(`#/search/${encodeURIComponent(q)}`);
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
        ${isShort(video) ? '<span class="ac-channel">Short</span>' : (ch ? `<span class="ac-channel">${ch.name}</span>` : '')}
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

function runSearchInternal(q) {
  destroyInfiniteScroll();
  scrollToTop();

  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));

  document.getElementById('shorts-shelf').classList.add('hidden');
  document.getElementById('subscriptions-section').classList.add('hidden');
  document.getElementById('history-section').classList.add('hidden');
  document.getElementById('watch-section').classList.add('hidden');
  document.getElementById('channel-section').classList.add('hidden');
  document.getElementById('video-section').classList.remove('hidden');

  const grid = document.getElementById('video-grid');
  const lower = q.toLowerCase();

  const shortsMatches = allVideos.filter(v => isShort(v) && v.src.toLowerCase().includes(lower));
  const videoMatches = allVideos.filter(v => !isShort(v) && v.src.toLowerCase().includes(lower));

  grid.innerHTML = '';

  if (shortsMatches.length) {
    const wrapper = document.createElement('div');
    wrapper.style.gridColumn = '1 / -1';
    wrapper.innerHTML = `
      <div class="shorts-header" style="margin-bottom:12px;">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <rect x="7" y="2" width="10" height="20" rx="2.5" fill="#ba1a1a"/>
          <path fill="#0f0f0f" d="M10.5 8.5v7l6-3.5z"/>
        </svg>
        <span class="shorts-title">Shorts</span>
      </div>
      <div class="shorts-row" id="search-shorts-row"></div>
    `;
    grid.appendChild(wrapper);

    const searchRow = wrapper.querySelector('#search-shorts-row');
    shortsMatches.forEach(video => {
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
        <div class="short-views">${formatViews(getViews(video))}</div>
      `;
      const t = card.querySelector('.short-thumb');
      const b = card.querySelector('.duration-badge');
      attachDurationBadge(t, b);
      card.onclick = () => openShortsPlayer(video.src);
      searchRow.appendChild(card);
    });
  }

  if (videoMatches.length) {
    const wrapper = document.createElement('div');
    wrapper.style.gridColumn = '1 / -1';
    wrapper.className = 'video-grid';
    if (shortsMatches.length) wrapper.style.marginTop = '24px';
    grid.appendChild(wrapper);
    renderVideos(videoMatches, wrapper);
  }

  if (!shortsMatches.length && !videoMatches.length) {
    grid.innerHTML = '<p class="history-empty">No results found.</p>';
  }
}

function attachHoverPreview(thumb, videoSrc) {
  const wrapper = thumb.parentElement;
  if (!wrapper) return;

  const preview = document.createElement('video');
  preview.muted = true;
  preview.playsInline = true;
  preview.preload = 'none';
  preview.loop = true;
  preview.className = 'video-thumb';
  preview.style.position = 'absolute';
  preview.style.inset = '0';
  preview.style.width = '100%';
  preview.style.height = '100%';
  preview.style.objectFit = 'cover';
  preview.style.zIndex = '2';
  preview.style.pointerEvents = 'none';
  preview.style.opacity = '0';
  preview.style.transition = 'opacity .15s ease';
  preview.style.display = 'none';

  const source = document.createElement('source');
  source.src = videoSrc;
  source.type = 'video/mp4';
  preview.appendChild(source);

  wrapper.appendChild(preview);

  let hoverTimer = null;
  let active = false;

  function show() {
    if (active) return;
    active = true;
    preview.style.display = 'block';
    preview.style.opacity = '1';
    try {
      if (preview.duration && isFinite(preview.duration) && preview.duration > 6) {
        preview.currentTime = Math.random() * (preview.duration - 5);
      } else if (preview.readyState >= 1) {
        preview.currentTime = 0;
      }
    } catch {}
    const p = preview.play();
    if (p && p.catch) p.catch(() => {});
  }

  function hide() {
    active = false;
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    preview.style.opacity = '0';
    setTimeout(() => {
      if (!active) preview.style.display = 'none';
    }, 150);
    try { preview.pause(); } catch {}
  }

  preview.addEventListener('loadedmetadata', () => {
    if (active) {
      try {
        const maxStart = Math.max(0, preview.duration - 5);
        if (maxStart > 0) preview.currentTime = Math.random() * maxStart;
      } catch {}
    }
  });

  wrapper.addEventListener('mouseenter', () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(show, 500);
  });

  wrapper.addEventListener('mouseleave', () => {
    hide();
  });
}

function renderVideos(videos, container, append) {
  if (!container) container = document.getElementById('video-grid');
  if (!append) container.innerHTML = '';

  if (!videos.length && !append) {
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
        ${watchedBarHTML(progress)}
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

    thumb.onclick = () => navigate(`#/watch/${encodeURIComponent(`videos/${video.src}`)}`);
    attachHoverPreview(thumb, `videos/${video.src}`);

    wireVoteButtons(card.querySelector('.video-actions'), video.src);
    wireSubscribeBtn(card.querySelector('.subscribe-btn'));

    const chName = card.querySelector('.channel-name');
    if (chName) {
      chName.onclick = e => {
        e.stopPropagation();
        e.preventDefault();
        navigate(`#/channel/${chName.dataset.channel}`);
      };
    }

    const chAvatar = card.querySelector('.channel-avatar');
    if (chAvatar && chAvatar.dataset.channel) {
      chAvatar.style.cursor = 'pointer';
      chAvatar.onclick = e => {
        e.stopPropagation();
        navigate(`#/channel/${chAvatar.dataset.channel}`);
      };
    }

    container.appendChild(card);
  });
}

init();