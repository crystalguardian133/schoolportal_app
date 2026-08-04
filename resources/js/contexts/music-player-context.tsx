import { createContext, useContext, useState, useRef, useEffect, useCallback  } from 'react';
import type {ReactNode} from 'react';

export type Track = {
    id: string;
    title: string;
    duration: number;
    duration_string: string;
    channel: string;
    thumbnail: string;
    view_count: number | null;
};

export type Keybindings = {
    playPause: string[];
    prev: string[];
    next: string[];
};

const DEFAULT_KEYBINDINGS: Keybindings = {
    playPause: ['k', ' '],
    prev: ['j', 'ArrowLeft'],
    next: ['l', 'ArrowRight'],
};

type MusicPlayerContextType = {
    queue: Track[];
    currentIndex: number;
    currentTrack: Track | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    muted: boolean;
    loadingTrack: string | null;
    downloadingTracks: Set<string>;
    browserCached: Set<string>;
    queueOpen: boolean;
    setQueueOpen: (open: boolean) => void;
    keybindings: Keybindings;
    setKeybindings: (kb: Keybindings) => void;
    pendingResume: boolean;
    resumePlayback: () => void;
    playTrack: (track: Track, index: number) => void;
    togglePlay: () => void;
    playFromQueue: (index: number) => void;
    removeFromQueue: (index: number) => void;
    skipNext: () => void;
    skipPrev: () => void;
    setVolume: (v: number) => void;
    toggleMute: () => void;
    seekTo: (pct: number) => void;
    downloadAndPlayOnly: (track: Track) => Promise<void>;
    downloadAndEnqueue: (track: Track) => Promise<void>;
    fmt: (s: number) => string;
    progressRef: React.RefObject<HTMLDivElement | null>;
};

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

const CACHE_NAME = 'music-audio-cache';
const STORAGE_KEY = 'music-player-state';

function loadPersistedState() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);

        if (raw) {
            const data = JSON.parse(raw);

            return {
                queue: Array.isArray(data.queue) ? data.queue : [],
                currentIndex: typeof data.currentIndex === 'number' ? data.currentIndex : -1,
                activeTrack: data.activeTrack ?? null,
                volume: typeof data.volume === 'number' ? data.volume : 0.8,
                muted: typeof data.muted === 'boolean' ? data.muted : false,
                isPlaying: typeof data.isPlaying === 'boolean' ? data.isPlaying : false,
                currentTime: typeof data.currentTime === 'number' ? data.currentTime : 0,
                keybindings: data.keybindings ?? null,
            };
        }
    } catch {
        // corrupted storage
    }

    return null;
}

function xsrfToken(): string {
    return document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '';
}

function streamUrl(track: Track): string {
    return `/developer/music/stream?video_id=${encodeURIComponent(track.id)}`;
}

async function getCachedBlob(trackId: string): Promise<string | null> {
    return caches.open(CACHE_NAME).then(async (cache) => {
        const req = new Request(`/music-audio/${trackId}`);
        const resp = await cache.match(req);

        if (!resp) {
return null;
}

        const blob = await resp.blob();

        return URL.createObjectURL(blob);
    }).catch(() => null);
}

async function cacheAudioBlob(trackId: string, blob: Blob): Promise<void> {
    try {
        const cache = await caches.open(CACHE_NAME);
        const req = new Request(`/music-audio/${trackId}`);
        const resp = new Response(blob, {
            headers: { 'Content-Type': blob.type || 'audio/mpeg' },
        });
        await cache.put(req, resp);
    } catch {
        // Cache API may be unavailable
    }
}

async function fetchAndCacheAudio(track: Track): Promise<string> {
    const cached = await getCachedBlob(track.id);

    if (cached) {
return cached;
}

    try {
        const preResp = await fetch('/developer/music/pre-cache', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(xsrfToken()),
            },
            body: JSON.stringify({ video_id: track.id }),
        });

        if (!preResp.ok) {
            console.warn('Pre-cache returned', preResp.status);
        }
    } catch {
        // Pre-cache failed, stream endpoint will try anyway
    }

    const resp = await fetch(streamUrl(track), {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });

    if (!resp.ok) {
throw new Error('Failed to fetch audio');
}

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);

    cacheAudioBlob(track.id, blob);

    return url;
}

