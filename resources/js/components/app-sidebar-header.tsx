import { CalendarDays, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const [mounted, setMounted] = useState(false);
    const [now, setNow] = useState(() => new Date(0));

    useEffect(() => {
        setMounted(true);
        setNow(new Date());
    }, []);

    useEffect(() => {
        if (!mounted) {
            return;
        }

        const timer = window.setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => window.clearInterval(timer);
    }, [mounted]);

    const dateLabel = mounted ? now.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }) : 'Loading date';
    const timeLabel = mounted ? now.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
    }) : 'Loading time';
    const timeZoneLabel = mounted ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time') : 'Local time';

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="min-w-0 flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <div className="min-w-0">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            <div className="hidden items-center gap-3 rounded-full border border-sidebar-border/70 bg-sidebar px-3 py-2 shadow-sm sm:flex">
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70 md:text-sm">
                    <CalendarDays className="size-4 text-sidebar-foreground" />
                    <span className="font-medium text-sidebar-foreground">{dateLabel}</span>
                </div>
                <div className="h-4 w-px bg-sidebar-border/80" />
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70 md:text-sm">
                    <Clock3 className="size-4 text-sidebar-foreground" />
                    <span className="tabular-nums font-medium text-sidebar-foreground">{timeLabel}</span>
                </div>
                <div className="h-4 w-px bg-sidebar-border/80" />
                <span className="max-w-[170px] truncate text-xs text-sidebar-foreground/60">
                    {timeZoneLabel}
                </span>
            </div>
        </header>
    );
}
