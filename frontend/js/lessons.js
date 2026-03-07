let allLessons = [];

async function loadLessons() {
  const grid = document.getElementById("lessonsGrid");

  try {
    const response = await authFetch(`${API_URL}/lessons`);
    const lessons = await response.json();

    allLessons = lessons;

    if (lessons.length === 0) {
      grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>Hələki heç bir dərs yoxdur.</p>
                </div>
            `;
      return;
    }

    renderLessons(lessons);
    updateProgress(lessons);
  } catch (error) {
    grid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Dərsləri yükləmək alınmadı.</p>
            </div>
        `;
  }
}

function renderLessons(lessons) {
  const grid = document.getElementById("lessonsGrid");

  grid.innerHTML = lessons
    .map(
      (lesson) => `
        <div class="lesson-card ${lesson.completed ? "completed" : ""}" onclick="openLesson('${lesson._id}')">
            <div class="lesson-header">
                <span class="lesson-category">${lesson.category}</span>
                <h3>${lesson.title}</h3>
                <p>${lesson.description}</p>
            </div>
            <div class="lesson-meta">
                <span class="difficulty ${lesson.difficulty.toLowerCase()}">
                    ${Array(3)
                      .fill(0)
                      .map(
                        (_, i) =>
                          `<i class="fas fa-circle${i < (lesson.difficulty === "Beginner" ? 1 : lesson.difficulty === "Intermediate" ? 2 : 3) ? "" : "-o"}"></i>`,
                      )
                      .join("")}
                    ${lesson.difficulty}
                </span>
                <span><i class="fas fa-star"></i> ${lesson.points} xal</span>
            </div>
        </div>
    `,
    )
    .join("");
}

function filterLessons(category) {
  if (category === "all") {
    renderLessons(allLessons);
  } else {
    const filtered = allLessons.filter((l) => l.category === category);
    renderLessons(filtered);
  }
}

function updateProgress(lessons) {
  const completed = lessons.filter((l) => l.completed).length;
  const total = lessons.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const circle = document.querySelector(".circle-progress");
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  if (circle) {
    circle.style.strokeDasharray = `${percentage}, 100`;
  }

  const percentageEl = document.getElementById("progressPercentage");
  if (percentageEl) {
    percentageEl.textContent = `${percentage}%`;
  }

  const completedEl = document.getElementById("completedCount");
  const totalEl = document.getElementById("totalCount");

  if (completedEl) completedEl.textContent = completed;
  if (totalEl) totalEl.textContent = total;
}

function openLesson(id) {
  window.location.href = `lesson.html?id=${id}`;
}
