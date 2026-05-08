import type React from 'react';
import { memo, useMemo } from 'react';
import type { MediaItem } from '@/lib/api';

const MediaCard = memo(({ item }: { item: MediaItem }): React.ReactElement => (
  <article className="h-full rounded-md border border-slate-700 p-2">
    <div className="mb-2 text-xs uppercase text-slate-400">{item.type}</div>
    {item.type === 'image' ? (
      <img
        src={item.mediaUrl}
        className="h-40 w-full rounded object-cover"
        loading="lazy"
        decoding="async"
        alt="Scraped media preview"
      />
    ) : (
      <div className="flex h-40 w-full items-center justify-center rounded bg-slate-800 text-xs text-slate-300">
        Video preview disabled for smooth UI
      </div>
    )}
    <p className="mt-2 line-clamp-2 text-xs text-slate-300">{item.mediaUrl}</p>
    <p className="line-clamp-2 text-xs text-slate-500">{item.sourceUrl}</p>
  </article>
));

export const MediaGrid = memo(({ items }: { items: MediaItem[] }): React.ReactElement => {
  // ensure stable reference for map in very frequent refresh cases
  const stableItems = useMemo(() => items, [items]);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stableItems.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
    </div>
  );
});

