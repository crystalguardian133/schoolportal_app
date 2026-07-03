<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (! Schema::hasColumn('students', 'address_zone_street')) {
                $table->string('address_zone_street')->nullable()->after('address');
            }

            if (! Schema::hasColumn('students', 'address_barangay')) {
                $table->string('address_barangay')->nullable()->after('address_zone_street');
            }

            if (! Schema::hasColumn('students', 'address_municipality')) {
                $table->string('address_municipality')->nullable()->after('address_barangay');
            }

            if (! Schema::hasColumn('students', 'address_province')) {
                $table->string('address_province')->nullable()->after('address_municipality');
            }

            if (! Schema::hasColumn('students', 'previous_school')) {
                $table->string('previous_school')->nullable()->after('address_province');
            }

            if (! Schema::hasColumn('students', 'last_school_year')) {
                $table->string('last_school_year')->nullable()->after('previous_school');
            }

            if (! Schema::hasColumn('students', 'last_grade_level')) {
                $table->string('last_grade_level')->nullable()->after('last_school_year');
            }

            if (! Schema::hasColumn('students', 'previous_section')) {
                $table->string('previous_section')->nullable()->after('last_grade_level');
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $columns = [
                'previous_section',
                'last_grade_level',
                'last_school_year',
                'previous_school',
                'address_province',
                'address_municipality',
                'address_barangay',
                'address_zone_street',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('students', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};