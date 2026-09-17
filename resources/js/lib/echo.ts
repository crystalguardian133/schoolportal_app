import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

/**
 * Single, lazily-created realtime connection for the whole app.
 *
 * Design notes (learned the hard way):
 * - `new Echo()` already connects (the Echo constructor calls
 *   `connector.connect()`), so callers must NEVER call `.connect()` again or
 *   a second socket is opened. All lifecycle goes through this module.
 * - The socket exists only while a user is authenticated. Guests (e.g. the
 *   login page) get no connection at all.
 * - Only the transport matching `VITE_REVERB_SCHEME` is offered. Offering
 *   `wss` against a non-TLS Reverb only produces doomed connection errors.
 * - Event names are namespaced by Echo with the default `App.Events`
 *   namespace, so listeners for `broadcastAs()` names MUST use a leading dot
 *   (e.g. `.listen('.AnnouncementCreated', ...)`).
 */

export type EchoStatus =
    | 'idle'
    | 'connecting'
    | 'connected'
    | 'unavailable'
    | 'failed'
    | 'closed';

let echo: Echo<'reverb'> | null = null;
let status: EchoStatus = 'idle';
const statusListeners = new Set<(status: EchoStatus) => void>();

const DEV = import.meta.env.DEV === true;

function devLog(...args: unknown[]): void {
    if (DEV) {
        console.debug('[echo]', ...args);
    }
}

function setStatus(next: EchoStatus): void {
    if (status === next) {
        return;
    }

    status = next;
    devLog('status ->', next);

    statusListeners.forEach((listener) => {
        try {
            listener(next);
        } catch {
            // ignore listener errors
        }
    });
}

type PusherConnection = {
    state: string;
    bind: (event: string, callback: (data?: unknown) => void) => void;
};

function pusherConnection(): PusherConnection | null {
    try {
        return (
            (echo as unknown as { connector?: { pusher?: { connection?: PusherConnection } } })
                ?.connector?.pusher?.connection ?? null
        );
    } catch {
        return null;
    }
}

function watchConnection(): void {
    const connection = pusherConnection();

    if (!connection) {
        return;
    }

    // Pusher states: initialized | connecting | connected | unavailable |
    // failed | disconnected. Anything else stays quiet in production; dev
    // gets a debug line via the status transitions above.
    connection.bind('connecting', () => setStatus('connecting'));
    connection.bind('connected', () => setStatus('connected'));
    connection.bind('unavailable', () => setStatus('unavailable'));
    connection.bind('failed', () => setStatus('failed'));
    connection.bind('disconnected', () => setStatus('closed'));
    connection.bind('error', (data) => {
        devLog('connection error', data);
    });
}

/**
 * Return the shared Echo instance, creating (and connecting) it on first use.
 * Returns null outside the browser or when the client library is missing.
 */
export function ensureEcho(): Echo<'reverb'> | null {
    if (echo) {
        return echo;
    }

    if (typeof window === 'undefined' || typeof Pusher === 'undefined') {
        return null;
    }

    (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

    // This Reverb server has no TLS (REVERB_SCHEME=http), so only the
    // matching transport is offered.
    const useTLS = (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https';

    if (
        DEV &&
        typeof window !== 'undefined' &&
        window.location.protocol === 'https:' &&
        !useTLS
    ) {
        // pusher-js forces TLS whenever the page itself is https
        // (shouldUseTLS ignores forceTLS:false), so a non-TLS Reverb can
        // never connect from here — e.g. the app opened through an ngrok
        // https tunnel while Reverb only listens as plain ws://localhost.
        // Fix: open the app over plain http(same machine), or expose Reverb
        // through its own TLS tunnel and point VITE_REVERB_* at it.
        console.warn(
            '[echo] page is https but VITE_REVERB_SCHEME is not "https": ' +
                'realtime cannot connect (browsers block ws:// on https pages ' +
                'and this Reverb has no TLS).',
        );
    }

    setStatus('connecting');

    echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY ?? 'local',
        wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        forceTLS: useTLS,
        enabledTransports: useTLS ? ['wss'] : ['ws'],
        disableStats: true,
    });

    devLog('created', {
        host: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
        port: import.meta.env.VITE_REVERB_PORT ?? 8080,
        useTLS,
    });

    watchConnection();

    return echo;
}

/**
 * Tear down the shared connection (e.g. on logout). Safe to call when idle.
 */
export function releaseEcho(): void {
    if (!echo) {
        setStatus('idle');

        return;
    }

    try {
        echo.disconnect();
    } catch {
        // ignore teardown errors
    }

    echo = null;
    setStatus('idle');
    devLog('released');
}

export function getEchoStatus(): EchoStatus {
    return status;
}

/** Subscribe to connection-status changes. Returns an unsubscribe function. */
export function subscribeEchoStatus(
    listener: (status: EchoStatus) => void,
): () => void {
    statusListeners.add(listener);

    return () => {
        statusListeners.delete(listener);
    };
}
