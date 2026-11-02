<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureSingleSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $sessionId = $request->session()->getId();
        $forceClaim = (bool) $request->session()->pull('force_claim_session');

        // This session is explicitly claiming the account (fresh login).
        if ($forceClaim) {
            $user->forceFill(['current_session_id' => $sessionId])->save();
            $request->session()->put('single_session_bound', true);

            return $next($request);
        }

        // First-ever binding for this account.
        if ($user->current_session_id === null) {
            $user->forceFill(['current_session_id' => $sessionId])->save();
            $request->session()->put('single_session_bound', true);

            return $next($request);
        }

        // Same session that owns the account.
        if ($user->current_session_id === $sessionId) {
            $request->session()->put('single_session_bound', true);

            return $next($request);
        }

        // Another session has claimed this account -> invalidate this one.
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('session_conflict', true);
    }
}
