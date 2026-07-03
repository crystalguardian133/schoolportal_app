<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, $permission = null)
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        if ($user->hasPermission($permission)) {
            return $next($request);
        }

        abort(403);
    }
}
