<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminIdCardController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();

        $hasPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage users');
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasPermission && ! $hasRole)) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $type = $request->query('type', 'student');
        $q = trim((string) $request->query('q', ''));
        $perPage = (int) $request->query('per_page', 50);

        $users = DB::table('users as u')
            ->leftJoin('students', 'students.user_uuid', '=', 'u.uuid')
            ->leftJoin('role_user', 'role_user.user_uuid', '=', 'u.uuid')
            ->leftJoin('roles', 'roles.id', '=', 'role_user.role_uuid')
            ->select([
                'u.uuid',
                'u.name',
                'u.email',
                'u.profile_picture',
                'students.student_id',
                'students.lrn',
                'students.section',
                'students.grade_level',
            ]);

        if ($type === 'staff') {
            $users->whereIn('roles.name', ['staff', 'teacher', 'admin', 'principal', 'registrar']);
        } else {
            $users->where('roles.name', 'student');
        }

        if ($q !== '') {
            $users->where(function ($query) use ($q) {
                $query->where('u.name', 'like', "%{$q}%")
                    ->orWhere('students.student_id', 'like', "%{$q}%")
                    ->orWhere('students.lrn', 'like', "%{$q}%")
                    ->orWhere('u.email', 'like', "%{$q}%");
            });
        }

        $users = $users->orderBy('u.name')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/id-cards', [
            'users' => $users,
            'filters' => [
                'type' => $type,
                'q' => $q,
                'per_page' => $perPage,
            ],
        ]);
    }
}