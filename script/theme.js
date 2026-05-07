const STORAGE_KEY = "ek_theme";

function systemTheme() {
  try { return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; } catch { return "dark"; }
}

export function getStoredTheme() {
  try { return localStorage.getItem(STORAGE_KEY) || systemTheme(); } catch { return "dark"; }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("theme_toggle");
  if (!btn) return;
  const icon = btn.querySelector(".material-symbols-outlined");
  if (icon) icon.textContent = theme === "light" ? "dark_mode" : "light_mode";
  btn.setAttribute("aria-label", theme === "light" ? "Dunkelmodus" : "Hellmodus");
}

export function initThemeToggle() {
  applyTheme(getStoredTheme());
  const btn = document.getElementById("theme_toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || systemTheme();
    const next = current === "light" ? "dark" : "light";
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    applyTheme(next);
  });
}
