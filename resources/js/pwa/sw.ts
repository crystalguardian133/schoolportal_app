/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST, { ignoreURLParametersMatching: [/.*/] });
cleanupOutdatedCaches();

const APP_SHELL_FALLBACKS = ['/dashboard', '/login'];

const navigationHandler = async ({ request, event }: { request: Request; event: FetchEvent }) => {
    const networkFirst = new NetworkFirst({
        cacheName: 'pages',
        networkTimeoutSeconds: 3,
    });

    try {
        const response = await networkFirst.handle({ request, event });

        if (response && response.ok) {
            return response;
        }
    } catch {
        // Offline: fall through to cached app shell.
    }

    for (const fallbackUrl of APP_SHELL_FALLBACKS) {
        const cached = await caches.match(fallbackUrl);

        if (cached) {
            return cached;
        }
    }

    return Response.error();
};

registerRoute(
    ({ request }) => request.mode === 'navigate',
    navigationHandler,
);

const pageDataHandler = new NetworkFirst({
    cacheName: 'page-data',
    networkTimeoutSeconds: 3,
});

registerRoute(
    ({ request, sameOrigin }) =>
        sameOrigin &&
        request.method === 'GET' &&
        request.headers.get('X-Inertia') === 'true',
    pageDataHandler,
);

registerRoute(
    ({ sameOrigin, destination }) =>
        sameOrigin &&
        (destination === 'script' ||
            destination === 'style' ||
            destination === 'font' ||
            destination === 'image'),
    new StaleWhileRevalidate({
        cacheName: 'assets',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60,
            }),
        ],
    }),
);

type PushPayload = {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
    icon?: string;
    badge?: string;
    renotify?: boolean;
};

self.addEventListener('push', (event) => {
    let payload: PushPayload = {};

    try {
        payload = event.data?.json() ?? {};
    } catch {
        payload = {
            title: 'DNHS School Portal',
            body: event.data?.text() ?? '',
        };
    }

    const title = payload.title || 'DNHS School Portal';

    const options: NotificationOptions = {
        body: payload.body ?? '',
        icon: payload.icon ?? '/pwa-icons/icon-192x192.png',
        badge: payload.badge ?? '/pwa-icons/icon-192x192.png',
        data: { url: payload.url ?? '/dashboard' },
        tag: payload.tag,
        renotify: payload.tag ? Boolean(payload.renotify) : undefined,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url ?? '/dashboard';

    event.waitUntil(
        (async () => {
            const clientList = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true,
            });

            for (const client of clientList) {
                if ('navigate' in client) {
                    await client.navigate(targetUrl);

                    return client.focus();
                }
            }

            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })(),
    );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
