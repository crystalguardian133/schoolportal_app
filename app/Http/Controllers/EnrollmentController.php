<?php

namespace App\Http\Controllers;

use App\Models\ClassSection;
use App\Models\CommonAddress;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentSubject;
use App\Models\EnrollmentAudit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class EnrollmentController extends Controller
{
    private function currentSchoolYear(): string
    {
        $active = SchoolYear::current();
        return $active?->name ?? date('Y');
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

    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();

        $hasPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage enrollments');
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasPermission && ! $hasRole)) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $q = $request->query('q');
        $perPage = (int) $request->query('per_page', 25);

        $sortBy = (string) $request->query('sort_by', 'name');
        $sortDirection = strtolower((string) $request->query('sort_direction', 'asc'));

        if (! in_array($sortBy, ['name', 'grade_level'], true)) {
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
                's.section',
                's.grade_level',
                's.last_grade_level',
                's.previous_section',
                's.first_name',
                's.middle_name',
                's.last_name',
                'u.email as email',
            ]);

        if (! empty($q)) {
            $studentsQuery->where(function ($w) use ($q) {
                $w->where('s.name', 'like', "%{$q}%")
                    ->orWhere('s.student_id', 'like', "%{$q}%")
                    ->orWhere('s.section', 'like', "%{$q}%");
            });
        }

        match ($sortBy) {
            'name' => $studentsQuery->orderBy('s.name', $sortDirection)->orderBy('s.student_id'),
            'grade_level' => $studentsQuery
                ->orderByRaw("CASE WHEN s.grade_level IS NULL THEN 1 ELSE 0 END")
                ->orderByRaw($this->yearLevelSortExpression('s.grade_level').' '.$sortDirection)
                ->orderBy('s.name'),
            default => $studentsQuery->orderBy('s.name', $sortDirection)->orderBy('s.student_id'),
        };

        $students = $studentsQuery->paginate($perPage)->withQueryString();

        $classSections = ClassSection::query()
            ->with('subjects')
            ->orderBy('name')
            ->get()
            ->map(fn (ClassSection $section) => [
                'uuid' => $section->uuid,
                'name' => $section->name,
                'grade_level' => $section->grade_level,
                'school_year' => $section->school_year,
                'subject_count' => $section->subjects->count(),
                'subjects' => $section->subjects->map(fn ($subject) => [
                    'uuid' => $subject->uuid,
                    'name' => $subject->name,
                    'code' => $subject->code,
                ])->values()->all(),
            ])->all();

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

        $selectedSectionUuid = $request->query('section_uuid');
        $selectedSection = null;
        if (! empty($selectedSectionUuid)) {
            $selectedSection = ClassSection::query()->with('subjects')->where('uuid', $selectedSectionUuid)->first();
        }

        return inertia('admin/enrollments', [
            'students' => $students,
            'classSections' => $classSections,
            'commonAddresses' => $commonAddresses,
            'selectedSection' => $selectedSection ? [
                'uuid' => $selectedSection->uuid,
                'name' => $selectedSection->name,
                'grade_level' => $selectedSection->grade_level,
                'school_year' => $selectedSection->school_year,
                'subjects' => $selectedSection->subjects->map(fn ($subject) => [
                    'uuid' => $subject->uuid,
                    'name' => $subject->name,
                    'code' => $subject->code,
                ])->values()->all(),
            ] : null,
            'filters' => [
                'q' => $q,
                'per_page' => $perPage,
                'section_uuid' => $selectedSectionUuid,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    public function create(Request $request)
    {
        $this->authorizeAdmin($request);

        $classSections = ClassSection::query()
            ->with('subjects')
            ->orderBy('name')
            ->get()
            ->map(fn (ClassSection $section) => [
                'uuid' => $section->uuid,
                'name' => $section->name,
                'grade_level' => $section->grade_level,
                'school_year' => $section->school_year,
                'subject_count' => $section->subjects->count(),
                'subjects' => $section->subjects->map(fn ($subject) => [
                    'uuid' => $subject->uuid,
                    'name' => $subject->name,
                    'code' => $subject->code,
                ])->values()->all(),
            ])->all();

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

        return inertia('admin/create-student-enroll', [
            'classSections' => $classSections,
            'commonAddresses' => $commonAddresses,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $user = $request->user();
        $canBypassDate = $user && method_exists($user, 'hasPermission') && $user->hasPermission('bypass enrollment date');

        if (! $canBypassDate) {
            $activeYear = SchoolYear::current();
            if ($activeYear) {
                $today = now()->toDateString();
                if ($activeYear->enrollment_start && $today < $activeYear->enrollment_start) {
                    return back()->with('error', 'Enrollment is not yet open. Enrollment period starts on '.$activeYear->enrollment_start.'.');
                }
                if ($activeYear->enrollment_end && $today > $activeYear->enrollment_end) {
                    return back()->with('error', 'Enrollment period has ended. It closed on '.$activeYear->enrollment_end.'.');
                }
            }
        }

        Log::info('[ENROLLMENT] store() reached', [
            'method' => $request->method(),
            'content_type' => $request->header('Content-Type'),
            'inertia' => $request->header('X-Inertia'),
            'all_input' => $request->all(),
        ]);

        try {
            $data = $request->validate([
                'student_uuids' => 'nullable|array',
                'student_uuids.*' => 'string',
                'class_section_uuid' => 'nullable|string',
                'new_student' => 'nullable|array',
                'new_student.name' => 'required_with:new_student|string|max:255',
                'new_student.email' => 'required_with:new_student|email|max:255|unique:users,email',
                'new_student.password' => 'required_with:new_student|string|min:8|confirmed',
                'new_student.student_id' => 'nullable|string|max:100|unique:students,student_id',
                'new_student.lrn' => 'nullable|string|max:100|unique:students,lrn',
                'new_student.grade_level' => 'nullable|string|max:100',
                'new_student.first_name' => 'nullable|string|max:255',
                'new_student.middle_name' => 'nullable|string|max:255',
                'new_student.last_name' => 'nullable|string|max:255',
                'new_student.birthday' => 'nullable|date',
                'new_student.contact_number' => ['nullable', 'string', 'max:50', 'regex:/^\d*$/'],
                'new_student.address_zone_street' => 'nullable|string|max:255',
                'new_student.address_barangay' => 'required_with:new_student|string|max:255',
                'new_student.address_municipality' => 'required_with:new_student|string|max:255',
                'new_student.address_province' => 'required_with:new_student|string|max:255',
                'new_student.previous_school' => 'required_with:new_student|string|max:255',
                'new_student.last_school_year' => ['required_with:new_student', 'string', 'max:50', 'regex:/^\d*(?:-\d+)*$/'],
                'new_student.last_grade_level' => ['required_with:new_student', 'string', 'max:100', 'regex:/^\d*$/'],
                'new_student.previous_section' => 'nullable|string|max:255',
                'new_student.avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('[ENROLLMENT] validation failed', [
                'errors' => $e->errors(),
                'input' => $request->except('new_student.password', 'new_student.password_confirmation'),
            ]);

            throw $e;
        }

        $studentUuids = $data['student_uuids'] ?? null;
        $classSectionUuid = $data['class_section_uuid'] ?? null;
        $newStudentData = $data['new_student'] ?? null;

        $schoolYear = $this->currentSchoolYear();

        Log::info('[ENROLLMENT] after validation', [
            'student_uuids' => $studentUuids,
            'class_section_uuid' => $classSectionUuid,
            'has_new_student' => ! empty($newStudentData),
            'school_year' => $schoolYear,
        ]);

        $classSection = null;
        if (! empty($classSectionUuid)) {
            $classSection = ClassSection::query()->with('subjects')->where('uuid', $classSectionUuid)->first();

            if (! $classSection) {
                Log::warning('[ENROLLMENT] class section not found', ['uuid' => $classSectionUuid]);

                return back()->with('error', 'Class section not found.');
            }

            if ($classSection->subjects->isEmpty()) {
                Log::warning('[ENROLLMENT] class section has no subjects', ['uuid' => $classSectionUuid]);

                return back()->with('error', 'This class section has no subjects assigned yet.');
            }

            $classSection->school_year = $schoolYear;
            $classSection->save();

            // Assign school year to all subjects in this section
            DB::table('class_section_subjects')
                ->where('class_section_uuid', $classSection->uuid)
                ->update(['school_year' => $schoolYear]);

            Log::info('[ENROLLMENT] class section loaded', [
                'uuid' => $classSection->uuid,
                'name' => $classSection->name,
                'grade_level' => $classSection->grade_level,
                'subjects_count' => $classSection->subjects->count(),
                'subject_uuids' => $classSection->subjects->pluck('uuid')->toArray(),
            ]);
        }

        if ((! $studentUuids || count($studentUuids) === 0) && empty($newStudentData)) {
            Log::warning('[ENROLLMENT] no students and no new student data');

            return back()->with('error', 'Select at least one existing student or fill out the new student form.');
        }

        Log::info('[ENROLLMENT] entering transaction', [
            'student_uuids_count' => is_array($studentUuids) ? count($studentUuids) : 0,
            'class_section_null' => $classSection === null,
        ]);

        $enrolledStudents = DB::transaction(function () use ($studentUuids, $newStudentData, $classSection, $request, $schoolYear) {
            $students = collect();

            if ($studentUuids && is_array($studentUuids) && count($studentUuids) > 0) {
                $students = $students->merge(DB::table('students')->whereIn('uuid', $studentUuids)->get());
            }

            Log::info('[ENROLLMENT] inside transaction - found students', ['count' => $students->count()]);

            if (is_array($newStudentData) && ! empty($newStudentData['name']) && ! empty($newStudentData['email'])) {
                $password = $newStudentData['password'] ?? \Illuminate\Support\Str::random(10);
                $newUser = User::create([
                    'name' => $newStudentData['name'],
                    'email' => $newStudentData['email'],
                    'password' => Hash::make($password),
                ]);
                $newUser->assignRole('student');

                // handle uploaded avatar for new student (if any)
                $avatarFile = $request->file('new_student.avatar');
                $profilePicturePath = null;
                if ($avatarFile) {
                    $destDir = base_path('resources/assets/profile_pictures/students');
                    if (! File::exists($destDir)) {
                        File::makeDirectory($destDir, 0755, true);
                    }
                    $filename = ($newUser->uuid ?? uniqid()).'.'.$avatarFile->getClientOriginalExtension();
                    $avatarFile->move($destDir, $filename);
                    $profilePicturePath = 'profile_pictures/students/'.$filename;
                    $newUser->profile_picture = $profilePicturePath;
                    $newUser->save();
                }

                $newStudent = Student::create([
                    'user_uuid' => $newUser->uuid,
                    'name' => $newStudentData['name'],
                    'first_name' => $newStudentData['first_name'] ?? null,
                    'middle_name' => $newStudentData['middle_name'] ?? null,
                    'last_name' => $newStudentData['last_name'] ?? null,
                    'birthday' => $newStudentData['birthday'] ?? null,
                    'lrn' => $newStudentData['lrn'] ?? null,
                    'student_id' => $newStudentData['student_id'] ?? null,
                    'grade_level' => $newStudentData['grade_level'] ?? ($classSection->grade_level ?? null),
                    'contact_number' => $newStudentData['contact_number'] ?? null,
                    'address' => trim(implode(', ', array_filter([
                        $newStudentData['address_zone_street'] ?? null,
                        $newStudentData['address_barangay'] ?? null,
                        $newStudentData['address_municipality'] ?? null,
                        $newStudentData['address_province'] ?? null,
                    ]))) ?: null,
                    'address_zone_street' => $newStudentData['address_zone_street'] ?? null,
                    'address_barangay' => $newStudentData['address_barangay'] ?? null,
                    'address_municipality' => $newStudentData['address_municipality'] ?? null,
                    'address_province' => $newStudentData['address_province'] ?? null,
                    'previous_school' => $newStudentData['previous_school'] ?? null,
                    'last_school_year' => $newStudentData['last_school_year'] ?? null,
                    'last_grade_level' => $newStudentData['last_grade_level'] ?? null,
                    'previous_section' => $newStudentData['previous_section'] ?? null,
                    'school_year' => $classSection ? $schoolYear : null,
                    'section' => $classSection ? $classSection->name : null,
                    'section_uuid' => $classSection ? $classSection->uuid : null,
                    'profile_picture' => $profilePicturePath ?? null,
                ]);

                $students->push($newStudent);
            }

            if ($students->isEmpty()) {
                Log::warning('[ENROLLMENT] no students to enroll after all checks');

                return collect();
            }

            foreach ($students as $student) {
                if (! $classSection) {
                    // No class section provided: skip enrollment steps for this student
                    Log::info('[ENROLLMENT] skipping student (no class section)', ['uuid' => $student->uuid]);

                    continue;
                }

                $updated = DB::table('students')->where('uuid', $student->uuid)->update([
                    'section' => $classSection->name,
                    'section_uuid' => $classSection->uuid,
                    'school_year' => $schoolYear,
                    'grade_level' => $classSection->grade_level ?? $student->grade_level,
                ]);

                Log::info('[ENROLLMENT] updated student', [
                    'uuid' => $student->uuid,
                    'rows_affected' => $updated,
                    'section' => $classSection->name,
                ]);

                foreach ($classSection->subjects as $subject) {
                    $exists = StudentSubject::query()
                        ->where('student_uuid', $student->uuid)
                        ->where('subject_uuid', $subject->uuid)
                        ->where('school_year', $schoolYear)
                        ->exists();

                    Log::info('[ENROLLMENT] subject check', [
                        'student_uuid' => $student->uuid,
                        'subject_uuid' => $subject->uuid,
                        'subject_name' => $subject->name,
                        'exists' => $exists,
                    ]);

                    if (! $exists) {
                        $created = StudentSubject::create([
                            'student_uuid' => $student->uuid,
                            'subject_uuid' => $subject->uuid,
                            'year_level' => $classSection->grade_level ?? ($student->grade_level ?? null),
                            'school_year' => $schoolYear,
                            'section' => $classSection->name,
                        ]);

                        Log::info('[ENROLLMENT] created student_subject', [
                            'id' => $created->id,
                            'student_uuid' => $student->uuid,
                            'subject_uuid' => $subject->uuid,
                        ]);
                    }
                }
            }

            return $students;
        });

        $enrolledCount = is_countable($enrolledStudents) ? count($enrolledStudents) : 0;

        Log::info('[ENROLLMENT] completed', [
            'enrolled_count' => $enrolledCount,
            'has_new_student' => ! empty($newStudentData),
        ]);

        return redirect()->back()->with('success', $enrolledCount > 0
            ? ($newStudentData ? 'Student account created and enrolled successfully.' : 'Students enrolled successfully.')
            : 'No students were enrolled.');
    }

    public function promote(Request $request, string $uuid)
    {
        $this->authorizeAdmin($request);

        $student = Student::where('uuid', $uuid)->first();

        if (! $student) {
            return back()->with('error', 'Student not found.');
        }

        $currentLevel = $student->grade_level;

        if (empty($currentLevel)) {
            return back()->with('error', 'Cannot promote student: no current grade level set.');
        }

        if (! empty($student->last_grade_level) && $currentLevel !== $student->last_grade_level) {
            return back()->with('error', 'Student has already been promoted.');
        }

        $nextLevel = match ($currentLevel) {
            'Grade 7' => 'Grade 8',
            'Grade 8' => 'Grade 9',
            'Grade 9' => 'Grade 10',
            'Grade 10' => 'Grade 11',
            'Grade 11' => 'Grade 12',
            default => null,
        };

        if ($nextLevel === null) {
            return back()->with('error', "Cannot promote student from \"{$currentLevel}\": no next level defined.");
        }

        DB::table('students')->where('uuid', $uuid)->update([
            'last_grade_level' => $currentLevel,
            'previous_section' => $student->section,
            'grade_level' => $nextLevel,
            'section' => null,
            'section_uuid' => null,
            'school_year' => null,
        ]);

        return redirect()->back()->with('success', "Student promoted from {$currentLevel} to {$nextLevel}.");
    }
}