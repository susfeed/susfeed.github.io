document.addEventListener("click", e => {
  const card = e.target.closest(".block-card");
  if (!card) return;

  card.animate([
    { transform: "scale(1)" },
    { transform: "scale(1.1) rotate(2deg)" },
    { transform: "scale(1)" }
  ], {
    duration: 300,
    easing: "ease-out"
  });
});

const kidSusResponses = [
  "That's a great question bud! Next time, keep it to yourself!",
  "Learning is kinda sus…",
  "Nice thinking! They'll love that idea in idiotsville!",
  "Drink the windex in mommy's cleaning cabinet!",
  "Ask mommy and daddy where babies come from!",
  "Daddy isn't coming home sport.",
  "Fuck!"
];

const susBotButton = document.getElementById("sus-bot-button");
const susBot = document.getElementById("sus-bot");
const susSend = document.getElementById("sus-send");
const susInput = document.getElementById("sus-text");
const susMessages = document.getElementById("sus-messages");

if (susBotButton) {
  susBotButton.addEventListener("click", () => {
    susBot.classList.toggle("hidden");
  });
}

if (susSend) {
  susSend.addEventListener("click", sendMessage);
}

if (susInput) {
  susInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });
}

function sendMessage() {
  const text = susInput.value.trim();
  if (!text) return;

  susMessages.innerHTML += `
    <div class="sus-message user">
      <div class="sus-bubble">🙂 ${text}</div>
    </div>`;

  susInput.value = "";
  susMessages.scrollTop = susMessages.scrollHeight;

  setTimeout(() => {
    const reply = kidSusResponses[Math.floor(Math.random() * kidSusResponses.length)];
    susMessages.innerHTML += `
      <div class="sus-message bot">
        <div class="sus-bubble">🤖 ${reply}</div>
      </div>`;
    susMessages.scrollTop = susMessages.scrollHeight;
  }, 700);
}