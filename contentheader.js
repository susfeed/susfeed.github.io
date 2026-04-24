document.addEventListener('DOMContentLoaded', function () {
    const headerContent = `
        <header class="site-header">
            <div class="container header-top">
                <a href="../../index.html" class="logo-link">
                    <img src="../../img/logo.webp" alt="SusFeed Logo" class="logo" />
                </a>
            </div>

            <nav class="main-nav">
                <ul class="nav-links">

                    <li><a href="../../index.html"><img src="../../img/amogus.webp" alt="SusFeed Icon" class="logo" /></a></li>

                    <li class="dropdown">
                        <a href="#">SusFeed News ▾</a>
                        <ul class="dropdown-menu">
                            <li><a href="../../articles.html">Susarticles</a></li>
                            <li><a href="../../quiz.html">Quizzes</a></li>
                            <li><a href="../../games.html">Games</a></li>
                            <li><a href="../../about.html">About</a></li>
                        </ul>
                    </li>

                    <li class="dropdown">
                        <a href="../../TV/index.html">SusFeed Video</a>
                    </li>

                    <li class="dropdown">
                        <a href="../../susipedia/index.html">SusiPedia</a>
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
                <a href="../../67.html">
                    <p>&copy; 2026 SusFeed. All rights reserved.</p>
                </a>
            </div>
        </footer>
    `;

    const footerDiv = document.querySelector('.site-footer');
    if (footerDiv) footerDiv.innerHTML = footerContent;
});