import { useMemo } from 'react';
import AnimeCard from '../components/AnimeCard';
import Loader from '../components/Loader';
import { useAnime } from '../hooks/useAnime';
import { isWatchingStatus } from '../utils/constants';

export default function Watching() {
  const { anime, loading, error } = useAnime();

  const watchingAnime = useMemo(() => anime.filter((item) => isWatchingStatus(item.status)), [anime]);

  if (loading) {
    return <Loader message="Loading watching list..." />;
  }

  return (
    <section className="page-section space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-white glow-text">Watching</h1>
        <p className="text-sm text-purple-400/70">Currently watching: {watchingAnime.length}</p>
      </header>

      {error ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 backdrop-blur-sm">
          {error}
        </p>
      ) : null}

      {watchingAnime.length === 0 ? (
        <div className="dark-card text-sm text-gray-400">Nothing in progress. Start watching something!</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {watchingAnime.map((item) => (
            <AnimeCard anime={item} key={item.id} />
          ))}
        </div>
      )}
    </section>
  );
}
