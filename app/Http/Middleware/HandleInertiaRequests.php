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
        ];
    }

    private function getUserPermissions($user): array
    {
        $user->loadMissing('roles');

        $adminRoles = ['admin', 'principal', 'registrar', 'ADMINISTRATOR', 'school-head'];
        $userRoles = $user->roles->pluck('name')->map(fn ($name) => strtolower($name))->toArray();
        $hasAdminRole = !empty(array_intersect($userRoles, array_map('strtolower', $adminRoles)));

        if ($hasAdminRole) {
            return ['manage users', 'manage roles', 'manage subjects', 'manage sections', 'manage assignments', 'manage enrollments', 'manage announcements', 'manage schedules', 'view logs', 'view announcements', 'access admin', 'assign subjects', 'access admin dashboard', 'access school head dashboard'];
        }

        $permissions = $user->getAllPermissions()->pluck('name')->map(fn ($name) => strtolower($name))->unique()->values();

        // "Access Admin" permission grants all permissions
        if ($permissions->contains('access admin')) {
            return ['manage users', 'manage roles', 'manage subjects', 'manage sections', 'manage assignments', 'manage enrollments', 'manage announcements', 'manage schedules', 'view logs', 'view announcements', 'access admin', 'assign subjects', 'access admin dashboard', 'access school head dashboard'];
        }

        return $permissions->toArray();
    }
}