import { useContext } from 'react';
import { AnimeContext } from '../context/animeContextRef';

export function useAnime() {
  const context = useContext(AnimeContext);

  if (!context) {
    throw new Error('useAnime must be used within an AnimeProvider.');
  }

  return context;
}
