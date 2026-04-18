const PASS_MARK = 70;

let scores = JSON.parse(localStorage.getItem("courseScores")) || {};
let attempts = JSON.parse(localStorage.getItem("courseAttempts")) || {};
let completedCourses = JSON.parse(localStorage.getItem("completedCourses")) || [];

let currentQuiz = null;

let READINGS = [];
let currentReading = null;

function initCourse(courseCode, quizzes) {
  window.COURSE_CODE = courseCode;
  window.QUIZZES = quizzes;

  if (!attempts[COURSE_CODE]) attempts[COURSE_CODE] = {};
  if (!scores[COURSE_CODE]) scores[COURSE_CODE] = {};

  renderCards();
  updateFinal();
}

function renderCards() {
  const container = document.getElementById("quizCards");
  container.innerHTML = "";

  QUIZZES.forEach((quiz, i) => {
    const passed = scores[COURSE_CODE][i] >= PASS_MARK;
    const prevPassed = i === 0 || scores[COURSE_CODE][i - 1] >= PASS_MARK;

    const card = document.createElement("div");
    card.className = "quiz-card";

    let status = "";
    if (scores[COURSE_CODE][i] !== undefined) {
      status = scores[COURSE_CODE][i] >= PASS_MARK ? "✔️ Passed" : "❌ Failed";
    }

    let attemptText = attempts[COURSE_CODE][i] || 0;

    card.innerHTML = `
      <h3>${quiz.title}</h3>
      <p>${quiz.weight}%</p>
      <p>${status}</p>
      <p>Attempts: ${attemptText}/2</p>
    `;

    if (!prevPassed) {
      card.classList.add("locked");
      card.innerHTML += `<p>🔒 Locked</p>`;
    } else if (passed) {
      card.classList.add("completed");
    } else {
      card.onclick = () => openQuiz(i);
    }

    container.appendChild(card);
  });
}

function openQuiz(i) {
  currentQuiz = i;
  document.getElementById("quizModal").classList.remove("hidden");

  const quiz = QUIZZES[i];
  document.getElementById("quizTitle").textContent = quiz.title;

  let html = "";

  quiz.questions.forEach((q, qi) => {
    html += `<div class="question"><p>${q.q}</p>`;
    q.options.forEach((opt, oi) => {
      html += `<label><input type="radio" name="q-${qi}" value="${oi}"> ${opt}</label>`;
    });
    html += `</div>`;
  });

  document.getElementById("quizQuestions").innerHTML = html;
}

function closeQuiz() {
  document.getElementById("quizModal").classList.add("hidden");
}

function submitQuiz() {
  if (!attempts[COURSE_CODE][currentQuiz]) {
    attempts[COURSE_CODE][currentQuiz] = 0;
  }

  if (attempts[COURSE_CODE][currentQuiz] >= 2) {
    alert("No attempts left for this quiz");
    return;
  }

  const quiz = QUIZZES[currentQuiz];
  let correct = 0;

  quiz.questions.forEach((q, i) => {
    const sel = document.querySelector(`input[name="q-${i}"]:checked`);
    if (sel && parseInt(sel.value) === q.answer) correct++;
  });

  const percent = Math.round((correct / quiz.questions.length) * 100);

  scores[COURSE_CODE][currentQuiz] = percent;
  attempts[COURSE_CODE][currentQuiz]++;

  localStorage.setItem("courseScores", JSON.stringify(scores));
  localStorage.setItem("courseAttempts", JSON.stringify(attempts));

  document.getElementById("quizScore").textContent = `Score: ${percent}%`;

  closeQuiz();
  renderCards();
  updateFinal();
}

function updateFinal() {
  let total = 0;
  let weight = 0;

  QUIZZES.forEach((q, i) => {
    const s = scores[COURSE_CODE][i];
    if (s !== undefined) {
      total += s * q.weight;
      weight += q.weight;
    }
  });

  if (!weight) return;

  const final = Math.round(total / weight);

  document.getElementById("finalScore").textContent =
    `Final Score: ${final}%`;

  if (final >= PASS_MARK) {
    if (!completedCourses.includes(COURSE_CODE)) {
      completedCourses.push(COURSE_CODE);
      localStorage.setItem("completedCourses", JSON.stringify(completedCourses));
    }
    document.getElementById("statusText").textContent = "Completed";
  } else {
    document.getElementById("statusText").textContent = "Not Completed";
  }
}

/* ================= READINGS ================= */

function initReadings(readings) {
  READINGS = readings;
  renderReadingCards();
}

function renderReadingCards() {
  const container = document.getElementById("readingCards");
  if (!container) return;

  container.innerHTML = "";

  READINGS.forEach((reading, i) => {
    const card = document.createElement("div");
    card.className = "quiz-card";
    card.onclick = () => openReading(i);

    card.innerHTML = `
      <h3>${reading.title}</h3>
      <p>Reading Material</p>
    `;

    container.appendChild(card);
  });
}

function openReading(i) {
  currentReading = i;

  const reading = READINGS[i];
  document.getElementById("readingTitle").textContent = reading.title;
  document.getElementById("readingContent").innerHTML = reading.content;

  document.getElementById("readingModal").classList.remove("hidden");
}

function closeReading() {
  document.getElementById("readingModal").classList.add("hidden");
}