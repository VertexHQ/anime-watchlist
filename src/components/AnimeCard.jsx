import { useState } from 'react';
import { ANIME_STATUSES, normalizeAnimeStatus } from '../utils/constants';

export default function AnimeCard({ anime, isDragging, onDragStart, onDragEnd, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  if (!anime) return null;
  const normalizedStatus = normalizeAnimeStatus(anime.status);
  const isComingSoon = normalizedStatus === ANIME_STATUSES.COMING_SOON;
  const isDropped = normalizedStatus === ANIME_STATUSES.DROPPED;
  const releaseDateNotDeclared = anime.releaseDateNotDeclared === true
    || String(anime.releaseDateNotDeclared || '').toLowerCase() === 'true';
  const releaseText = isComingSoon
    ? (
      releaseDateNotDeclared
        ? 'Not declared'
        : (anime.releaseDate ? new Date(anime.releaseDate).toLocaleDateString() : '')
    )
    : '';
  const droppedReason = isDropped ? String(anime.droppedReason || '').trim() : '';

  return (
    <article
      draggable
      onClick={() => setExpanded((v) => !v)}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      className={`group relative cursor-grab select-none rounded-lg border border-purple-900/30 bg-black/50 p-3 backdrop-blur-sm transition-all duration-200 active:cursor-grabbing ${
        isDragging
          ? 'scale-95 opacity-40'
          : 'hover:border-purple-500/50 hover:bg-black/70 hover:shadow-[0_0_14px_rgba(139,92,246,0.18)]'
      }`}
    >
      {/* Action buttons */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <button
          aria-label="Edit anime"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-purple-500/40 bg-black/60 text-purple-300 backdrop-blur-sm transition hover:border-purple-400 hover:bg-purple-900/30 hover:text-white hover:shadow-[0_0_10px_rgba(168,85,247,0.45)]"
          onClick={(e) => { e.stopPropagation(); onEdit(anime); }}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          aria-label="Delete anime"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-purple-500/40 bg-black/60 text-purple-300 backdrop-blur-sm transition hover:border-purple-400 hover:bg-purple-900/30 hover:text-white hover:shadow-[0_0_10px_rgba(168,85,247,0.45)]"
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
      </div>

      <div className="flex items-start gap-3">
        {anime.image ? (
          <img
            alt={anime.title || 'cover'}
            className={`flex-shrink-0 rounded object-cover shadow-md transition-all duration-200 ${
              expanded ? 'h-24 w-16' : 'h-16 w-11'
            }`}
            src={anime.image}
          />
        ) : (
          <div className={`flex flex-shrink-0 items-center justify-center rounded bg-gray-800/60 text-gray-600 transition-all duration-200 ${
            expanded ? 'h-24 w-16 text-2xl' : 'h-16 w-11 text-lg'
          }`}>
            ⛩
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1 pr-16">
          <p className={`text-sm font-semibold leading-snug text-white ${expanded ? '' : 'line-clamp-2'}`}>
            {anime.title || 'Untitled anime'}
          </p>
          {anime.rating ? (
            <p className="text-xs text-yellow-400">★ {anime.rating} / 10</p>
          ) : null}
          {releaseText ? (
            <p className="text-xs text-cyan-300">Release: {releaseText}</p>
          ) : null}
          {droppedReason ? (
            <p className={`text-xs ${expanded ? 'whitespace-pre-wrap text-rose-300' : 'line-clamp-1 text-rose-300'}`}>
              Drop reason: {droppedReason}
            </p>
          ) : null}
          {anime.notes ? (
            <p className={`text-xs ${expanded ? 'whitespace-pre-wrap text-gray-300' : 'line-clamp-1 text-gray-500'}`}>
              {anime.notes}
            </p>
          ) : null}
          {expanded && anime.createdAt ? (
            <p className="pt-1 text-xs text-purple-500/50">
              Added {new Date(anime.createdAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-700 transition-colors group-hover:text-gray-500">
          {expanded ? '▲ collapse' : '▼ expand'}
        </span>
        {!expanded && (
          <svg fill="currentColor" height="10" viewBox="0 0 10 10" width="10" className="text-gray-700 transition-colors group-hover:text-gray-500">
            <circle cx="2" cy="2" r="1" />
            <circle cx="8" cy="2" r="1" />
            <circle cx="2" cy="5" r="1" />
            <circle cx="8" cy="5" r="1" />
            <circle cx="2" cy="8" r="1" />
            <circle cx="8" cy="8" r="1" />
          </svg>
        )}
      </div>
    </article>
  );
}
