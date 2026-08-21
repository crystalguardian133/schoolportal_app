<?php

namespace App\Services;

use App\Models\User;

class LoginThrottleService
{
    public const CAPTCHA_THRESHOLD = 2;
    public const LOCKOUT_THRESHOLD = 5;

    public function isLocked(?User $user): bool
    {
        return $user !== null && $user->locked_at !== null;
    }

    public function requiresCaptcha(?User $user): bool
    {
        return $user !== null
            && $user->locked_at === null
            && $user->failed_login_attempts >= self::CAPTCHA_THRESHOLD;
    }

    public function recordFailure(User $user): void
    {
        $attempts = $user->failed_login_attempts + 1;

        $user->forceFill([
            'failed_login_attempts' => $attempts,
            'locked_at' => $attempts >= self::LOCKOUT_THRESHOLD ? now() : $user->locked_at,
        ])->save();
    }

    public function recordSuccess(User $user): void
    {
        if ($user->failed_login_attempts > 0 || $user->locked_at !== null) {
            $user->forceFill([
                'failed_login_attempts' => 0,
                'locked_at' => null,
            ])->save();
        }
    }

    public function unlock(User $user): void
    {
        $user->forceFill([
            'failed_login_attempts' => 0,
            'locked_at' => null,
        ])->save();
    }
}
