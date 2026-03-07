let editor;
let currentLesson = null;
let code = { html: "", css: "", javascript: "" };
let currentMode = "html";
let debounceTimer;

const urlParams = new URLSearchParams(window.location.search);
const lessonId = urlParams.get("id");

async function initLesson() {
  if (!lessonId) {
    window.location.href = "lessons.html";
    return;
  }

  await loadLessonData();
  initEditor();
  setupEventListeners();
  updatePreview();
}

async function loadLessonData() {
  try {
    const response = await authFetch(`${API_URL}/lessons/${lessonId}`);
    const lesson = await response.json();

    currentLesson = lesson;

    // Update UI
    document.getElementById("lessonTitle").textContent = lesson.title;
    document.getElementById("lessonCategory").textContent = lesson.category;
    document.getElementById("instructionsContent").innerHTML = marked.parse(
      lesson.instructions,
    );
    document.getElementById("taskText").textContent = lesson.task;

    // Set initial code
    code.html = lesson.starterCode.html || "";
    code.css = lesson.starterCode.css || "";
    code.javascript = lesson.starterCode.javascript || "";

    // Setup hints
    const hintsList = document.getElementById("hintsList");
    hintsList.innerHTML = lesson.hints
      .map((hint) => `<li>${hint}</li>`)
      .join("");
  } catch (error) {
    showToast("Dərs məlumatlarını yükləmək alınmadı", "error");
  }
}

function initEditor() {
  editor = CodeMirror(document.getElementById("editorContainer"), {
    mode: "htmlmixed",
    theme: "dracula",
    lineNumbers: true,
    autoCloseTags: true,
    autoCloseBrackets: true,
    lineWrapping: true,
    value: code.html,
  });

  editor.on("change", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      code[currentMode] = editor.getValue();
      updatePreview();
    }, 500);
  });
}

function setupEventListeners() {
  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Save current content
      code[currentMode] = editor.getValue();

      // Switch mode
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      currentMode = e.target.dataset.mode;

      // Update editor
      const modes = {
        html: "htmlmixed",
        css: "css",
        javascript: "javascript",
      };

      editor.setOption("mode", modes[currentMode]);
      editor.setValue(code[currentMode] || "");
    });
  });

  // Run code
  document
    .getElementById("runCodeBtn")
    ?.addEventListener("click", updatePreview);

  // Reset code
  document.getElementById("resetCodeBtn")?.addEventListener("click", () => {
    if (confirm("Kodu ilkin vəziyyətinə qaytarmaq istədiyinizə əminsiniz?")) {
      code.html = currentLesson?.starterCode.html || "";
      code.css = currentLesson?.starterCode.css || "";
      code.javascript = currentLesson?.starterCode.javascript || "";
      editor.setValue(code[currentMode] || "");
      updatePreview();
    }
  });

  // AI Analysis
  document.getElementById("analyzeBtn")?.addEventListener("click", analyzeCode);

  // Hints modal
  document.getElementById("hintsBtn")?.addEventListener("click", () => {
    document.getElementById("hintsModal").classList.add("active");
  });

  document.getElementById("closeHintsModal")?.addEventListener("click", () => {
    document.getElementById("hintsModal").classList.remove("active");
  });

  // GitHub save
  document.getElementById("saveGithubBtn")?.addEventListener("click", () => {
    document.getElementById("githubModal").classList.add("active");
  });

  document.getElementById("closeGithubModal")?.addEventListener("click", () => {
    document.getElementById("githubModal").classList.remove("active");
  });

  document
    .getElementById("githubSaveForm")
    ?.addEventListener("submit", saveToGithub);

  // Toggle panels
  document
    .getElementById("toggleInstructions")
    ?.addEventListener("click", () => {
      document
        .getElementById("instructionsPanel")
        .classList.toggle("collapsed");
    });

  document.getElementById("togglePreview")?.addEventListener("click", () => {
    document.getElementById("previewPanel").classList.toggle("collapsed");
  });

  document.getElementById("toggleAiPanel")?.addEventListener("click", () => {
    document.getElementById("aiPanel").classList.toggle("collapsed");
  });

  // Refresh preview
  document
    .getElementById("refreshPreview")
    ?.addEventListener("click", updatePreview);

  // Next lesson
  document.getElementById("nextLessonBtn")?.addEventListener("click", () => {
    window.location.href = "lessons.html";
  });
}

