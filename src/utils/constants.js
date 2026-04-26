import { REQUIRED_SHEET_TABS } from '../setup/setupContract';

// Values are loaded from .env (VITE_ prefix required for Vite to expose them).
// Copy .env.example to .env and fill in your values.
export const SHEETS_SCRIPT_URL = import.meta.env.VITE_SHEETS_SCRIPT_URL || '';

export const SHEET_NAMES = {
  WATCHING: import.meta.env.VITE_SHEET_WATCHING || REQUIRED_SHEET_TABS.watching.name,
  COMPLETED: import.meta.env.VITE_SHEET_COMPLETED || REQUIRED_SHEET_TABS.completed.name,
  PLAN: import.meta.env.VITE_SHEET_PLAN || REQUIRED_SHEET_TABS.plan.name,
  COMING_SOON: import.meta.env.VITE_SHEET_COMING_SOON || import.meta.env.VITE_SHEET_UPCOMING || REQUIRED_SHEET_TABS.comingSoon.name,
  DROPPED: import.meta.env.VITE_SHEET_DROPPED || REQUIRED_SHEET_TABS.dropped.name,
};

export const ANIME_STATUSES = {
  COMPLETED: REQUIRED_SHEET_TABS.completed.name,
  WATCHING: REQUIRED_SHEET_TABS.watching.name,
  PLANNED: REQUIRED_SHEET_TABS.plan.name,
  COMING_SOON: REQUIRED_SHEET_TABS.comingSoon.name,
  DROPPED: REQUIRED_SHEET_TABS.dropped.name,
};

export const API_STATUSES = {
  WATCHED: 'watched',
  UNWATCHED: 'unwatched',
};

export const APP_ROUTES = {
  HOME: '/',
  ADD: '/add',
  COMPLETED: '/completed',
  WATCHING: '/watching',
  PLANNED: '/planned',
  DETAILS: '/details/:id',
  detailsById: (id) => `/details/${id}`,
};

export const NAV_LINKS = [
  { label: 'Home', to: APP_ROUTES.HOME },
  { label: 'Add', to: APP_ROUTES.ADD },
  { label: 'Completed', to: APP_ROUTES.COMPLETED },
  { label: 'Watching', to: APP_ROUTES.WATCHING },
  { label: 'Planned', to: APP_ROUTES.PLANNED },
];

export function normalizeAnimeStatus(status) {
  const value = String(status || '').trim().toLowerCase();

  if (['completed', 'complete', 'watched'].includes(value)) {
    return ANIME_STATUSES.COMPLETED;
  }

  if (['watching', 'current', 'in-progress', 'in progress'].includes(value)) {
    return ANIME_STATUSES.WATCHING;
  }

  if (['plan', 'planned', 'plan to watch', 'unwatched'].includes(value)) {
    return ANIME_STATUSES.PLANNED;
  }

  if (['coming-soon', 'coming soon', 'upcoming', 'not yet aired', 'unreleased'].includes(value)) {
    return ANIME_STATUSES.COMING_SOON;
  }

  if (['dropped', 'droped', 'on hold', 'on-hold'].includes(value)) {
    return ANIME_STATUSES.DROPPED;
  }

  return value;
}

export function isCompletedStatus(status) {
  return normalizeAnimeStatus(status) === ANIME_STATUSES.COMPLETED;
}

export function isWatchingStatus(status) {
  return normalizeAnimeStatus(status) === ANIME_STATUSES.WATCHING;
}

export function isPlannedStatus(status) {
  return normalizeAnimeStatus(status) === ANIME_STATUSES.PLANNED;
}

export {
  SETUP_STORAGE_KEYS,
  SETUP_STEPS,
  SETUP_STEP_ORDER,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  REQUIRED_SHEET_TABS,
  REQUIRED_SHEET_TAB_NAMES,
  parseSpreadsheetId,
  normalizeSetupPayload,
  validateSetupPayload,
  buildStableClientUserId,
} from '../setup/setupContract';
