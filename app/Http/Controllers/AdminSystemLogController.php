<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSystemLogController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();

        $hasPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('view logs');
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasPermission && ! $hasRole)) {
            abort(403);
        }
    }

    private array $allowedSortColumns = [
        'created_at',
        'action',
        'method',
        'status_code',
        'route_name',
    ];

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $search = trim((string) $request->query('q', ''));
        $perPage = max(10, min(100, (int) $request->query('per_page', 25)));
        $sortBy = (string) $request->query('sort_by', 'created_at');
        $sortDir = strtolower((string) $request->query('sort_dir', 'desc'));

        if (! in_array($sortBy, $this->allowedSortColumns)) {
            $sortBy = 'created_at';
        }

        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';
        $sortColumn = $sortBy === 'created_at' ? 'logs.id' : "logs.{$sortBy}";

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
                        ->orWhere('users.email', 'like', '%'.$search.'%');
                });
            })
            ->orderBy($sortColumn, $sortDir)
            ->paginate($perPage)
            ->withQueryString();

        return inertia('admin/system-logs', [
            'logs' => $logs,
            'filters' => [
                'q' => $search,
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
        ]);
    }
}