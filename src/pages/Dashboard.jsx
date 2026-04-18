import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import Loader from '../components/Loader';
import { useAnime } from '../hooks/useAnime';
import { APP_ROUTES, isCompletedStatus, isWatchingStatus } from '../utils/constants';

function toDateValue(item) {
  if (!item?.createdAt) {
    return 0;
  }

  const parsed = new Date(item.createdAt).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function Dashboard() {
  const { anime, loading, error } = useAnime();

  const stats = useMemo(() => {
    const completedCount = anime.filter((item) => isCompletedStatus(item.status)).length;
    const watchingCount = anime.filter((item) => isWatchingStatus(item.status)).length;

    return {
      totalCount: anime.length,
      completedCount,
      watchingCount,
    };
  }, [anime]);

  const recentAnime = useMemo(() => {
    return [...anime].sort((a, b) => toDateValue(b) - toDateValue(a)).slice(0, 6);
  }, [anime]);

  if (loading) {
    return <Loader message="Loading dashboard..." />;
  }

  return (
    <section className="page-section space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-white glow-text">Dashboard</h1>
        <p className="text-sm text-purple-300/70">Track your anime progress at a glance.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-xs font-medium uppercase tracking-widest text-purple-400/70">Total anime</p>
          <p className="mt-2 text-4xl font-bold text-purple-300 glow-text">{stats.totalCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400/70">Completed</p>
          <p className="mt-2 text-4xl font-bold text-emerald-300">{stats.completedCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium uppercase tracking-widest text-sky-400/70">Watching</p>
          <p className="mt-2 text-4xl font-bold text-sky-300">{stats.watchingCount}</p>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 backdrop-blur-sm">
          Failed to load anime: {error}
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Recent anime</h2>
          <Link className="text-sm font-medium text-purple-400 transition hover:text-purple-300" to={APP_ROUTES.ADD}>
            Add new
          </Link>
        </div>

        {recentAnime.length === 0 ? (
          <div className="dark-card text-sm text-gray-400">
            No anime yet. Add your first entry from the <Link className="text-purple-400 hover:text-purple-300" to={APP_ROUTES.ADD}>Add</Link> page.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentAnime.map((item) => (
              <AnimeCard anime={item} key={item.id} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
