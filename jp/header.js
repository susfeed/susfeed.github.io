document.addEventListener('DOMContentLoaded', function () {
    const headerContent = `
        <header class="site-header">
            <div class="container header-top">
                <a href="index.html" class="logo-link">
                    <img src="img/jplogo.png" alt="SusFeed Logo" class="logo" />
                </a>
            </div>

            <nav class="main-nav">
                <ul class="nav-links">

                    <li><a href="index.html"><img src="img/amogus.webp" alt="SusFeed Icon" class="logo" /></a></li>

                    <li class="dropdown">
                        <a href="#">サッスフィードニュース ▾</a>
                        <ul class="dropdown-menu">
                            <li><a href="articles.html">疑記事</a></li>
                            <li><a href="quiz.html">クイズ</a></li>
                            <li><a href="games.html">ゲーム</a></li>
                        </ul>
                    </li>

                    <li class="dropdown">
                        <a href="about.html">アバウト</a>
                    </li>

                </ul>
            </nav>
        </header>
    `;

    const headerDiv = document.querySelector('.site-header');
    if (headerDiv) headerDiv.innerHTML = headerContent;

    document.querySelectorAll('.dropdown').forEach(drop => {
        drop.addEventListener('click', function (e) {
            e.stopPropagation();
            this.classList.toggle('open');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
    });

    const footerContent = `
        <footer class="site-footer">
            <div class="container">
                <a href="67.html">
                    <p>&copy; 2026 SusFeed JP.</p>
                </a>
            </div>
        </footer>
    `;

    const footerDiv = document.querySelector('.site-footer');
    if (footerDiv) footerDiv.innerHTML = footerContent;
});