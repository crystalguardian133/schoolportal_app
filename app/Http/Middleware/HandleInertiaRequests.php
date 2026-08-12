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
            'unreadAnnouncementsCount' => $this->getUnreadAnnouncementsCount($user),
        ];
    }

    private function getUnreadAnnouncementsCount($user): int
    {
        if (! $user) {
            return 0;
        }

        $query = \App\Models\Announcement::query()
            ->where('created_at', '>=', now()->subDays(7));

        if (method_exists($user, 'hasRole') && $user->hasRole('student')) {
            $studentSection = $user->student?->section;
            $classSectionUuid = null;
            
            if ($studentSection) {
                $classSectionUuid = \App\Models\ClassSection::query()->where('name', $studentSection)->value('uuid');
            }

            $query->where(function ($builder) use ($studentSection, $classSectionUuid) {
                $builder->where('scope', 'system');
                
                if ($studentSection !== null) {
                    $builder->orWhere(function ($sectionQuery) use ($studentSection) {
                        $sectionQuery->where('scope', 'section')
                            ->where('section_name', $studentSection);
                    });
                }

                if ($classSectionUuid !== null) {
                    $builder->orWhere(function ($classQuery) use ($classSectionUuid) {
                        $classQuery->where('scope', 'class')
                            ->where('class_section_uuid', $classSectionUuid);
                    });
                }
            });
        }

        return $query->count();
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
