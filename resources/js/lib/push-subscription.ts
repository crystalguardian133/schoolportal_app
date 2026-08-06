type PushSubscriptionJson = {
    endpoint: string;
    expirationTime: number | null;
    keys: { auth: string; p256dh: string };
};

function xsrfToken(): string {
    return decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
    );
}

export function isPushSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!isPushSupported()) {
        return null;
    }

    const registration = await navigator.serviceWorker.getRegistration();

    return registration?.pushManager.getSubscription() ?? null;
}

function pushSubscriptionToJson(subscription: PushSubscription): PushSubscriptionJson {
    const { endpoint, expirationTime } = subscription;
    const keyData = subscription.toJSON() as {
        keys?: { auth?: string; p256dh?: string };
    };

    return {
        endpoint,
        expirationTime: expirationTime ?? null,
        keys: {
            auth: keyData.keys?.auth ?? '',
            p256dh: keyData.keys?.p256dh ?? '',
        },
    };
}

export async function subscribeToPush(vapidPublicKey: string, deviceName?: string): Promise<PushSubscription | null> {
    if (!isPushSupported()) {
        return null;
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        return null;
    }

    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
        return null;
    }

    const existing = await registration.pushManager.getSubscription();

    if (existing) {
        return existing;
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
    });

    const payload = {
        ...pushSubscriptionToJson(subscription),
        device_name: deviceName ?? null,
    };

    const response = await fetch('/push/subscriptions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': xsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('Failed to save push subscription');
    }

    return subscription;
}

export async function unsubscribeFromPush(): Promise<void> {
    if (!isPushSupported()) {
        return;
    }

    const subscription = await getCurrentSubscription();

    if (subscription) {
        const endpoint = subscription.endpoint;

        await subscription.unsubscribe();

        await fetch('/push/subscriptions', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': xsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ endpoint }),
        }).catch(() => {
            // ignore server errors when unsubscribing locally
        });
    }
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i += 1) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}
