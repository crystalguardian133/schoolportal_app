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

        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');

        $query = DB::table('system_logs as logs')
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
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('logs.action', 'like', '%'.$search.'%')
                        ->orWhere('logs.route_name', 'like', '%'.$search.'%')
                        ->orWhere('logs.path', 'like', '%'.$search.'%')
                        ->orWhere('users.name', 'like', '%'.$search.'%')
                        ->orWhere('users.email', 'like', '%'.$search.'%');
                });
            })
            ->when($dateFrom, function ($q) use ($dateFrom) {
                $q->whereDate('logs.created_at', '>=', $dateFrom);
            })
            ->when($dateTo, function ($q) use ($dateTo) {
                $q->whereDate('logs.created_at', '<=', $dateTo);
            })
            ->orderBy($sortColumn, $sortDir);

        if ($request->query('export') === 'csv') {
            $logsForExport = $query->get();
            
            $headers = [
                'Content-type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename=system_logs_' . date('Y-m-d_H-i-s') . '.csv',
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            $callback = function () use ($logsForExport) {
                $file = fopen('php://output', 'w');
                fputcsv($file, ['ID', 'User Name', 'User Email', 'Action', 'Route', 'Method', 'Path', 'Status', 'IP Address', 'Date']);

                foreach ($logsForExport as $log) {
                    fputcsv($file, [
                        $log->id,
                        $log->user_name ?? 'System',
                        $log->user_email ?? 'N/A',
                        $log->action,
                        $log->route_name,
                        $log->method,
                        $log->path,
                        $log->status_code,
                        $log->ip_address,
                        $log->created_at,
                    ]);
                }
                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        }

        $logs = $query->paginate($perPage)->withQueryString();

        return inertia('admin/system-logs', [
            'logs' => $logs,
            'filters' => [
                'q' => $search,
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }
}