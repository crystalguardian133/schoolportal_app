<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminEnrollmentAuditController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (! $user || ! method_exists($user, 'hasRole') || (! $user->hasRole('admin') && ! $user->hasRole('principal') && ! $user->hasRole('registrar'))) {
            abort(403);
        }

        $audits = DB::table('enrollment_audits')
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 25))
            ->withQueryString();

        return inertia('admin/enrollment-audits', [
            'audits' => $audits,
        ]);
    }
}
