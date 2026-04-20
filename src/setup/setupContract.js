const GOOGLE_SHEETS_HOST = 'docs.google.com';
const SPREADSHEET_ID_REGEX = /^[a-zA-Z0-9-_]{20,}$/;

export const SETUP_STORAGE_KEYS = Object.freeze({
  SETUP: 'anime_watchlist_setup_v1',
  USER_ID: 'anime_watchlist_user_id_v1',
});

export const SETUP_STEPS = Object.freeze({
  LANGUAGE: 'language',
  CREDENTIALS: 'credentials',
  SHEET_LINK: 'sheet-link',
});

export const SETUP_STEP_ORDER = Object.freeze([
  SETUP_STEPS.LANGUAGE,
  SETUP_STEPS.CREDENTIALS,
  SETUP_STEPS.SHEET_LINK,
]);

export const SUPPORTED_LANGUAGES = Object.freeze([
  Object.freeze({ code: 'en', label: 'English' }),
  Object.freeze({ code: 'bn', label: 'বাংলা' }),
  Object.freeze({ code: 'hi', label: 'हिन्दी' }),
  Object.freeze({ code: 'gu', label: 'ગુજરાતી' }),
]);

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0].code;
const SUPPORTED_LANGUAGE_CODES = new Set(SUPPORTED_LANGUAGES.map((item) => item.code));

export const REQUIRED_SHEET_TABS = Object.freeze({
  watching: Object.freeze({ name: 'watching', label: 'Watching' }),
  completed: Object.freeze({ name: 'completed', label: 'Completed' }),
  plan: Object.freeze({ name: 'plan', label: 'Plan' }),
  upcoming: Object.freeze({ name: 'upcoming', label: 'Upcoming' }),
});

export const REQUIRED_SHEET_TAB_NAMES = Object.freeze(
  Object.values(REQUIRED_SHEET_TABS).map((tab) => tab.name),
);

function toCleanString(value) {
  return String(value ?? '').trim();
}

function normalizeLanguage(language) {
  const candidate = toCleanString(language).toLowerCase();
  return SUPPORTED_LANGUAGE_CODES.has(candidate) ? candidate : DEFAULT_LANGUAGE;
}

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function readLocalStorageValue(key) {
  if (!canUseLocalStorage()) return '';
  return toCleanString(window.localStorage.getItem(key));
}

function writeLocalStorageValue(key, value) {
  if (!canUseLocalStorage() || !value) return;
  window.localStorage.setItem(key, value);
}

function buildSpreadsheetUrl(spreadsheetId) {
  if (!spreadsheetId) return '';
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

function buildCompletedSteps({ language, username, password, spreadsheetId }) {
  const completedSteps = [];
  if (language) completedSteps.push(SETUP_STEPS.LANGUAGE);
  if (username && password) completedSteps.push(SETUP_STEPS.CREDENTIALS);
  if (spreadsheetId) completedSteps.push(SETUP_STEPS.SHEET_LINK);
  return completedSteps;
}

function hashSeed(seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

function generateClientUserId() {
  if (globalThis.crypto?.randomUUID) {
    return `aw-${globalThis.crypto.randomUUID()}`;
  }
  return `aw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseSpreadsheetIdFromUrl(urlValue) {
  try {
    const url = new URL(urlValue);
    if (!url.hostname.includes(GOOGLE_SHEETS_HOST)) return '';

    const pathMatch = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
    if (pathMatch?.[1]) return pathMatch[1];

    const queryId = toCleanString(url.searchParams.get('id'));
    return SPREADSHEET_ID_REGEX.test(queryId) ? queryId : '';
  } catch {
    return '';
  }
}

export function parseSpreadsheetId(value) {
  const input = toCleanString(value);
  if (!input) return '';
  if (SPREADSHEET_ID_REGEX.test(input)) return input;
  const urlId = parseSpreadsheetIdFromUrl(input);
  if (urlId) return urlId;
  const looseMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (looseMatch?.[1]) return looseMatch[1];
  const idQueryMatch = input.match(/[?&]id=([a-zA-Z0-9-_]+)/i);
  return idQueryMatch?.[1] || '';
}

export function buildStableClientUserId(payload = {}) {
  const explicitUserId = toCleanString(payload.userId);
  if (explicitUserId) {
    writeLocalStorageValue(SETUP_STORAGE_KEYS.USER_ID, explicitUserId);
    return explicitUserId;
  }

  const cachedUserId = readLocalStorageValue(SETUP_STORAGE_KEYS.USER_ID);
  if (cachedUserId) return cachedUserId;

  const username = toCleanString(payload.username).toLowerCase();
  const spreadsheetId = parseSpreadsheetId(payload.spreadsheetId || payload.sheetUrl || payload.sheetLink);
  const seed = [username, spreadsheetId].filter(Boolean).join('|');
  const generated = seed ? `aw-${hashSeed(seed)}` : generateClientUserId();
  writeLocalStorageValue(SETUP_STORAGE_KEYS.USER_ID, generated);
  return generated;
}

function normalizeSetupPayloadInternal(payload = {}, { generateUserId } = { generateUserId: true }) {
  const language = normalizeLanguage(payload.language);
  const username = toCleanString(payload.username);
  const password = toCleanString(payload.password);
  const rawSheetUrl = toCleanString(payload.sheetUrl || payload.sheetLink);
  const spreadsheetId = parseSpreadsheetId(payload.spreadsheetId || payload.sheetId || rawSheetUrl);
  const sheetUrl = spreadsheetId ? buildSpreadsheetUrl(spreadsheetId) : rawSheetUrl;
  const userId = generateUserId
    ? buildStableClientUserId({ userId: payload.userId, username, spreadsheetId, sheetUrl })
    : toCleanString(payload.userId);

  return {
    language,
    username,
    password,
    sheetUrl,
    spreadsheetId,
    userId,
    completedSteps: buildCompletedSteps({ language, username, password, spreadsheetId }),
  };
}

export function normalizeSetupPayload(payload = {}) {
  return normalizeSetupPayloadInternal(payload, { generateUserId: true });
}

export function validateSetupPayload(payload = {}) {
  const value = normalizeSetupPayloadInternal(payload, { generateUserId: false });
  const errors = {};

  if (!SUPPORTED_LANGUAGE_CODES.has(value.language)) {
    errors.language = 'Please choose a supported language.';
  }
  if (!value.username) {
    errors.username = 'Username is required.';
  }
  if (!value.password) {
    errors.password = 'Password is required.';
  }
  if (!value.spreadsheetId) {
    errors.sheetUrl = 'A valid Google Sheet link is required.';
  }

  return {
    value,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
