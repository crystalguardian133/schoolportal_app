<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $studentPerms = DB::table('permissions')->whereIn('name', ['View Grades', 'View Schedules', 'View Announcements'])->pluck('id')->toArray();
        $staffPerms = DB::table('permissions')->whereIn('name', ['View Grades', 'Edit Grades', 'View Schedules', 'View Announcements'])->pluck('id')->toArray();
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
        // Principal and registrar roles also get all admin permissions
        if (isset($roleIds['principal'])) {
            foreach ($adminPerms as $pid) {
                $rows[] = ['permission_uuid' => $pid, 'role_uuid' => $roleIds['principal']];
            }
        }
        if (isset($roleIds['registrar'])) {
            foreach ($adminPerms as $pid) {
                $rows[] = ['permission_uuid' => $pid, 'role_uuid' => $roleIds['registrar']];
            }
        }

        if (!empty($rows)) {
            // Use insertOrIgnore to avoid duplicate key errors when seeding into an existing DB
            DB::table('permission_role')->insertOrIgnore($rows);
        }
    }
}