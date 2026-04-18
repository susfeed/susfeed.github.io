document.addEventListener("DOMContentLoaded", () => {
  const programTitle = document.querySelector(".hero h1")?.textContent.trim();

  if (!programTitle) return;

  fetch("../dash/courses.json")
    .then(res => res.json())
    .then(data => {
      const courses = data.courses || [];

      // 🔥 smarter matching (partial + flexible)
      const matched = courses.filter(course => {
        if (!course.programs) return false;

        return course.programs.some(p =>
          programTitle.includes(p) || p.includes(programTitle)
        );
      });

      console.log("Program:", programTitle);
      console.log("Matched courses:", matched);

      if (matched.length === 0) return;

      const section = document.createElement("section");
      section.className = "section alt";

      section.innerHTML = `
        <div class="container">
          <h2>Courses in This Program</h2>
          <div class="grid">
            ${matched.map(course => `
              <div class="card">
                <h3>${course.code}: ${course.title}</h3>
                <p>${course.credits} Credits</p>
              </div>
            `).join("")}
          </div>
        </div>
      `;

      const sections = document.querySelectorAll(".section");
      let insertAfter = null;

      sections.forEach(sec => {
        const h2 = sec.querySelector("h2");
        if (h2 && h2.textContent.includes("Career Outcomes")) {
          insertAfter = sec;
        }
      });

      if (insertAfter) {
        insertAfter.insertAdjacentElement("afterend", section);
      }
    })
    .catch(err => console.error("Failed to load courses:", err));
});