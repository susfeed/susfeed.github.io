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
                    <li><a href="../../index.html">Home</a></li>
                    <li><a href="../../articles.html">Susarticles</a></li>
                    <li><a href="../../quiz.html">Quizzes</a></li>
                    <li><a href="../../games.html">Games</a></li>
                    <li><a href="../../TV/index.html">SusFeed Video</a></li>
                    <li><a href="../../about.html">About</a></li>
                </ul>
            </nav>
        </header>
    `;

    const headerDiv = document.querySelector('.site-header');
    if (headerDiv) {
        headerDiv.innerHTML = headerContent;
    }

    const titleEl = document.querySelector('.article-main-title');
    if (
        titleEl &&
        titleEl.textContent.trim() ===
            'Top 10 Cereals That Will Stop You From Ending It All'
    ) {
        const logoImg = document.querySelector('.logo');
        if (logoImg) {
            logoImg.src = 'ringo.webp';
        }
    }
    else if (
        titleEl &&
        titleEl.textContent.trim() ===
            'Do You Deserve Happiness?'
    ) {
        const logoImg = document.querySelector('.logo');
        if (logoImg) {
            logoImg.src = '../../articles/22/ringo.webp';
        }
    }
    else if (
        titleEl &&
        titleEl.textContent.trim() ===
            'Ringo Starr Hangman'
    ) {
        const logoImg = document.querySelector('.logo');
        if (logoImg) {
            logoImg.src = '../../articles/22/ringo.webp';
        }
    }

    const sectionDiv = document.querySelector('.site-header');
    if (sectionDiv) {
        sectionDiv.innerHTML = headerContent;
    }

    const sectionEl = document.querySelector('.section-title');
    if (
        sectionEl &&
        sectionEl.textContent.trim() ===
            'Featured Ringo Starrticles'
    ) {
        const logoImg = document.querySelector('.logo');
        if (logoImg) {
            logoImg.src = '../../../articles/22/ringo.webp';
        }
    }

    const footerContent = `
        <footer class="site-footer">
            <div class="container">
                <a href="../../ringo.html">
                    <p>&copy; 2025 SusFeed. All rights reserved.</p>
                </a>
            </div>
        </footer>
    `;

    const footerDiv = document.querySelector('.site-footer');
    if (footerDiv) {
        footerDiv.innerHTML = footerContent;
    }
});
