import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function getStorageKey(uuid?: string | null) {
    return `announcements_seen_at${uuid ? `_${uuid}` : ''}`;
}

export function useAnnouncementRealtime(onAnnouncementsUpdate?: () => void) {
    const { props } = usePage<{
        auth?: { user?: { uuid?: string; role?: string | null } };
    }>();
    const role = props.auth?.user?.role;
    const userUuid = props.auth?.user?.uuid;
    const [unreadCount, setUnreadCount] = useState(0);
    const seenRef = useRef<number | null>(null);
    const skipToastRef = useRef(false);
    const lastTotalRef = useRef<number | null>(null);
    const lastUpdatedRef = useRef<string | null>(null);
    const toastIdRef = useRef<string | number | null>(null);
    const callbackRef = useRef(onAnnouncementsUpdate);

    // Update callback ref in an effect to avoid "ref during render" error
    useEffect(() => {
        callbackRef.current = onAnnouncementsUpdate;
    }, [onAnnouncementsUpdate]);

    const getRedirectUrl = useCallback(() => {
        switch (role) {
            case 'admin':
            case 'principal':
            case 'registrar':
            case 'staff':
                return '/admin/announcements';
            default:
                return '/student/announcements';
        }
    }, [role]);

    const markAsRead = useCallback(() => {
        seenRef.current = Date.now();

        if (typeof window !== 'undefined') {
            localStorage.setItem(
                getStorageKey(userUuid),
                String(seenRef.current),
            );
        }

        setUnreadCount(0);

        if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
        }
    }, [userUuid]);

    const checkNew = useCallback(async () => {
        if (seenRef.current === null) {
            return;
        }

        try {
            const since = new Date(seenRef.current).toISOString();
            const res = await fetch(
                `/announcements/new-count?since=${encodeURIComponent(since)}`,
            );

            if (!res.ok) {
                return;
            }

            const data = await res.json();

            if (typeof data.count !== 'number') {
                return;
            }

            if (data.count > 0 && !skipToastRef.current) {
                setUnreadCount(data.count);
            }

            if (
                callbackRef.current &&
                (data.total !== lastTotalRef.current ||
                    data.updated_at !== lastUpdatedRef.current)
            ) {
                lastTotalRef.current = data.total;
                lastUpdatedRef.current = data.updated_at;
                callbackRef.current();
            }
        } catch {
            // ignore network errors
        }
    }, []);

    // Initialize seenRef from localStorage and set skipToast flag
    useEffect(() => {
        if (seenRef.current === null) {
            const stored =
                typeof window !== 'undefined'
                    ? localStorage.getItem(getStorageKey(userUuid))
                    : null;
            seenRef.current = stored ? Number(stored) : Date.now();
        }

        // On announcements pages (when callback provided), reset seen timestamp to now
        // This prevents toasting for announcements already visible on the page
        if (onAnnouncementsUpdate && !skipToastRef.current) {
            seenRef.current = Date.now();

            if (typeof window !== 'undefined') {
                localStorage.setItem(
                    getStorageKey(userUuid),
                    String(seenRef.current),
                );
            }

            skipToastRef.current = true;
        }
    }, [userUuid, onAnnouncementsUpdate]);

    useEffect(() => {
        checkNew();
    }, [checkNew]);

    useEffect(() => {
        const interval = setInterval(checkNew, 60000);

        return () => clearInterval(interval);
    }, [checkNew]);

    useEffect(() => {
        if (unreadCount <= 0) {
            return;
        }

        if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
        }

        const message =
            unreadCount === 1
                ? '1 new announcement is posted. Please check the announcement page for details.'
                : `${unreadCount} new announcements are posted. Please check the announcement page for details.`;

        toastIdRef.current = toast.success(message, {
            duration: Infinity,
            action: {
                label: 'View',
                onClick: () => {
                    markAsRead();
                    window.location.href = getRedirectUrl();
                },
            },
        });
    }, [unreadCount, markAsRead, getRedirectUrl]);

    return { unreadCount, markAsRead };
}
