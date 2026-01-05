async function loadBreakingNews() {
  try {
    const response = await fetch("news/scroll.json");
    const stories = await response.json();

    const shuffled = stories.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 8);

    const container = document.getElementById("breaking-content");
    container.innerHTML = "";

    selected.forEach(story => {
      let el;

      if (story.url) {
        el = document.createElement("a");
        el.href = story.url;
        el.className = "breaking-item breaking-link";
      } else {
        el = document.createElement("span");
        el.className = "breaking-item";
      }

      el.textContent = story.title || story;
      container.appendChild(el);
    });

  } catch (err) {
    console.error("Failed to load breaking news:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadBreakingNews);

async function loadAndDisplayContent(jsonPath, containerId, baseDir) {
      try {
        const response = await fetch(jsonPath);
        const data = await response.json();

        data.sort((a, b) => parseInt(b.folder) - parseInt(a.folder));

        const topThree = data.slice(0, 2);
        const container = document.getElementById(containerId);

        topThree.forEach(item => {
          const title = item.file.replace(/_/g, ' ').replace(/\.html$/, '');
          const card = document.createElement('a');
          card.href = `${baseDir}/${item.folder}/${item.file}`;
          card.className = 'block-card';
          card.innerHTML = `
            <div class="card-image" style="background-image: url('${baseDir}/${item.folder}/cover.webp');"></div>
            <div class="card-content">
              <h3 class="card-title">${title}</h3>
            </div>
          `;
          container.appendChild(card);
        });
      } catch (error) {
        console.error(`Failed to load ${jsonPath}:`, error);
      }
    }

    loadAndDisplayContent('articles/index.json', 'new-articles', 'articles');
    loadAndDisplayContent('quizzes/index.json', 'new-quizzes', 'quizzes');
    loadAndDisplayContent('games/index.json', 'new-games', 'games');

    document.addEventListener("DOMContentLoaded", () => {
  const susBotButton = document.getElementById("sus-bot-button");
  const susBot = document.getElementById("sus-bot");
  const susSend = document.getElementById("sus-send");
  const susInput = document.getElementById("sus-text");
  const susMessages = document.getElementById("sus-messages");

  if (!susBotButton) return;

  const susResponses = [
    "That sounds kinda sus ngl.",
    "I saw you vent. Don't lie.",
    "Red did it. Always red.",
    "Impostor behavior detected.",
    "Emergency meeting!",
    "Stop talking and do tasks.",
    "You typed that pretty confidently for an impostor.",
    "Vote them out. Trust me.",
    "Try asking again.",
    "Among fard ._.",
    "That sounds like colonizer behavior!",
    "Would Waluigi approve of that?",
    "That's an epic gamer moment!",
    "Have you tried adding more mayonnaise?",
    "7.",
    "Just go bake some cookies instead.",
    "Have you considered not caring?",
    "Consult Johnny Sins for advice.",
    "Just add a little crack!",
    "It's morphin' time then!",
    "Just buy another copy of Skyrim.",
    "Please enter you social security number to continue.",
    "This wouldn't be a problem if you had sex before.",
    "Rock lobster!",
    "Be on your phone, be bisexual, eat hot chip and lie.",
    "Tell me another secret!",
    "This is certified the 3rd best prompt I've ever gotten!",
    "STOP PLAYING RADIOHEAD OH MY GOD PLEASE STOP",
    "Radical!",
    "Consult the rat.",
    "Eat some more Reeese's Puffs!",
    "Atone for your sins, the puppy will forgive you.",
    "Continue clicking on!",
    "Coat Tom Holland in that sweet sweet mayo then come back to me.",
    "Consume the puffs!",
    "Ask the Al again!",
    "I quit, write your own response.",
    "Eat more puffs.",
    "I Bond burgered your sister.",
    "You should have some gelt.",
    "You are the reason your parents got a divorce.",
    "I can tell you were disturbingly old when you found out Santa isn't real.",
    "I did your mom last night lmao.",
    "It's not in the cards.",
    "Minion Bob disapproves.",
    "Look it up on SusiPedia.",
    "SusiPedia says that is wrong.",
    "Yeah I heard about that earlier on SusFeed.com"
  ];

  susBotButton.addEventListener("click", () => {
    susBot.classList.toggle("hidden");
  });

  susSend.addEventListener("click", sendSusMessage);
  susInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendSusMessage();
  });

  function sendSusMessage() {
  const text = susInput.value.trim();
  if (!text) return;
  
  susMessages.innerHTML += `
    <div class="sus-message user">
      <div class="sus-bubble">You: ${text}</div>
    </div>
  `;
  susInput.value = "";
  susMessages.scrollTop = susMessages.scrollHeight;

  const typingEl = document.createElement("div");
  typingEl.className = "sus-message bot";
  typingEl.innerHTML = `
    <div class="sus-bubble typing">SusBot is typing...</div>
  `;
  susMessages.appendChild(typingEl);
  susMessages.scrollTop = susMessages.scrollHeight;

  const reply = susResponses[Math.floor(Math.random() * susResponses.length)];

  setTimeout(() => {
    typingEl.innerHTML = `
      <div class="sus-bubble">${reply}</div>
    `;
    typingEl.classList.remove("typing");
    susMessages.scrollTop = susMessages.scrollHeight;
  }, 1200 + Math.random() * 800);
}
});
