// Utility functions

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("az-AZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function truncate(str, length) {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

// Close modals on outside click
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("active");
  }
});

// Escape key to close modals
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal.active").forEach((modal) => {
      modal.classList.remove("active");
    });
  }
});
