function initBrowserSearch(win, programs) {
  const browserHeader = win.querySelector('.browser-header');
  const browserInput = browserHeader.querySelector('.browser-url');
  const tabsContainer = browserHeader.querySelector('.browser-tabs');

  const browserData = {
    history: [],
    cookies: {},
  };

  function addToHistory(appTitle) {
    browserData.history.unshift({
      title: appTitle,
      timestamp: new Date().toLocaleString(),
    });
    if (browserData.history.length > 50) browserData.history.pop();
  }

  function setCookie(name, value) { browserData.cookies[name] = value; }
  function getCookie(name) { return browserData.cookies[name] || null; }
  function clearCookies() { browserData.cookies = {}; }
  function clearHistory() { browserData.history = []; }

  function openHistoryTab(contentContainer, tabsContainer) {
    const appTitle = 'History & Cookies';
    const existingTab = Array.from(tabsContainer.children).find(t => t.dataset.title === appTitle);
    if (existingTab) {
      switchToTab(existingTab);
      return;
    }

    const tab = document.createElement('div');
    tab.dataset.title = appTitle;
    tab.style.display = 'inline-block';
    tab.style.padding = '5px 10px';
    tab.style.cursor = 'pointer';
    tab.style.borderRight = '1px solid #ccc';
    tab.style.position = 'relative';

    const tabLabel = document.createElement('span');
    tabLabel.textContent = appTitle;
    tab.appendChild(tabLabel);

    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.marginLeft = '5px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      const contentDiv = contentContainer.querySelector(`div[data-title="${appTitle}"]`);
      if (contentDiv) contentDiv.remove();
      tab.remove();
      if (tabsContainer.lastChild) switchToTab(tabsContainer.lastChild);
    });
    tab.appendChild(closeBtn);
    tabsContainer.appendChild(tab);

    const contentDiv = document.createElement('div');
    contentDiv.dataset.title = appTitle;
    contentDiv.style.display = 'none';
    contentDiv.style.width = '100%';
    contentDiv.style.height = '100%';
    contentDiv.style.padding = '10px';
    contentDiv.style.overflowY = 'auto';

    const historyTitle = document.createElement('h3');
    historyTitle.textContent = 'History';
    contentDiv.appendChild(historyTitle);

    const historyList = document.createElement('ul');
    historyList.style.listStyle = 'none';
    historyList.style.padding = '0';
    contentDiv.appendChild(historyList);

    const updateHistoryList = () => {
      historyList.innerHTML = '';
      browserData.history.forEach(h => {
        const li = document.createElement('li');
        li.textContent = `${h.timestamp} → ${h.title}`;
        historyList.appendChild(li);
      });
    };

    const clearHistoryBtn = document.createElement('button');
    clearHistoryBtn.textContent = 'Clear History';
    clearHistoryBtn.style.marginTop = '5px';
    clearHistoryBtn.addEventListener('click', () => {
      clearHistory();
      updateHistoryList();
    });
    contentDiv.appendChild(clearHistoryBtn);
    updateHistoryList();

    const cookiesTitle = document.createElement('h3');
    cookiesTitle.textContent = 'Cookies';
    cookiesTitle.style.marginTop = '20px';
    contentDiv.appendChild(cookiesTitle);

    const cookiesList = document.createElement('ul');
    cookiesList.style.listStyle = 'none';
    cookiesList.style.padding = '0';
    contentDiv.appendChild(cookiesList);

    const updateCookiesList = () => {
      cookiesList.innerHTML = '';
      Object.entries(browserData.cookies).forEach(([k, v]) => {
        const li = document.createElement('li');
        li.textContent = `${k}: ${v}`;
        cookiesList.appendChild(li);
      });
    };

    const clearCookiesBtn = document.createElement('button');
    clearCookiesBtn.textContent = 'Clear Cookies';
    clearCookiesBtn.style.marginTop = '5px';
    clearCookiesBtn.addEventListener('click', () => {
      clearCookies();
      updateCookiesList();
    });
    contentDiv.appendChild(clearCookiesBtn);
    updateCookiesList();

    contentContainer.appendChild(contentDiv);
    switchToTab(tab);
  }

  // Create content container if missing
  let contentContainer = win.querySelector('.browser-content');
  if (!contentContainer) {
    contentContainer = document.createElement('div');
    contentContainer.className = 'browser-content';
    contentContainer.style.width = '100%';
    contentContainer.style.height = 'calc(100% - 40px)';
    contentContainer.style.overflow = 'hidden';
    win.appendChild(contentContainer);
  }

  browserInput.setAttribute('autocomplete', 'off');
  browserInput.setAttribute('spellcheck', 'false');

  const inputWrapper = document.createElement('div');
  inputWrapper.style.position = 'relative';
  inputWrapper.style.flexGrow = '1';
  browserHeader.insertBefore(inputWrapper, browserInput);
  inputWrapper.appendChild(browserInput);

  browserInput.style.width = '100%';
  browserInput.style.boxSizing = 'border-box';

  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';
  dropdown.style.position = 'absolute';
  dropdown.style.top = '100%';
  dropdown.style.left = '0';
  dropdown.style.width = '100%';
  dropdown.style.background = 'white';
  dropdown.style.border = '1px solid #ccc';
  dropdown.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  dropdown.style.zIndex = '1000';
  dropdown.style.display = 'none';
  inputWrapper.appendChild(dropdown);

  const programTitles = Array.from(programs).map(p => p.dataset.title);
  let autocompleteIndex = -1;

  function updateDropdown(matches) {
    dropdown.innerHTML = '';
    if (matches.length === 0) {
      dropdown.style.display = 'none';
      return;
    }
    matches.forEach((m, i) => {
      const item = document.createElement('div');
      item.textContent = m;
      item.style.padding = '5px';
      item.style.cursor = 'pointer';
      if (i === autocompleteIndex) item.style.background = '#eee';
      item.addEventListener('mousedown', () => {
        openAppInTab(m);
        browserInput.value = '';
        dropdown.style.display = 'none';
      });
      dropdown.appendChild(item);
    });
    dropdown.style.display = 'block';
  }

  function showDropdown() {
    const val = browserInput.value.toLowerCase();
    let matches;
    if (val === '') {
      matches = programTitles.slice(-5);
    } else {
      matches = programTitles.filter(p => p.toLowerCase().startsWith(val));
    }
    autocompleteIndex = -1;
    updateDropdown(matches);
  }

  function switchToTab(tab) {
    Array.from(tabsContainer.children).forEach(t => { t.style.background = ''; });
    Array.from(contentContainer.children).forEach(c => { c.style.display = 'none'; });
    tab.style.background = '#eee';
    const appTitle = tab.dataset.title;
    const contentDiv = contentContainer.querySelector(`div[data-title="${appTitle}"]`);
    if (contentDiv) contentDiv.style.display = 'block';
  }

  tabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('div[data-title]');
    if (tab) switchToTab(tab);
  });

  function openAppInTab(appTitle) {
    addToHistory(appTitle);

    const existingTab = Array.from(tabsContainer.children).find(t => t.dataset.title === appTitle);
    if (existingTab) {
      switchToTab(existingTab);
      return;
    }

    const tab = document.createElement('div');
    tab.dataset.title = appTitle;
    tab.style.display = 'inline-block';
    tab.style.padding = '5px 10px';
    tab.style.cursor = 'pointer';
    tab.style.borderRight = '1px solid #ccc';
    tab.style.position = 'relative';
    tab.style.whiteSpace = 'nowrap';

    const tabLabel = document.createElement('span');
    tabLabel.textContent = appTitle;
    tab.appendChild(tabLabel);

    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.marginLeft = '5px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const contentDiv = contentContainer.querySelector(`div[data-title="${appTitle}"]`);
      if (contentDiv) contentDiv.remove();
      tab.remove();
      if (tabsContainer.lastChild) switchToTab(tabsContainer.lastChild);
    });
    tab.appendChild(closeBtn);
    tabsContainer.appendChild(tab);

    const content = document.createElement('div');
    content.dataset.title = appTitle;
    content.style.display = 'none';
    content.style.width = '100%';
    content.style.height = '100%';

    const appProgram = Array.from(programs).find(p => p.dataset.title === appTitle);
    if (appProgram) {
      const link = appProgram.dataset.link;
      if (link) {
        const iframe = document.createElement('iframe');
        iframe.src = link;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        content.appendChild(iframe);
      } else {
        const fallback = document.createElement('div');
        fallback.textContent = appTitle;
        fallback.style.fontSize = '20px';
        fallback.style.textAlign = 'center';
        fallback.style.paddingTop = '50px';
        content.appendChild(fallback);
      }
    }

    contentContainer.appendChild(content);
    switchToTab(tab);
  }

  browserInput.addEventListener('focus', showDropdown);
  browserInput.addEventListener('input', showDropdown);

  browserInput.addEventListener('keydown', e => {
    const visibleItems = Array.from(dropdown.children);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (visibleItems.length === 0) return;
      autocompleteIndex = (autocompleteIndex + 1) % visibleItems.length;
      showDropdown();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (visibleItems.length === 0) return;
      autocompleteIndex = (autocompleteIndex - 1 + visibleItems.length) % visibleItems.length;
      showDropdown();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (visibleItems.length === 0) return;
      autocompleteIndex = (autocompleteIndex + 1) % visibleItems.length;
      browserInput.value = visibleItems[autocompleteIndex].textContent;
      showDropdown();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const matchedProgram = programTitles.find(p => p.toLowerCase() === browserInput.value.trim().toLowerCase());
      if (matchedProgram) openAppInTab(matchedProgram);
      browserInput.value = '';
      dropdown.style.display = 'none';
    }
  });

  document.addEventListener('click', e => {
    if (!inputWrapper.contains(e.target)) dropdown.style.display = 'none';
  });

