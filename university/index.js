document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("header").innerHTML = headerHTML;
  document.getElementById("footer").innerHTML = footerHTML;

  const heroBtn = document.querySelector(".hero button");
  if (heroBtn) {
    heroBtn.onclick = () => {
      document.querySelector(".section").scrollIntoView({ behavior: "smooth" });
    };
  }

  initMenu();
  initDropdowns();
});

const headerHTML = `
<header class="header">
  <div class="container nav">
    <a href="index.html"><div class="logo"><img src="img/logo.png"></div></a>

    <div class="menu-toggle">☰</div>

    <nav>
      <div class="dropdown">
        <a href="#">About</a>
        <div class="dropdown-content">
          <a href="overview.html">Overview</a>
          <a href="mission.html">Mission</a>
          <a href="leadership.html">Leadership</a>
        </div>
      </div>

<div class="dropdown">
  <a href="programs.html">Programs</a>
  <div class="dropdown-content">
    <a href="programs.html">All</a>
    <a href="programs.html?level=certificate">Certificates</a>
    <a href="programs.html?level=minor">Minors</a>
    <a href="programs.html?level=undergraduate">Undergraduate</a>
    <a href="programs.html?level=graduate">Graduate</a>
    <a href="programs.html?level=phd">Doctoral</a>
  </div>
</div>

      <div class="dropdown">
        <a href="research.html">Research</a>
      </div>

      <div class="dropdown">
        <a href="admissions.html">Admissions</a>
      </div>

      <div class="dropdown">
        <a href="dash/index.html">Course Portal</a>
      </div>
    </nav>
  </div>
</header>
`;

const footerHTML = `
<footer class="footer">
  <div class="container">
    <p>SusFeed University</p>
    <p>Email: info@susfeed.edu</p>
    <p>© 2026 SusFeed University</p>
  </div>
</footer>
`;

function initMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("active");
    });
  }
}

function initDropdowns() {
  document.querySelectorAll(".dropdown > a").forEach(link => {
    link.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        link.parentElement.classList.toggle("open");
      }
    });
  });
}