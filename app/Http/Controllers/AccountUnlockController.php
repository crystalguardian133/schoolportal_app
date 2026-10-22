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
     * Public request-a-link page for locked-out users. Staff holding the
     * "unlock accounts" permission get the locked-accounts directory instead.
     */
    public function page(Request $request)
    {
        if ($this->canUnlock($request)) {
            $search = trim((string) $request->query('search', ''));
            $perPage = (int) $request->query('per_page', 10);
            $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;

            $query = User::query()
                ->select(['id', 'uuid', 'name', 'email', 'profile_picture', 'failed_login_attempts', 'locked_at', 'created_at'])
                ->whereNotNull('locked_at');

            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $users = $query
                ->orderByDesc('locked_at')
                ->paginate($perPage)
                ->withQueryString();

            return Inertia::render('admin/unlock-accounts', [
                'users' => $users,
                'filters' => [
                    'search' => $search ?: null,
                    'per_page' => (string) $perPage,
                ],
                'stats' => [
                    'locked' => User::query()->whereNotNull('locked_at')->count(),
                ],
            ]);
        }

        return Inertia::render('account-unlock', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Unlock an account from the staff directory (requires "unlock accounts").
     */
    public function unlock(Request $request, string $uuid)
    {
        abort_unless($this->canUnlock($request), 403);

        $target = User::query()->where('uuid', $uuid)->firstOrFail();

        app(LoginThrottleService::class)->unlock($target);

        return back()->with('success', "Account unlocked for {$target->name}.");
    }

    private function canUnlock(Request $request): bool
    {
        $user = $request->user();

        return $user !== null
            && method_exists($user, 'hasPermission')
            && $user->hasPermission('unlock accounts');
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
