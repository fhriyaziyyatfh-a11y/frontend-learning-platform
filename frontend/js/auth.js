const API_URL = "/api";

// Check if user is authenticated
function isAuthenticated() {
  return !!localStorage.getItem("accessToken");
}

// Get current user
function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// Update navigation based on auth status
function updateNavigation() {
  const navAuth = document.getElementById("navAuth");
  const navLinks = document.getElementById("navLinks");

  if (!navAuth) return;

  if (isAuthenticated()) {
    const user = getCurrentUser();
    navAuth.innerHTML = `
            <a href="profile.html" class="nav-user">
                <i class="fas fa-user-circle"></i>
                <span>${user?.name || "Profil"}</span>
            </a>
            <button class="btn btn-outline" onclick="logout()">Çıxış</button>
        `;
  } else {
    navAuth.innerHTML = `
            <a href="login.html" class="btn btn-outline">Daxil ol</a>
            <a href="register.html" class="btn btn-primary">Qeydiyyat</a>
        `;
  }
}

// Login
async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: "Network error" };
  }
}

// Register
async function register(name, email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: "Network error" };
  }
}

// Logout
function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// Refresh token
async function refreshToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    logout();
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return data.accessToken;
    } else {
      logout();
      return null;
    }
  } catch (error) {
    logout();
    return null;
  }
}

// Authenticated fetch
async function authFetch(url, options = {}) {
  let token = localStorage.getItem("accessToken");

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Token expired, try to refresh
      token = await refreshToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
}

// Check auth and redirect if needed
function checkAuth() {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// Show toast notification
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
