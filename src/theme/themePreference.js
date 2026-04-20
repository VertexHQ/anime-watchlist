const THEME_STORAGE_KEY = 'anime_watchlist_theme_v1';
const DEFAULT_THEME = 'dark';
const SUPPORTED_THEMES = new Set(['dark', 'light']);

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function normalizeTheme(value) {
  const candidate = String(value ?? '').trim().toLowerCase();
  return SUPPORTED_THEMES.has(candidate) ? candidate : DEFAULT_THEME;
}

export function readStoredTheme() {
  if (!canUseLocalStorage()) return DEFAULT_THEME;

  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveThemePreference(value) {
  const normalized = normalizeTheme(value);

  if (canUseLocalStorage()) {
    window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
  }

  return normalized;
}

export { DEFAULT_THEME };