function updatePreview() {
  const frame = document.getElementById("previewFrame");
  const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${code.css}</style>
        </head>
        <body>
            ${code.html}
            <script>
                try {
                    ${code.javascript}
                } catch (error) {
                    console.error(error);
                }
            <\/script>
        </body>
        </html>
    `;

  frame.srcdoc = content;
}

async function analyzeCode() {
  const aiPanel = document.getElementById("aiPanelContent");
  const placeholder = document.getElementById("aiPlaceholder");
  const results = document.getElementById("aiResults");
  const loading = document.getElementById("aiLoading");
  const scoreEl = document.getElementById("aiScore");

  placeholder.style.display = "none";
  results.style.display = "none";
  loading.style.display = "flex";
  scoreEl.style.display = "none";

  try {
    const fullCode = `
${code.html}

<style>
${code.css}
</style>

<script>
${code.javascript}
<\/script>
        `.trim();

    const response = await authFetch(`${API_URL}/code/analyze-code`, {
      method: "POST",
      body: JSON.stringify({
        code: fullCode,
        language: "html",
        task: currentLesson?.task,
      }),
    });

    const analysis = await response.json();

    // Display results
    document.getElementById("scoreValue").textContent = analysis.score;
    document.getElementById("aiGeneralComment").textContent =
      analysis.generalComment;

    const feedbackList = document.getElementById("aiFeedbackList");
    feedbackList.innerHTML = analysis.feedback
      .map(
        (item) => `
            <div class="feedback-item ${item.type}">
                <i class="fas fa-${item.type === "error" ? "times-circle" : item.type === "warning" ? "exclamation-triangle" : "check-circle"} feedback-icon"></i>
                <div>
                    ${item.line ? `<strong>Sətir ${item.line}:</strong> ` : ""}
                    ${item.message}
                </div>
            </div>
        `,
      )
      .join("");

    const improvementsEl = document.getElementById("aiImprovements");
    if (analysis.improvements && analysis.improvements.length > 0) {
      improvementsEl.innerHTML = `
                <h4>Təkmilləşdirmə Təklifləri</h4>
                <ul>
                    ${analysis.improvements.map((imp) => `<li>${imp}</li>`).join("")}
                </ul>
            `;
      improvementsEl.style.display = "block";
    } else {
      improvementsEl.style.display = "none";
    }

    loading.style.display = "none";
    results.style.display = "grid";
    scoreEl.style.display = "flex";

    // If score is good, show completion option
    if (analysis.score >= 70) {
      showCompletionModal(analysis.score);
    }
  } catch (error) {
    loading.style.display = "none";
    placeholder.style.display = "flex";
    showToast("Kod analizi alınmadı", "error");
  }
}

async function showCompletionModal(score) {
  try {
    const response = await authFetch(
      `${API_URL}/lessons/${lessonId}/complete`,
      {
        method: "POST",
        body: JSON.stringify({ score }),
      },
    );

    const result = await response.json();

    document.getElementById("earnedPoints").textContent =
      `+${result.earnedPoints}`;
    document.getElementById("codeScore").textContent = `${score}/100`;

    const newBadgesEl = document.getElementById("newBadges");
    if (result.newBadges && result.newBadges.length > 0) {
      newBadgesEl.innerHTML = result.newBadges
        .map(
          (badge) => `
                <div class="badge-item">
                    <i class="fas fa-medal"></i>
                    <span>${badge}</span>
                </div>
            `,
        )
        .join("");
      newBadgesEl.style.display = "flex";
    } else {
      newBadgesEl.style.display = "none";
    }

    document.getElementById("completionModal").classList.add("active");
  } catch (error) {
    console.error("Completion error:", error);
  }
}

async function saveToGithub(e) {
  e.preventDefault();

  const repoName = document.getElementById("repoName").value;
  const fileName = document.getElementById("fileName").value;
  const description = document.getElementById("repoDescription").value;
  const isPublic = document.getElementById("isPublic").checked;

  const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${currentLesson?.title || "Lesson"}</title>
    <style>
${code.css}
    </style>
</head>
<body>
${code.html}
    <script>
${code.javascript}
    <\/script>
</body>
</html>
    `.trim();

  try {
    const response = await authFetch(`${API_URL}/github/save`, {
      method: "POST",
      body: JSON.stringify({
        repoName,
        fileName,
        content,
        description,
        isPublic,
      }),
    });

    const result = await response.json();

    document.getElementById("githubModal").classList.remove("active");
    showToast("Kod GitHub-a yükləndi!", "success");
  } catch (error) {
    showToast("GitHub-a yükləmək alınmadı", "error");
  }
}
