export type AppTheme = "light" | "dark";

const THEME_KEY = "simpleflow_theme";

function applyThemeClass(theme: AppTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  const raw = window.localStorage.getItem(THEME_KEY);
  return raw === "dark" ? "dark" : "light";
}

export function setTheme(theme: AppTheme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
  applyThemeClass(theme);
}

export function initTheme() {
  if (typeof window === "undefined") return;
  applyThemeClass(getStoredTheme());
}

export function toggleTheme(current: AppTheme): AppTheme {
  const next: AppTheme = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
