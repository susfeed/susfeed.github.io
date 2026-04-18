const levelFilter = document.getElementById("levelFilter");
const deptFilter = document.getElementById("deptFilter");
const programs = document.querySelectorAll("#programGrid .card");

let noResults = document.createElement("p");
noResults.className = "no-results";
noResults.textContent = "No programs match your filters.";
document.getElementById("programGrid").after(noResults);

function applyFilters() {
  const level = levelFilter.value;
  const dept = deptFilter.value;

  let visible = 0;

  programs.forEach(card => {
    const cardLevel = card.dataset.level;
    const cardDept = card.dataset.dept;

    let show = true;

    if (level !== "all" && cardLevel !== level) show = false;
    if (dept !== "all" && cardDept !== dept) show = false;

    card.style.display = show ? "block" : "none";
    if (show) visible++;
  });

  noResults.style.display = visible === 0 ? "block" : "none";
}

levelFilter.addEventListener("change", applyFilters);
deptFilter.addEventListener("change", applyFilters);

function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const level = params.get("level");

  if (level) {
    levelFilter.value = level;
  }

  applyFilters();
}

applyQueryParams();

function addBadges() {
  const cards = document.querySelectorAll("#programGrid .card");

  cards.forEach(card => {
    const level = card.dataset.level;
    let label = "";

    if (level === "undergraduate") {
      if (card.querySelector("h3").textContent.includes("BS")) {
        label = "BS";
      } else {
        label = "BA";
      }
    }

    if (level === "graduate") {
      if (card.querySelector("h3").textContent.includes("Smeff")) {
        label = "MSmeff";
      } else if (card.querySelector("h3").textContent.includes("MS")) {
        label = "MS";
      } else {
        label = "MA";
      }
    }

    if (level === "phd") label = "Doctorate";
    if (level === "certificate") label = "Certification";
    if (level === "minor") label = "Minor";

    if (label) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = label;
      card.prepend(badge);
    }
  });
}

addBadges();