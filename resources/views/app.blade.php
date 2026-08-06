<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

        <meta name="description" content="Official school portal of Dulag National High School.">
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)">

        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="DNHS Portal">
        <meta name="format-detection" content="telephone=no">

        <link rel="manifest" href="/manifest.webmanifest">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Detect client's public IPv4 and store in cookie for logging --}}
        <script>
            (function() {
                if (!document.cookie.includes('client_ipv4=')) {
                    fetch('https://api4.ipify.org?format=json')
                        .then(function(r) { return r.json(); })
                        .then(function(data) {
                            if (data && data.ip) {
                                document.cookie = 'client_ipv4=' + data.ip + ';path=/;max-age=86400;samesite=lax';
                            }
                        })
                        .catch(function() {});
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @php
            $usesLocalViteServer = in_array(request()->getHost(), ['127.0.0.1', 'localhost'], true);

            Vite::useHotFile(public_path($usesLocalViteServer ? 'hot' : 'hot.disabled'));
        @endphp

        @fonts

        @if ($usesLocalViteServer)
            @viteReactRefresh
        @endif
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
