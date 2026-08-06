import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    server: {
        host: '127.0.0.1',
        hmr: {
            host: '127.0.0.1',
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia({
            ssr: false,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        VitePWA({
            registerType: 'prompt',
            injectRegister: false,
            strategies: 'injectManifest',
            srcDir: 'resources/js/pwa',
            filename: 'sw.ts',
            outDir: 'public',
            buildBase: '/',
            scope: '/',
            injectManifest: {
                globPatterns: [
                    '**/*.{js,css,html,ico,png,svg,webp,woff,woff2}',
                ],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
            },
            manifest: {
                id: '/',
                name: 'Dulag National High School',
                short_name: 'DNHS Portal',
                description:
                    'Official school portal of Dulag National High School. Access grades, schedules, announcements and more.',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/dashboard',
                scope: '/',
                lang: 'en',
                categories: ['education'],
                icons: [
                    {
                        src: '/pwa-icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-icons/icon-maskable-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
                shortcuts: [
                    {
                        name: 'Dashboard',
                        short_name: 'Dashboard',
                        url: '/dashboard',
                        icons: [
                            {
                                src: '/pwa-icons/icon-192x192.png',
                                sizes: '192x192',
                                type: 'image/png',
                            },
                        ],
                    },
                    {
                        name: 'Announcements',
                        short_name: 'Announcements',
                        url: '/student/announcements',
                        icons: [
                            {
                                src: '/pwa-icons/icon-192x192.png',
                                sizes: '192x192',
                                type: 'image/png',
                            },
                        ],
                    },
                ],
            },
        }),
    ],
});
