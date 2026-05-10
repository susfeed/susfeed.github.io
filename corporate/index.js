document.getElementById("year").textContent = new Date().getFullYear();

const ticker = document.getElementById("ticker");
function randomStock() {
  return (Math.random() * 1000 + 100).toFixed(2);
}
setInterval(() => {
  ticker.textContent = `SUS ${randomStock()} ▲  |  VIDEO ${randomStock()} ▲  |  SFU ${randomStock()} ▲  |  PEDIA ${randomStock()} ▲  |  SUOS ${randomStock()} ▲`;
}, 1500);

const barChart = document.getElementById("barChart");
for (let i = 0; i < 8; i++) {
  const bar = document.createElement("div");
  bar.className = "bar";
  bar.style.height = Math.random() * 100 + "%";
  barChart.appendChild(bar);
}

const canvas = document.getElementById("lineChart");
const ctx = canvas.getContext("2d");
canvas.width = 300;
canvas.height = 150;

ctx.beginPath();
ctx.moveTo(0, 100);

for (let x = 0; x <= 300; x += 30) {
  ctx.lineTo(x, Math.random() * 100);
}

ctx.strokeStyle = "#b30000";
ctx.stroke();

function openModal(job) {
  document.getElementById("modal").style.display = "flex";
  document.getElementById("jobTitle").textContent = job;
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}