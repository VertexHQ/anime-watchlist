// Values are loaded from .env (VITE_ prefix required for Vite to expose them).
// Copy .env.example to .env and fill in your values.
export const SHEETS_SCRIPT_URL = import.meta.env.VITE_SHEETS_SCRIPT_URL || '';

export const SHEET_NAMES = {
  WATCHING:  import.meta.env.VITE_SHEET_WATCHING  || 'watching',
  COMPLETED: import.meta.env.VITE_SHEET_COMPLETED || 'completed',
  PLAN:      import.meta.env.VITE_SHEET_PLAN      || 'plan',
  UPCOMING:  import.meta.env.VITE_SHEET_UPCOMING  || 'upcoming',
};

export const ANIME_STATUSES = {
  COMPLETED: 'completed',
  WATCHING: 'watching',
  PLANNED: 'plan',
  UPCOMING: 'upcoming',
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

  if (['upcoming', 'coming soon', 'not yet aired', 'unreleased'].includes(value)) {
    return ANIME_STATUSES.UPCOMING;
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
