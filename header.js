document.addEventListener('DOMContentLoaded', function() {
    const headerContent = `
        <header class="site-header">
            <div class="container header-top">
                <a href="index.html" class="logo-link">
                    <img src="img/logo.webp" alt="SusFeed Logo" class="logo" />
                </a>
            </div>
            <nav class="main-nav">
                <ul class="nav-links">
                    <li><a href="index.html">Home</a></li>
                    <li><a href="articles.html">Susarticles</a></li>
                    <li><a href="quiz.html">Quizzes</a></li>
                    <li><a href="https://www.youtube.com/@SusFeed">SusFeed Video</a></li>
                    <li><a href="about.html">About</a></li>
                </ul>
            </nav>
        </header>
    `;
    
    const headerDiv = document.querySelector('.site-header');
    
    if (headerDiv) {
        headerDiv.innerHTML = headerContent;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const footerContent = `
        <footer class="site-footer">
            <div class="container">
                <a href="gif/easteregg.html"><p>&copy; 2025 SusFeed. All rights reserved.</p></a>
            </div>
        </footer>
    `;
    
    const footerDiv = document.querySelector('.site-footer');
    
    if (footerDiv) {
        footerDiv.innerHTML = footerContent;
    }
});