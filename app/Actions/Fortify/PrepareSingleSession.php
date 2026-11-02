<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Http\Request;

class PrepareSingleSession
{
    public function handle(Request $request, \Closure $next)
    {
        $response = $next($request);

        $user = $request->user();
        if ($user instanceof User && $request->hasSession()) {
            $user->forceFill(['current_session_id' => $request->session()->getId()])->save();
        }

        return $response;
    }
}
