<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSystemLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (! $user || ! method_exists($user, 'hasRole') || (! $user->hasRole('admin') && ! $user->hasRole('principal') && ! $user->hasRole('registrar'))) {
            abort(403);
        }

        $search = trim((string) $request->query('q', ''));
        $perPage = max(10, min(100, (int) $request->query('per_page', 25)));

        $logs = DB::table('system_logs as logs')
            ->leftJoin('users as users', 'users.uuid', '=', 'logs.user_uuid')
            ->select([
                'logs.id',
                'logs.user_uuid',
                'users.name as user_name',
                'users.email as user_email',
                'logs.action',
                'logs.route_name',
                'logs.method',
                'logs.path',
                'logs.ip_address',
                'logs.user_agent',
                'logs.status_code',
                'logs.metadata',
                'logs.created_at',
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('logs.action', 'like', '%'.$search.'%')
                        ->orWhere('logs.route_name', 'like', '%'.$search.'%')
                        ->orWhere('logs.path', 'like', '%'.$search.'%')
                        ->orWhere('users.name', 'like', '%'.$search.'%')
                        ->orWhere('users.email', 'like', '%'.$search.'%')
                        ->orWhere('logs.ip_address', 'like', '%'.$search.'%');
                });
            })
            ->orderByDesc('logs.id')
            ->paginate($perPage)
            ->withQueryString();

        return inertia('admin/system-logs', [
            'logs' => $logs,
            'filters' => [
                'q' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }
}