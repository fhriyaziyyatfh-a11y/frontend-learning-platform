let currentPage = 1;
let currentSort = "recent";

async function loadDiscover(sort = "recent") {
  currentSort = sort;
  currentPage = 1;

  const grid = document.getElementById("codeGrid");
  grid.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Kodlar yüklənir...</p>
        </div>
    `;

  try {
    const response = await fetch(
      `${API_URL}/discover?page=${currentPage}&sort=${sort}`,
    );
    const data = await response.json();

    renderCodeShares(data.shares);

    const loadMoreBtn = document.getElementById("loadMore");
    if (data.pagination.hasMore) {
      loadMoreBtn.style.display = "block";
    } else {
      loadMoreBtn.style.display = "none";
    }
  } catch (error) {
    grid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Kodları yükləmək alınmadı.</p>
            </div>
        `;
  }
}

function renderCodeShares(shares) {
  const grid = document.getElementById("codeGrid");

  if (shares.length === 0) {
    grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-code"></i>
                <p>Hələ heç bir kod paylaşılmayıb.</p>
            </div>
        `;
    return;
  }

  const html = shares
    .map(
      (share) => `
        <div class="code-card" onclick="openCodeDetail('${share._id}')">
            <div class="code-preview">
                <iframe srcdoc="${escapeHtml(createPreview(share.code))}" sandbox="allow-scripts"></iframe>
                <div class="code-overlay">
                    <button class="btn btn-primary">Kodu Bax</button>
                </div>
            </div>
            <div class="code-info">
                <h4>${share.title}</h4>
                <div class="code-meta">
                    <span class="code-author">
                        <i class="fas fa-user"></i>
                        ${share.user.name}
                    </span>
                    <div class="code-stats">
                        <span><i class="fas fa-heart"></i> ${share.likesCount}</span>
                        <span><i class="fas fa-comment"></i> ${share.commentsCount}</span>
                    </div>
                </div>
            </div>
        </div>
    `,
    )
    .join("");

  if (currentPage === 1) {
    grid.innerHTML = html;
  } else {
    grid.insertAdjacentHTML("beforeend", html);
  }
}

function createPreview(code) {
  return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${code.css || ""}</style>
        </head>
        <body>
            ${code.html || ""}
            <script>${code.javascript || ""}<\/script>
        </body>
        </html>
    `;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function openCodeDetail(id) {
  try {
    // Load share details
    const response = await fetch(`${API_URL}/discover/${id}`);
    const share = await response.json();

    // Load comments
    const commentsResponse = await fetch(`${API_URL}/discover/${id}/comments`);
    const comments = await commentsResponse.json();

    // Update modal
    document.getElementById("modalCodeTitle").textContent = share.title;
    document.getElementById("modalCodeAuthor").innerHTML = `
            @${share.user.name} • ${share.lesson.title}
        `;
    document.getElementById("modalPreview").srcdoc = createPreview(share.code);
    document.getElementById("modalLikesCount").textContent = share.likesCount;

    const commentsList = document.getElementById("commentsList");
    if (comments.length === 0) {
      commentsList.innerHTML = '<p class="text-muted">Hələ şərh yoxdur.</p>';
    } else {
      commentsList.innerHTML = comments
        .map(
          (comment) => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-author">${comment.user.name}</span>
                        <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p class="comment-content">${comment.content}</p>
                </div>
            `,
        )
        .join("");
    }

    // Setup comment form
    const commentForm = document.getElementById("commentForm");
    commentForm.onsubmit = async (e) => {
      e.preventDefault();
      const content = e.target.querySelector("textarea").value;

      try {
        await authFetch(`${API_URL}/discover/${id}/comment`, {
          method: "POST",
          body: JSON.stringify({ content }),
        });

        e.target.querySelector("textarea").value = "";
        openCodeDetail(id); // Refresh
        showToast("Şərh əlavə edildi", "success");
      } catch (error) {
        showToast("Şərh əlavə edilmədi", "error");
      }
    };

    // Setup like button
    const likeBtn = document.getElementById("modalLikeBtn");
    likeBtn.onclick = async () => {
      try {
        const response = await authFetch(`${API_URL}/discover/${id}/like`, {
          method: "POST",
        });
        const result = await response.json();

        document.getElementById("modalLikesCount").textContent =
          result.likesCount;
        likeBtn.innerHTML = `<i class="${result.liked ? "fas" : "far"} fa-heart"></i> <span>${result.likesCount}</span>`;
      } catch (error) {
        showToast("Bəyənmək alınmadı", "error");
      }
    };

    document.getElementById("codeModal").classList.add("active");
  } catch (error) {
    showToast("Kod detallarını yükləmək alınmadı", "error");
  }
}

document.getElementById("closeCodeModal")?.addEventListener("click", () => {
  document.getElementById("codeModal").classList.remove("active");
});

document.getElementById("loadMoreBtn")?.addEventListener("click", async () => {
  currentPage++;

  try {
    const response = await fetch(
      `${API_URL}/discover?page=${currentPage}&sort=${currentSort}`,
    );
    const data = await response.json();

    renderCodeShares(data.shares);

    if (!data.pagination.hasMore) {
      document.getElementById("loadMore").style.display = "none";
    }
  } catch (error) {
    showToast("Daha çox kod yüklənmədi", "error");
  }
});
