import { useState } from 'react';
import AnimeCard from './AnimeCard';

export default function KanbanColumn({ column, items, draggingId, onDragStart, onDragEnd, onDrop, onDelete, onEdit }) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 backdrop-blur-sm transition-all duration-150 md:h-full ${
        isDragOver
          ? `${column.borderClass} ${column.glowClass} bg-white/5`
          : 'border-gray-700/40 bg-black/30'
      }`}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsDragOver(false);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(column.id);
        setIsDragOver(false);
      }}
    >
      {/* Column header */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${column.dotClass}`} />
        <h2 className="text-sm font-semibold text-white">{column.label}</h2>
        <span
          className={`ml-auto rounded-full border px-2 py-0.5 text-xs font-semibold ${column.countClass}`}
        >
          {items.length}
        </span>
      </div>

      {/* Cards — scrollable, never pushes the page */}
      <div className="flex flex-col gap-2 overflow-y-auto md:flex-1 md:min-h-0 pr-0.5">
        {items.map((item) => (
          <AnimeCard
            key={item.id}
            anime={item}
            isDragging={String(draggingId) === String(item.id)}
            onDelete={onDelete}
            onDragEnd={onDragEnd}
            onDragStart={() => onDragStart(item.id)}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Empty drop zone */}
      {items.length === 0 ? (
        <div
          className={`mt-1 flex flex-1 items-center justify-center rounded-lg border border-dashed py-10 text-xs italic transition-colors ${
            isDragOver ? `${column.borderClass} text-gray-400` : 'border-gray-700/40 text-gray-600'
          }`}
        >
          {isDragOver ? 'Release to move here' : 'Drop anime here'}
        </div>
      ) : null}
    </div>
  );
}
