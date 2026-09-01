<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CacheStaticAssets
{
    /**
     * Hashed, immutable build assets (fingerprinted filenames).
     */
    protected const IMMUTABLE_PREFIXES = [
        '/build/',
        '/react-refresh',
    ];

    /**
     * Assets that may change but are safe to cache for a short while.
     */
    protected const CACHED_FILES = [
        '/manifest.webmanifest',
        '/favicon.ico',
        '/favicon.svg',
        '/apple-touch-icon.png',
        '/robots.txt',
        '/fonts-manifest.json',
        '/fonts-manifest.dev.json',
    ];

    /**
     * Add sane Cache-Control headers so the browser caches static assets.
     * Hashed build files get a long, immutable lifetime; everything else in
     * the static list gets a short-lived cache. The HTML shell and sw.js are
     * intentionally left untouched (must always be revalidated).
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if ($response instanceof Response
            && $response->headers->has('Cache-Control')) {
            return $response;
        }

        if (!($response instanceof Response) || $response->getStatusCode() >= 400) {
            return $response;
        }

        $path = $request->getPathInfo();

        if ($this->matchesAny($path, self::IMMUTABLE_PREFIXES)) {
            $response->headers->set('Cache-Control', 'public, max-age=31536000, immutable');
            $response->headers->set('Pragma', 'public');
        } elseif (in_array($path, self::CACHED_FILES, true)) {
            $response->headers->set('Cache-Control', 'public, max-age=86400');
            $response->headers->set('Pragma', 'public');
        }

        return $response;
    }

    protected function matchesAny(string $path, array $prefixes): bool
    {
        foreach ($prefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }
}