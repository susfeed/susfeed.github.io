let currentIndex = 0;
let allGames = [];
let sortedGames = [];

const container = document.getElementById("games-container");
const loadMoreBtn = document.getElementById("load-more-btn");
const sortSelect = document.getElementById("sort-select");
const searchInput = document.getElementById("game-search");

function renderGames(games) {
  games.forEach(({ folder, file }) => {
    const gamePath = `games/${folder}/${file}`;
    const imagePath = `games/${folder}/cover.webp`;
    const title = file.replace(/_/g, " ").replace(".html", "");

    const index = allGames.findIndex(g => g.folder === folder);
    const isClassic = index >= 0 && index < 3;

    const card = document.createElement("a");
    card.href = gamePath;
    card.className = "game-card";

    card.innerHTML = `
      <div class="card-image" style="background-image:url('${imagePath}')">
        ${isClassic ? `
          <div class="classic-badge">
            <span class="circle-text">Classic Game</span>
          </div>` : ""}
      </div>
      <div class="card-content">
        <h3 class="card-title">${title}</h3>
      </div>
    `;

    container.appendChild(card);
  });
}

function loadGames() {
  const batch = sortedGames.slice(currentIndex, currentIndex + 10);
  renderGames(batch);
  currentIndex += 10;

  loadMoreBtn.style.display =
    currentIndex >= sortedGames.length ? "none" : "inline-block";
}

function sortGames(method) {
  sortedGames = [...allGames];

  switch (method) {
    case "newest":
      sortedGames.sort((a, b) => b.folder - a.folder);
      break;
    case "oldest":
      sortedGames.sort((a, b) => a.folder - b.folder);
      break;
    case "az":
      sortedGames.sort((a, b) =>
        a.file.localeCompare(b.file)
      );
      break;
    case "za":
      sortedGames.sort((a, b) =>
        b.file.localeCompare(a.file)
      );
      break;
  }

  container.innerHTML = "";
  currentIndex = 0;
  loadGames();
}

sortSelect.addEventListener("change", e => sortGames(e.target.value));

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = sortedGames.filter(g =>
    g.file.replace(/_/g, " ").toLowerCase().includes(query)
  );

  container.innerHTML = "";
  renderGames(filtered.slice(0, 10));
  loadMoreBtn.style.display = filtered.length > 10 ? "inline-block" : "none";
});

fetch("games/index.json")
  .then(res => res.json())
  .then(data => {
    allGames = data;
    sortGames("newest");
  })
  .catch(() => loadMoreBtn.style.display = "none");

loadMoreBtn.addEventListener("click", loadGames);
