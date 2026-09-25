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

  const pageEl = document.querySelector(".page");

  if (pageEl) {
    pageEl.querySelectorAll(".thumb").forEach(thumb => {
      let ref = thumb.nextElementSibling;
      while (ref && !["P", "UL", "OL"].includes(ref.tagName)) {
        ref = ref.nextElementSibling;
      }
      if (ref) {
        ref.parentNode.insertBefore(thumb, ref);
      }
    });

    pageEl.querySelectorAll(".thumb").forEach((thumb, i) => {
      thumb.classList.add(i % 2 === 0 ? "thumb-left" : "thumb-right");
    });
  }

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

  function buildArticleIndex(list) {
    return list.map(a => {
      const escaped = a.title
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return {
        ...a,
        regex: new RegExp(`\\b${escaped}s?\\b`, "i"),
        lowerTitle: a.title.toLowerCase(),
        titleLength: a.title.length,
      };
    });
  }

  const articleIndex = buildArticleIndex(articles);

  function linkTextInContainer(container, opts = {}) {
    const {
      limitOne = true,
      skipBold = true,
    } = opts;

    const usedInContainer = new Set();

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;

          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          if (parent.closest("a")) return NodeFilter.FILTER_REJECT;

          if (skipBold && parent.closest("b, strong")) {
            return NodeFilter.FILTER_REJECT;
          }

          if (parent.closest("h1, h2, h3, h4, h5, h6")) {
            return NodeFilter.FILTER_REJECT;
          }

          if (parent.closest(".toc")) return NodeFilter.FILTER_REJECT;
          if (parent.closest(".footer")) return NodeFilter.FILTER_REJECT;
          if (parent.closest(".tagline")) return NodeFilter.FILTER_REJECT;

          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) textNodes.push(n);

    for (const node of textNodes) {
      let text = node.nodeValue;
      let changed = false;
      const frag = document.createDocumentFragment();

      while (text.length > 0) {
        let bestMatch = null;

        for (const article of articleIndex) {
          if (limitOne && usedInContainer.has(article.lowerTitle)) continue;

          article.regex.lastIndex = 0;
          const match = article.regex.exec(text);
          if (!match) continue;

          const matchIndex = match.index;
          const matchedText = match[0];

          const charBefore = text[matchIndex - 1];
          const charAfter = text[matchIndex + matchedText.length];
          if (charBefore && /[A-Za-z0-9]/.test(charBefore)) continue;
          if (charAfter && /[A-Za-z0-9]/.test(charAfter)) continue;

          if (
            !bestMatch ||
            matchIndex < bestMatch.matchIndex ||
            (matchIndex === bestMatch.matchIndex &&
              matchedText.length > bestMatch.matchedText.length)
          ) {
            bestMatch = { article, matchIndex, matchedText };
          }
        }

        if (!bestMatch) {
          frag.appendChild(document.createTextNode(text));
          break;
        }

        const { article, matchIndex, matchedText } = bestMatch;

        if (matchIndex > 0) {
          frag.appendChild(document.createTextNode(text.slice(0, matchIndex)));
        }

        const a = document.createElement("a");
        a.href = `${contentPath}/${article.file}`;
        a.dataset.preview = article.title;
        a.textContent = matchedText;
        frag.appendChild(a);

        if (limitOne) usedInContainer.add(article.lowerTitle);

        changed = true;
        text = text.slice(matchIndex + matchedText.length);
      }

      if (changed) {
        node.replaceWith(frag);
      }
    }
  }

  document.querySelectorAll(".page p").forEach(p => {
    linkTextInContainer(p, { limitOne: true, skipBold: true });
  });

  document.querySelectorAll(".page li").forEach(li => {
    linkTextInContainer(li, { limitOne: true, skipBold: true });
  });

  document.querySelectorAll(".thumb .caption, .infobox .caption").forEach(cap => {
    linkTextInContainer(cap, { limitOne: true, skipBold: false });
  });

  document.querySelectorAll(".infobox td").forEach(td => {
    linkTextInContainer(td, { limitOne: true, skipBold: true });
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