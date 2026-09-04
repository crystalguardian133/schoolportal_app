<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        Schema::table('reports', function (Blueprint $table) {
            if (!Schema::hasColumn('reports', 'ticket_number')) {
                $table->unsignedInteger('ticket_number')->nullable()->after('type');
            }
            if (!Schema::hasColumn('reports', 'ticket_year')) {
                $table->unsignedSmallInteger('ticket_year')->nullable()->after('ticket_number');
            }
        });

        // Backfill existing rows: assign sequential ticket numbers per year.
        $reports = DB::table('reports')->select('id', 'created_at')->orderBy('created_at')->get();

        $counters = [];
        foreach ($reports as $report) {
            $year = (int) \Illuminate\Support\Carbon::parse($report->created_at)->format('Y');
            $counters[$year] = ($counters[$year] ?? 0) + 1;

            DB::table('reports')->where('id', $report->id)->update([
                'ticket_year' => $year,
                'ticket_number' => $counters[$year],
            ]);
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE reports ALTER COLUMN ticket_number SET NOT NULL');
            DB::statement('ALTER TABLE reports ALTER COLUMN ticket_year SET NOT NULL');
        } else {
            Schema::table('reports', function (Blueprint $table) {
                $table->unsignedInteger('ticket_number')->nullable(false)->change();
                $table->unsignedSmallInteger('ticket_year')->nullable(false)->change();
            });
        }

        Schema::table('reports', function (Blueprint $table) {
            $table->unique(['ticket_year', 'ticket_number'], 'reports_ticket_year_number_unique');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropUnique('reports_ticket_year_number_unique');
            $table->dropColumn(['ticket_number', 'ticket_year']);
        });
    }
};