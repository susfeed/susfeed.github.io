// Home button
document.getElementById('home-btn').addEventListener('click', () => {
  window.location.href = '../index.html';
});

// Open program windows
const programs = document.querySelectorAll('.program-btn');
const windowsContainer = document.getElementById('windows-container');
const openProgramsBar = document.getElementById('open-programs');

const GRID_W = 120;
const GRID_H = 100;

// track occupied grid cells as "c{col}-r{row}"
const occupiedGrid = new Set();
const desktopEl = document.querySelector('.desktop');

function gridKey(col, row) {
  return `c${col}-r${row}`;
}
function rectToGrid(left, top) {
  return [Math.round(left / GRID_W), Math.round(top / GRID_H)];
}
function clampGrid(col, row) {
  const maxCol = Math.floor((desktopEl.clientWidth - 1) / GRID_W);
  const maxRow = Math.floor((desktopEl.clientHeight - 60 - 1) / GRID_H);
  return [
    Math.max(0, Math.min(col, maxCol)),
    Math.max(0, Math.min(row, maxRow)),
  ];
}
function findNearestFree(col, row) {
  // spiral search for nearest free slot
  const [c0, r0] = clampGrid(col, row);
  if (!occupiedGrid.has(gridKey(c0, r0))) return [c0, r0];

  const maxCol = Math.floor((desktopEl.clientWidth - 1) / GRID_W);
  const maxRow = Math.floor((desktopEl.clientHeight - 60 - 1) / GRID_H);
  const maxRadius = Math.max(maxCol, maxRow) + 2;

  for (let d = 1; d <= maxRadius; d++) {
    for (let dc = -d; dc <= d; dc++) {
      for (let dr of [-d, d]) {
        const [cc, rr] = clampGrid(c0 + dc, r0 + dr);
        if (!occupiedGrid.has(gridKey(cc, rr))) return [cc, rr];
      }
    }
    for (let dr = -d + 1; dr <= d - 1; dr++) {
      for (let dc of [-d, d]) {
        const [cc, rr] = clampGrid(c0 + dc, r0 + dr);
        if (!occupiedGrid.has(gridKey(cc, rr))) return [cc, rr];
      }
    }
  }
  // fallback
  return [c0, r0];
}
function occupy(col, row) {
  occupiedGrid.add(gridKey(col, row));
}
function release(col, row) {
  occupiedGrid.delete(gridKey(col, row));
}

