import { router } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { echoClient } from '@/lib/echo';

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

type AnnouncementsContextValue = {
    notifications: NotificationRow[];
    unread: number;
    loaded: boolean;
    refresh: () => Promise<void>;
    markSeen: (uuids?: string[]) => Promise<void>;
    registerUpdateListener: (listener: () => void) => () => void;
};

const AnnouncementsContext = createContext<AnnouncementsContextValue | null>(
    null,
);

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

function isAnnouncementsPage(url: string): boolean {
    return url.includes('/announcements');
}

function getAnnouncementsHref(role?: string | null): string {
    switch (role) {
        case 'teacher':
            return '/teacher/announcements';
        case 'student':
            return '/student/announcements';
        default:
            return '/admin/announcements';
    }
}

type AnnouncementsProviderProps = {
    children: ReactNode;
    initialUnreadCount?: number;
    initialUrl: string;
    role?: string | null;
    authenticated: boolean;
};

export function AnnouncementsProvider({
    children,
    initialUnreadCount = 0,
    initialUrl = '/',
    role = null,
    authenticated = false,
}: AnnouncementsProviderProps) {
    const [notifications, setNotifications] = useState<NotificationRow[]>([]);
    const [unread, setUnread] = useState(
        Math.max(initialUnreadCount ?? 0, 0),
    );
    const [loaded, setLoaded] = useState(false);

    const urlRef = useRef(initialUrl);
    const listenersRef = useRef<Set<() => void>>(new Set());
    const toastIdRef = useRef<string | number | null>(null);
    const pendingToastRef = useRef(false);

    // Keep track of the current URL across client-side navigations so the
    // provider can decide whether to toast (not on announcements pages).
    useEffect(() => {
        const removeNavigateListener = router.on('navigate', (event) => {
            urlRef.current = event.detail.page.url;
        });

        return removeNavigateListener;
    }, []);

    const notifyListeners = useCallback(() => {
        listenersRef.current.forEach((listener) => {
            try {
                listener();
            } catch {
                // ignore listener errors
            }
        });
    }, []);

    const registerUpdateListener = useCallback((listener: () => void) => {
        listenersRef.current.add(listener);

        return () => {
            listenersRef.current.delete(listener);
        };
    }, []);

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
            // ignore network errors
        }
    }, []);

    const markSeen = useCallback(async (uuids?: string[]) => {
        try {
            await fetch('/announcements/seen', {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({ uuids: uuids ?? [] }),
            });
        } catch {
            // ignore network errors; update optimistically below too
        }

        const seen = new Set(uuids ?? []);
        const markAll = seen.size === 0;

        setNotifications((list) => {
            const updated = list.map((n) =>
                markAll || seen.has(n.uuid) ? { ...n, seen: true } : n,
            );

            setUnread(updated.filter((n) => !n.seen).length);

            return updated;
        });
    }, []);

    // WebSocket is the single notification source: it only signals "something
    // changed"; the server-side /announcements/recent list is re-fetched to
    // stay in sync with per-user visibility and seen state.
    useEffect(() => {
        if (!echoClient || !authenticated) {
            return;
        }

        const channel = echoClient.channel('announcements');

        channel
            .listen('AnnouncementCreated', () => {
                pendingToastRef.current = !isAnnouncementsPage(urlRef.current);
                notifyListeners();
                refresh();
            })
            .error(() => {
                // socket errors have no fallback now; the WS is the trigger
            });

        echoClient.connect();

        return () => {
            echoClient.leave('announcements');
        };
    }, [authenticated, refresh, notifyListeners]);

    // Keep the sticky toast in sync with the live unread count.
    useEffect(() => {
        if (!pendingToastRef.current) {
            return;
        }

        if (unread <= 0) {
            pendingToastRef.current = false;

            if (toastIdRef.current) {
                toast.dismiss(toastIdRef.current);
                toastIdRef.current = null;
            }

            return;
        }

        if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
        }

        const message =
            unread === 1
                ? '1 new announcement is posted. Please check the announcement page for details.'
                : `${unread} new announcements are posted. Please check the announcement page for details.`;

        toastIdRef.current = toast.success(message, {
            duration: Infinity,
            action: {
                label: 'View',
                onClick: () => {
                    markSeen();
                    router.visit(getAnnouncementsHref(role));
                },
            },
        });
    }, [unread, role, markSeen]);

    const value = useMemo<AnnouncementsContextValue>(
        () => ({
            notifications,
            unread,
            loaded,
            refresh,
            markSeen,
            registerUpdateListener,
        }),
        [notifications, unread, loaded, refresh, markSeen, registerUpdateListener],
    );

    return (
        <AnnouncementsContext.Provider value={value}>
            {children}
        </AnnouncementsContext.Provider>
    );
}

export function useAnnouncements(options?: {
    onUpdate?: () => void;
    markSeenOnMount?: boolean;
}): AnnouncementsContextValue {
    const context = useContext(AnnouncementsContext);

    if (!context) {
        throw new Error(
            'useAnnouncements must be used within an AnnouncementsProvider',
        );
    }

    const { onUpdate, markSeenOnMount } = options ?? {};
    const onUpdateRef = useRef(onUpdate);
    const markSeenRef = useRef(context.markSeen);

    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        markSeenRef.current = context.markSeen;
    }, [context.markSeen]);

    useEffect(() => {
        if (!onUpdateRef.current) {
            return;
        }

        return context.registerUpdateListener(() => {
            onUpdateRef.current?.();
        });
    }, [context]);

    // Run once on mount only. Depending on `context` here would re-fire on
    // every markSeen() state update, causing a loop of POST /announcements/seen.
    useEffect(() => {
        if (markSeenOnMount) {
            markSeenRef.current();
        }
    }, [markSeenOnMount]);

    return context;
}