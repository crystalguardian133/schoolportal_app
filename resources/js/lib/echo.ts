import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echo: Echo | null = null;

if (typeof Pusher !== 'undefined' && typeof Echo !== 'undefined') {
    (window as any).Pusher = Pusher;
    echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_REVERB_APP_KEY ?? 'local',
        wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
    });
}

export { echo as echoClient };