import {
  SETUP_STEP_ORDER,
  SETUP_STORAGE_KEYS,
  normalizeSetupPayload,
  validateSetupPayload,
} from './setupContract';

const SETUP_CREDENTIAL_STORAGE_KEYS = Object.freeze({
  USERNAME: `${SETUP_STORAGE_KEYS.SETUP}_username`,
  PASSWORD: `${SETUP_STORAGE_KEYS.SETUP}_password`,
});

const SETUP_CREDENTIAL_COOKIE_KEYS = Object.freeze({
  USERNAME: 'anime_watchlist_setup_username_v1',
  PASSWORD: 'anime_watchlist_setup_password_v1',
});

const CREDENTIAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function canUseDocumentCookies() {
  return typeof document !== 'undefined';
}

function toCleanString(value) {
  return String(value ?? '').trim();
}

function readLocalStorageValue(key) {
  if (!canUseLocalStorage()) return '';

  try {
    return toCleanString(window.localStorage.getItem(key));
  } catch {
    return '';
  }
}

function saveLocalStorageValue(key, value) {
  if (!canUseLocalStorage()) return;

  try {
    const cleanValue = toCleanString(value);
    if (cleanValue) {
      window.localStorage.setItem(key, cleanValue);
      return;
    }
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[SetupStorage] Failed to persist localStorage value for "${key}".`, error);
  }
}

function readCookieValue(key) {
  if (!canUseDocumentCookies()) return '';

  const cookiePrefix = `${key}=`;
  const cookies = document.cookie ? document.cookie.split(';') : [];

  for (const cookie of cookies) {
    const cleanCookie = cookie.trim();
    if (!cleanCookie.startsWith(cookiePrefix)) continue;

    const value = cleanCookie.slice(cookiePrefix.length);
    try {
      return toCleanString(decodeURIComponent(value));
    } catch {
      return toCleanString(value);
    }
  }

  return '';
}

function saveCookieValue(key, value) {
  if (!canUseDocumentCookies()) return;

  const cleanValue = toCleanString(value);
  const encodedValue = encodeURIComponent(cleanValue);
  const maxAge = cleanValue ? CREDENTIAL_COOKIE_MAX_AGE_SECONDS : 0;
  document.cookie = `${key}=${encodedValue}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function readStoredCredentials({ useCookieFallback = false } = {}) {
  const username = readLocalStorageValue(SETUP_CREDENTIAL_STORAGE_KEYS.USERNAME);
  const password = readLocalStorageValue(SETUP_CREDENTIAL_STORAGE_KEYS.PASSWORD);

  if (!useCookieFallback) {
    return { username, password };
  }

  return {
    username: username || readCookieValue(SETUP_CREDENTIAL_COOKIE_KEYS.USERNAME),
    password: password || readCookieValue(SETUP_CREDENTIAL_COOKIE_KEYS.PASSWORD),
  };
}

function persistStoredCredentials(payload = {}) {
  const username = toCleanString(payload.username);
  const password = toCleanString(payload.password);

  saveLocalStorageValue(SETUP_CREDENTIAL_STORAGE_KEYS.USERNAME, username);
  saveLocalStorageValue(SETUP_CREDENTIAL_STORAGE_KEYS.PASSWORD, password);
  saveCookieValue(SETUP_CREDENTIAL_COOKIE_KEYS.USERNAME, username);
  saveCookieValue(SETUP_CREDENTIAL_COOKIE_KEYS.PASSWORD, password);
}

function readStoredSetupObject() {
  if (!canUseLocalStorage()) {
    return { value: null, unreadable: false };
  }

  try {
    const raw = window.localStorage.getItem(SETUP_STORAGE_KEYS.SETUP);
    if (!raw) return { value: null, unreadable: false };
    return { value: JSON.parse(raw), unreadable: false };
  } catch {
    return { value: null, unreadable: true };
  }
}

export function readStoredSetup() {
  const storedSetup = readStoredSetupObject();

  if (storedSetup.value) {
    const normalizedSetup = normalizeSetupPayload(storedSetup.value);
    const restoredCredentials = readStoredCredentials({
      useCookieFallback: !normalizedSetup.username || !normalizedSetup.password,
    });

    return normalizeSetupPayload({
      ...normalizedSetup,
      username: normalizedSetup.username || restoredCredentials.username,
      password: normalizedSetup.password || restoredCredentials.password,
    });
  }

  const restoredCredentials = readStoredCredentials({
    useCookieFallback: true,
  });
  if (!restoredCredentials.username && !restoredCredentials.password) return null;

  return normalizeSetupPayload(restoredCredentials);
}

export function saveSetup(payload = {}) {
  const normalized = normalizeSetupPayload(payload);
  persistStoredCredentials(normalized);

  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(SETUP_STORAGE_KEYS.SETUP, JSON.stringify(normalized));
    } catch (error) {
      console.warn('[SetupStorage] Failed to persist setup object in localStorage.', error);
    }
  }

  return normalized;
}

export function clearStoredSetup() {
  persistStoredCredentials({});

  if (canUseLocalStorage()) {
    try {
      window.localStorage.removeItem(SETUP_STORAGE_KEYS.SETUP);
      window.localStorage.removeItem(SETUP_STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.warn('[SetupStorage] Failed to clear setup from localStorage.', error);
    }
  }
}

export function isSetupComplete(payload = {}) {
  const validation = validateSetupPayload(payload);
  if (!validation.isValid) return false;

  return SETUP_STEP_ORDER.every((step) => validation.value.completedSteps.includes(step));
}
