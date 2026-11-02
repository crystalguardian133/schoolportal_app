<?php

namespace Tests\Feature;

use App\Models\EnrollmentAudit;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\PermissionsTableSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\RolesTableSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EnrollmentPoolCategoryTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed([
            RolesTableSeeder::class,
            PermissionsTableSeeder::class,
            RolePermissionSeeder::class,
        ]);

        $admin = User::factory()->create();
        $admin->assignRole('ADMINISTRATOR');

        return $admin;
    }

    private function student(string $name, string $gradeLevel = 'Grade 7'): Student
    {
        return Student::factory()->create([
            'name' => $name,
            'grade_level' => $gradeLevel,
            'status' => 'active',
        ]);
    }

    public function test_guests_cannot_access_enrollment_pool(): void
    {
        $this->get('/admin/enrollments')->assertRedirect('/login');
    }

    public function test_pool_tags_latest_rollover_outcome_per_student(): void
    {
        $admin = $this->admin();

        $fresh = $this->student('Fresh New');
        $repeater = $this->student('Repeat Retained');
        $moved = $this->student('Moved Promoted');

        EnrollmentAudit::create([
            'student_uuid' => $repeater->uuid,
            'school_year' => '2025-2026',
            'action' => 'retained',
        ]);
        EnrollmentAudit::create([
            'student_uuid' => $moved->uuid,
            'school_year' => '2025-2026',
            'action' => 'promoted',
        ]);

        $this->actingAs($admin)
            ->get('/admin/enrollments')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/enrollments')
                ->has('students.data', 3)
                ->where('students.data', function ($students) use ($fresh, $repeater, $moved) {
                    $byUuid = collect($students)->keyBy('uuid');

                    $this->assertSame('new', $byUuid[$fresh->uuid]['enrollment_category']);
                    $this->assertSame('retained', $byUuid[$repeater->uuid]['enrollment_category']);
                    $this->assertSame('promoted', $byUuid[$moved->uuid]['enrollment_category']);

                    return true;
                })
                ->where('categoryCounts.new', 1)
                ->where('categoryCounts.retained', 1)
                ->where('categoryCounts.promoted', 1));
    }

    public function test_latest_audit_wins_over_older_history(): void
    {
        $admin = $this->admin();

        $student = $this->student('Repeat Then Moved');

        // Retained two years ago, promoted last year: classification must be
        // the newest outcome, not the first one recorded.
        EnrollmentAudit::create([
            'student_uuid' => $student->uuid,
            'school_year' => '2024-2025',
            'action' => 'retained',
        ]);
        EnrollmentAudit::create([
            'student_uuid' => $student->uuid,
            'school_year' => '2025-2026',
            'action' => 'promoted',
        ]);

        $this->actingAs($admin)
            ->get('/admin/enrollments')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('students.data.0.enrollment_category', 'promoted'));
    }

    public function test_category_filter_narrows_the_pool(): void
    {
        $admin = $this->admin();

        $fresh = $this->student('Fresh New');
        $repeater = $this->student('Repeat Retained');

        EnrollmentAudit::create([
            'student_uuid' => $repeater->uuid,
            'school_year' => '2025-2026',
            'action' => 'retained',
        ]);

        $this->actingAs($admin)
            ->get('/admin/enrollments?enrollment_category=retained')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('students.data', 1)
                ->where('students.data.0.uuid', $repeater->uuid)
                ->where('students.data.0.enrollment_category', 'retained'));

        $this->actingAs($admin)
            ->get('/admin/enrollments?enrollment_category=new')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('students.data', 1)
                ->where('students.data.0.uuid', $fresh->uuid)
                ->where('students.data.0.enrollment_category', 'new'));
    }

    public function test_unknown_category_filter_is_ignored(): void
    {
        $admin = $this->admin();

        $this->student('One');
        $this->student('Two');

        $this->actingAs($admin)
            ->get('/admin/enrollments?enrollment_category=bogus')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('students.data', 2));
    }

    public function test_graduated_students_are_excluded_from_pool_and_counts(): void
    {
        $admin = $this->admin();

        $active = $this->student('Active Student');
        $graduated = $this->student('Graduated Student');
        $graduated->update(['status' => 'graduated']);

        $this->actingAs($admin)
            ->get('/admin/enrollments')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('students.data', 1)
                ->where('students.data.0.uuid', $active->uuid)
                ->where('categoryCounts.new', 1)
                ->where('categoryCounts.retained', 0)
                ->where('categoryCounts.promoted', 0));
    }

    public function test_counts_are_grouped_by_grade_level(): void
    {
        $admin = $this->admin();

        $this->student('Grade Seven New', 'Grade 7');

        $gradeEight = $this->student('Grade Eight New', 'Grade 8');
        EnrollmentAudit::create([
            'student_uuid' => $gradeEight->uuid,
            'school_year' => '2025-2026',
            'action' => 'retained',
        ]);

        $this->actingAs($admin)
            ->get('/admin/enrollments')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('categoryCountsByGrade.Grade 7.new', 1)
                ->where('categoryCountsByGrade.Grade 8.retained', 1)
                ->where('categoryCounts.new', 1)
                ->where('categoryCounts.retained', 1));
    }
}
