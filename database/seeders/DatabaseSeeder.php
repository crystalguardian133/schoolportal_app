<?php

namespace Database\Seeders;

use App\Models\SchoolYear;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\Uid\Uuid;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesTableSeeder::class,
            PermissionsTableSeeder::class,
            RolePermissionSeeder::class,
        ]);

        SchoolYear::firstOrCreate(
            ['name' => '2025-2026'],
            [
                'start_date' => '2025-06-01',
                'end_date' => '2026-03-31',
                'status' => 'active',
            ],
        );

        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        if (empty($admin->uuid)) {
            $admin->uuid = Uuid::v7()->toRfc4122();
            $admin->save();
        }

        $admin->assignRole('admin');
    }
}
