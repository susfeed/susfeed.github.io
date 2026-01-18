const questions = document.querySelectorAll(".quiz-question");
const finishBtn = document.getElementById("finish-quiz");
const resultMessage = document.getElementById("result-message");
const triviaPopup = document.getElementById("trivia-popup");
const triviaText = triviaPopup.querySelector(".trivia-text");

let glitchInterval = null;
let triviaTimeouts = [];
let triviaActive = false;

function glitchMorph(element, newText) {
  const chars = "!<>-_\\/[]{}—=+*^?#________";
  let frame = 0;

  clearInterval(glitchInterval);

  glitchInterval = setInterval(() => {
    element.textContent = newText
      .split("")
      .map((char, i) => (i < frame ? char : chars[Math.floor(Math.random() * chars.length)]))
      .join("");

    frame++;

    if (frame > newText.length) {
      clearInterval(glitchInterval);
      element.textContent = newText;
    }
  }, 40);
}

function clearTriviaTimers() {
  triviaTimeouts.forEach(t => clearTimeout(t));
  triviaTimeouts = [];
}

function showTrivia(firstText, secondText) {
  if (triviaActive) return;
  triviaActive = true;

  clearTriviaTimers();
  clearInterval(glitchInterval);

  triviaText.textContent = firstText;
  triviaPopup.classList.remove("hidden", "glitch");

  triviaTimeouts.push(setTimeout(() => {
    triviaPopup.classList.add("glitch");
    glitchMorph(triviaText, secondText);
  }, 3000));

  triviaTimeouts.push(setTimeout(() => {
    triviaPopup.classList.remove("glitch");
    triviaPopup.classList.add("hidden");
    triviaActive = false;
  }, 6500));
}

function showTrivia(firstText, secondText) {
  triviaText.textContent = firstText;
  triviaPopup.classList.remove("hidden");

  setTimeout(() => {
    triviaPopup.classList.add("glitch");
    glitchMorph(triviaText, secondText);
  }, 1000);

  setTimeout(() => {
    triviaPopup.classList.remove("glitch");
    triviaPopup.classList.add("hidden");
  }, 6500);
}

questions.forEach(q => {
  const buttons = q.querySelectorAll("button");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (q.classList.contains("answered")) return;

      q.classList.add("answered");

      const correct = q.dataset.answer;
      const chosen = btn.dataset.choice;
      const mark = q.querySelector(".mark");

      if (chosen === correct) {
        q.classList.add("correct");
        mark.textContent = "✔";
        mark.classList.add("correct");
      } else {
        q.classList.add("wrong");
        mark.textContent = "✖";
        mark.classList.add("wrong");
      }
          const trivia = q.dataset.trivia;
        const after = q.dataset.after;

        if (trivia && after) {
        showTrivia(trivia, after);
        }
    });
  });
});

finishBtn.addEventListener("click", () => {
  let allCorrect = true;

  questions.forEach(q => {
    if (!q.classList.contains("correct")) {
      allCorrect = false;
    }
  });

  resultMessage.classList.remove("hidden");

  if (allCorrect) {
    resultMessage.textContent =
      "✔ EXEMPLARY PERFORMANCE. YOU MAY PROCEED.";
  } else {
    resultMessage.textContent =
      "✖ DU HAST DEM REICH DEN GEHORSAM GEWIDERT.";
  }
});
