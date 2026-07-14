<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;
use Symfony\Component\Uid\Uuid;

class PermissionsTableSeeder extends Seeder
{
    public function run(): void
    {
        $perms = [
            'View Grades',
            'Edit Grades',
            'View Schedules',
            'Manage Users',
            'Access Admin',
            'Manage Roles',
            'Manage Subjects',
            'Assign Subject Teacher',
            'Assign Subjects',
            'Manage Sections',
            'Manage Assignments',
            'Manage Enrollments',
            'Bypass Enrollment Date',
            'School Year Bypass',
            'View Announcements',
            'Manage Announcements',
            'View Logs',
            'Create Teacher',
            'Access Teacher Dashboard',
            'Access Staff Dashboard',
            'Access Admin Dashboard',
            'Access Department Head Dashboard',
            'Access School Head Dashboard',
            'Manage Schedules',
        ];

        foreach ($perms as $permission) {
            // Create if missing; avoid changing primary keys on existing rows
            Permission::query()->firstOrCreate(
                ['name' => $permission],
                ['id' => Uuid::v7()->toRfc4122(), 'guard_name' => 'web']
            );
        }
    }
}
