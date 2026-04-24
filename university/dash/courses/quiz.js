const PASS_MARK = 70;

let scores = JSON.parse(localStorage.getItem("courseScores")) || {};
let attempts = JSON.parse(localStorage.getItem("courseAttempts")) || {};
let completedCourses = JSON.parse(localStorage.getItem("completedCourses")) || [];

let currentQuiz = null;

let READINGS = [];
let currentReading = null;

let VIDEOS = [];
let videoProgress = JSON.parse(localStorage.getItem("videoProgress")) || {};

let projectSubmissions = JSON.parse(localStorage.getItem("projectSubmissions")) || {};
let PROJECT = null;

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
  if (!container) return;
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

  VIDEOS.forEach((v, i) => {
    const watched = videoProgress[COURSE_CODE]?.[i];

    if (watched !== undefined) {
      const score = Math.min((watched / 90) * 100, 100);
      total += score * v.weight;
      weight += v.weight;
    }
  });

  if (PROJECT) {
    const proj = projectSubmissions[COURSE_CODE];
    if (proj && proj.submitted) {
      total += proj.score * PROJECT.weight;
      weight += PROJECT.weight;
    }
  }

  if (!weight) return;

  const final = Math.round(total / weight);

  document.getElementById("finalScore").textContent =
    `Final Score: ${final}%`;

  const projectDone = !PROJECT || projectSubmissions[COURSE_CODE]?.submitted;

  const allPassed =
    QUIZZES.every((q, i) => scores[COURSE_CODE][i] >= PASS_MARK) &&
    projectDone;

  if (final >= PASS_MARK && allPassed) {
    if (!completedCourses.includes(COURSE_CODE)) {
      completedCourses.push(COURSE_CODE);
      localStorage.setItem("completedCourses", JSON.stringify(completedCourses));
    }
    document.getElementById("statusText").textContent = "Completed";
  } else {
    document.getElementById("statusText").textContent = "Not Completed";
  }
}

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

function initVideos(videos) {
  VIDEOS = videos;

  const section = document.getElementById("videoCards")?.parentElement;

  if (!VIDEOS || VIDEOS.length === 0) {
    if (section) section.style.display = "none";
    return;
  } else {
    if (section) section.style.display = "block";
  }

  if (!videoProgress[COURSE_CODE]) {
    videoProgress[COURSE_CODE] = {};
  }

  renderVideoCards();
}

function renderVideoCards() {
  const container = document.getElementById("videoCards");
  if (!container) return;

  container.innerHTML = "";

  VIDEOS.forEach((video, i) => {
    const watched = videoProgress[COURSE_CODE][i] || 0;
    const score = Math.min((watched / 90) * 100, 100).toFixed(0);

    const card = document.createElement("div");
    card.className = "quiz-card";
    card.onclick = () => openVideo(i);

    card.innerHTML = `
      <h3>${video.title}</h3>
      <p>${video.weight}%</p>
      <p>Watched: ${watched.toFixed(0)}%</p>
      <p>Score: ${score}%</p>
    `;

    container.appendChild(card);
  });
}

function openVideo(i) {
  currentVideo = i;

  const video = VIDEOS[i];

  document.getElementById("videoTitle").textContent = video.title;

  const player = document.getElementById("videoPlayer");
  player.src = video.src;

  document.getElementById("videoModal").classList.remove("hidden");

  trackVideoProgress(player, i);
}

function closeVideo() {
  document.getElementById("videoModal").classList.add("hidden");

  const player = document.getElementById("videoPlayer");
  player.pause();
}

function trackVideoProgress(videoElement, index) {
  videoElement.ontimeupdate = () => {
    const percent = (videoElement.currentTime / videoElement.duration) * 100;

    if (!videoProgress[COURSE_CODE][index] || percent > videoProgress[COURSE_CODE][index]) {
      videoProgress[COURSE_CODE][index] = percent;

      localStorage.setItem("videoProgress", JSON.stringify(videoProgress));

      renderVideoCards();
      updateFinal();
    }
  };
}

function initProject(project) {
  PROJECT = project;

  if (!projectSubmissions[COURSE_CODE]) {
    projectSubmissions[COURSE_CODE] = { submitted: false, score: 0 };
  }

  renderProject();
}

function renderProject() {
  const box = document.getElementById("projectBox");
  if (!box || !PROJECT) return;

  const data = projectSubmissions[COURSE_CODE];

  box.innerHTML = `
    <h2>${PROJECT.title}</h2>
    <p>${PROJECT.weight}%</p>
    <p>${PROJECT.description}</p>
    <textarea id="projectInput" placeholder="Write your response..."></textarea>
    <button class="btn-primary" onclick="submitProject()">Submit</button>
    <p>Status: ${data.submitted ? "Submitted ✅" : "Not Submitted"}</p>
    <p>Score: ${data.score}%</p>
  `;
}

function submitProject() {
  const text = document.getElementById("projectInput").value.trim();

  if (text.length < 50) {
    alert("Submission too short (min 50 characters)");
    return;
  }

  let score = 70;

  if (text.length > 150) score = 85;
  if (text.length > 300) score = 100;

  projectSubmissions[COURSE_CODE] = {
    submitted: true,
    score: score
  };

  localStorage.setItem("projectSubmissions", JSON.stringify(projectSubmissions));

  renderProject();
  updateFinal();
}