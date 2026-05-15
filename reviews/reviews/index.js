const header = `
<header class="topbar">
  <div class="container nav">

    <a href="../index.html" class="brand">
      <img src="../img/logo.png" alt="SFGN" class="logo">
    </a>

    <nav>
      <a href="../index.html">Reviews</a>
      <a href="../../index.html">News</a>
    </nav>

  </div>
</header>
`;

const footer = `
<footer class="footer">
  <div class="container footer-inner">

    <div>
      <img src="../img/logo.png" alt="SFGN" class="footer-logo">

      <p>
        Independent reviews and editorials.
      </p>
    </div>

    <div class="footer-links">
      <a href="../../corporate/index.html">About</a>
      <a href="#">Contact</a>
      <a href="#">Privacy</a>
    </div>

  </div>
</footer>
`;

document.body.insertAdjacentHTML("afterbegin", header);
document.body.insertAdjacentHTML("beforeend", footer);