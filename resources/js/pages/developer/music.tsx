import { Head } from '@inertiajs/react';
import {
    Search,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Music,
    Clock,
    Loader2,
    X,
    Plus,
    ListMusic,
    ChevronDown,
    Check,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { useMusicPlayer  } from '@/contexts/music-player-context';
import type {Track} from '@/contexts/music-player-context';

function DownloadCircle({ className }: { className?: string }) {
    return (
        <svg
            className={`animate-spin ${className ?? ''}`}
            viewBox="0 0 24 24"
            fill="none"
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-20"
            />
            <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

function xsrfToken(): string {
    return document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '';
}

export default function MusicPlayer() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Track[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    const {
        queue,
        currentIndex,
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        muted,
        loadingTrack,
        downloadingTracks,
        browserCached,
        queueOpen,
        setQueueOpen,
        togglePlay,
        playFromQueue,
        removeFromQueue,
        skipNext,
        skipPrev,
        setVolume,
        toggleMute,
        seekTo,
        downloadAndPlayOnly,
        downloadAndEnqueue,
        fmt,
        progressRef,
    } = useMusicPlayer();

    const doSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
return;
}

        setSearching(true);
        setSearchError('');

        try {
            const res = await fetch('/developer/music/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken()),
                },
                body: JSON.stringify({ query: q }),
            });
            const data = await res.json();

            if (!res.ok) {
                setResults([]);
                setSearchError(data.error ?? 'Search failed.');

                return;
            }

            setResults(data.results ?? []);
        } catch {
            setResults([]);
            setSearchError('Search failed. Check your connection and try again.');
        } finally {
            setSearching(false);
        }
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        doSearch(query);
    };

    const handlePlayClick = (track: Track) => {
        const idx = queue.findIndex((q) => q.id === track.id);

        if (idx >= 0) {
            playFromQueue(idx);
        } else {
            downloadAndPlayOnly(track);
        }
    };

    const handleAddToQueue = (track: Track) => {
        if (queue.find((q) => q.id === track.id)) {
return;
}

        if (!currentTrack) {
            downloadAndPlayOnly(track);
        } else {
            downloadAndEnqueue(track);
        }
    };

    return (
        <>
            <Head title="Music Player" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Search */}
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search YouTube..."
                                className="w-full rounded-lg border border-sidebar-border/70 bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={searching || !query.trim()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                            Search
                        </button>
                    </form>
                </section>

                {/* Results + Queue */}
                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Results */}
                    <section className="min-w-0 flex-1 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            {results.length > 0 ? 'Search Results' : 'Search YouTube to find music'}
                        </h2>
                        {searching ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Loader2 className="mb-3 size-8 animate-spin" />
                                <p className="text-sm">Searching...</p>
                            </div>
                        ) : searchError ? (
                            <div className="flex flex-col items-center justify-center rounded-xl bg-destructive/5 px-6 py-10 text-center text-destructive">
                                <Music className="mb-3 size-12 opacity-40" />
                                <p className="text-sm font-medium">{searchError}</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-2">
                                {results.map((track) => {
                                    const isCurrent = currentTrack?.id === track.id;
                                    const isLoading = loadingTrack === track.id;
                                    const isDownloading = downloadingTracks.has(track.id);
                                    const isBrowserReady = browserCached.has(track.id);
                                    const isAlreadyQueued = queue.some((q) => q.id === track.id);

                                    return (
                                        <div
                                            key={track.id}
                                            className={`flex items-center gap-4 rounded-xl p-3 transition-colors ${
                                                isCurrent ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-sidebar-accent/40'
                                            }`}
                                        >
                                            <div className="relative size-14 shrink-0">
                                                <img src={track.thumbnail} alt="" className="size-14 rounded-lg object-cover" />
                                                {isCurrent && isPlaying && (
                                                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                                                        <div className="flex items-end gap-0.5 h-4">
                                                            {[0, 1, 2, 3].map((i) => (
                                                                <div
                                                                    key={i}
                                                                    className="w-0.5 bg-white rounded-full animate-bounce"
                                                                    style={{
                                                                        animationDelay: `${i * 0.12}s`,
                                                                        animationDuration: '0.6s',
                                                                        height: `${8 + Math.random() * 8}px`,
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{track.title}</p>
                                                <p className="truncate text-xs text-muted-foreground">{track.channel}</p>
                                                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock className="size-3" />
                                                        {track.duration_string}
                                                    </span>
                                                    {track.view_count != null && (
                                                        <span>{track.view_count.toLocaleString()} views</span>
                                                    )}
                                                    {isBrowserReady && (
                                                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                                            <Check className="size-3" />
                                                            Ready
                                                        </span>
                                                    )}
                                                    {isDownloading && (
                                                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                            <DownloadCircle className="size-3" />
                                                            Downloading...
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePlayClick(track)}
                                                    disabled={isLoading || isDownloading}
                                                    className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                                >
                                                    {isLoading || isDownloading ? (
                                                        <DownloadCircle className="size-4" />
                                                    ) : isCurrent && isPlaying ? (
                                                        <Pause className="size-4" />
                                                    ) : (
                                                        <Play className="size-4 ml-0.5" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddToQueue(track)}
                                                    disabled={isAlreadyQueued || isDownloading}
                                                    className="inline-flex size-9 items-center justify-center rounded-full border border-sidebar-border/70 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-50"
                                                    title="Add to queue"
                                                >
                                                    {isDownloading ? (
                                                        <DownloadCircle className="size-4" />
                                                    ) : isAlreadyQueued ? (
                                                        <Check className="size-4" />
                                                    ) : (
                                                        <Plus className="size-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Music className="mb-3 size-12 opacity-30" />
                                <p className="text-sm">Type a search query to find music</p>
                            </div>
                        )}
                    </section>

                    {/* Queue */}
                    <section className="w-full shrink-0 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm lg:w-80 dark:border-sidebar-border dark:bg-sidebar">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Up Next ({queue.filter((_, i) => i !== currentIndex).length})
                        </h2>
                        {queue.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">Queue is empty</p>
                        ) : (
                            <div className="space-y-1">
                                {queue
                                    .map((track, i) => ({ track, originalIndex: i }))
                                    .filter(({ originalIndex }) => originalIndex !== currentIndex)
                                    .map(({ track, originalIndex }) => {
                                        const isBrowserReady = browserCached.has(track.id);
                                        const isDownloading = downloadingTracks.has(track.id);

                                        return (
                                            <div
                                                key={`${track.id}-${originalIndex}`}
                                                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors cursor-pointer hover:bg-sidebar-accent/40"
                                                onClick={() => playFromQueue(originalIndex)}
                                            >
                                                <img src={track.thumbnail} alt="" className="size-10 shrink-0 rounded object-cover" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{track.title}</p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {track.channel} &middot; {track.duration_string}
                                                    </p>
                                                </div>
                                                {isDownloading && (
                                                    <DownloadCircle className="size-4 shrink-0 text-amber-500" />
                                                )}
                                                {!isDownloading && isBrowserReady && (
                                                    <Check className="size-4 shrink-0 text-green-600 dark:text-green-400" />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFromQueue(originalIndex);
                                                    }}
                                                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* Player Overlay */}
            {currentTrack && (
                <div className="fixed inset-x-0 bottom-0 z-50">
                    <div className="relative mx-auto max-w-5xl">
                        {/* Queue drawer */}
                        {queueOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 max-h-80 overflow-y-auto rounded-2xl border border-sidebar-border/70 bg-white shadow-xl dark:border-sidebar-border dark:bg-sidebar">
                                <div className="sticky top-0 flex items-center justify-between border-b border-sidebar-border/70 bg-white/95 px-5 py-3 backdrop-blur dark:bg-sidebar/95">
                                    <h3 className="text-sm font-semibold">Up Next</h3>
                                    <button type="button" onClick={() => setQueueOpen(false)} className="text-muted-foreground hover:text-foreground">
                                        <ChevronDown className="size-4" />
                                    </button>
                                </div>
                                <div className="p-2">
                                    {queue
                                        .map((track, i) => ({ track, originalIndex: i }))
                                        .filter(({ originalIndex }) => originalIndex !== currentIndex)
                                        .map(({ track, originalIndex }, displayIndex) => (
                                            <div
                                                key={`${track.id}-drawer-${originalIndex}`}
                                                onClick={() => {
 playFromQueue(originalIndex); setQueueOpen(false); 
}}
                                                className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors hover:bg-sidebar-accent/40"
                                            >
                                                <span className="w-5 text-center text-xs text-muted-foreground">{displayIndex + 1}</span>
                                                <img src={track.thumbnail} alt="" className="size-8 shrink-0 rounded object-cover" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{track.title}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{track.channel}</p>
                                                </div>
                                                <span className="text-xs text-muted-foreground tabular-nums">{track.duration_string}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
 e.stopPropagation(); removeFromQueue(originalIndex); 
}}
                                                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Main player bar */}
                        <div className="mx-4 mb-4 overflow-hidden rounded-2xl border border-sidebar-border/70 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-sidebar-border dark:bg-sidebar/95">
                            {/* Full-width progress */}
                            <div
                                ref={progressRef}
                                onClick={(e) => {
                                    if (!progressRef.current || !duration) {
return;
}

                                    const rect = progressRef.current.getBoundingClientRect();
                                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                                    seekTo(pct);
                                }}
                                className="group relative h-2 w-full cursor-pointer bg-muted/50"
                            >
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 transition-all"
                                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                />
                                <div
                                    className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-primary shadow-lg ring-2 ring-white opacity-0 transition-opacity group-hover:opacity-100 dark:ring-sidebar"
                                    style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 8px)` }}
                                />
                            </div>

                            <div className="flex flex-col items-center gap-4 px-5 py-3.5 sm:flex-row sm:items-center">
                                {/* Track info */}
                                <div className="flex min-w-0 items-center gap-3.5 w-72">
                                    <div className="relative size-14 shrink-0">
                                        <img
                                            src={currentTrack.thumbnail}
                                            alt=""
                                            className="size-14 rounded-xl object-cover shadow-md"
                                        />
                                        {loadingTrack === currentTrack.id && (
                                            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                                                <Loader2 className="size-5 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold leading-tight">
                                            {currentTrack.title}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            {currentTrack.channel}
                                        </p>
                                    </div>
                                </div>

                                {/* Center controls */}
                                <div className="flex flex-1 flex-col items-center gap-1">
                                    <div className="flex items-center gap-5">
                                        <button
                                            type="button"
                                            onClick={skipPrev}
                                            disabled={currentIndex <= 0}
                                            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
                                        >
                                            <SkipBack className="size-[18px] fill-current" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={togglePlay}
                                            disabled={!!loadingTrack}
                                            className="inline-flex size-10 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                                        >
                                            {loadingTrack ? (
                                                <Loader2 className="size-5 animate-spin" />
                                            ) : isPlaying ? (
                                                <Pause className="size-5 fill-current" />
                                            ) : (
                                                <Play className="size-5 ml-0.5 fill-current" />
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={skipNext}
                                            disabled={currentIndex >= queue.length - 1}
                                            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
                                        >
                                            <SkipForward className="size-[18px] fill-current" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
                                        <span className="w-10 text-right tabular-nums">{fmt(currentTime)}</span>
                                        <div className="w-10 text-center tabular-nums">
                                            {fmt(duration)}
                                        </div>
                                    </div>
                                </div>

                                {/* Right controls */}
                                <div className="flex w-56 items-center justify-end gap-3">
                                    {/* Volume */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={toggleMute}
                                            className="text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {muted || volume === 0 ? (
                                                <VolumeX className="size-4" />
                                            ) : (
                                                <Volume2 className="size-4" />
                                            )}
                                        </button>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={muted ? 0 : volume}
                                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                                            className="h-1 w-20 cursor-pointer accent-primary"
                                        />
                                    </div>

                                    {/* Queue toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setQueueOpen(!queueOpen)}
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                            queueOpen
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                                        }`}
                                    >
                                        <ListMusic className="size-3.5" />
                                        <span className="tabular-nums">{queue.length}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

MusicPlayer.layout = undefined;
