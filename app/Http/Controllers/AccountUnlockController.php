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
     * Public unlock page (request-a-link flow only). Staff unlock accounts
     * from the users directory (admin/users unlock action).
     */
    public function page(Request $request)
    {
        return Inertia::render('account-unlock', [
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

}
