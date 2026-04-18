let data = {};

const levelSelect = document.getElementById("levelSelect");
const deptSelect = document.getElementById("deptSelect");
const programSelect = document.getElementById("programSelect");
const concentrationSelect = document.getElementById("concentrationSelect");
const minorSelect = document.getElementById("minorSelect");
const educationLevel = document.getElementById("educationLevel");

fetch("programs.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    loadMinors();
  });

levelSelect.addEventListener("change", updatePrograms);
deptSelect.addEventListener("change", updatePrograms);
programSelect.addEventListener("change", updateConcentrations);

function updatePrograms() {
  const level = levelSelect.value;
  const dept = deptSelect.value;

  programSelect.innerHTML = '<option value="">Select Program</option>';
  concentrationSelect.innerHTML = '<option value="">Select Concentration</option>';

  if (level === "graduate" || level === "phd") {
    if (educationLevel.value !== "bachelor" && educationLevel.value !== "master") {
      alert("A Bachelor’s degree is required for this level.");
      levelSelect.value = "";
      return;
    }
  }

  if (!level || !dept || !data[level] || !data[level][dept]) return;

  data[level][dept].forEach(program => {
    const option = document.createElement("option");
    option.value = program.name;
    option.textContent = program.name;
    programSelect.appendChild(option);
  });

  minorSelect.disabled = false;
}

function updateConcentrations() {
  const level = levelSelect.value;
  const dept = deptSelect.value;
  const programName = programSelect.value;

  concentrationSelect.innerHTML = '<option value="">Select Concentration</option>';

  if (!level || !dept) return;

  const program = data[level][dept].find(p => p.name === programName);

  if (!program || !program.concentrations) return;

  program.concentrations.forEach(c => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    concentrationSelect.appendChild(option);
  });
}

function loadMinors() {
  minorSelect.innerHTML = '<option value="">Select Minor</option>';

  Object.values(data.minor).forEach(dept => {
    dept.forEach(m => {
      const option = document.createElement("option");
      option.value = m.name;
      option.textContent = m.name;
      minorSelect.appendChild(option);
    });
  });
}

function submitApp() {
  const name = document.getElementById("name").value;
  const level = levelSelect.value;
  const dept = deptSelect.value;
  const program = programSelect.value;
  const concentration = concentrationSelect.value;
  const minor = minorSelect.value;
  const education = educationLevel.value;

  if (!name || !level || !dept || !program) {
    alert("Please complete all required fields.");
    return;
  }

  if (level === "graduate" || level === "phd") {
    if (education !== "bachelor" && education !== "master") {
      alert("You must have a Bachelor’s degree to apply.");
      return;
    }
  }

  const programData = data[level]?.[dept]?.find(p => p.name === program);

  if (programData && programData.concentrations && programData.concentrations.length > 0) {
    if (!concentration) {
      alert("Please select a concentration.");
      return;
    }
  }

  const user = {
    name,
    education,
    accepted: true,
    degree: {
      level,
      dept,
      program,
      concentration,
      minor
    }
  };

  localStorage.setItem("user", JSON.stringify(user));

  window.location.href = "accepted.html";
}