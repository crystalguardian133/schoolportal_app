import { usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';

export type NotificationRow = {
    uuid: string;
    title: string;
    body: string;
    scope: 'system' | 'class' | 'section';
    target_label: string;
    created_by?: string | null;
    created_at: string | null;
    image_url: string | null;
    seen: boolean;
};

function xsrfToken(): string {
    return decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
    );
}

function jsonHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-XSRF-TOKEN': xsrfToken(),
        'X-Requested-With': 'XMLHttpRequest',
    };
}

export function useNotifications() {
    const { props } = usePage<{ unreadAnnouncementsCount?: number }>();
    const [notifications, setNotifications] = useState<NotificationRow[]>([]);
    const [unread, setUnread] = useState(
        Math.max(props.unreadAnnouncementsCount ?? 0, 0),
    );
    const [loaded, setLoaded] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/announcements/recent', {
                headers: { Accept: 'application/json' },
            });

            if (!res.ok) {
                return;
            }

            const data = (await res.json()) as {
                notifications?: NotificationRow[];
            };

            const list = data.notifications ?? [];
            setNotifications(list);
            setUnread(list.filter((n) => !n.seen).length);
            setLoaded(true);
        } catch {
            // ignore network errors; the badge falls back to the prop value
        }
    }, []);

    const markSeen = useCallback(
        async (uuids?: string[]) => {
            try {
                await fetch('/announcements/seen', {
                    method: 'POST',
                    headers: jsonHeaders(),
                    body: JSON.stringify({ uuids: uuids ?? [] }),
                });
            } catch {
                // ignore network errors; update locally too
            }

            const seen = new Set(uuids ?? []);
            const markAll = seen.size === 0;

            setNotifications((list) => {
                const updated = list.map((n) =>
                    markAll || seen.has(n.uuid)
                        ? { ...n, seen: true }
                        : n,
                );

                setUnread(updated.filter((n) => !n.seen).length);

                return updated;
            });
        },
        [],
    );

    return { notifications, unread, loaded, refresh, markSeen };
}