let activePreviewEl = null;
function buildWindowPreview(win) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed; bottom: 60px; /* above taskbar */
    width: 320px; height: 200px;
    background: #111; color:#ddd; border:1px solid #333; border-radius:8px;
    overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.35);
    transform-origin: bottom left; pointer-events: none; z-index: 99999;
  `;

  // clone header + content lightly; scrub media
  const clone = win.cloneNode(true);
  // shrink everything to fit
  clone.style.cssText = 'transform: scale(0.5); transform-origin: top left; width: 200%; height: 200%; pointer-events:none;';
  // keep it from being huge
  clone.querySelectorAll('*').forEach(n => (n.style && (n.style.pointerEvents = 'none')));

  // Mute <video>/<audio> if any (in COS Browser etc.)
  clone.querySelectorAll('video,audio').forEach(m => {
    try { m.muted = true; m.autoplay = false; m.pause && m.pause(); } catch {}
  });

  // Iframes: replace with sandboxed muted previews or placeholders
  clone.querySelectorAll('iframe').forEach((f) => {
    const ph = document.createElement('div');
    ph.style.cssText = 'display:flex;align-items:center;justify-content:center;background:#1f1f1f;border:1px solid #333;height:100%;';
    // Try a sandboxed iframe that will not autoplay sound
    const safe = document.createElement('iframe');
    safe.src = f.src || 'about:blank';
    safe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    safe.setAttribute('allow', '');
    safe.setAttribute('loading', 'lazy');
    safe.style.cssText = 'width:100%;height:100%;border:0;pointer-events:none;';
    // Swap based on preference: use safe iframe for some visual, otherwise placeholder
    ph.appendChild(safe);
    f.replaceWith(ph);
  });

  wrapper.appendChild(clone);
  return wrapper;
}
function showTaskPreview(taskIcon, win) {
  hideTaskPreview();
  const prev = buildWindowPreview(win);
  // position near icon
  const r = taskIcon.getBoundingClientRect();
  prev.style.left = Math.max(8, Math.min(window.innerWidth - 328, r.left - 10)) + 'px';
  document.body.appendChild(prev);
  activePreviewEl = prev;
}
function hideTaskPreview() {
  if (activePreviewEl) {
    activePreviewEl.remove();
    activePreviewEl = null;
  }
}

function makeTaskIconDraggable(taskIcon) {
  let dragging = false;
  let ghost = null;
  let placeholder = null;
  let startX = 0, offsetX = 0;

  const iconWidth = () => taskIcon.getBoundingClientRect().width;

  function onMouseDown(e) {
    e.preventDefault();
    startX = e.clientX;
    offsetX = 0;
    dragging = true;

    // ghost
    ghost = taskIcon.cloneNode(true);
    ghost.style.opacity = '0.6';
    ghost.style.position = 'fixed';
    ghost.style.top = (taskIcon.getBoundingClientRect().top) + 'px';
    ghost.style.left = (taskIcon.getBoundingClientRect().left) + 'px';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = 10000;

    // placeholder
    placeholder = document.createElement('div');
    placeholder.style.width = iconWidth() + 'px';
    placeholder.style.height = taskIcon.getBoundingClientRect().height + 'px';
    placeholder.style.margin = getComputedStyle(taskIcon).margin;
    placeholder.style.borderRadius = '6px';
    placeholder.style.background = 'rgba(255,255,255,0.08)';

    taskIcon.parentElement.insertBefore(placeholder, taskIcon.nextSibling);
    taskIcon.style.display = 'none';
    document.body.appendChild(ghost);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!dragging) return;
    offsetX = e.clientX - startX;
    ghost.style.left = (taskIcon.getBoundingClientRect().left + offsetX) + 'px';

    // figure out where to insert placeholder
    const siblings = Array.from(openProgramsBar.querySelectorAll('.taskbar-icon'))
      .filter(n => n !== taskIcon);
    const pointX = e.clientX;
    for (let s of siblings) {
      const rect = s.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      if (pointX < mid) {
        openProgramsBar.insertBefore(placeholder, s);
        return;
      }
    }
    openProgramsBar.appendChild(placeholder);
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    if (!dragging) return;
    dragging = false;

    // place icon where placeholder is
    openProgramsBar.insertBefore(taskIcon, placeholder);
    taskIcon.style.display = '';
    placeholder.remove();
    ghost.remove();
  }

  taskIcon.addEventListener('mousedown', onMouseDown);
}

function openProgram(btn) {
  const title = btn.dataset.title;
  const link = btn.dataset.link;
  const icon = btn.dataset.icon;

  if (document.querySelector(`.window[data-title="${title}"]`)) return;

  // Taskbar icon
  const taskIcon = document.createElement('img');
  taskIcon.src = icon;
  taskIcon.alt = title;
  taskIcon.title = title;
  taskIcon.classList.add('taskbar-icon');
  taskIcon.style.userSelect = 'none';
  taskIcon.draggable = false;
  openProgramsBar.appendChild(taskIcon);
  makeTaskIconDraggable(taskIcon);

  // Window
  const win = document.createElement('div');
  win.classList.add('window');
  win.dataset.title = title;
  win.style.top = '50px';
  win.style.left = '50px';

  let contentHTML = '';
  if (title === "COS Browser") {
    contentHTML = `
      <div class="browser-window">
        <div class="browser-header">
          <img src="${icon}" alt="Browser Logo" class="browser-logo">
          <input type="text" class="browser-url" placeholder="Search or enter URL">
          <button class="browser-go">Go</button>
          <div class="browser-tabs" style="overflow-x:auto; white-space:nowrap;"></div>
        </div>
        <div class="browser-content" style="border-top:1px solid #ccc; padding:10px; height:400px; overflow:auto;"></div>
      </div>
    `;
  } else if (title === "Notepad") {
    contentHTML = `
      <textarea id="text-editor" style="flex:1;width:100%;height:100%;"></textarea>
      <button id="save-text" style="padding:5px;">Save as .txt</button>
    `;
  } else {
    contentHTML = `<iframe class="window-content" src="${link}" frameborder="0" style="flex:1;width:100%;border:none;"></iframe>`;
  }

  win.innerHTML = `
    <div class="window-header" style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:5px;">
        <img src="${icon}" alt="${title} Icon" class="window-favicon" style="width:16px;height:16px;">
        <span>${title}</span>
      </div>
      <div class="window-buttons">
        <span class="window-minimize">🗕</span>
        <span class="window-maximize">🗖</span>
        <span class="window-close">✖</span>
      </div>
    </div>
    ${contentHTML}
  `;
  windowsContainer.appendChild(win);

  const minimizeBtn = win.querySelector('.window-minimize');
  const maximizeBtn = win.querySelector('.window-maximize');
  const closeBtn = win.querySelector('.window-close');

  // Close
  closeBtn.addEventListener('click', () => {
    win.remove();
    taskIcon.remove();
    hideTaskPreview();
  });

  // Minimize
  minimizeBtn.addEventListener('click', () => {
    win.style.display = 'none';
  });

  // Maximize / Restore
  let isMaximized = false;
  let prevStyle = {};
  maximizeBtn.addEventListener('click', () => {
    if (!isMaximized) {
      prevStyle = { top: win.style.top, left: win.style.left, width: win.style.width, height: win.style.height };
      win.style.top = '0';
      win.style.left = '0';
      win.style.width = '100%';
      win.style.height = 'calc(100% - 40px)';
    } else {
      win.style.top = prevStyle.top;
      win.style.left = prevStyle.left;
      win.style.width = prevStyle.width;
      win.style.height = prevStyle.height;
    }
    isMaximized = !isMaximized;
  });

  // Dragging window
  const header = win.querySelector('.window-header');
  let offsetX, offsetY, dragging = false;

  header.addEventListener('mousedown', e => {
    if (isMaximized) return;
    dragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    win.style.zIndex = 100;

    const onMouseMove = eMove => {
      if (!dragging) return;
      win.style.left = (eMove.clientX - offsetX) + 'px';
      win.style.top = (eMove.clientY - offsetY) + 'px';

      if (eMove.clientY < 10) {
        win.style.top = '0';
        win.style.left = '0';
        win.style.width = '100%';
        win.style.height = 'calc(100% + 40px)';
      } else if (eMove.clientX < 10) {
        win.style.top = '0';
        win.style.left = '0';
        win.style.width = '50%';
        win.style.height = 'calc(100% - 40px)';
      } else if (eMove.clientX > window.innerWidth - 10) {
        win.style.top = '0';
        win.style.left = '50%';
        win.style.width = '50%';
        win.style.height = 'calc(100% - 40px)';
      }
    };

    const onMouseUp = () => {
      dragging = false;
      win.style.zIndex = 10;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  // Taskbar icon click: restore/raise
  taskIcon.addEventListener('click', () => {
    if (win.style.display === 'none') win.style.display = 'flex';
    win.style.zIndex = 101;
  });

  // Taskbar icon preview (hover)
  let previewTimer;
  taskIcon.addEventListener('mouseenter', () => {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => showTaskPreview(taskIcon, win), 120);
  });
  taskIcon.addEventListener('mouseleave', () => {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(hideTaskPreview, 100);
  });

  // Text editor save
  if (title === "Notepad") {
    win.querySelector('#save-text').addEventListener('click', () => {
      const text = win.querySelector('#text-editor').value;
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'document.txt';
      a.click();
    });
  }

  // COS Browser autocomplete is now in search.js
  if (title === "COS Browser") {
    initBrowserSearch(win, programs);
  }
}

// Arrange programs in columns (initial layout, populate occupied grid)
function arrangePrograms() {
  occupiedGrid.clear();
  const desktop = desktopEl;
  const desktopHeight = desktop.clientHeight - 60;
  const programsPerColumn = Math.floor(desktopHeight / GRID_H);
  let col = 0, row = 0;

  programs.forEach(btn => {
    btn.style.position = 'absolute';
    btn.style.top = `${row * GRID_H}px`;
    btn.style.left = `${col * GRID_W}px`;
    occupy(col, row);
    row++;
    if (row >= programsPerColumn) {
      row = 0;
      col++;
    }
  });
}

// Draggable desktop icons with collision-free snapping
programs.forEach(btn => {
  let isDragging = false;
  let justDragged = false;
  let startX, startY, origX, origY, origCol, origRow;
  let shadow;

  const desktop = desktopEl;

  btn.addEventListener('mousedown', e => {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    origX = btn.offsetLeft;
    origY = btn.offsetTop;
    [origCol, origRow] = rectToGrid(origX, origY);
    isDragging = false;

    const onMouseMove = eMove => {
      const dx = eMove.clientX - startX;
      const dy = eMove.clientY - startY;

      if (!isDragging && Math.hypot(dx, dy) > 5) {
        isDragging = true;
        justDragged = true;

        // Create shadow copy
        shadow = btn.cloneNode(true);
        shadow.style.position = 'absolute';
        shadow.style.left = origX + 'px';
        shadow.style.top = origY + 'px';
        shadow.style.opacity = '0.5';
        shadow.style.pointerEvents = 'none';
        shadow.style.zIndex = 999;
        desktop.appendChild(shadow);

        // free original slot while dragging
        release(origCol, origRow);
      }

      if (isDragging) {
        let newLeft = origX + dx;
        let newTop = origY + dy;

        // Keep within desktop bounds
        const desktopWidth = desktop.clientWidth;
        const desktopHeight = desktop.clientHeight - 60;
        newLeft = Math.max(0, Math.min(newLeft, desktopWidth - btn.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, desktopHeight - btn.offsetHeight));

        shadow.style.left = newLeft + 'px';
        shadow.style.top = newTop + 'px';
      }
    };

    const onMouseUp = eUp => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (isDragging) {
        isDragging = false;

        // Snap to nearest free grid cell
        let [col, row] = rectToGrid(parseInt(shadow.style.left), parseInt(shadow.style.top));
        [col, row] = findNearestFree(col, row);

        btn.style.left = col * GRID_W + 'px';
        btn.style.top = row * GRID_H + 'px';
        occupy(col, row);

        shadow.remove();
        setTimeout(() => { justDragged = false; }, 0);
      } else {
        // Not dragged, treat as click
        openProgram(btn);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
});

window.addEventListener('resize', arrangePrograms);
arrangePrograms();
