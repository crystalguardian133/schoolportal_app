<?php

namespace App\Http\Controllers;

use App\Mail\AccountUnlockMail;
use App\Models\User;
use App\Services\LoginThrottleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class AccountUnlockController extends Controller
{
    /**
     * Public unlock page. Staff with the "Unlock Accounts" permission get the
     * manual unlock table; everyone else (and guests) get the email-link form.
     */
    public function page(Request $request)
    {
        $user = $request->user();
        $canManage = $user && $user->hasPermission('Unlock Accounts');

        return Inertia::render('account-unlock', [
            'canManage' => $canManage,
            'lockedUsers' => $canManage
                ? User::query()
                    ->whereNotNull('locked_at')
                    ->orderBy('locked_at')
                    ->get(['uuid', 'name', 'email', 'failed_login_attempts', 'locked_at'])
                    ->map(fn (User $u) => [
                        'uuid' => $u->uuid,
                        'name' => $u->name,
                        'email' => $u->email,
                        'failed_login_attempts' => $u->failed_login_attempts,
                        'locked_at' => $u->locked_at?->toISOString(),
                    ])
                    ->all()
                : [],
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Email a one-time signed unlock link to the account owner.
     */
    public function sendLink(Request $request)
    {
        $ipKey = 'unlock-link:' . $request->ip();
        if (RateLimiter::tooManyAttempts($ipKey, 3)) {
            $seconds = RateLimiter::availableIn($ipKey);

            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => __('Too many unlock requests. Please try again in :seconds seconds.', ['seconds' => $seconds]),
            ]);
        }
        RateLimiter::hit($ipKey, 3600);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        $target = User::query()
            ->where('email', strtolower($validated['email']))
            ->first();

        if ($target && $target->locked_at !== null) {
            $link = URL::temporarySignedRoute(
                'account-unlock.link',
                now()->addMinutes(30),
                ['user' => $target->uuid],
            );

            Mail::to($target->email)->queue(new AccountUnlockMail($target->name, $link));
        }

        // Same response whether or not the account exists/ is locked —
        // do not leak account state to strangers.
        return back()->with('status', __('If that email belongs to a locked account, an unlock link has been sent. Check your inbox (valid for 30 minutes).'));
    }

    /**
     * Consume the emailed signed link and unlock the account.
     */
    public function unlockViaLink(Request $request, string $user)
    {
        $target = User::query()->where('uuid', $user)->firstOrFail();

        app(LoginThrottleService::class)->unlock($target);

        return redirect()->route('login')->with(
            'status',
            __('Your account has been unlocked. You can now sign in.'),
        );
    }

    /**
     * Manual unlock by permitted staff.
     */
    public function unlockManual(Request $request, string $uuid)
    {
        $actor = $request->user();

        if (!$actor || !$actor->hasPermission('Unlock Accounts')) {
            abort(403);
        }

        $target = User::query()->where('uuid', $uuid)->firstOrFail();
        app(LoginThrottleService::class)->unlock($target);

        return back()->with('success', __("Account unlocked for :name.", ['name' => $target->name]));
    }
}
