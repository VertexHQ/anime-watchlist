import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AnimeForm from '../components/AnimeForm';
import Loader from '../components/Loader';
import { useAnime } from '../hooks/useAnime';
import { ANIME_STATUSES, APP_ROUTES, normalizeAnimeStatus } from '../utils/constants';

function statusBadge(status) {
  const n = normalizeAnimeStatus(status);
  if (n === ANIME_STATUSES.COMPLETED) return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300';
  if (n === ANIME_STATUSES.WATCHING) return 'border-purple-500/40 bg-purple-500/15 text-purple-300';
  if (n === ANIME_STATUSES.PLANNED) return 'border-sky-500/40 bg-sky-500/15 text-sky-300';
  if (n === ANIME_STATUSES.COMING_SOON) return 'border-amber-500/40 bg-amber-500/15 text-amber-300';
  if (n === ANIME_STATUSES.DROPPED) return 'border-rose-500/40 bg-rose-500/15 text-rose-300';
  return 'border-gray-600 bg-gray-700/30 text-gray-300';
}

function statusLabel(status) {
  const n = normalizeAnimeStatus(status);
  if (n === ANIME_STATUSES.COMPLETED) return 'Completed';
  if (n === ANIME_STATUSES.WATCHING) return 'Watching';
  if (n === ANIME_STATUSES.PLANNED) return 'Plan to Watch';
  if (n === ANIME_STATUSES.COMING_SOON) return 'Coming Soon';
  if (n === ANIME_STATUSES.DROPPED) return 'Dropped';
  return status || 'Unknown';
}

export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { anime, loading, deleteAnimeEntry } = useAnime();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const animeItem = anime.find((item) => String(item.id) === String(id));

  if (loading) {
    return <Loader message="Loading anime details..." />;
  }

  if (!animeItem) {
    return (
      <section className="page-section">
        <div className="dark-card space-y-3">
          <h1 className="text-2xl font-semibold text-white">Anime not found</h1>
          <p className="text-sm text-gray-400">No entry with id: {id}</p>
          <Link
            className="inline-flex rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            to={APP_ROUTES.HOME}
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    );
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${animeItem.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAnimeEntry(id);
      navigate(APP_ROUTES.HOME);
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete.');
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <section className="page-section space-y-4">
        <button
          className="text-sm text-purple-400 transition hover:text-purple-300"
          onClick={() => setEditing(false)}
          type="button"
        >
          ← Cancel edit
        </button>
        <AnimeForm initialData={animeItem} onSuccess={() => setEditing(false)} />
      </section>
    );
  }

  return (
    <section className="page-section space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm text-purple-400 transition hover:text-purple-300" to={APP_ROUTES.HOME}>
          ← Back to dashboard
        </Link>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-purple-500/40 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300 backdrop-blur-sm transition hover:bg-purple-500/25"
            onClick={() => setEditing(true)}
            type="button"
          >
            Edit
          </button>
          <button
            className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-1.5 text-sm font-medium text-rose-300 backdrop-blur-sm transition hover:bg-rose-500/25 disabled:opacity-50"
            disabled={deleting}
            onClick={handleDelete}
            type="button"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {deleteError ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {deleteError}
        </p>
      ) : null}

      <article className="dark-card overflow-hidden p-0">
        <div className="aspect-video bg-black/40">
          {animeItem.image ? (
            <img
              alt={animeItem.title || 'Anime cover'}
              className="h-full w-full object-cover"
              src={animeItem.image}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No cover image
            </div>
          )}
        </div>

        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-bold text-white glow-text">
              {animeItem.title || 'Untitled anime'}
            </h1>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(animeItem.status)}`}
            >
              {statusLabel(animeItem.status)}
            </span>
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-md border border-purple-900/40 bg-black/40 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Rating</p>
              <p className="mt-1 text-2xl font-bold text-purple-300">
                {animeItem.rating || 'N/A'}
                {animeItem.rating ? (
                  <span className="ml-1 text-sm font-normal text-gray-500">/ 10</span>
                ) : null}
              </p>
            </div>
            <div className="rounded-md border border-purple-900/40 bg-black/40 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Added</p>
              <p className="mt-1 text-sm text-gray-300">
                {animeItem.createdAt
                  ? new Date(animeItem.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Unknown'}
              </p>
            </div>
            <div className="rounded-md border border-purple-900/40 bg-black/40 p-4 backdrop-blur-sm md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-gray-200">
                {animeItem.notes || 'No notes provided.'}
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
