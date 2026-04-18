import { useMemo } from 'react';
import AnimeCard from '../components/AnimeCard';
import Loader from '../components/Loader';
import { useAnime } from '../hooks/useAnime';
import { isCompletedStatus } from '../utils/constants';

export default function Completed() {
  const { anime, loading, error } = useAnime();

  const completedAnime = useMemo(() => anime.filter((item) => isCompletedStatus(item.status)), [anime]);

  if (loading) {
    return <Loader message="Loading completed anime..." />;
  }

  return (
    <section className="page-section space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-white glow-text">Completed Anime</h1>
        <p className="text-sm text-emerald-400/70">{completedAnime.length} title{completedAnime.length !== 1 ? 's' : ''} finished</p>
      </header>

      {error ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 backdrop-blur-sm">
          {error}
        </p>
      ) : null}

      {completedAnime.length === 0 ? (
        <div className="dark-card text-sm text-gray-400">No completed anime yet. Keep watching!</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {completedAnime.map((item) => (
            <AnimeCard anime={item} key={item.id} />
          ))}
        </div>
      )}
    </section>
  );
}
