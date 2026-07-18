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
        $adminPerms = DB::table('permissions')->where('name', '!=', 'Access Developer Dashboard')->pluck('id')->toArray();

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

        // Teacher role: teacher dashboard access + teacher-specific perms
        $teacherRoleId = $roleIds['teacher'] ?? $roleIds['TEACHER'] ?? null;
        if ($teacherRoleId) {
            $teacherPerms = DB::table('permissions')->whereIn('name', [
                'Access Teacher Dashboard',
                'View Grades',
                'Edit Grades',
                'View Schedules',
                'View Announcements',
                'Manage Announcements',
            ])->pluck('id')->toArray();
            foreach ($teacherPerms as $pid) {
                $rows[] = ['permission_uuid' => $pid, 'role_uuid' => $teacherRoleId];
            }
        }

        // Department Head role: department head dashboard + manage subjects/sections
        if (isset($roleIds['department-head'])) {
            $deptHeadPerms = DB::table('permissions')->whereIn('name', [
                'Access Department Head Dashboard',
                'Manage Subjects',
                'Manage Sections',
                'Assign Subjects',
                'Manage Schedules',
                'View Grades',
                'Edit Grades',
                'View Schedules',
                'View Announcements',
                'Manage Announcements',
            ])->pluck('id')->toArray();
            foreach ($deptHeadPerms as $pid) {
                $rows[] = ['permission_uuid' => $pid, 'role_uuid' => $roleIds['department-head']];
            }
        }

        // School Head role: school head dashboard + all admin perms (excluding developer)
        if (isset($roleIds['school-head'])) {
            $schoolHeadPerms = DB::table('permissions')->where('name', '!=', 'Access Developer Dashboard')->pluck('id')->toArray();
            foreach ($schoolHeadPerms as $pid) {
                $rows[] = ['permission_uuid' => $pid, 'role_uuid' => $roleIds['school-head']];
            }
        }

        // Developer role: developer dashboard access + music player
        $developerRoleId = $roleIds['developer'] ?? $roleIds['DEV'] ?? null;
        if ($developerRoleId) {
            $developerPermIds = DB::table('permissions')->whereIn('name', [
                'Access Developer Dashboard',
                'Access Music Player',
            ])->pluck('id')->toArray();
            foreach ($developerPermIds as $pid) {
                $rows[] = ['permission_uuid' => $pid, 'role_uuid' => $developerRoleId];
            }
        }

        if (!empty($rows)) {
            // Use insertOrIgnore to avoid duplicate key errors when seeding into an existing DB
            DB::table('permission_role')->insertOrIgnore($rows);
        }
    }
}