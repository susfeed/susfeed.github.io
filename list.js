let currentIndex = 0
let allItems = []
let sortedItems = []

const container = document.getElementById("articles-container") || document.getElementById("games-container")
const loadMoreBtn = document.getElementById("load-more-btn")
const sortSelect = document.getElementById("sort-select")
const searchInput = document.getElementById("article-search")

const type = document.body.dataset.type

function getConfig() {
  if (type === "articles") return { path: "articles", classicCheck: i => i < 9, className: "article-card" }
  if (type === "games") return { path: "games", classicCheck: i => i < 3, className: "game-card" }
  if (type === "quizzes") return { path: "quizzes", classicCheck: i => i === 0 || i === 3, className: "article-card" }
}

function render(items) {
  const { path, classicCheck, className } = getConfig()

  items.forEach(({ folder, file }) => {
    const itemPath = `${path}/${folder}/${file}`
    const imagePath = `${path}/${folder}/cover.webp`
    const title = file.replace(/_/g, " ").replace(".html", "")

    const index = allItems.findIndex(i => i.folder === folder && i.file === file)
    const isClassic = classicCheck(index)

    const card = document.createElement("a")
    card.href = itemPath
    card.className = className

    card.innerHTML = `
      <div class="card-image" style="background-image:url('${imagePath}')">
        ${isClassic ? `<div class="classic-badge"><span class="circle-text">Certified SusFeed Classic ඞ</span></div>` : ""}
      </div>
      <div class="card-content">
        <h3 class="card-title">${title}</h3>
      </div>
    `

    container.appendChild(card)
  })
}

function load() {
  const batch = sortedItems.slice(currentIndex, currentIndex + 9)
  render(batch)
  currentIndex += 9
  loadMoreBtn.style.display = currentIndex >= sortedItems.length ? "none" : "inline-block"
}

function sort(method) {
  sortedItems = [...allItems]

  if (method === "newest") sortedItems.sort((a, b) => b.folder - a.folder)
  if (method === "oldest") sortedItems.sort((a, b) => a.folder - b.folder)
  if (method === "az") sortedItems.sort((a, b) => a.file.localeCompare(b.file))
  if (method === "za") sortedItems.sort((a, b) => b.file.localeCompare(a.file))

  container.innerHTML = ""
  currentIndex = 0
  load()
}

sortSelect.addEventListener("change", e => sort(e.target.value))

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase()
  const filtered = sortedItems.filter(i =>
    i.file.replace(/_/g, " ").toLowerCase().includes(query)
  )

  container.innerHTML = ""
  render(filtered.slice(0, 9))
  loadMoreBtn.style.display = filtered.length > 9 ? "inline-block" : "none"
})

const { path } = getConfig()

fetch(`${path}/index.json`)
  .then(res => res.json())
  .then(data => {
    allItems = data
    sort("newest")
  })
  .catch(() => loadMoreBtn.style.display = "none")

loadMoreBtn.addEventListener("click", load)