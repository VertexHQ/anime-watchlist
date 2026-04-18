import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAnime,
  addAnime as apiAdd,
  updateAnime as apiUpdate,
  deleteAnime as apiDelete,
} from '../api/animeApi';

export const AnimeContext = createContext(undefined);

export function AnimeProvider({ children }) {
  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAnime();
      setAnime(Array.isArray(response?.anime) ? response.anime : []);
    } catch (err) {
      setError(err?.message || 'Failed to load anime.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addAnimeEntry = useCallback(async (payload) => {
    const result = await apiAdd(payload);
    setAnime((prev) => [result.anime, ...prev]);
    return result;
  }, []);

  const updateAnimeEntry = useCallback(async (id, payload) => {
    const result = await apiUpdate(id, payload);
    setAnime((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? result.anime : item)),
    );
    return result;
  }, []);

  const deleteAnimeEntry = useCallback(async (id) => {
    await apiDelete(id);
    setAnime((prev) => prev.filter((item) => String(item.id) !== String(id)));
  }, []);

  const value = useMemo(
    () => ({
      anime,
      loading,
      error,
      fetchData,
      setAnime,
      addAnimeEntry,
      updateAnimeEntry,
      deleteAnimeEntry,
    }),
    [anime, loading, error, fetchData, addAnimeEntry, updateAnimeEntry, deleteAnimeEntry],
  );

  return <AnimeContext.Provider value={value}>{children}</AnimeContext.Provider>;
}
