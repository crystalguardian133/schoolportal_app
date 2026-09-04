import { router } from '@inertiajs/react';
import { Bell, Check, ChevronRight, Megaphone } from 'lucide-react';
import { useCallback, useState } from 'react';
import { AnnouncementModal } from '@/components/announcement-modal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';
import type { NotificationRow } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

type NotificationBellProps = {
    viewAllHref: string;
    align?: 'start' | 'center' | 'end';
    side?: 'top' | 'right' | 'bottom' | 'left';
    sideOffset?: number;
    className?: string;
    iconClassName?: string;
};

function formatTimestamp(iso: string | null): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);
    const now = new Date();
    const yesterday = new Date(Date.now() - 86_400_000);

    if (date.toDateString() === now.toDateString()) {
        return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }

    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function NotificationBell({
    viewAllHref,
    align = 'end',
    side = 'bottom',
    sideOffset = 8,
    className,
    iconClassName,
}: NotificationBellProps) {
    const { notifications, unread, loaded, refresh, markSeen } =
        useNotifications();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<NotificationRow | null>(null);

    const handleOpenChange = useCallback(
        async (nextOpen: boolean) => {
            setOpen(nextOpen);

            if (nextOpen && !loaded) {
                await refresh();
            }
        },
        [loaded, refresh],
    );

    function openAnnouncement(announcement: NotificationRow) {
        setSelected(announcement);
        markSeen([announcement.uuid]);
        setOpen(false);
    }

    return (
        <>
            <DropdownMenu open={open} onOpenChange={handleOpenChange}>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
                        className={cn(
                            'relative inline-flex size-8 items-center justify-center rounded-full text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                            className,
                        )}
                    >
                        <Bell className={cn('size-4', iconClassName)} />
                        {unread > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold leading-none text-white ring-1 ring-sidebar">
                                {unread > 9 ? '9+' : unread}
                            </span>
                        )}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align={align}
                    side={side}
                    sideOffset={sideOffset}
                    className="w-[21rem] overflow-hidden"
                >
                    <div className="flex items-center gap-2 border-b border-sidebar-border/70 px-3 py-2">
                        <Megaphone className="size-4 shrink-0 text-amber-600" />
                        <span className="text-sm font-semibold">Notifications</span>
                        {unread > 0 && (
                            <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                                {unread} unread
                            </span>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <Bell className="mx-auto size-6 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                No announcements yet.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[18rem] overflow-y-auto px-1">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.uuid}
                                    type="button"
                                    onClick={() =>
                                        openAnnouncement(notification)
                                    }
                                    className="flex w-full items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent/70 focus:bg-accent focus:text-accent-foreground focus:outline-none"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate text-[13px] font-medium text-foreground dark:text-sidebar-foreground">
                                                {notification.title}
                                            </span>
                                            {!notification.seen && (
                                                <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                                            )}
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-muted-foreground dark:text-sidebar-foreground/70">
                                            {formatTimestamp(
                                                notification.created_at,
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            router.get(viewAllHref);
                        }}
                        className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-sidebar-border/70 px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/70"
                    >
                        <Check className="size-4 shrink-0" />
                        <span className="flex-1 text-left">View all announcements</span>
                        <ChevronRight className="size-4 shrink-0" />
                    </button>
                </DropdownMenuContent>
            </DropdownMenu>

            {selected && (
                <AnnouncementModal
                    announcement={selected}
                    open={!!selected}
                    onOpenChange={(nextOpen) =>
                        !nextOpen && setSelected(null)
                    }
                />
            )}
        </>
    );
}