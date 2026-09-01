<?php

// Suppress PHP warnings originating from vendor files (e.g. thecodingmachine/safe
// uses legacy type names like "resource" and "integer" that trigger E_WARNING on PHP 8.3+).
set_error_handler(function (int $errno, string $errstr, string $errfile): bool {
    if ($errno === E_WARNING && str_contains($errfile, DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR)) {
        return true; // Suppress: silently ignore warnings from vendor packages
    }
    return false; // Let PHP handle all other errors normally
});

use App\Http\Middleware\CacheStaticAssets;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LogSystemActivity;
use App\Http\Middleware\PermissionMiddleware;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->trustProxies(at: '*');

        $middleware->prepend(CacheStaticAssets::class);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            LogSystemActivity::class,
        ]);

        $middleware->alias([
            'permission' => PermissionMiddleware::class,
            'role' => RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();