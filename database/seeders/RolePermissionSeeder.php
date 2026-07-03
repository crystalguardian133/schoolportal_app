<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $studentPerms = DB::table('permissions')->whereIn('name', ['view grades', 'view schedules'])->pluck('id')->toArray();
        $staffPerms = DB::table('permissions')->whereIn('name', ['view grades', 'edit grades', 'view schedules'])->pluck('id')->toArray();
        $adminPerms = DB::table('permissions')->pluck('id')->toArray();

        $roleIds = DB::table('roles')->pluck('id', 'name');

        $rows = [];

        foreach ($studentPerms as $pid) {
            $rows[] = ['permission_uuid' => $pid, 'role_uuid' => $roleIds['student']];
        }
        foreach ($staffPerms as $pid) {
            $rows[] = ['permission_uuid' => $pid, 'role_uuid' => $roleIds['staff']];
        }
        foreach ($adminPerms as $pid) {
            $rows[] = ['permission_uuid' => $pid, 'role_uuid' => $roleIds['admin']];
        }

        if (!empty($rows)) {
            // Use insertOrIgnore to avoid duplicate key errors when seeding into an existing DB
            DB::table('permission_role')->insertOrIgnore($rows);
        }
    }
}
