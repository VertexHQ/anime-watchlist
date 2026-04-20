import { DEFAULT_LANGUAGE, SETUP_STORAGE_KEYS, parseSpreadsheetId } from '../setup/setupContract';

function toCleanString(value) {
  return String(value ?? '').trim();
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

function readLocalStorageJson(key) {
  const rawValue = readLocalStorageValue(key);
  if (!rawValue) return null;

  try {
    const parsedValue = JSON.parse(rawValue);
    if (parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)) {
      return parsedValue;
    }
  } catch (error) {
    console.warn(`[SyncContext] Failed to parse localStorage value for "${key}".`, error);
  }

  return null;
}

function getFirstPopulatedValue(source, keys) {
  if (!source || typeof source !== 'object') return '';
  for (const key of keys) {
    const value = toCleanString(source[key]);
    if (value) return value;
  }
  return '';
}

function buildSheetUrl(spreadsheetId, fallbackUrl) {
  if (spreadsheetId) return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  return toCleanString(fallbackUrl);
}

export function getSetupSyncContext() {
  const setup = readLocalStorageJson(SETUP_STORAGE_KEYS.SETUP);
  const storedUserId = readLocalStorageValue(SETUP_STORAGE_KEYS.USER_ID);
  const rawSheetUrl = getFirstPopulatedValue(setup, ['sheetUrl', 'sheetLink']);
  const spreadsheetId = parseSpreadsheetId(
    getFirstPopulatedValue(setup, ['spreadsheetId', 'sheetId']) || rawSheetUrl,
  );

  const userId = getFirstPopulatedValue(setup, ['userId']) || storedUserId;
  const language = getFirstPopulatedValue(setup, ['language']) || DEFAULT_LANGUAGE;

  return {
    userId,
    spreadsheetId,
    sheetUrl: buildSheetUrl(spreadsheetId, rawSheetUrl),
    language,
    hasSetup: Boolean(setup),
    isComplete: Boolean(userId && spreadsheetId),
  };
}

export function buildSheetsLoadUrl(baseUrl, context) {
  const ctx = context || getSetupSyncContext();
  const url = new URL(baseUrl);
  url.searchParams.set('userId', ctx.userId);
  url.searchParams.set('spreadsheetId', ctx.spreadsheetId);
  if (ctx.sheetUrl) url.searchParams.set('sheetUrl', ctx.sheetUrl);
  if (ctx.language) url.searchParams.set('language', ctx.language);
  return url.toString();
}

export function withSyncContext(payload, context) {
  const ctx = context || getSetupSyncContext();
  return {
    ...payload,
    userId: ctx.userId,
    spreadsheetId: ctx.spreadsheetId,
    ...(ctx.sheetUrl ? { sheetUrl: ctx.sheetUrl } : {}),
    ...(ctx.language ? { language: ctx.language } : {}),
  };
}
