import { useMemo } from 'react';
import AnimeCard from '../components/AnimeCard';
import Loader from '../components/Loader';
import { useAnime } from '../hooks/useAnime';
import { isPlannedStatus } from '../utils/constants';

export default function Planned() {
  const { anime, loading, error } = useAnime();

  const plannedAnime = useMemo(() => anime.filter((item) => isPlannedStatus(item.status)), [anime]);

  if (loading) {
    return <Loader message="Loading planned anime..." />;
  }

  return (
    <section className="page-section space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-white glow-text">Planned Anime</h1>
        <p className="text-sm text-sky-400/70">{plannedAnime.length} title{plannedAnime.length !== 1 ? 's' : ''} in the queue</p>
      </header>

      {error ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 backdrop-blur-sm">
          {error}
        </p>
      ) : null}

      {plannedAnime.length === 0 ? (
        <div className="dark-card text-sm text-gray-400">Nothing planned yet. Add some titles to your queue!</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plannedAnime.map((item) => (
            <AnimeCard anime={item} key={item.id} />
          ))}
        </div>
      )}
    </section>
  );
}
