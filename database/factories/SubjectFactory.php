<?php

namespace Database\Factories;

use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubjectFactory extends Factory
{
    protected $model = Subject::class;

    public function definition()
    {
        return [
            'name' => $this->faker->unique()->word(),
            'code' => strtoupper($this->faker->bothify('??###')),
        ];
    }
}
