function getResult(event) {
  if (event) {
    event.preventDefault();
  }

  const form = document.getElementById("quiz-form");
  const selected = form.querySelectorAll("input[type='radio']:checked");

  const scores = {};
  let totalWeight = 0;

  if (selected.length === 0) {
    console.warn("No answers selected!");
  }

  selected.forEach(input => {
    const result = input.getAttribute("data-result");
    const points = parseInt(input.getAttribute("data-points")) || 0;

    console.log(`Selected: ${input.value}, Result: ${result}, Points: ${points}`);

    scores[result] = (scores[result] || 0) + points;
    totalWeight += points;
  });

  console.log("Scores:", scores);

  if (Object.keys(scores).length === 0) {
    console.warn("No valid answers were selected, can't calculate result.");
    return;
  }

  const maxScore = Math.max(...Object.values(scores));

  const topResults = Object.keys(scores).filter(result => scores[result] === maxScore);

  let selectedResult;
  if (topResults.length === 1) {
    selectedResult = topResults[0];
  } else {
    selectedResult = topResults[Math.floor(Math.random() * topResults.length)];
  }

  document.querySelectorAll('.quiz-result').forEach(div => div.style.display = 'none');

  const resultDiv = document.getElementById(`result-${selectedResult}`);
  if (resultDiv) {
    resultDiv.style.display = "block";
  } else {
    console.warn("No matching result found.");
  }

  document.getElementById("result").style.display = "block";
}
