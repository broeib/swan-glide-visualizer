import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Film,
  Guitar,
  Piano,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';

export interface RenderedVideoItem {
  id: string;
  date: string;
  slug: string;
  title: string;
  mood: string;
  key: string;
  bpm: number;
  instrument: string;
  theme: string;
  chordNames: string[];
  totalBeats: number;
  createdAt: string;
  videoUrl: string;
  coverUrl: string | null;
  caption: string;
}

const MOOD_LABELS: Record<string, string> = {
  'dreamy-major': 'Dreamy Major',
  'melancholy-minor': 'Melancholy Minor',
  'spicy-altered': 'Spicy Altered',
  'smooth-rnb': 'Smooth R&B',
};

export const RendersGallery: React.FC = () => {
  const [items, setItems] = useState<RenderedVideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [instrumentFilter, setInstrumentFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadOutputs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}outputs.json`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Failed to load renders (${response.status})`);
      }
      const data = (await response.json()) as { items?: RenderedVideoItem[] };
      const list = Array.isArray(data.items) ? data.items : [];
      setItems(list);
      setSelectedId((prev) => {
        if (prev && list.some((item) => item.id === prev)) {
          return prev;
        }
        return list[0]?.id ?? null;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load rendered videos'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOutputs();
  }, [loadOutputs]);

  const availableDates = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.date))).sort((a, b) =>
      b.localeCompare(a)
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (dateFilter !== 'all' && item.date !== dateFilter) return false;
      if (instrumentFilter !== 'all' && item.instrument !== instrumentFilter) {
        return false;
      }
      return true;
    });
  }, [items, dateFilter, instrumentFilter]);

  const selectedItem = useMemo(() => {
    return (
      filteredItems.find((item) => item.id === selectedId) ??
      filteredItems[0] ??
      null
    );
  }, [filteredItems, selectedId]);

  const handleCopyCaption = useCallback(async (item: RenderedVideoItem) => {
    if (!item.caption) return;
    try {
      await navigator.clipboard.writeText(item.caption);
      setCopiedId(item.id);
      setTimeout(() => {
        setCopiedId((current) => (current === item.id ? null : current));
      }, 2000);
    } catch {
      // Clipboard write unavailable
    }
  }, []);

  if (loading && items.length === 0) {
    return (
      <div className="flex-1 w-full max-w-5xl flex items-center justify-center text-sm text-white/60">
        Loading rendered videos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-sm text-rose-300">{error}</p>
        <button
          type="button"
          onClick={() => void loadOutputs()}
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 w-full max-w-xl flex flex-col items-center justify-center gap-3 text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
          <Film className="w-5 h-5" />
        </div>
        <h2 className="text-base font-semibold text-white/90">
          No rendered videos yet
        </h2>
        <p className="text-xs text-white/55 leading-relaxed">
          Run{' '}
          <code className="px-1.5 py-0.5 rounded bg-white/10 text-white/85 font-mono">
            npm run pipeline:generate -- --count 1
          </code>{' '}
          to render a 9:16 MP4 bundle into{' '}
          <code className="px-1.5 py-0.5 rounded bg-white/10 text-white/85 font-mono">
            output/
          </code>
          , then refresh.
        </p>
        <button
          type="button"
          onClick={() => void loadOutputs()}
          className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-5xl min-h-0 flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-5 px-2 py-2 overflow-hidden">
      {/* Centerpiece 9:16 Video Player */}
      <div className="flex flex-col items-center justify-center shrink-0">
        {selectedItem ? (
          <div className="relative h-[54vh] sm:h-[66vh] lg:h-[74vh] max-h-[760px] aspect-[9/16] rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
            <video
              key={selectedItem.id}
              src={selectedItem.videoUrl}
              poster={selectedItem.coverUrl ?? undefined}
              controls
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-contain bg-black"
            />
          </div>
        ) : (
          <div className="h-[54vh] sm:h-[66vh] aspect-[9/16] rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-xs text-white/50">
            No videos match the current filters
          </div>
        )}
      </div>

      {/* Right Rail: Selected Metadata + Render Archive List */}
      <aside className="w-full lg:w-[400px] min-h-0 flex-1 lg:flex-initial flex flex-col gap-3 overflow-hidden">
        {/* Filter & Refresh Bar */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {availableDates.length > 1 && (
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                aria-label="Filter by render date"
                className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white border border-white/10 outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900 text-white">
                  All dates
                </option>
                {availableDates.map((d) => (
                  <option key={d} value={d} className="bg-zinc-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center p-0.5 rounded-full bg-white/5 border border-white/10 text-xs">
              {(['all', 'guitar', 'keyboard'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setInstrumentFilter(mode)}
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer capitalize',
                    instrumentFilter === mode
                      ? 'bg-white/15 text-white'
                      : 'text-white/55 hover:text-white'
                  )}
                >
                  {mode === 'all' ? 'All' : mode === 'keyboard' ? 'Piano' : 'Guitar'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadOutputs()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-medium border border-white/10 transition-colors cursor-pointer shrink-0"
            title="Rescan output directory"
          >
            <RefreshCw className={clsx('w-3 h-3', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Selected Video Details */}
        {selectedItem && (
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 shrink-0 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-white/95 leading-snug">
                  {selectedItem.title}
                </h2>
                <p className="text-[11px] text-white/55 mt-0.5">
                  {selectedItem.date} ·{' '}
                  {MOOD_LABELS[selectedItem.mood] ?? selectedItem.mood} ·{' '}
                  {selectedItem.bpm} BPM · {selectedItem.theme}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {selectedItem.caption && (
                  <button
                    type="button"
                    onClick={() => void handleCopyCaption(selectedItem)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-[11px] font-medium text-white/85 transition-colors cursor-pointer"
                    title="Copy caption.txt"
                  >
                    {copiedId === selectedItem.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-white/60" />
                        <span>Caption</span>
                      </>
                    )}
                  </button>
                )}
                <a
                  href={selectedItem.videoUrl}
                  download={`${selectedItem.slug}.mp4`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-[11px] font-medium text-white/85 transition-colors"
                  title="Download MP4"
                >
                  <Download className="w-3 h-3 text-white/60" />
                  <span>MP4</span>
                </a>
              </div>
            </div>

            {selectedItem.chordNames.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedItem.chordNames.map((chord, idx) => (
                  <span
                    key={`${chord}-${idx}`}
                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-white/80"
                  >
                    {chord}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scrollable List of Renders */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2">
          {filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={clsx(
                  'w-full flex items-center gap-3 p-2 rounded-xl border text-left transition-all cursor-pointer shrink-0',
                  isSelected
                    ? 'bg-white/10 border-white/25 shadow-sm'
                    : 'bg-zinc-900/50 border-white/5 hover:bg-white/[0.07] hover:border-white/15'
                )}
              >
                <div className="w-10 h-[71px] rounded-lg overflow-hidden bg-black/50 border border-white/10 shrink-0 flex items-center justify-center">
                  {item.coverUrl ? (
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Film className="w-4 h-4 text-white/30" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {item.instrument === 'keyboard' ? (
                      <Piano className="w-3 h-3 text-amber-300 shrink-0" />
                    ) : (
                      <Guitar className="w-3 h-3 text-cyan-300 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-white/90 truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 truncate mt-0.5">
                    {MOOD_LABELS[item.mood] ?? item.mood} · {item.bpm} BPM ·{' '}
                    {item.theme}
                  </p>
                  <p className="text-[10px] font-mono text-white/40 truncate mt-1">
                    {item.chordNames.join(' → ')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
};
