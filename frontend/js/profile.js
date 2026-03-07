async function loadProfile() {
  try {
    const response = await authFetch(`${API_URL}/auth/user`);
    const user = await response.json();

    // Update UI
    document.getElementById("userName").textContent = user.name;
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("userAvatar").innerHTML = user.name
      .charAt(0)
      .toUpperCase();
    document.getElementById("levelBadge").textContent = user.level;
    document.getElementById("totalPoints").textContent = user.points;
    document.getElementById("completedLessons").textContent =
      user.completedLessons.length;
    document.getElementById("badgesCount").textContent = user.badges.length;

    // Update progress
    document.getElementById("progressFill").style.width = `${user.progress}%`;
    document.getElementById("progressText").textContent =
      `${user.progress}% Tamamlandı`;

    // GitHub connection
    if (user.githubConnected) {
      document.getElementById("githubConnected").style.display = "flex";
      document.getElementById("githubUsername").textContent =
        user.githubUsername || "Connected";
      document.getElementById("connectGithubBtn").style.display = "none";
    } else {
      document.getElementById("connectGithubBtn").style.display = "inline-flex";
      document.getElementById("githubConnected").style.display = "none";
    }

    // Badges
    const allBadges = [
      "First Lesson",
      "10 Lessons",
      "Perfect Code",
      "Helper",
      "Contributor",
      "Master",
    ];
    const badgesGrid = document.getElementById("badgesGrid");
    badgesGrid.innerHTML = allBadges
      .map(
        (badge) => `
            <div class="badge-card ${user.badges.includes(badge) ? "earned" : ""}">
                <i class="fas fa-${getBadgeIcon(badge)}"></i>
                <span>${badge}</span>
            </div>
        `,
      )
      .join("");

    // Completed lessons
    const lessonsList = document.getElementById("completedLessonsList");
    if (user.completedLessons.length === 0) {
      lessonsList.innerHTML =
        '<p class="text-muted">Hələ heç bir dərs tamamlanmayıb.</p>';
    } else {
      lessonsList.innerHTML = user.completedLessons
        .map((lesson) => {
          const score = user.lessonScores.find((s) => s.lesson === lesson._id);
          return `
                    <div class="completed-lesson-item">
                        <div class="completed-lesson-info">
                            <h4>${lesson.title}</h4>
                            <span>${lesson.category}</span>
                        </div>
                        <div class="lesson-score">
                            <i class="fas fa-star"></i>
                            ${score ? score.score : "N/A"}/100
                        </div>
                    </div>
                `;
        })
        .join("");
    }

    // Category progress (mock data - in real app, calculate from actual data)
    const categories = ["HTML", "CSS", "JavaScript", "React"];
    const categoryProgress = document.getElementById("categoryProgress");
    categoryProgress.innerHTML = categories
      .map(
        (cat) => `
            <div class="category-item">
                <span>${cat}</span>
                <div class="category-bar">
                    <div class="category-fill" style="width: ${Math.random() * 100}%"></div>
                </div>
            </div>
        `,
      )
      .join("");
  } catch (error) {
    showToast("Profil məlumatlarını yükləmək alınmadı", "error");
  }
}

function getBadgeIcon(badge) {
  const icons = {
    "First Lesson": "rocket",
    "10 Lessons": "trophy",
    "Perfect Code": "gem",
    Helper: "hands-helping",
    Contributor: "code-branch",
    Master: "crown",
  };
  return icons[badge] || "medal";
}

// GitHub OAuth
document.getElementById("connectGithubBtn")?.addEventListener("click", () => {
  const clientId = "YOUR_GITHUB_CLIENT_ID"; // Replace with actual client ID
  const redirectUri = encodeURIComponent(
    window.location.origin + "/github-callback.html",
  );
  const scope = "repo";

  window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
});
