<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'permissions' => $user ? $this->getUserPermissions($user) : [],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'push' => [
                'enabled' => (bool) config('push.enabled'),
                'vapid_public_key' => config('push.vapid.public_key'),
            ],
        ];
    }

    private function getUserPermissions($user): array
    {
        $user->loadMissing('roles.permissions');

        return $user->getAllPermissions()
            ->pluck('name')
            ->map(fn ($name) => strtolower($name))
            ->unique()
            ->values()
            ->toArray();
    }
}
