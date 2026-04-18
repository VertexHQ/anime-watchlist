export default function AnimeCard({ anime, isDragging, onDragStart, onDragEnd, onDelete }) {
  if (!anime) return null;

  return (
    <article
      draggable
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      className={`group relative cursor-grab select-none rounded-lg border border-purple-900/30 bg-black/50 p-3 backdrop-blur-sm transition-all duration-150 active:cursor-grabbing ${
        isDragging
          ? 'scale-95 opacity-40'
          : 'hover:border-purple-500/50 hover:bg-black/70 hover:shadow-[0_0_14px_rgba(139,92,246,0.18)]'
      }`}
    >
      {/* Delete button — appears on hover */}
      <button
        aria-label="Delete anime"
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-purple-500/40 bg-black/60 text-purple-300 backdrop-blur-sm transition hover:border-purple-400 hover:bg-purple-900/30 hover:text-white hover:shadow-[0_0_10px_rgba(168,85,247,0.45)]"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Delete "${anime.title || 'this anime'}"?`)) {
            onDelete(anime.id);
          }
        }}
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="flex items-start gap-3">
        {/* Cover thumbnail */}
        {anime.image ? (
          <img
            alt={anime.title || 'cover'}
            className="h-16 w-11 flex-shrink-0 rounded object-cover shadow-md"
            src={anime.image}
          />
        ) : (
          <div className="flex h-16 w-11 flex-shrink-0 items-center justify-center rounded bg-gray-800/60 text-lg text-gray-600">
            ⛩
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-1 pr-4">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
            {anime.title || 'Untitled anime'}
          </p>
          {anime.rating ? (
            <p className="text-xs text-yellow-400">★ {anime.rating} / 10</p>
          ) : null}
          {anime.notes ? (
            <p className="line-clamp-1 text-xs text-gray-500">{anime.notes}</p>
          ) : null}
        </div>
      </div>

      {/* Drag grip dots */}
      <div className="absolute bottom-2 right-2 text-gray-700 group-hover:text-gray-500 transition-colors">
        <svg fill="currentColor" height="10" viewBox="0 0 10 10" width="10">
          <circle cx="2" cy="2" r="1" />
          <circle cx="8" cy="2" r="1" />
          <circle cx="2" cy="5" r="1" />
          <circle cx="8" cy="5" r="1" />
          <circle cx="2" cy="8" r="1" />
          <circle cx="8" cy="8" r="1" />
        </svg>
      </div>
    </article>
  );
}
