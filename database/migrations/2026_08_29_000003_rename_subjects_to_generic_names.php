<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Upgrade subjects from grade-suffixed names ("MATHEMATICS 7") to generic
        // domain names ("Mathematics"). The grade is now scoped on department_subject.
        $renames = [
            'MATHEMATICS 7' => 'Mathematics',
            'ENGLISH 7' => 'English',
            'ARALING PANLIPUNAN 7' => 'Araling Panlipunan',
            'MUSIC ARTS PHYSICAL EDUCATION & HEALTH 7' => 'Music, Arts, Physical Education and Health',
            'TECHNOLOGY AND LIVELIHOOD EDUCATION 7' => 'Technology and Livelihood Education',
            'FILIPINO 7' => 'Filipino',
            'SCIENCE 7' => 'Science',
            'EDUKASYON SA PAGPAPAKATAO 7' => 'Edukasyon sa Pagpapakatao',
        ];

        $subjects = DB::table('subjects')->get(['uuid', 'name']);

        foreach ($subjects as $subject) {
            $normalized = strtoupper(trim($subject->name));

            $newName = $renames[$normalized] ?? null;

            // Fallback: strip a trailing grade token (e.g. "General Mathematics 11" -> "General Mathematics").
            if ($newName === null && preg_match('/^(.*?)\s+\d{1,2}\s*$/', trim($subject->name), $m)) {
                $newName = trim($m[1]);
            }

            if ($newName !== null && $newName !== $subject->name) {
                DB::table('subjects')
                    ->where('uuid', $subject->uuid)
                    ->update(['name' => $newName, 'updated_at' => now()]);
            }
        }
    }

    public function down(): void
    {
        // No reliable reverse mapping; down() is intentionally a no-op.
    }
};
