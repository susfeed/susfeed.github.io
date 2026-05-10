const grid = document.getElementById("review-grid");
const search = document.getElementById("search");
const loadMore = document.getElementById("load-more");

let reviews = [];
let visible = 6;

async function loadReviews() {
  try {
    const response = await fetch("reviews/reviews.json");
    const data = await response.json();

    reviews = data.map(review => {
      const title = review.file
        .replace(/_/g, " ")
        .replace(/\.html$/i, "");

      return {
        title,
        file: `reviews/${review.file}`,
        image: `reviews/${review.cover || "cover.webp"}`,
        category: review.category || "REVIEW",
        score: review.score || (7 + Math.random() * 3).toFixed(1),
        description: review.description || "A featured review from the Critix editorial team."
      };
    });

    renderReviews(reviews);
  } catch (error) {
    console.error("Failed to load reviews:", error);
  }
}

function renderReviews(list) {
  grid.innerHTML = "";

  list.slice(0, visible).forEach(review => {
    const card = document.createElement("a");

    card.className = "review-card";
    card.href = review.file;

    card.innerHTML = `
      <div class="review-cover" style="background-image:url('${review.image}')"></div>

      <div class="review-content">
        <span class="review-type">${review.category}</span>

        <h3>${review.title}</h3>

        <p>${review.description}</p>

        <div class="review-meta">
          <span class="read-link">Read Review</span>
          <div class="score">${review.score}</div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  loadMore.style.display = visible >= list.length ? "none" : "inline-block";
}

function filteredReviews() {
  const value = search.value.toLowerCase();

  return reviews.filter(review =>
    review.title.toLowerCase().includes(value) ||
    review.category.toLowerCase().includes(value)
  );
}

loadMore.addEventListener("click", () => {
  visible += 6;
  renderReviews(filteredReviews());
});

search.addEventListener("input", () => {
  visible = 6;
  renderReviews(filteredReviews());
});

loadReviews();