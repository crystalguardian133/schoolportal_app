import { Head, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    getCurrentSubscription,
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
} from '@/lib/push-subscription';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/notifications';

type PushProps = {
    push?: {
        enabled: boolean;
        vapid_public_key: string | null;
    };
};

function Switch({
    checked,
    onCheckedChange,
    disabled,
    label,
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
                checked ? 'bg-primary' : 'bg-input',
            )}
        >
            <span
                className={cn(
                    'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-sm transition-transform',
                    checked ? 'translate-x-5' : 'translate-x-0.5',
                )}
            />
        </button>
    );
}

export default function Notifications() {
    const { push } = usePage<PushProps>().props;
    const supported = isPushSupported();
    const vapidKey = push?.vapid_public_key ?? null;
    const pushEnabled = Boolean(push?.enabled && vapidKey);

    const [permission, setPermission] = useState<NotificationPermission>(() =>
        typeof Notification !== 'undefined' ? Notification.permission : 'default',
    );
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [isInitialized, setIsInitialized] = useState(() => !isPushSupported());

    useEffect(() => {
        if (!supported) {
            return;
        }

        getCurrentSubscription()
            .then((subscription) => {
                setIsSubscribed(Boolean(subscription));
            })
            .finally(() => setIsInitialized(true));
    }, [supported]);

    const enableNotifications = useCallback(async () => {
        if (!vapidKey) {
            toast.error('Push notifications are not configured for this server.');

            return;
        }

        setIsBusy(true);

        try {
            const subscription = await subscribeToPush(
                vapidKey,
                navigator.userAgent.slice(0, 100),
            );

            if (!subscription) {
                setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'default');

                if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
                    toast.error(
                        'Notifications are blocked. Allow notifications for this site in your browser settings.',
                    );
                }

                return;
            }

            setPermission('granted');
            setIsSubscribed(true);
            toast.success('Notifications enabled. You will be alerted about new announcements.');
        } catch {
            toast.error('Could not enable notifications. Please try again.');
        } finally {
            setIsBusy(false);
        }
    }, [vapidKey]);

    const disableNotifications = useCallback(async () => {
        setIsBusy(true);

        try {
            await unsubscribeFromPush();
            setIsSubscribed(false);
            toast.success('Notifications disabled.');
        } catch {
            toast.error('Could not disable notifications. Please try again.');
        } finally {
            setIsBusy(false);
        }
    }, []);

    const enabled = permission === 'granted' && isSubscribed;
    const denied = permission === 'denied';

    return (
        <>
            <Head title="Notification settings" />

            <h1 className="sr-only">Notification settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Notifications"
                    description="Manage push notifications for this device"
                />

                <div className="space-y-10 rounded-3xl border border-sidebar-border/70 bg-white p-8 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                            Push notifications
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Get notified when new announcements are posted, even
                            when the portal is not open.
                        </p>
                    </div>

                    {!supported && (
                        <p className="text-sm text-muted-foreground">
                            Push notifications are not supported on this device
                            or browser.
                        </p>
                    )}

                    {!pushEnabled && supported && (
                        <p className="text-sm text-muted-foreground">
                            Push notifications are not available on this server.
                        </p>
                    )}

                    {supported && pushEnabled && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-foreground">
                                        Enable notifications
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {denied
                                            ? 'Notifications are blocked in this browser. Unblock them in your browser settings, then reload this page.'
                                            : enabled
                                              ? 'This device is subscribed to announcement notifications.'
                                              : 'This device is not receiving notifications yet.'}
                                    </p>
                                </div>

                                {!isInitialized ? null : (
                                    <Switch
                                        checked={enabled}
                                        disabled={denied || isBusy}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                void enableNotifications();
                                            } else {
                                                void disableNotifications();
                                            }
                                        }}
                                        label="Enable notifications"
                                    />
                                )}
                            </div>

                            {isBusy && (
                                <p className="text-sm text-muted-foreground">
                                    {enabled
                                        ? 'Unsubscribing…'
                                        : 'Requesting permission…'}
                                </p>
                            )}

                            {denied && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void enableNotifications()}
                                >
                                    Retry
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Notifications.layout = {
    breadcrumbs: [
        {
            title: 'Notification settings',
            href: edit(),
        },
    ],
};
