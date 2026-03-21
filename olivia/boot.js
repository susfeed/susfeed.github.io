const bootScreen = document.getElementById('boot-screen');
const bootBar = document.getElementById('boot-bar');

let progress = 0;
let stallDone = false;

function incrementBootBar() {
  let increment, randomInterval;

  if (progress < 90) {
    increment = Math.random() * 14.5 + 0.5;
    randomInterval = Math.random() * 190 + 10;
  } else if (!stallDone) {
    increment = 0;
    randomInterval = Math.random() * 300 + 600;
    stallDone = true;
  } else {
    increment = Math.random() * 2 + 0.2;
    randomInterval = Math.random() * 150 + 100;
  }

  progress += increment;
  bootBar.style.width = Math.min(progress, 100) + '%';

  if (progress >= 100) {
    bootBar.style.width = '100%';
    bootScreen.style.transition = 'opacity 1s';
    bootScreen.style.opacity = 0;
    setTimeout(() => bootScreen.remove(), 1000);
    return;
  }

  setTimeout(incrementBootBar, randomInterval);
}

window.addEventListener('load', () => {
  incrementBootBar();
});
