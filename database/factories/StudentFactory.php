<?php

namespace Database\Factories;

use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition()
    {
        $firstName = $this->faker->firstName();
        $middleName = $this->faker->optional()->firstName();
        $lastName = $this->faker->lastName();

        return [
            'lrn' => $this->faker->unique()->numerify('2026########'),
            'student_id' => $this->faker->unique()->numerify('ID-#######'),
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'last_name' => $lastName,
            'name' => trim(implode(' ', array_filter([$firstName, $middleName, $lastName]))),
            'section' => $this->faker->randomElement(['A', 'B', 'C', 'D']),
            'age' => $this->faker->numberBetween(6, 20),
            'grade_level' => $this->faker->randomElement(['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']),
            'grades' => [],
        ];
    }
}
