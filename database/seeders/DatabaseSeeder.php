<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
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
            CommonAddressSeeder::class,
        ]);

        // User::factory(10)->create();

        $student = User::query()->firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test Student',
                'password' => bcrypt('password'),
            ]
        );

        if (empty($student->uuid)) {
            $student->uuid = Uuid::v7()->toRfc4122();
            $student->save();
        }

        $student->assignRole('student');

        $staff = User::query()->firstOrCreate(
            ['email' => 'teacher@example.com'],
            [
                'name' => 'Test Staff',
                'password' => bcrypt('password'),
            ]
        );

        if (empty($staff->uuid)) {
            $staff->uuid = Uuid::v7()->toRfc4122();
            $staff->save();
        }

        $staff->assignRole('staff');

        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'password' => bcrypt('password'),
            ]
        );

        if (empty($admin->uuid)) {
            $admin->uuid = Uuid::v7()->toRfc4122();
            $admin->save();
        }

        $admin->assignRole('admin');

        $registrar = User::query()->firstOrCreate(
            ['email' => 'registrar@example.com'],
            [
                'name' => 'Registrar',
                'password' => bcrypt('password'),
            ]
        );

        if (empty($registrar->uuid)) {
            $registrar->uuid = Uuid::v7()->toRfc4122();
            $registrar->save();
        }

        $registrar->assignRole('registrar');

        // Seed subjects after users so we can assign teachers by user UUID when needed.
        $this->call([
            SubjectsTableSeeder::class,
            AssignSubjectTeachersSeeder::class,
            StudentEnrollmentSeeder::class,
        ]);
    }
}
