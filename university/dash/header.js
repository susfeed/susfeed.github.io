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
    <a href="../index.html"><div class="logo"><img src="../img/logo.png"></div></a>
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