document.addEventListener("DOMContentLoaded", async () => {

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

  const response = await fetch("../articles.json");
  let articles = await response.json();

  const currentTitle = document.querySelector("h1")?.textContent.trim().toLowerCase() || "";

  articles = articles
    .filter(a => a.title.toLowerCase() !== currentTitle)
    .sort((a, b) => {
      const ad = a.title.toLowerCase().includes("disambiguation");
      const bd = b.title.toLowerCase().includes("disambiguation");
      if (ad !== bd) return ad ? 1 : -1;
      return b.title.length - a.title.length;
    });

  const infobox = document.querySelector(".infobox");
  const bodyParagraphs = document.querySelectorAll(".page p");

  function prefixRegex(title) {
    const words = title.split(" ").map(w =>
      w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    let p = "\\b" + words[0];
    for (let i = 1; i < words.length; i++) {
      p += "(?:\\s+" + words[i] + ")?";
    }
    return new RegExp(p + "\\b", "gi");
  }

  if (infobox) {
    let used = false;

articles.forEach(article => {
  if (used) return;
  const regex = prefixRegex(article.title);

  bodyParagraphs.forEach(p => {
    if (used || p.querySelector("a")) return;

    if (regex.test(p.textContent)) {
      p.innerHTML = p.innerHTML.replace(regex, m => {
        if (used) return m;
        used = true;
        return `<a href="../${article.id}/${article.file}" data-preview="${article.title}">${m}</a>`;
      });
    }
  });
});
  }

  let used = false;

  articles.forEach(article => {
    if (used) return;
    const regex = prefixRegex(article.title);

    bodyParagraphs.forEach(p => {
      if (used || p.querySelector("a")) return;

      if (regex.test(p.textContent)) {
        p.innerHTML = p.innerHTML.replace(regex, m => {
          if (used) return m;
          used = true;
          return `<a href="../${article.id}/${article.file}" data-preview="${article.title}">${m}</a>`;
        });
      }
    });
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
  const a = e.target.closest(".page a[data-preview]");
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
  if (e.target.closest(".page a[data-preview]")) {
    preview.style.display = "none";
  }
});
});
