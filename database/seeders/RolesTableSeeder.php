<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Symfony\Component\Uid\Uuid;

class RolesTableSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['student', 'staff', 'admin', 'registrar', 'principal'] as $name) {
            // Create if missing; do not attempt to update the primary key on existing rows
            Role::query()->firstOrCreate(
                ['name' => $name],
                ['id' => Uuid::v7()->toRfc4122(), 'guard_name' => 'web']
            );
        }
    }
}
