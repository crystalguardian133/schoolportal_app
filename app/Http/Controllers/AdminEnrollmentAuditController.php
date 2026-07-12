<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminEnrollmentAuditController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();

        $hasPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage enrollments');
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasPermission && ! $hasRole)) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $audits = DB::table('enrollment_audits')
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 25))
            ->withQueryString();

        return inertia('admin/enrollment-audits', [
            'audits' => $audits,
        ]);
    }
}