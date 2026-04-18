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

export function getAnime() {
  return Promise.resolve({ anime: loadList() });
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
  return Promise.resolve({ success: true, anime: list[idx] });
}

export function deleteAnime(id) {
  const list = loadList();
  const next = list.filter((item) => String(item.id) !== String(id));
  if (next.length === list.length) return Promise.reject(new Error('Anime not found.'));
  persist(next);
  return Promise.resolve({ success: true });
}
