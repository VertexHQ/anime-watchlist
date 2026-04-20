import { useState } from 'react';
import { useAnime } from '../hooks/useAnime';
import { ANIME_STATUSES, normalizeAnimeStatus } from '../utils/constants';
import KanbanColumn from './KanbanColumn';
import AddAnimeModal from './AddAnimeModal';
import Loader from './Loader';

const COLUMNS = [
  {
    id: ANIME_STATUSES.WATCHING,
    label: 'Watching',
    emoji: '▶',
    dotClass: 'bg-purple-400',
    borderClass: 'border-purple-500/50',
    glowClass: 'shadow-[inset_0_0_24px_rgba(168,85,247,0.07)]',
    countClass: 'border-purple-500/30 bg-purple-500/15 text-purple-300',
  },
  {
    id: ANIME_STATUSES.COMPLETED,
    label: 'Completed',
    emoji: '✓',
    dotClass: 'bg-emerald-400',
    borderClass: 'border-emerald-500/50',
    glowClass: 'shadow-[inset_0_0_24px_rgba(52,211,153,0.07)]',
    countClass: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  },
  {
    id: ANIME_STATUSES.PLANNED,
    label: 'Plan to Watch',
    emoji: '◷',
    dotClass: 'bg-sky-400',
    borderClass: 'border-sky-500/50',
    glowClass: 'shadow-[inset_0_0_24px_rgba(56,189,248,0.07)]',
    countClass: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  },
  {
    id: ANIME_STATUSES.UPCOMING,
    label: 'Upcoming',
    emoji: '✦',
    dotClass: 'bg-amber-400',
    borderClass: 'border-amber-500/50',
    glowClass: 'shadow-[inset_0_0_24px_rgba(251,191,36,0.07)]',
    countClass: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  },
];

export default function KanbanBoard() {
  const { anime, loading, updateAnimeEntry, deleteAnimeEntry } = useAnime();
  const [draggingId, setDraggingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return <Loader message="Loading your watchlist..." />;
  }

  async function handleDrop(targetStatus) {
    if (!draggingId) return;
    const item = anime.find((a) => String(a.id) === String(draggingId));
    if (!item || normalizeAnimeStatus(item.status) === targetStatus) {
      setDraggingId(null);
      return;
    }
    await updateAnimeEntry(draggingId, { status: targetStatus });
    setDraggingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Board header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white glow-text">My Watchlist</h1>
          <p className="mt-0.5 text-sm text-purple-400/60">
            {anime.length} {anime.length === 1 ? 'anime' : 'anime'} tracked — drag cards between columns to update status
          </p>
        </div>
        <button
          className="rounded-md bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(139,92,246,0.45)] transition hover:bg-purple-500 hover:shadow-[0_0_26px_rgba(139,92,246,0.65)] active:scale-95"
          onClick={() => setShowModal(true)}
          type="button"
        >
          + Add Anime
        </button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            draggingId={draggingId}
            items={anime.filter((a) => normalizeAnimeStatus(a.status) === col.id)}
            onDelete={deleteAnimeEntry}
            onDragEnd={() => setDraggingId(null)}
            onDragStart={setDraggingId}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {showModal ? <AddAnimeModal onClose={() => setShowModal(false)} /> : null}
    </div>
  );
}