export function checkBrowserCache(trackIds: string[]): Promise<Set<string>> {
    const cached = new Set<string>();

    return caches.open(CACHE_NAME).then(async (cache) => {
        for (const id of trackIds) {
            const resp = await cache.match(new Request(`/music-audio/${id}`));

            if (resp) {
cached.add(id);
}
        }

        return cached;
    }).catch(() => cached);
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
    const persisted = useRef(loadPersistedState());

    const [queue, setQueue] = useState<Track[]>(() => persisted.current?.queue ?? []);
    const [currentIndex, setCurrentIndex] = useState<number>(() => persisted.current?.currentIndex ?? -1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(() => persisted.current?.volume ?? 0.8);
    const [muted, setMuted] = useState(() => persisted.current?.muted ?? false);
    const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
    const [downloadingTracks, setDownloadingTracks] = useState<Set<string>>(new Set());
    const [browserCached, setBrowserCached] = useState<Set<string>>(new Set());
    const [queueOpen, setQueueOpen] = useState(false);
    const [activeTrack, setActiveTrack] = useState<Track | null>(() => persisted.current?.activeTrack ?? null);
    const [keybindings, setKeybindingsState] = useState<Keybindings>(
        () => persisted.current?.keybindings ?? DEFAULT_KEYBINDINGS,
    );
    const [pendingResume, setPendingResume] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const blobUrlsRef = useRef<Map<string, string>>(new Map());
    const generationRef = useRef(0);
    const queueRef = useRef<Track[]>(queue);
    queueRef.current = queue;
    const currentIndexRef = useRef(currentIndex);
    currentIndexRef.current = currentIndex;

    const currentTrack = activeTrack ?? (currentIndex >= 0 ? queue[currentIndex] : null);

    // Persist state to sessionStorage on every relevant change
    useEffect(() => {
        try {
            sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    queue,
                    currentIndex,
                    activeTrack,
                    volume,
                    muted,
                    isPlaying,
                    currentTime,
                    keybindings,
                }),
            );
        } catch {
            // storage full or unavailable
        }
    }, [queue, currentIndex, activeTrack, volume, muted, isPlaying, currentTime, keybindings]);

    // On remount: if we had a playing track, try to re-audio and resume
    useEffect(() => {
        if (!persisted.current) {
return;
}

        const { activeTrack: savedTrack, isPlaying: wasPlaying, currentTime: savedTime, currentIndex: savedIndex } = persisted.current;
        persisted.current = null; // only do this once

        if (!savedTrack || !wasPlaying) {
return;
}

        (async () => {
            try {
                setLoadingTrack(savedTrack.id);
                const audioUrl = await fetchAndCacheAudio(savedTrack);
                const audio = new Audio(audioUrl);
                audio.volume = muted ? 0 : volume;

                if (savedTime > 0) {
audio.currentTime = savedTime;
}

                audioRef.current = audio;

                audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
                audio.ondurationchange = () => setDuration(audio.duration || 0);
                audio.oncanplay = () => setLoadingTrack(null);
                audio.onended = () => {
                    setIsPlaying(false);
                    const q = queueRef.current;
                    const idx = savedIndex >= 0 ? savedIndex : currentIndexRef.current;

                    if (idx >= 0 && idx < q.length - 1) {
                        const nextIdx = idx + 1;
                        setCurrentIndex(nextIdx);
                        playTrackRef.current(q[nextIdx], nextIdx);
                    }
                };
                audio.onerror = () => {
                    setIsPlaying(false);
                    setLoadingTrack(null);
                };

                await audio.play();
                setIsPlaying(true);
            } catch {
                // Autoplay blocked by browser — audio element is still loaded,
                // user can click play in the header to resume
                setLoadingTrack(null);
                setPendingResume(true);
            }
        })();
        // Only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const ids = queue.map((t) => t.id);

        if (ids.length === 0) {
return;
}

        checkBrowserCache(ids).then(setBrowserCached);
    }, [queue]);

    useEffect(() => {
        return () => {
            blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    const playTrack = useCallback(
        async (track: Track, index: number) => {
            const gen = ++generationRef.current;
            setPendingResume(false);

            audioRef.current?.pause();
            setLoadingTrack(track.id);

            try {
                const audioUrl = await fetchAndCacheAudio(track);

                if (gen !== generationRef.current) {
return;
}

                blobUrlsRef.current.set(track.id, audioUrl);
                setBrowserCached((prev) => new Set(prev).add(track.id));

                const audio = new Audio(audioUrl);
                audio.volume = muted ? 0 : volume;
                audioRef.current = audio;

                audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
                audio.ondurationchange = () => setDuration(audio.duration || 0);
                audio.oncanplay = () => setLoadingTrack(null);
                audio.onended = () => {
                    setIsPlaying(false);
                    const q = queueRef.current;
                    const idx = index >= 0 ? index : currentIndexRef.current;

                    if (idx >= 0 && idx < q.length - 1) {
                        const nextIdx = idx + 1;
                        setCurrentIndex(nextIdx);
                        playTrackRef.current(q[nextIdx], nextIdx);
                    }
                };
                audio.onerror = () => {
                    setIsPlaying(false);
                    setLoadingTrack(null);
                };

                await audio.play();
                setIsPlaying(true);
                setActiveTrack(track);
                setCurrentIndex(index >= 0 ? index : currentIndexRef.current);
            } catch {
                setIsPlaying(false);
                setLoadingTrack(null);
            }
        },
        [volume, muted],
    );

    const playTrackRef = useRef(playTrack);
    playTrackRef.current = playTrack;

    const togglePlay = useCallback(() => {
        if (!audioRef.current) {
return;
}

        setPendingResume(false);

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
    }, [isPlaying]);

    const resumePlayback = useCallback(() => {
        setPendingResume(false);
        togglePlay();
    }, [togglePlay]);

    const playFromQueue = useCallback(
        (index: number) => {
            const q = queueRef.current;
            const idx = currentIndexRef.current;

            if (index === idx) {
                togglePlay();
            } else {
                audioRef.current?.pause();
                setCurrentIndex(index);
                playTrack(q[index], index);
            }
        },
        [playTrack, togglePlay],
    );

    const removeFromQueue = useCallback(
        (index: number) => {
            setQueue((prev) => prev.filter((_, i) => i !== index));
            const idx = currentIndexRef.current;

            if (index === idx) {
                audioRef.current?.pause();
                setIsPlaying(false);
                setCurrentIndex(-1);
                setActiveTrack(null);
                setCurrentTime(0);
                setDuration(0);
            } else if (index < idx) {
                setCurrentIndex((prev) => prev - 1);
            }
        },
        [],
    );

    const skipNext = useCallback(() => {
        const q = queueRef.current;
        const idx = currentIndexRef.current;

        if (idx < q.length - 1) {
            const next = idx + 1;
            audioRef.current?.pause();
            setCurrentIndex(next);
            playTrack(q[next], next);
        }
    }, [playTrack]);

    const skipPrev = useCallback(() => {
        const q = queueRef.current;
        const idx = currentIndexRef.current;

        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
        } else if (idx > 0) {
            const prev = idx - 1;
            audioRef.current?.pause();
            setCurrentIndex(prev);
            playTrack(q[prev], prev);
        }
    }, [playTrack]);

    const setVolume = useCallback((v: number) => {
        setVolumeState(v);
        setMuted(false);

        if (audioRef.current) {
audioRef.current.volume = v;
}
    }, []);

    const toggleMute = useCallback(() => {
        if (!audioRef.current) {
return;
}

        if (muted) {
            audioRef.current.volume = volume || 0.8;
            setMuted(false);
        } else {
            audioRef.current.volume = 0;
            setMuted(true);
        }
    }, [muted, volume]);

    const seekTo = useCallback(
        (pct: number) => {
            if (!audioRef.current || !duration) {
return;
}

            audioRef.current.currentTime = pct * duration;
        },
        [duration],
    );

    const downloadAndPlayOnly = useCallback(
        async (track: Track) => {
            if (downloadingTracks.has(track.id)) {
return;
}

            setDownloadingTracks((prev) => new Set(prev).add(track.id));
            setLoadingTrack(track.id);
            audioRef.current?.pause();
            setIsPlaying(false);

            try {
                const audioUrl = await fetchAndCacheAudio(track);
                blobUrlsRef.current.set(track.id, audioUrl);
                setBrowserCached((prev) => new Set(prev).add(track.id));

                playTrack(track, -1);
            } catch (err) {
                console.error('Download failed:', err);
            } finally {
                setDownloadingTracks((prev) => {
                    const next = new Set(prev);
                    next.delete(track.id);

                    return next;
                });
                setLoadingTrack((prev) => (prev === track.id ? null : prev));
            }
        },
        [downloadingTracks, playTrack],
    );

    const downloadAndEnqueue = useCallback(
        async (track: Track) => {
            if (downloadingTracks.has(track.id)) {
return;
}

            if (queue.find((q) => q.id === track.id)) {
return;
}

            setDownloadingTracks((prev) => new Set(prev).add(track.id));
            setLoadingTrack(track.id);

            try {
                const audioUrl = await fetchAndCacheAudio(track);
                blobUrlsRef.current.set(track.id, audioUrl);
                setBrowserCached((prev) => new Set(prev).add(track.id));

                setQueue((prev) => {
                    if (prev.find((q) => q.id === track.id)) {
return prev;
}

                    return [...prev, track];
                });
            } catch (err) {
                console.error('Download failed:', err);
            } finally {
                setDownloadingTracks((prev) => {
                    const next = new Set(prev);
                    next.delete(track.id);

                    return next;
                });
                setLoadingTrack((prev) => (prev === track.id ? null : prev));
            }
        },
        [downloadingTracks, queue],
    );

    const fmt = useCallback((s: number) => {
        if (!s || !isFinite(s)) {
return '0:00';
}

        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);

        return `${m}:${sec.toString().padStart(2, '0')}`;
    }, []);

    const setKeybindings = useCallback((kb: Keybindings) => {
        setKeybindingsState(kb);
    }, []);

    // Global keybindings
    const keybindingsRef = useRef(keybindings);
    keybindingsRef.current = keybindings;
    const togglePlayRef = useRef(togglePlay);
    togglePlayRef.current = togglePlay;
    const skipNextRef = useRef(skipNext);
    skipNextRef.current = skipNext;
    const skipPrevRef = useRef(skipPrev);
    skipPrevRef.current = skipPrev;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;

            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable) {
                return;
            }

            const kb = keybindingsRef.current;

            if (e.type === 'keydown') {
                if (kb.playPause.includes(e.key)) {
                    e.preventDefault();
                    togglePlayRef.current();
                } else if (kb.prev.includes(e.key)) {
                    e.preventDefault();
                    skipPrevRef.current();
                } else if (kb.next.includes(e.key)) {
                    e.preventDefault();
                    skipNextRef.current();
                }
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <MusicPlayerContext.Provider
            value={{
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
                keybindings,
                setKeybindings,
                pendingResume,
                resumePlayback,
                playTrack,
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
            }}
        >
            {children}
        </MusicPlayerContext.Provider>
    );
}

export function useMusicPlayer() {
    const ctx = useContext(MusicPlayerContext);

    if (!ctx) {
throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
}

    return ctx;
}
