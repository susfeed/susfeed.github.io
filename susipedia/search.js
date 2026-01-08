let allArticles = [];

const list = document.getElementById("articles-list");
const input = document.getElementById("searchInput");
const button = document.getElementById("searchBtn");

const overlay = document.getElementById("searchResults");
const resultsList = document.getElementById("resultsList");
const closeBtn = document.getElementById("closeResults");
const title = document.getElementById("resultsTitle");

const articleCountEl = document.getElementById("articleCount");
const randomBtn = document.getElementById("randomArticleBtn");

fetch("articles/articles.json")
  .then(res => res.json())
  .then(articles => {
    allArticles = articles;
    const maxId = Math.max(...articles.map(a => a.id));
    articleCountEl.textContent = maxId.toLocaleString();
    renderHomeArticles(articles.slice().reverse().slice(0, 10));
  });

function renderHomeArticles(articles) {
  list.innerHTML = "";
  articles.forEach(article => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `articles/content/${article.file}`;
    a.textContent = article.title;
    li.appendChild(a);
    list.appendChild(li);
  });
}

function renderResults(titleResults, contentResults) {
  resultsList.innerHTML = "";

  if (!titleResults.length && !contentResults.length) {
    resultsList.innerHTML = "<li class='error'>No results found</li>";
    return;
  }

  title.textContent = "Search results";

  if (titleResults.length) {
    const h = document.createElement("li");
    h.className = "results-divider";
    h.textContent = "Articles";
    resultsList.appendChild(h);

    titleResults.forEach(article => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `articles/content/${article.file}`;
      a.textContent = article.title;
      li.appendChild(a);
      resultsList.appendChild(li);
    });
  }

  if (contentResults.length) {
    const h = document.createElement("li");
    h.className = "results-divider";
    h.textContent = "Found in:";
    resultsList.appendChild(h);

    contentResults.forEach(item => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      const p = document.createElement("p");

      a.href = `articles/content/${item.file}`;
      a.textContent = item.title;
      p.className = "excerpt";
      p.innerHTML = item.excerpt;

      li.appendChild(a);
      li.appendChild(p);
      resultsList.appendChild(li);
    });
  }
}

async function fetchArticleText(file) {
  try {
    const res = await fetch(`articles/content/${file}`);
    const html = await res.text();
    const temp = document.createElement("div");
    temp.innerHTML = html;

    temp.querySelectorAll(".topbar, .tagline, .footer").forEach(el => el.remove());

    return temp.textContent.replace(/\s+/g, " ").toLowerCase();
  } catch {
    return "";
  }
}

function extractExcerpt(text, query) {
  const index = text.indexOf(query);
  if (index === -1) return "";

  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + query.length + 100);

  const snippet = text.slice(start, end);
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(safeQuery, "gi");

  return "…" + snippet.replace(regex, "<strong>$&</strong>").trim() + "…";
}

async function runSearch() {
  const query = input.value.trim().toLowerCase();
  if (!query) return;

  const titleResults = allArticles
    .filter(a => a.title.toLowerCase().includes(query))
    .slice(0, 5);

  const usedIds = new Set(titleResults.map(a => a.id));
  const contentResults = [];

  for (const article of allArticles) {
    if (contentResults.length >= 5) break;
    if (usedIds.has(article.id)) continue;

    const text = await fetchArticleText(article.file);
    if (text.includes(query)) {
      contentResults.push({
        ...article,
        excerpt: extractExcerpt(text, query)
      });
      usedIds.add(article.id);
    }
  }

  renderResults(titleResults, contentResults);
  overlay.classList.remove("hidden");
}

button.addEventListener("click", runSearch);

input.addEventListener("keydown", e => {
  if (e.key === "Enter") runSearch();
});

closeBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
});

overlay.addEventListener("click", e => {
  if (e.target === overlay) overlay.classList.add("hidden");
});

function goToRandomArticle() {
  if (!allArticles.length) return;
  const random = allArticles[Math.floor(Math.random() * allArticles.length)];
  window.location.href = `articles/content/${random.file}`;
}

randomBtn.addEventListener("click", e => {
  e.preventDefault();
  goToRandomArticle();
});
