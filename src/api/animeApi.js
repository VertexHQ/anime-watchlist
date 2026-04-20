import { SHEETS_SCRIPT_URL } from '../utils/constants';
import { syncAdd, syncUpdate, syncDelete } from './sheetsSync';
import { buildSheetsLoadUrl, getSetupSyncContext } from './syncContext';

const STORAGE_KEY = 'anime_watchlist_v1';

function loadList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/**
 * Load anime list.
 * If SHEETS_SCRIPT_URL is set, fetch from Google Sheets (source of truth),
 * persist the result to localStorage, and return it.
 * Falls back to localStorage if the fetch fails or URL is not set.
 */
export async function getAnime() {
  if (!SHEETS_SCRIPT_URL) {
    return { anime: loadList() };
  }

  const syncContext = getSetupSyncContext();
  if (!syncContext.isComplete) {
    console.warn(
      '[AnimeApi] Skipping remote load because setup context is incomplete.',
      { hasSetup: syncContext.hasSetup, hasUserId: Boolean(syncContext.userId), hasSpreadsheetId: Boolean(syncContext.spreadsheetId) },
    );
    return { anime: loadList() };
  }

  try {
    const res = await fetch(buildSheetsLoadUrl(SHEETS_SCRIPT_URL, syncContext), { method: 'GET' });
    const data = await res.json();
    if (data.success && Array.isArray(data.anime)) {
      // Sort newest first to match the add-to-front behaviour
      const sorted = data.anime.slice().sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      ); // oldest first — first added stays at top
      persist(sorted);
      return { anime: sorted };
    }
    console.warn('[AnimeApi] Remote load returned an unexpected payload. Falling back to localStorage.');
  } catch (error) {
    console.warn('[AnimeApi] Remote load failed. Falling back to localStorage.', error);
  }
  return { anime: loadList() };
}

export function addAnime(payload) {
  const list = loadList();
  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    title: payload.title ?? '',
    status: payload.status ?? 'watching',
    rating: payload.rating ?? '',
    notes: payload.notes ?? '',
    image: payload.image ?? '',
  };
  list.unshift(entry);
  persist(list);
  syncAdd(entry); // mirror to Google Sheets
  return Promise.resolve({ success: true, anime: entry });
}

export function updateAnime(id, payload) {
  const list = loadList();
  const idx = list.findIndex((item) => String(item.id) === String(id));
  if (idx === -1) return Promise.reject(new Error('Anime not found.'));
  list[idx] = {
    ...list[idx],
    title: payload.title ?? list[idx].title,
    status: payload.status ?? list[idx].status,
    rating: payload.rating ?? list[idx].rating,
    notes: payload.notes ?? list[idx].notes,
    image: payload.image ?? list[idx].image,
  };
  persist(list);
  syncUpdate(list[idx]); // mirror to Google Sheets (handles drag-drop status moves)
  return Promise.resolve({ success: true, anime: list[idx] });
}

export function deleteAnime(id) {
  const list = loadList();
  const next = list.filter((item) => String(item.id) !== String(id));
  if (next.length === list.length) return Promise.reject(new Error('Anime not found.'));
  persist(next);
  syncDelete(id); // mirror to Google Sheets
  return Promise.resolve({ success: true });
}