const historyBtn = document.createElement('button');

historyBtn.style.width = '24px';
historyBtn.style.height = '24px';
historyBtn.style.padding = '0';
historyBtn.style.marginLeft = '10px';
historyBtn.style.border = 'none';
historyBtn.style.background = 'transparent';
historyBtn.style.cursor = 'pointer';
historyBtn.style.display = 'flex';
historyBtn.style.flexDirection = 'column';
historyBtn.style.justifyContent = 'space-around';
historyBtn.style.alignItems = 'center';

for (let i = 0; i < 3; i++) {
  const dot = document.createElement('span');
  dot.style.width = '4px';
  dot.style.height = '4px';
  dot.style.background = '#000';
  dot.style.borderRadius = '50%';
  historyBtn.appendChild(dot);
}

historyBtn.addEventListener('click', () => openHistoryTab(contentContainer, tabsContainer));
browserHeader.appendChild(historyBtn);
}


// Taskbar search bar
function initDesktopSearch(programs) {
  const searchBar = document.getElementById('search-bar');

  // Disable browser autocomplete
  searchBar.setAttribute('autocomplete', 'off');
  searchBar.setAttribute('spellcheck', 'false');

  // Create dropdown container
  const dropdown = document.createElement('div');
  dropdown.className = 'taskbar-search-dropdown';
  dropdown.style.position = 'absolute';
  dropdown.style.bottom = '100%';
  dropdown.style.left = '0';
  dropdown.style.width = '400px';
  dropdown.style.background = '#1f1f1f';
  dropdown.style.color = '#fff';
  dropdown.style.border = '1px solid #444';
  dropdown.style.boxShadow = '0 2px 6px rgba(0,0,0,0.5)';
  dropdown.style.display = 'none';
  dropdown.style.zIndex = '1000';
  dropdown.style.borderRadius = '5px';
  dropdown.style.padding = '10px';
  dropdown.style.flexDirection = 'row';
  dropdown.style.gap = '20px';

  // Search results container
  const resultsContainer = document.createElement('div');
  resultsContainer.style.flex = '1';
  resultsContainer.style.display = 'flex';
  resultsContainer.style.flexDirection = 'column';
  resultsContainer.style.gap = '5px';
  dropdown.appendChild(resultsContainer);

  // Recents container
  const recentsContainer = document.createElement('div');
  recentsContainer.style.width = '150px';
  recentsContainer.style.display = 'flex';
  recentsContainer.style.flexDirection = 'column';
  recentsContainer.style.gap = '5px';

  const recentsTitle = document.createElement('div');
  recentsTitle.textContent = 'Recents';
  recentsTitle.style.fontWeight = 'bold';
  recentsTitle.style.marginBottom = '5px';
  recentsContainer.appendChild(recentsTitle);

  const recentsList = document.createElement('div');
  recentsList.style.display = 'flex';
  recentsList.style.flexDirection = 'column';
  recentsList.style.gap = '5px';
  recentsContainer.appendChild(recentsList);

  dropdown.appendChild(recentsContainer);

  searchBar.parentElement.style.position = 'relative';
  searchBar.parentElement.appendChild(dropdown);

  let autocompleteIndex = -1;
  const recents = [];

  function addRecent(app) {
    if (!recents.includes(app)) {
      recents.unshift(app);
      if (recents.length > 5) recents.pop();
    } else {
      const index = recents.indexOf(app);
      recents.splice(index, 1);
      recents.unshift(app);
    }
    updateRecents();
  }

  function updateRecents() {
    recentsList.innerHTML = '';
    recents.forEach(app => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '5px';
      item.style.cursor = 'pointer';

      const icon = document.createElement('img');
      icon.src = app.dataset.icon || '';
      icon.style.width = '24px';
      icon.style.height = '24px';
      icon.style.flexShrink = '0';

      const name = document.createElement('span');
      name.textContent = app.dataset.title;

      item.appendChild(icon);
      item.appendChild(name);

      item.addEventListener('click', () => {
        app.click();
        dropdown.style.display = 'none';
        searchBar.value = '';
      });

      recentsList.appendChild(item);
    });
  }

  function updateResults(matches) {
    resultsContainer.innerHTML = '';
    if (matches.length === 0 && recents.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    matches.forEach((app, i) => {
      const item = document.createElement('div');
      item.style.padding = '5px 10px';
      item.style.cursor = 'pointer';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '10px';
      if (i === autocompleteIndex) item.style.background = '#333';

      const icon = document.createElement('img');
      icon.src = app.dataset.icon || '';
      icon.style.width = '24px';
      icon.style.height = '24px';
      icon.style.flexShrink = '0';

      const name = document.createElement('span');
      name.textContent = app.dataset.title;

      item.appendChild(icon);
      item.appendChild(name);

      item.addEventListener('mousedown', () => {
        app.click();
        addRecent(app);
        dropdown.style.display = 'none';
        searchBar.value = '';
      });

      resultsContainer.appendChild(item);
    });

    dropdown.style.display = 'flex';
  }

  function showDropdown() {
    const val = searchBar.value.toLowerCase();
    let matches;

    if (val === '') {
      matches = Array.from(programs).slice(-5);
    } else {
      matches = Array.from(programs).filter(p =>
        p.dataset.title.toLowerCase().includes(val)
      );
    }

    autocompleteIndex = -1;
    updateResults(matches);
  }

  searchBar.addEventListener('focus', showDropdown);
  searchBar.addEventListener('input', showDropdown);

  searchBar.addEventListener('keydown', e => {
    const visibleItems = Array.from(resultsContainer.children);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (visibleItems.length === 0) return;
      autocompleteIndex = (autocompleteIndex + 1) % visibleItems.length;
      showDropdown();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (visibleItems.length === 0) return;
      autocompleteIndex = (autocompleteIndex - 1 + visibleItems.length) % visibleItems.length;
      showDropdown();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (visibleItems.length > 0 && autocompleteIndex >= 0) {
        visibleItems[autocompleteIndex].click();
      }
    }
  });

  document.addEventListener('click', e => {
    if (!searchBar.parentElement.contains(e.target)) dropdown.style.display = 'none';
  });
}

// Initialize desktop search on load
document.addEventListener('DOMContentLoaded', () => {
  const programs = document.querySelectorAll('.program-btn');
  initDesktopSearch(programs);
});
