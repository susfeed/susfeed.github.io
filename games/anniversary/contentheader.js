(function() {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var logoWrap = document.createElement('div');
  logoWrap.className = 'logo-wrap';

  var logo = document.createElement('img');
  logo.className = 'logo';
  logo.src = '../logo.png';
  logo.alt = 'SusFeed';
  logoWrap.appendChild(logo);

  var nav = document.createElement('nav');
  nav.className = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  var link1 = document.createElement('a');
  link1.href = '../susarticles.html';
  link1.textContent = 'Susarticles';
  nav.appendChild(link1);

  var icon1 = document.createElement('img');
  icon1.className = 'amogus';
  icon1.src = '../amogus.png';
  icon1.alt = '';
  nav.appendChild(icon1);

  var link2 = document.createElement('a');
  link2.href = '#';
  link2.textContent = 'Quizes';
  nav.appendChild(link2);

  var icon2 = document.createElement('img');
  icon2.className = 'amogus';
  icon2.src = '../amogus.png';
  icon2.alt = '';
  nav.appendChild(icon2);

  var link3 = document.createElement('a');
  link3.href = '../about.html';
  link3.textContent = 'About';
  nav.appendChild(link3);

  header.appendChild(logoWrap);
  header.appendChild(nav);
})();