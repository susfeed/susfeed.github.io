document.addEventListener("DOMContentLoaded", () => {

  const startScreen = document.getElementById("start-screen");
  const startButton = document.getElementById("start-button");
  const wrapper = document.querySelector(".wrapper");

  const song1 = new Audio("song1.mp3");
  const song2 = new Audio("song2.mp3");

  song1.loop = true;
  song2.loop = true;

  song1.volume = 1;
  song2.volume = 0.05;

  let fadeInterval = null;
  let started = false;

  function hardSwitch(ww2) {
    clearInterval(fadeInterval);
    fadeInterval = setInterval(() => {
      if (ww2) {
        song1.volume = Math.max(0.05, song1.volume - 0.1);
        song2.volume = Math.min(1, song2.volume + 0.1);
        if (song2.volume >= 1) clearInterval(fadeInterval);
      } else {
        song1.volume = Math.min(1, song1.volume + 0.1);
        song2.volume = Math.max(0.05, song2.volume - 0.1);
        if (song1.volume >= 1) clearInterval(fadeInterval);
      }
    }, 20);
  }

  startButton.addEventListener("click", () => {
    if (started) return;
    started = true;

    song1.play();
    song2.play();

    startScreen.remove();
    wrapper.classList.remove("hidden");

    document.querySelector(".site-header").innerHTML = `
      <header class="site-header">
        <div class="container header-top">
          <a href="index.html">
            <img src="img/logo.png" class="logo" id="site-logo">
          </a>
        </div>
        <nav class="main-nav">
          <ul class="nav-links">
            <li><a href="#">Home</a></li>
            <li><a href="#">Articles</a></li>
            <li><a href="#">Quizzes</a></li>
            <li><a href="#">Games</a></li>
            <li><a href="#">About</a></li>
          </ul>
        </nav>
      </header>
    `;

    document.querySelector(".site-footer").innerHTML = `
      <footer class="site-footer">
        <p id="copyright">© 2026 SusFeed</p>
      </footer>
    `;

    const body = document.body;
    const logo = document.getElementById("site-logo");
    const copyright = document.getElementById("copyright");
    const titles = document.querySelectorAll(".section-title");

    titles.forEach(t => t.dataset.original = t.textContent);

    const titleMap = [
      "Verdächtigeartikel",
      "Quizze für das Reich",
      "Spiele für brave kleine Kinder"
    ];

    const flicker = document.createElement("div");
    flicker.className = "flicker-layer";

    const steps = [
      { t: 0,    ww2: true,  logo: "img/reallogo.png", copy: "© 1942 SSusFeed" },
      { t: 360,  ww2: false, logo: "img/logo.png",     copy: "© 2026 SusFeed" },
      { t: 720,  ww2: true,  logo: "img/reallogo.png", copy: "© 1943 SSusFeed" },
      { t: 1080, ww2: false, logo: "img/logo.png",     copy: "© 2026 SusFeed" },
      { t: 1440, ww2: true,  logo: "img/reallogo.png", copy: "© 1944 SSusFeed" },
      { t: 1800, ww2: false, logo: "img/logo.png",     copy: "© 2026 SusFeed" },
      { t: 2160, ww2: true,  logo: "img/reallogo.png", copy: "© 1988 SSusFeed" }
    ];

    setTimeout(() => {

      document.body.appendChild(flicker);
      body.classList.add("glitching");

      steps.forEach(step => {
        setTimeout(() => {
          logo.src = step.logo;
          copyright.textContent = step.copy;
          hardSwitch(step.ww2);

          if (step.ww2) {
            body.classList.add("ww2");
            titles.forEach((t, i) => t.textContent = titleMap[i]);
          } else {
            body.classList.remove("ww2");
            titles.forEach(t => t.textContent = t.dataset.original);
          }
        }, step.t);
      });

      setTimeout(() => {
        flicker.remove();
        body.classList.remove("glitching");
        body.classList.add("ww2");
        copyright.textContent = "© 1944 SSusFeed";
        hardSwitch(true);
      }, 3600);

    }, 10000);
  });

});
