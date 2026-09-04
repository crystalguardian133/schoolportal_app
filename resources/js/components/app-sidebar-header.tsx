import { usePage } from '@inertiajs/react';
import { CalendarDays, Clock3, MapPin, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationBell } from '@/components/notification-bell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useMusicPlayer } from '@/contexts/music-player-context';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import type { Auth } from '@/types/auth';

function MarqueeTitle({ text }: { text: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [distance, setDistance] = useState(0);
    const [needsScroll, setNeedsScroll] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        const textEl = textRef.current;

        if (!container || !textEl) {
return;
}

        const measure = () => {
            const overflows = textEl.scrollWidth > container.clientWidth;
            setNeedsScroll(overflows);

            if (overflows) {
                setDistance(textEl.scrollWidth);
            }
        };
        measure();

        const ro = new ResizeObserver(measure);
        ro.observe(container);

        return () => ro.disconnect();
    }, [text]);

    return (
        <div ref={containerRef} className="marquee-wrap min-w-0 max-w-[260px]">
            <span
                ref={textRef}
                className="marquee-text text-xs font-medium text-sidebar-foreground"
                style={
                    needsScroll
                        ? {
                              '--marquee-distance': `-${distance}px`,
                              '--marquee-duration': `${Math.max(4, distance / 30)}s`,
                          } as React.CSSProperties
                        : undefined
                }
            >
                {text}
                {needsScroll && (
                    <>
                        {'\u00A0\u00A0\u2022\u00A0\u00A0'}
                        {text}
                    </>
                )}
            </span>
        </div>
    );
}

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const [mounted, setMounted] = useState(false);
    const [now, setNow] = useState(() => new Date(0));

    const { auth } = usePage<{ auth: Auth }>().props;
    const canUseMusic = auth.permissions.includes('access music player');

    const announcementsHref =
        auth.user?.role == 'teacher'
            ? '/teacher/announcements'
            : auth.user?.role == 'admin' ||
                    auth.user?.role == 'principal' ||
                    auth.user?.role == 'registrar' ||
                    auth.user?.role == 'staff'
                ? '/admin/announcements'
                : '/student/announcements';

    const {
        currentTrack,
        isPlaying,
        loadingTrack,
        pendingResume,
        togglePlay,
        resumePlayback,
        skipNext,
        skipPrev,
    } = useMusicPlayer();

    useEffect(() => {
        setMounted(true);
        setNow(new Date());
    }, []);

    useEffect(() => {
        if (!mounted) {
return;
}

        const timer = window.setInterval(() => setNow(new Date()), 1000);

        return () => window.clearInterval(timer);
    }, [mounted]);

    const dateLabel = mounted
        ? now.toLocaleDateString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : 'Loading date';
    const timeLabel = mounted
        ? now.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
          })
        : 'Loading time';

    const timeZoneLabel = mounted
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time'
        : 'Local time';

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-sidebar-border/50 px-3 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sm:px-6 md:px-4">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <div className="min-w-0">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
                {canUseMusic && currentTrack && (
                    <div className="flex items-center gap-2 rounded-full border border-sidebar-border/70 bg-sidebar px-3 py-2 shadow-sm">
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={skipPrev}
                                className="inline-flex size-6 items-center justify-center rounded text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground disabled:opacity-30"
                            >
                                <SkipBack className="size-3 fill-current" />
                            </button>
                            <button
                                type="button"
                                onClick={pendingResume ? resumePlayback : togglePlay}
                                disabled={!!loadingTrack}
                                className="inline-flex size-7 items-center justify-center rounded-full bg-sidebar-foreground text-sidebar transition-all hover:scale-105 disabled:opacity-50"
                            >
                                {loadingTrack ? (
                                    <span className="size-3 block animate-pulse rounded-sm bg-sidebar" />
                                ) : isPlaying ? (
                                    <Pause className="size-3 fill-current" />
                                ) : (
                                    <Play className="size-3 ml-0.5 fill-current" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={skipNext}
                                className="inline-flex size-6 items-center justify-center rounded text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
                            >
                                <SkipForward className="size-3 fill-current" />
                            </button>
                        </div>

                        <div className="h-4 w-px bg-sidebar-border/80" />

                        <MarqueeTitle text={currentTrack.title} />
                    </div>
                )}

                <NotificationBell viewAllHref={announcementsHref} />
                <div className="h-4 w-px bg-sidebar-border/80" />
                <div className="flex items-center gap-3 rounded-full border border-sidebar-border/70 bg-sidebar px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70 md:text-sm">
                        <CalendarDays className="size-4 text-sidebar-foreground" />
                        <span className="font-medium text-sidebar-foreground">
                            {dateLabel}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-sidebar-border/80" />
                    <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70 md:text-sm">
                        <Clock3 className="size-4 text-sidebar-foreground" />
                        <span className="font-medium text-sidebar-foreground tabular-nums">
                            {timeLabel}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-sidebar-border/80" />
                    <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/70 md:text-sm">
                        <MapPin className="size-3.5 text-sidebar-foreground" />
                        <span className="max-w-[160px] truncate font-medium text-sidebar-foreground">
                            {timeZoneLabel}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
