<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class ActiveSessionChecker
{
    /**
     * Whether the user currently has an active session on another device.
     */
    public function hasActiveSession(User $user, ?string $currentSessionId = null): bool
    {
        $stored = $user->current_session_id;

        if (empty($stored) || $stored === $currentSessionId) {
            return false;
        }

        $lifetime = (int) Config::get('session.lifetime', 120) * 60;
        $threshold = time() - $lifetime;

        $row = DB::table('sessions')
            ->where('id', $stored)
            ->where('last_activity', '>=', $threshold)
            ->first();

        if (! $row) {
            return false;
        }

        // Ensure it belongs to this user (sessions.user_id is the auth key).
        if (isset($row->user_id) && (string) $row->user_id !== (string) $user->getAuthIdentifier()) {
            return false;
        }

        return true;
    }
}
