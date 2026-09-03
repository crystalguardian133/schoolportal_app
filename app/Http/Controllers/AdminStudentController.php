<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\ClassSection;
use App\Models\CommonAddress;
use App\Models\EnrollmentAudit;
use App\Models\GradeArchive;
use App\Models\Student;
use App\Models\StudentSubject;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class AdminStudentController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        $hasPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage enrollments');
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasPermission && ! $hasRole)) {
            abort(403);
        }
    }

    private function yearLevelSortExpression(string $column): string
    {
        return "CASE {$column}"
            ." WHEN 'Grade 7' THEN 7"
            ." WHEN 'Grade 8' THEN 8"
            ." WHEN 'Grade 9' THEN 9"
            ." WHEN 'Grade 10' THEN 10"
            ." WHEN 'Grade 11' THEN 11"
            ." WHEN 'Grade 12' THEN 12"
            ." ELSE 999 END";
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $q = $request->query('q');
        $perPage = (int) $request->query('per_page', 25);

        $sortBy = (string) $request->query('sort_by', 'name');
        $sortDirection = strtolower((string) $request->query('sort_direction', 'asc'));

        if (! in_array($sortBy, ['name', 'grade_level', 'student_id'], true)) {
            $sortBy = 'name';
        }

        if (! in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'asc';
        }

        $studentsQuery = DB::table('students as s')
            ->leftJoin('users as u', 'u.uuid', '=', 's.user_uuid')
            ->select([
                's.uuid',
                's.name',
                's.student_id',
                's.lrn',
                's.section',
                's.grade_level',
                's.first_name',
                's.middle_name',
                's.last_name',
                'u.email as email',
            ]);

        if (! empty($q)) {
            $studentsQuery->where(function ($w) use ($q) {
                $w->where('s.name', 'like', "%{$q}%")
                    ->orWhere('s.student_id', 'like', "%{$q}%")
                    ->orWhere('s.lrn', 'like', "%{$q}%")
                    ->orWhere('u.email', 'like', "%{$q}%");
            });
        }

        match ($sortBy) {
            'name' => $studentsQuery->orderBy('s.name', $sortDirection)->orderBy('s.student_id'),
            'grade_level' => $studentsQuery
                ->orderByRaw("CASE WHEN s.grade_level IS NULL THEN 1 ELSE 0 END")
                ->orderByRaw($this->yearLevelSortExpression('s.grade_level').' '.$sortDirection)
                ->orderBy('s.name'),
            'student_id' => $studentsQuery->orderBy('s.student_id', $sortDirection)->orderBy('s.name'),
            default => $studentsQuery->orderBy('s.name', $sortDirection)->orderBy('s.student_id'),
        };

        $students = $studentsQuery->paginate($perPage)->withQueryString();

        return inertia('admin/manage-students', [
            'students' => $students,
            'filters' => [
                'q' => $q,
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    public function edit(Request $request, string $uuid)
    {
        $this->authorizeAdmin($request);

        $student = Student::where('uuid', $uuid)->firstOrFail();
        $user = $student->user;

        $classSections = ClassSection::query()
            ->select(['uuid', 'name', 'grade_level'])
            ->orderBy('name')
            ->get()
            ->map(fn ($s) => [
                'uuid' => $s->uuid,
                'name' => $s->name,
                'grade_level' => $s->grade_level,
            ])
            ->values()
            ->all();

        $commonAddresses = CommonAddress::query()
            ->orderBy('label')
            ->get()
            ->map(fn (CommonAddress $address) => [
                'id' => $address->id,
                'label' => $address->label,
                'address_zone_street' => $address->address_zone_street,
                'address_barangay' => $address->address_barangay,
                'address_municipality' => $address->address_municipality,
                'address_province' => $address->address_province,
            ])
            ->values()
            ->all();

        return inertia('admin/edit-student', [
            'student' => [
                'uuid' => $student->uuid,
                'first_name' => $student->first_name,
                'middle_name' => $student->middle_name,
                'last_name' => $student->last_name,
                'lrn' => $student->lrn,
                'student_id' => $student->student_id,
                'birthday' => $student->birthday,
                'contact_number' => $student->contact_number,
                'address_zone_street' => $student->address_zone_street,
                'address_barangay' => $student->address_barangay,
                'address_municipality' => $student->address_municipality,
                'address_province' => $student->address_province,
                'previous_school' => $student->previous_school,
                'last_school_year' => $student->last_school_year,
                'last_grade_level' => $student->last_grade_level,
                'previous_section' => $student->previous_section,
                'grade_level' => $student->grade_level,
                'section' => $student->section,
                'section_uuid' => $student->section_uuid,
                'profile_picture' => $student->profile_picture,
                'email' => $user?->email,
            ],
            'classSections' => $classSections,
            'commonAddresses' => $commonAddresses,
        ]);
    }

    public function update(Request $request, string $uuid)
    {
        $this->authorizeAdmin($request);

        $student = Student::where('uuid', $uuid)->firstOrFail();
        $user = $student->user;

        $data = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'birthday' => 'nullable|date',
            'contact_number' => ['nullable', 'string', 'max:50', 'regex:/^\d*$/'],
            'address_zone_street' => 'nullable|string|max:255',
            'address_barangay' => 'nullable|string|max:255',
            'address_municipality' => 'nullable|string|max:255',
            'address_province' => 'nullable|string|max:255',
            'lrn' => 'nullable|string|max:100',
            'student_id' => 'nullable|string|max:100',
            'grade_level' => 'nullable|string|max:100',
            'section_uuid' => 'nullable|string',
            'previous_school' => 'nullable|string|max:255',
            'last_school_year' => 'nullable|string|max:50',
            'last_grade_level' => 'nullable|string|max:100',
            'previous_section' => 'nullable|string|max:255',
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if (! empty($data['email']) && $user) {
            $emailTaken = DB::table('users')
                ->where('email', $data['email'])
                ->where('uuid', '<>', $user->uuid)
                ->exists();

            if ($emailTaken) {
                return back()->with('error', 'Email already in use by another account.');
            }
        }

        if (! empty($data['lrn']) && $data['lrn'] !== $student->lrn) {
            $lrnTaken = DB::table('students')
                ->where('lrn', $data['lrn'])
                ->where('uuid', '<>', $student->uuid)
                ->exists();

            if ($lrnTaken) {
                return back()->with('error', 'LRN already in use by another student.');
            }
        }

        if (! empty($data['student_id']) && $data['student_id'] !== $student->student_id) {
            $idTaken = DB::table('students')
                ->where('student_id', $data['student_id'])
                ->where('uuid', '<>', $student->uuid)
                ->exists();

            if ($idTaken) {
                return back()->with('error', 'Student ID already in use by another student.');
            }
        }

        $sectionUuid = $data['section_uuid'] ?? $student->section_uuid;
        $sectionName = $student->section;
        if (! empty($sectionUuid) && $sectionUuid !== $student->section_uuid) {
            $section = ClassSection::where('uuid', $sectionUuid)->first();
            if ($section) {
                $sectionName = $section->name;
            }
        }

        $student->fill(collect($data)->except([
            'email', 'avatar', 'section_uuid',
        ])->toArray());
        $student->section_uuid = $sectionUuid;
        $student->section = $sectionName;
        $student->save();

        if ($user) {
            $user->fill(collect($data)->only(['email'])->toArray());
            $user->save();
        }

        if ($request->hasFile('avatar') && $user) {
            $avatar = $request->file('avatar');
            $destDir = base_path('resources/assets/profile_pictures/students');
            if (! File::exists($destDir)) {
                File::makeDirectory($destDir, 0755, true);
            }

            $filename = ($student->uuid ?? uniqid()).'.'.$avatar->getClientOriginalExtension();
            $avatar->move($destDir, $filename);

            $student->profile_picture = 'profile_pictures/students/'.$filename;
            $student->save();
        }

        return redirect()->route('admin.manage-students.index')
            ->with('success', 'Student information updated successfully.');
    }

    public function destroy(Request $request, string $uuid)
    {
        $this->authorizeAdmin($request);

        $student = Student::query()->where('uuid', $uuid)->first();

        if (! $student) {
            return back()->with('error', 'Student not found or already deleted.');
        }

        DB::transaction(function () use ($student) {
            // Remove related records before deleting the student
            StudentSubject::where('student_uuid', $student->uuid)->delete();
            Attendance::where('student_uuid', $student->uuid)->delete();
            GradeArchive::where('student_uuid', $student->uuid)->delete();
            EnrollmentAudit::where('student_uuid', $student->uuid)->delete();

            $userUuid = $student->user_uuid;
            $student->delete();

            if ($userUuid) {
                $user = User::query()->where('uuid', $userUuid)->first();
                if ($user) {
                    $user->roles()->detach();
                    DB::table('push_subscriptions')->where('user_uuid', $userUuid)->delete();
                    $user->delete();
                }
            }
        });

        return redirect()->route('admin.manage-students.index')
            ->with('success', 'Student deleted successfully.');
    }
}
