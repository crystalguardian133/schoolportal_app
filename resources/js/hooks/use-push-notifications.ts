import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import {
    getCurrentSubscription,
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
} from '@/lib/push-subscription';

type PushSharedProps = {
    push?: {
        enabled: boolean;
        vapid_public_key: string | null;
    };
};

export function usePushNotifications() {
    const { push } = usePage<PushSharedProps>().props;

    const supported = isPushSupported();
    const vapidPublicKey = push?.vapid_public_key ?? null;
    const pushEnabled = Boolean(push?.enabled && vapidPublicKey);

    const [permission, setPermission] = useState<NotificationPermission>(() =>
        typeof Notification !== 'undefined' ? Notification.permission : 'default',
    );
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [isInitialized, setIsInitialized] = useState(!supported);

    useEffect(() => {
        if (!supported) {
            return;
        }

        getCurrentSubscription()
            .then((subscription) => {
                const currentPermission =
                    typeof Notification !== 'undefined'
                        ? Notification.permission
                        : 'default';
                setIsSubscribed(Boolean(subscription));
                setPermission(currentPermission);

                if (
                    !subscription &&
                    currentPermission === 'granted' &&
                    pushEnabled &&
                    vapidPublicKey
                ) {
                    const key = vapidPublicKey as string;

                    return subscribeToPush(
                        key,
                        typeof navigator !== 'undefined'
                            ? navigator.userAgent.slice(0, 100)
                            : undefined,
                    ).then((newSubscription) => {
                        setIsSubscribed(Boolean(newSubscription));
                    });
                }

                return undefined;
            })
            .finally(() => setIsInitialized(true));
    }, [supported, pushEnabled, vapidPublicKey]);

    const enable = useCallback(async (): Promise<boolean> => {
        if (!pushEnabled || !vapidPublicKey) {
            return false;
        }

        if (
            typeof Notification !== 'undefined' &&
            Notification.permission === 'denied'
        ) {
            return false;
        }

        setIsBusy(true);

        const key: string = vapidPublicKey;

        try {
            const subscription = await subscribeToPush(
                key,
                typeof navigator !== 'undefined'
                    ? navigator.userAgent.slice(0, 100)
                    : undefined,
            );

            if (!subscription) {
                setPermission(
                    typeof Notification !== 'undefined'
                        ? Notification.permission
                        : 'default',
                );

                return false;
            }

            setPermission('granted');
            setIsSubscribed(true);

            return true;
        } catch {
            return false;
        } finally {
            setIsBusy(false);
        }
    }, [pushEnabled, vapidPublicKey]);

    const disable = useCallback(async () => {
        setIsBusy(true);

        try {
            await unsubscribeFromPush();
            setIsSubscribed(false);
        } finally {
            setIsBusy(false);
        }
    }, []);

    const enabled = permission === 'granted' && isSubscribed;
    const denied = permission === 'denied';

    return {
        supported,
        pushEnabled,
        enabled,
        denied,
        isBusy,
        isInitialized,
        isSubscribed,
        enable,
        disable,
    };
}