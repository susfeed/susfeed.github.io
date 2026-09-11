const conferences = [
  {
    id: "smeff-future",
    tag: "Live",
    live: true,
    duration: "1:24:15",
    title: "Keynote: The Future of Smeff Theory in a Post-Sus World",
    description: "Opening address for the Annual Symposium on Sus Dynamics, examining new frameworks and applied methodologies.",
    speaker: {
      name: "Dr. Cameron Impostor",
      avatar: "../img/cam.png"
    },
    meta: {
      event: "Annual Symposium",
      views: "2.4k watching"
    },
    thumbnail: "",
    videoSrc: ""
  },
  {
    id: "journalism-digital",
    tag: "Panel",
    live: false,
    duration: "58:42",
    title: "Investigative Journalism in the Digital Age",
    description: "A moderated discussion on media integrity, source protection, and the evolving role of the press.",
    speaker: {
      name: "Prof. Phillip",
      avatar: "../img/phil.png"
    },
    meta: {
      event: "Journalism Forum",
      views: "1.8k views"
    },
    thumbnail: "",
    videoSrc: ""
  },
  {
    id: "ea-nasir",
    tag: "Lecture",
    live: false,
    duration: "1:12:08",
    title: "Ea Nasir and the Origins of Customer Complaints",
    description: "A close reading of the famous complaint tablet and its implications for early Mesopotamian commerce.",
    speaker: {
      name: "Dr. John Smeff Mancala",
      avatar: "../img/smeffdean.png"
    },
    meta: {
      event: "Mesopotamian Colloquium",
      views: "3.1k views"
    },
    thumbnail: "",
    videoSrc: ""
  },
  {
    id: "puff-summit",
    tag: "Workshop",
    live: false,
    duration: "44:55",
    title: "Puff Theory Summit: Symbolism, Cereal, and Culture",
    description: "An interactive workshop on the cultural narratives surrounding puff-based media and modern storytelling.",
    speaker: {
      name: "Prof. Ringo Starr",
      avatar: "../img/ringo.png"
    },
    meta: {
      event: "Puff Theory Summit",
      views: "2.7k views"
    },
    thumbnail: "",
    videoSrc: ""
  }
];

const archives = [
  {
    year: "2025",
    title: "Sus Dynamics & Applied Smeff",
    count: "22"
  },
  {
    year: "2025",
    title: "Journalism in Transition",
    count: "21"
  },
  {
    year: "2024",
    title: "Mesopotamian Studies Conference",
    count: "20"
  },
  {
    year: "2024",
    title: "Puff Theory Summit",
    count: "19"
  }
];

function renderVideos() {
  const grid = document.getElementById("videoGrid");
  if (!grid) return;

  grid.innerHTML = conferences.map(conf => `
    <div class="video-card" onclick="openVideo('${conf.id}')">
      <div class="video-thumb" ${conf.thumbnail ? `style="background-image: url('${conf.thumbnail}');"` : ""}>
        <span class="video-tag ${conf.live ? "live" : ""}">${conf.tag}</span>
        <div class="play-btn"></div>
        <span class="video-duration">${conf.duration}</span>
      </div>
      <div class="video-info">
        <div class="video-speaker">
          <img src="${conf.speaker.avatar}" alt="${conf.speaker.name}">
          <span>${conf.speaker.name}</span>
        </div>
        <h3>${conf.title}</h3>
        <p>${conf.description}</p>
        <div class="video-meta">
          <span>${conf.meta.event}</span>
          <span class="dot"></span>
          <span>${conf.meta.views}</span>
        </div>
      </div>
    </div>
  `).join("");
}

function renderArchives() {
  const strip = document.getElementById("archiveStrip");
  if (!strip) return;

  strip.innerHTML = archives.map(a => `
    <div class="archive-item">
      <div class="archive-year">${a.year}</div>
      <div class="archive-info">
        <h4>${a.title}</h4>
        <span>${a.count}</span>
      </div>
    </div>
  `).join("");
}

function openVideo(id) {
  const conf = conferences.find(c => c.id === id);
  if (!conf) return;

  const modal = document.getElementById("videoModal");
  const player = document.getElementById("videoPlayer");
  const info = document.getElementById("videoModalInfo");

  if (conf.videoSrc) {
    player.src = conf.videoSrc;
    player.style.display = "block";
    player.load();
    player.play().catch(() => {});
  } else {
    player.removeAttribute("src");
    player.style.display = "block";
    player.load();
  }

  info.innerHTML = `
    <h3>${conf.title}</h3>
    <div class="modal-speaker">
      <img src="${conf.speaker.avatar}" alt="${conf.speaker.name}">
      <span>${conf.speaker.name}</span>
    </div>
    <p>${conf.description}</p>
    <div class="modal-meta">
      <span>${conf.meta.event}</span>
      <span>${conf.duration}</span>
      <span>${conf.meta.views}</span>
    </div>
  `;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeVideo() {
  const modal = document.getElementById("videoModal");
  const player = document.getElementById("videoPlayer");

  if (player) {
    player.pause();
    player.removeAttribute("src");
    player.load();
  }

  modal.classList.remove("active");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    closeVideo();
  }
});

document.addEventListener("DOMContentLoaded", function() {
  renderVideos();
  renderArchives();

  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function() {
      nav.classList.toggle("active");
    });
  }
  document.querySelectorAll(".dropdown > a").forEach(function(link) {
    link.addEventListener("click", function(e) {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        this.parentElement.classList.toggle("open");
      }
    });
  });
});