const user = JSON.parse(localStorage.getItem("user"));
if (!user || !user.degree) {
  window.location.href = "../admissions.html";
}

function getStudentID() {
  let id = localStorage.getItem("studentID");
  if (!id) {
    id = "SFU-" + Math.floor(100000 + Math.random() * 900000);
    localStorage.setItem("studentID", id);
  }
  return id;
}

document.getElementById("studentName").textContent = user.name || "Student";

let programText = user.degree.program || "";
if (user.degree.concentration) {
  programText += " (" + user.degree.concentration + ")";
}
if (user.degree.minor) {
  programText += " · Minor: " + user.degree.minor;
}
document.getElementById("programName").textContent = programText;

let completedCourses = JSON.parse(localStorage.getItem("completedCourses")) || [];

Promise.all([
  fetch("../programs.json").then(res => res.json()),
  fetch("courses.json").then(res => res.json())
]).then(([programsData, coursesJson]) => {

  const courses = coursesJson.courses;
  window.coursesData = courses;

const relevantCourses = courses.filter(course => {

  const inMajor =
    course.programs &&
    course.programs.includes(user.degree.program) &&
    course.levels.includes(user.degree.level) &&
    (!course.concentrations || course.concentrations.includes(user.degree.concentration));

  const inMinor =
    user.degree.minor &&
    course.minors &&
    course.minors.includes(user.degree.minor);

  return inMajor || inMinor;
});

  let completedCredits = 0;
  const totalCredits = relevantCourses.reduce((sum, c) => sum + c.credits, 0);

  const container = document.getElementById("courseList");

  relevantCourses.forEach(course => {
    const isDone = completedCourses.includes(course.code);
    if (isDone) completedCredits += course.credits;

    const card = document.createElement("a");
    card.className = "card";
    card.href = `courses/${course.code}.html`;

card.innerHTML = `
  <h3>${course.code} – ${course.title}</h3>
  <p>${course.credits} credits</p>
  <p>${course.minors ? "Minor Course" : "Major Course"}</p>
  <p>Status: <strong>${isDone ? "Completed" : "Not Completed"}</strong></p>
`;

    container.appendChild(card);
  });

  const percent = totalCredits ? Math.round((completedCredits / totalCredits) * 100) : 0;

  document.getElementById("progressText").textContent =
    `${completedCredits} / ${totalCredits} credits completed (${percent}%)`;

  document.getElementById("progressBar").style.width = percent + "%";

  checkGraduation(percent);
});

function checkGraduation(percent) {
  if (percent === 100) {
    document.getElementById("gradActions").style.display = "block";
  }
}

function generateTranscript() {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const completed = JSON.parse(localStorage.getItem("completedCourses")) || [];
  const courses = window.coursesData || [];
  const studentID = getStudentID();

  const logo = new Image();
  logo.src = "../img/logo.png";

  logo.onload = () => {

    ctx.drawImage(logo, 200, 20, 500, 170);

    ctx.fillStyle = "#7a0f0f";
    ctx.font = "bold 28px serif";
    ctx.fillText("Official Transcript", 320, 220);

    ctx.fillStyle = "#000";
    ctx.font = "18px serif";

    ctx.fillText("Name: " + user.name, 50, 280);
    ctx.fillText("Student ID: " + studentID, 50, 310);
    ctx.fillText("Program: " + user.degree.program, 50, 340);
    ctx.fillText("Year Completed: " + new Date().getFullYear(), 50, 370);

    const sorted = completed.map(code => {
      return courses.find(c => c.code === code) || {
        code,
        title: "Unknown Course",
        credits: 0
      };
    });

    let y = 460;
    let total = 0;

    ctx.font = "bold 20px serif";
    ctx.fillText("Completed Courses", 50, 420);

    ctx.font = "16px serif";

    sorted.forEach(c => {
      total += c.credits || 0;

      ctx.fillText(`${c.code} - ${c.title}`, 60, y);
      ctx.fillText(`${c.credits || 0} cr`, 750, y);

      y += 28;
    });

    y += 20;
    ctx.font = "bold 18px serif";
    ctx.fillText(`Total Credits: ${total}`, 60, y);

    downloadCanvas(canvas, "transcript.png");
  };
}

function generateCertificate() {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");

  const studentID = getStudentID();

  ctx.fillStyle = "#fdf6f6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#7a0f0f";
  ctx.lineWidth = 10;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  ctx.lineWidth = 2;
  ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

  const logo = new Image();
  const seal = new Image();

  logo.src = "../img/logo.png";
  seal.src = "../img/favicon.png";

  logo.onload = () => {

    ctx.drawImage(logo, 450, 60, 500, 170);

    ctx.fillStyle = "#7a0f0f";
    ctx.font = "bold 50px serif";
    ctx.textAlign = "center";

const fullTitle = user.degree.program;
    ctx.fillText(fullTitle, 700, 280);

    ctx.font = "bold 42px serif";
    ctx.fillStyle = "#000";
    ctx.fillText(user.name, 700, 380);

    ctx.font = "22px serif";
    ctx.fillText("has successfully completed the above program", 700, 440);

    if (user.degree.concentration) {
      ctx.fillText(`Concentration: ${user.degree.concentration}`, 700, 500);
    }

    if (user.degree.minor) {
      ctx.fillText(`Minor: ${user.degree.minor}`, 700, 540);
    }

    ctx.fillText(`Class of ${new Date().getFullYear()}`, 700, 600);

    seal.onload = () => {
      ctx.drawImage(seal, 120, 700, 80, 80);

      ctx.font = "36px 'Great Vibes'";
      ctx.fillText("Dr. Cameron Impostor", 1050, 750);

      ctx.font = "16px serif";
      ctx.fillText("President", 1100, 780);

      ctx.font = "14px monospace";
      ctx.textAlign = "right";
      ctx.fillText("ID: " + studentID, canvas.width - 120, 780);
      ctx.textAlign = "center";

      downloadCanvas(canvas, "certificate.png");
    };
  };
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL();
  link.click();
}