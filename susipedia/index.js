document.addEventListener("DOMContentLoaded", async () => {

  const isHome = !location.pathname.includes("/content/");
  const base = isHome ? "." : "..";
  const contentPath = base + "/content";
  const articlesPath = base + "/articles.json";

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `<img src="">`;
  document.body.appendChild(lightbox);
  const lightboxImg = lightbox.querySelector("img");

  document.querySelectorAll(".thumb img").forEach(img => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightbox.classList.add("active");
    });
  });

  lightbox.addEventListener("click", () => {
    lightbox.classList.remove("active");
    lightboxImg.src = "";
  });

  const toc = document.querySelector(".toc");
  if (toc) {
    const headings = document.querySelectorAll("h2[id], h3[id]");
    const ol = document.createElement("ol");
    let sub = null;

    headings.forEach(h => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      li.appendChild(a);

      if (h.tagName === "H2") {
        ol.appendChild(li);
        sub = null;
      } else {
        if (!sub) {
          sub = document.createElement("ol");
          ol.lastElementChild.appendChild(sub);
        }
        sub.appendChild(li);
      }
    });

    toc.querySelectorAll("ol").forEach(e => e.remove());
    toc.appendChild(ol);
  }

  const response = await fetch(articlesPath);
  let articles = await response.json();

  const currentTitle =
    document.querySelector("h1")?.textContent.trim().toLowerCase() || "";

  articles = articles
    .filter(a => a.title.toLowerCase() !== currentTitle)
    .sort((a, b) => {
      const ad = a.title.toLowerCase().includes("disambiguation");
      const bd = b.title.toLowerCase().includes("disambiguation");
      if (ad !== bd) return ad ? 1 : -1;
      return b.title.length - a.title.length;
    });

  function prefixRegex(title) {
    const words = title
      .trim()
      .split(/\s+/)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    if (words.length === 1) {
      return new RegExp(`\\b${words[0]}s?\\b`, "gi");
    }

    let pattern = `\\b${words[0]}\\s+${words[1]}`;
    for (let i = 2; i < words.length; i++) {
      pattern += `(?:\\s+${words[i]})?`;
    }

    return new RegExp(pattern + "\\b", "gi");
  }

  function linkText(container, article, limitOne) {
    let used = false;
    const regex = prefixRegex(article.title);

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      if (limitOne && used) break;
      if (node.parentElement.closest("a")) continue;

      regex.lastIndex = 0;
      const match = regex.exec(node.nodeValue);
      if (!match) continue;

      const a = document.createElement("a");
      a.href = `${contentPath}/${article.file}`;
      a.dataset.preview = article.title;
      a.textContent = match[0];

      const before = node.nodeValue.slice(0, match.index);
      const after = node.nodeValue.slice(match.index + match[0].length);

      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(a);
      if (after) frag.appendChild(document.createTextNode(after));

      node.replaceWith(frag);
      used = true;
    }
  }

  document.querySelectorAll(".page p").forEach(p => {
    articles.forEach(article => linkText(p, article, true));
  });

  document.querySelectorAll(".infobox td").forEach(td => {
    articles.forEach(article => linkText(td, article, false));
  });

  const preview = document.createElement("div");
  preview.className = "article-preview";
  document.body.appendChild(preview);

  const cache = new Map();

  async function getPreviewData(href) {
    if (cache.has(href)) return cache.get(href);

    const res = await fetch(href);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    const title = doc.querySelector("h1")?.textContent || "";
    const paragraph =
      doc.querySelector(".page > p")?.textContent.slice(0, 260) + "…" || "";

    function resolveURL(base, relative) {
      try {
        return new URL(relative, base).href;
      } catch {
        return "";
      }
    }

    const infoboxImg = doc.querySelector(".infobox img");
    const thumbImg = doc.querySelector(".thumb img");

    let img = "";
    if (infoboxImg?.getAttribute("src")) {
      img = resolveURL(href, infoboxImg.getAttribute("src"));
    } else if (thumbImg?.getAttribute("src")) {
      img = resolveURL(href, thumbImg.getAttribute("src"));
    }

    const data = { title, paragraph, img };
    cache.set(href, data);
    return data;
  }

  document.addEventListener("mouseover", async e => {
    const a = e.target.closest("a[data-preview]");
    if (!a) return;

    preview.innerHTML = "Loading…";
    preview.style.display = "block";

    const { title, paragraph, img } = await getPreviewData(a.href);

    preview.innerHTML = `
      ${img ? `<img src="${img}">` : ""}
      <div class="preview-body">
        <div class="preview-title">${title}</div>
        <p class="preview-excerpt">${paragraph}</p>
      </div>
    `;
  });

  document.addEventListener("mousemove", e => {
    preview.style.left = e.pageX + 14 + "px";
    preview.style.top = e.pageY + 14 + "px";
  });

  document.addEventListener("mouseout", e => {
    if (e.target.closest("a[data-preview]")) {
      preview.style.display = "none";
    }
  });

});
