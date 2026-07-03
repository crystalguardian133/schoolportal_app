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
            'view grades',
            'edit grades',
            'view schedules',
            'manage users',
            'access admin',
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
