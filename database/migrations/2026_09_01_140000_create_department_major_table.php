<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_major', function (Blueprint $table) {
            $table->uuid('department_uuid');
            $table->uuid('major_subject_uuid');
            $table->string('strand')->nullable();
            $table->timestamps();

            $table->foreign('department_uuid')->references('uuid')->on('departments')->onDelete('cascade');
            $table->foreign('major_subject_uuid')->references('uuid')->on('major_subjects')->onDelete('cascade');
            $table->primary(['department_uuid', 'major_subject_uuid']);
        });

        // Carry over existing subject links as major links where a subject belongs
        // to a major. Departments now scope by major instead of by individual subject.
        $links = DB::table('department_subject')->get(['department_uuid', 'subject_uuid', 'strand']);
        $majorOfSubject = DB::table('subjects')->pluck('major_subject_id', 'uuid');

        foreach ($links as $link) {
            $majorUuid = $majorOfSubject[$link->subject_uuid] ?? null;

            if (! $majorUuid) {
                continue;
            }

            DB::table('department_major')->updateOrInsert(
                [
                    'department_uuid' => $link->department_uuid,
                    'major_subject_uuid' => $majorUuid,
                ],
                [
                    'strand' => $link->strand ?: null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        Schema::dropIfExists('department_subject');
    }

    public function down(): void
    {
        Schema::create('department_subject', function (Blueprint $table) {
            $table->id();
            $table->uuid('department_uuid');
            $table->uuid('subject_uuid');
            $table->string('grade_level')->nullable();
            $table->string('track')->nullable();
            $table->string('strand')->nullable();
            $table->timestamps();

            $table->foreign('department_uuid')->references('uuid')->on('departments')->onDelete('cascade');
            $table->foreign('subject_uuid')->references('uuid')->on('subjects')->onDelete('cascade');

            $table->index(['department_uuid', 'grade_level']);
            $table->unique(
                ['department_uuid', 'subject_uuid', 'grade_level', 'track', 'strand'],
                'dept_subject_grade_strand_unique'
            );
        });

        Schema::dropIfExists('department_major');
    }
};