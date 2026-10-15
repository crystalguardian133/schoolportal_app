<?php

namespace App\Support;

/**
 * Single source of truth for which dashboard sections a user may see.
 * Used by DashboardController (payloads) and shared page props (settings UI
 * gating), so the two can never disagree about visibility.
 */
class DashboardSections
{
    /**
     * @return array<string, string> permission (lowercase) => section method
     */
    public const ORDER = [
        'access school head dashboard' => 'schoolHeadSection',
        'access admin dashboard' => 'adminSection',
        'access department head dashboard' => 'departmentHeadSection',
        'access teacher dashboard' => 'teacherSection',
        'access staff dashboard' => 'staffSection',
        'access developer dashboard' => 'developerSection',
    ];

    /**
     * @return array<string, string> permission (lowercase) => section key
     */
    public const KEYS = [
        'access school head dashboard' => 'school-head',
        'access admin dashboard' => 'admin',
        'access department head dashboard' => 'department-head',
        'access teacher dashboard' => 'teacher',
        'access staff dashboard' => 'staff',
        'access developer dashboard' => 'developer',
    ];

    /**
     * Section keys (e.g. ['teacher'], ['admin','teacher']) this user may see.
     * Query-free beyond already-loaded relations.
     *
     * @param mixed $user
     * @return string[]
     */
    public static function keysFor($user): array
    {
        if (! $user) {
            return [];
        }

        $keys = [];

        $permissions = method_exists($user, 'getAllPermissions')
            ? $user->getAllPermissions()->pluck('name')->map(fn ($n) => strtolower($n))
            : collect();

        foreach (self::KEYS as $permission => $key) {
            if ($permissions->contains($permission)) {
                $keys[] = $key;
            }
        }

        if (method_exists($user, 'hasRole') && $user->hasRole('student')) {
            $keys[] = 'student';
        }

        return array_values(array_unique($keys));
    }
}
