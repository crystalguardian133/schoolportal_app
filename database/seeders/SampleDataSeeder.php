<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\Uid\Uuid;

class SampleDataSeeder extends Seeder
{
    private array $firstNamesMale = [
        'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
        'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth',
        'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
        'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel',
        'Raymond', 'Gregory', 'Frank', 'Alexander', 'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron',
    ];

    private array $firstNamesFemale = [
        'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
        'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna',
        'Michelle', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
        'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen',
        'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather',
    ];

    private array $lastNames = [
        'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
        'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
        'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres',
        'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
        'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz',
        'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez',
        'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim',
    ];

    private array $barangays = [
        'Poblacion', 'San Isidro', 'San Jose', 'Santo Nino', 'Santa Rosa', 'Bagong Silang', 'Maligaya', 'Bagumbayan',
        'Talipapa', 'Tandang Sora', 'Batasan', 'Holy Spirit', ' Commonwealth', ' Payatas', 'Fairview', 'Brgy. 1', 'Brgy. 2',
    ];

    private array $municipalities = [
        'Quezon City', 'Manila', 'Caloocan', 'Pasig', 'Taguig', 'Makati', 'Parañaque', 'Las Piñas', 'Malabon', 'Navotas',
    ];

    private array $provinces = [
        'Metro Manila', 'Rizal', 'Laguna', 'Cavite', 'Bulacan', 'Pampanga', 'Batangas', 'Quezon', 'Bataan', 'Zambales',
    ];

    public function run(): void
    {
        $this->seedTeachers(20);
        $this->seedStudents(700);
    }

    private function seedTeachers(int $count): void
    {
        $password = Hash::make('password');
        $teachers = [];

        for ($i = 0; $i < $count; $i++) {
            $isMale = fake()->boolean();
            $first = $isMale ? fake()->randomElement($this->firstNamesMale) : fake()->randomElement($this->firstNamesFemale);
            $last = fake()->randomElement($this->lastNames);
            $middle = $isMale ? fake()->randomElement($this->firstNamesMale) : fake()->randomElement($this->firstNamesFemale);
            $name = $last . ', ' . $first . ' ' . strtoupper(substr($middle, 0, 1)) . '.';
            $email = strtolower($first . '.' . $last . ($i > 0 ? $i : '')) . '@school.edu.ph';

            $teachers[] = [
                'uuid' => Uuid::v7()->toRfc4122(),
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('users')->insertOrIgnore($teachers);
        $this->command->info("Created {$count} teachers (no role assigned). Password: password");
    }

    private function seedStudents(int $count): void
    {
        $sections = DB::table('class_sections')->select(['uuid', 'name', 'grade_level'])->get();
        $sectionUuids = $sections->pluck('uuid')->toArray();
        $sectionNames = $sections->pluck('name')->toArray();

        // If no sections exist, create some default ones
        if (empty($sectionUuids)) {
            $defaultSections = [
                ['uuid' => Uuid::v7()->toRfc4122(), 'name' => '7-DAFFODIL', 'grade_level' => '7', 'created_at' => now(), 'updated_at' => now()],
                ['uuid' => Uuid::v7()->toRfc4122(), 'name' => '7-ROSE', 'grade_level' => '7', 'created_at' => now(), 'updated_at' => now()],
                ['uuid' => Uuid::v7()->toRfc4122(), 'name' => '8-SAMPAGUITA', 'grade_level' => '8', 'created_at' => now(), 'updated_at' => now()],
                ['uuid' => Uuid::v7()->toRfc4122(), 'name' => '8-GUMAMELA', 'grade_level' => '8', 'created_at' => now(), 'updated_at' => now()],
                ['uuid' => Uuid::v7()->toRfc4122(), 'name' => '9-IRIS', 'grade_level' => '9', 'created_at' => now(), 'updated_at' => now()],
                ['uuid' => Uuid::v7()->toRfc4122(), 'name' => '9-SUNFLOWER', 'grade_level' => '9', 'created_at' => now(), 'updated_at' => now()],
                ['uuid' => Uuid::v7()->toRfc4122(), 'name' => '10-JASMINE', 'grade_level' => '10', 'created_at' => now(), 'updated_at' => now()],
                ['uuid' => Uuid::v7()->toRfc4122(), 'name' => '10-ORCHID', 'grade_level' => '10', 'created_at' => now(), 'updated_at' => now()],
            ];
            DB::table('class_sections')->insertOrIgnore($defaultSections);
            $sectionUuids = array_column($defaultSections, 'uuid');
            $sectionNames = array_column($defaultSections, 'name');
        }

        $gradeLevels = ['7', '8', '9', '10', '11', '12'];
        $students = [];
        $lrnBase = 300000000000;

        for ($i = 0; $i < $count; $i++) {
            $isMale = fake()->boolean(50);
            $first = $isMale ? fake()->randomElement($this->firstNamesMale) : fake()->randomElement($this->firstNamesFemale);
            $last = fake()->randomElement($this->lastNames);
            $middle = $isMale ? fake()->randomElement($this->firstNamesMale) : fake()->randomElement($this->firstNamesFemale);

            $sectionIdx = array_rand($sectionUuids);
            $sectionUuid = $sectionUuids[$sectionIdx];
            $sectionName = $sectionNames[$sectionIdx];

            $birthday = fake()->dateTimeBetween('-18 years', '-12 years');
            $age = (int) $birthday->diff(new \DateTime())->y;
            $gradeLevel = $gradeLevels[min($age - 12, count($gradeLevels) - 1)];

            $barangay = fake()->randomElement($this->barangays);
            $municipality = fake()->randomElement($this->municipalities);
            $province = fake()->randomElement($this->provinces);
            $street = fake()->buildingNumber . ' ' . fake()->streetName;

            $students[] = [
                'uuid' => Uuid::v7()->toRfc4122(),
                'name' => $last . ', ' . $first . ' ' . strtoupper(substr($middle, 0, 1)) . '.',
                'first_name' => $first,
                'middle_name' => $middle,
                'last_name' => $last,
                'lrn' => (string) ($lrnBase + $i),
                'student_id' => 'S' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'birthday' => $birthday->format('Y-m-d'),
                'age' => $age,
                'grade_level' => $gradeLevel,
                'section' => $sectionName,
                'section_uuid' => $sectionUuid,
                'school_year' => '2025-2026',
                'address' => $street . ', ' . $barangay . ', ' . $municipality . ', ' . $province,
                'address_zone_street' => $street,
                'address_barangay' => $barangay,
                'address_municipality' => $municipality,
                'address_province' => $province,
                'contact_number' => '09' . fake()->numerify('#########'),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $lrnBase++;
        }

        // Batch insert in chunks of 100
        foreach (array_chunk($students, 100) as $chunk) {
            DB::table('students')->insertOrIgnore($chunk);
        }

        $this->command->info("Created {$count} students distributed across " . count($sectionUuids) . " sections.");
    }
}
