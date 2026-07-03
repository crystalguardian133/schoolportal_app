<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, $roles = null)
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        $needles = is_string($roles) ? explode('|', $roles) : (array) $roles;

        foreach ($needles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        abort(403);
    }
}
