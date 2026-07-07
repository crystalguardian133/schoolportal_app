<?php

namespace App\Http\Controllers;

use App\Models\ClassSection;
use App\Models\CommonAddress;
use App\Models\Student;
use App\Models\StudentSubject;
use App\Models\EnrollmentAudit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnrollmentController extends Controller
{
    private function currentSchoolYear(): string
    {
        return date('Y');
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
        $user = $request->user();

        $can = false;
        if ($user) {
            if (method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('staff'))) {
                $can = true;
            }
            if (method_exists($user, 'hasPermissionTo') && $user->hasPermissionTo('enroll students')) {
                $can = true;
            }
        }

        if (! $can) {
            abort(403);
        }

        $q = $request->query('q');
        $perPage = (int) $request->query('per_page', 25);

        $sortBy = (string) $request->query('sort_by', 'name');
        $sortDirection = strtolower((string) $request->query('sort_direction', 'asc'));
        $lastYearLevel = $request->query('last_year_level');

        if (! in_array($sortBy, ['name', 'last_year_level', 'last_section'], true)) {
            $sortBy = 'name';
        }

        if (! in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'asc';
        }

        $latestHistorySubquery = DB::table('student_subject as ss')
            ->selectRaw('ss.student_uuid, ss.year_level as last_year_level, ss.section as last_section, ss.school_year as last_school_year, row_number() over (partition by ss.student_uuid order by ss.school_year desc, ss.created_at desc, ss.id desc) as rn');

        $studentsQuery = DB::table('students as s')
            ->leftJoinSub($latestHistorySubquery, 'history', function ($join) {
                $join->on('s.uuid', '=', 'history.student_uuid')
                    ->where('history.rn', '=', 1);
            })
            ->leftJoin('users as u', 'u.uuid', '=', 's.user_uuid')
            ->select([
                's.uuid',
                's.name',
                's.student_id',
                's.section',
                's.grade_level',
                's.first_name',
                's.middle_name',
                's.last_name',
                'u.email as email',
                'history.last_year_level',
                'history.last_section',
                'history.last_school_year',
                DB::raw("COALESCE(NULLIF(history.last_year_level, ''), NULLIF(s.last_grade_level, ''), NULLIF(s.grade_level, '')) as last_year_level"),
                DB::raw("COALESCE(NULLIF(history.last_section, ''), NULLIF(s.previous_section, ''), NULLIF(s.section, '')) as last_section"),
                DB::raw("COALESCE(NULLIF(history.last_school_year, ''), NULLIF(s.last_school_year, ''), NULLIF(s.school_year, '')) as last_school_year"),
            ]);

        if (! empty($q)) {
            $studentsQuery->where(function ($w) use ($q) {
                $w->where('s.name', 'like', "%{$q}%")
                    ->orWhere('s.student_id', 'like', "%{$q}%")
                    ->orWhere('s.section', 'like', "%{$q}%");
            });
        }

        if (! empty($lastYearLevel)) {
            $studentsQuery->whereRaw("COALESCE(NULLIF(history.last_year_level, ''), NULLIF(s.last_grade_level, ''), NULLIF(s.grade_level, '')) = ?", [$lastYearLevel]);
        }

        match ($sortBy) {
            'name' => $studentsQuery->orderBy('s.name', $sortDirection)->orderBy('s.student_id'),
            'last_section' => $studentsQuery->orderByRaw("COALESCE(NULLIF(history.last_section, ''), NULLIF(s.previous_section, ''), NULLIF(s.section, '')) ".$sortDirection)->orderBy('s.name'),
            'last_year_level' => $studentsQuery
                ->orderByRaw("CASE WHEN COALESCE(NULLIF(history.last_year_level, ''), NULLIF(s.last_grade_level, ''), NULLIF(s.grade_level, '')) IS NULL THEN 1 ELSE 0 END")
                ->orderByRaw($this->yearLevelSortExpression("COALESCE(NULLIF(history.last_year_level, ''), NULLIF(s.last_grade_level, ''), NULLIF(s.grade_level, ''))").' '.$sortDirection)
                ->orderBy('s.name'),
            default => $studentsQuery->orderBy('s.name', $sortDirection)->orderBy('s.student_id'),
        };

        $students = $studentsQuery->paginate($perPage)->withQueryString();
        $studentHistory = collect($students->items())
            ->mapWithKeys(function ($student) {
                return [
                    $student->uuid => [
                        'last_year_level' => $student->last_year_level ?? null,
                        'last_section' => $student->last_section ?? null,
                        'last_school_year' => $student->last_school_year ?? null,
                    ],
                ];
            })
            ->all();

        $yearLevelOptions = DB::table('student_subject')
            ->whereNotNull('year_level')
            ->distinct()
            ->pluck('year_level')
            ->sort(function ($left, $right) {
                $extract = function ($value) {
                    if (preg_match('/(\d+)/', (string) $value, $matches)) {
                        return (int) $matches[1];
                    }

                    return PHP_INT_MAX;
                };

                return $extract($left) <=> $extract($right) ?: strcmp((string) $left, (string) $right);
            })
            ->values()
            ->all();

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
            'studentHistory' => $studentHistory,
            'yearLevelOptions' => $yearLevelOptions,
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
                'last_year_level' => $lastYearLevel,
            ],
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        $can = false;
        if ($user) {
            if (method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('staff'))) {
                $can = true;
            }
            if (method_exists($user, 'hasPermissionTo') && $user->hasPermissionTo('enroll students')) {
                $can = true;
            }
        }

        if (! $can) {
            abort(403);
        }

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

        $yearLevelOptions = DB::table('student_subject')
            ->whereNotNull('year_level')
            ->distinct()
            ->pluck('year_level')
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

        return inertia('admin/create-student-enroll', [
            'classSections' => $classSections,
            'yearLevelOptions' => $yearLevelOptions,
            'commonAddresses' => $commonAddresses,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $can = false;
        if ($user) {
            if (method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('staff'))) {
                $can = true;
            }
            if (method_exists($user, 'hasPermissionTo') && $user->hasPermissionTo('enroll students')) {
                $can = true;
            }
        }

        if (! $can) {
            abort(403);
        }

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
            'new_student.address_barangay' => 'required|string|max:255',
            'new_student.address_municipality' => 'required|string|max:255',
            'new_student.address_province' => 'required|string|max:255',
            'new_student.previous_school' => 'required|string|max:255',
            'new_student.last_school_year' => ['required', 'string', 'max:50', 'regex:/^\d*(?:-\d+)*$/'],
            'new_student.last_grade_level' => ['required', 'string', 'max:100', 'regex:/^\d*$/'],
            'new_student.previous_section' => 'nullable|string|max:255',
            'new_student.avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $studentUuids = $data['student_uuids'] ?? null;
        $classSectionUuid = $data['class_section_uuid'] ?? null;
        $newStudentData = $data['new_student'] ?? null;

        $schoolYear = $this->currentSchoolYear();

        $classSection = null;
        if (! empty($classSectionUuid)) {
            $classSection = ClassSection::query()->with('subjects')->where('uuid', $classSectionUuid)->first();

            if (! $classSection) {
                return back()->with('error', 'Class section not found.');
            }

            if ($classSection->subjects->isEmpty()) {
                return back()->with('error', 'This class section has no subjects assigned yet.');
            }

            $classSection->school_year = $schoolYear;
            $classSection->save();
        }

        if ((! $studentUuids || count($studentUuids) === 0) && empty($newStudentData)) {
            return back()->with('error', 'Select at least one existing student or fill out the new student form.');
        }

        $enrolledStudents = DB::transaction(function () use ($studentUuids, $newStudentData, $classSection, $user, $schoolYear, $request) {
            $students = collect();

            if ($studentUuids && is_array($studentUuids) && count($studentUuids) > 0) {
                $students = $students->merge(DB::table('students')->whereIn('uuid', $studentUuids)->get());
            }

            if (is_array($newStudentData) && ! empty($newStudentData['name']) && ! empty($newStudentData['email'])) {
                $newUser = User::create([
                    'name' => $newStudentData['name'],
                    'email' => $newStudentData['email'],
                    'password' => $newStudentData['password'],
                ]);
                $newUser->assignRole('student');

                // handle uploaded avatar for new student (if any)
                $avatarFile = $request->file('new_student.avatar');
                $profilePicturePath = null;
                if ($avatarFile) {
                    $destDir = base_path('resources/assets/profile_pictures/students');
                    if (! \Illuminate\Support\Facades\File::exists($destDir)) {
                        \Illuminate\Support\Facades\File::makeDirectory($destDir, 0755, true);
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
                    'profile_picture' => $profilePicturePath ?? null,
                ]);

                $students->push($newStudent);
            }

            if ($students->isEmpty()) {
                return collect();
            }

            foreach ($students as $student) {
                if (! $classSection) {
                    // No class section provided: skip enrollment steps for this student
                    continue;
                }

                DB::table('students')->where('uuid', $student->uuid)->update([
                    'section' => $classSection->name,
                    'school_year' => $schoolYear,
                ]);

                foreach ($classSection->subjects as $subject) {
                    $exists = StudentSubject::query()
                        ->where('student_uuid', $student->uuid)
                        ->where('subject_uuid', $subject->uuid)
                        ->where('school_year', $schoolYear)
                        ->exists();

                    if (! $exists) {
                        StudentSubject::create([
                            'student_uuid' => $student->uuid,
                            'subject_uuid' => $subject->uuid,
                            'year_level' => $classSection->grade_level ?? ($student->grade_level ?? null),
                            'school_year' => $schoolYear,
                            'section' => $classSection->name,
                        ]);

                        try {
                            EnrollmentAudit::create([
                                'user_uuid' => $user->uuid ?? null,
                                'student_uuid' => $student->uuid,
                                'subject_uuid' => $subject->uuid,
                                'school_year' => $schoolYear,
                                'action' => 'enrolled',
                                'metadata' => [
                                    'enrolled_by' => $user->name ?? null,
                                    'section' => $classSection->name,
                                    'class_section_uuid' => $classSection->uuid,
                                ],
                            ]);
                        } catch (\Throwable $e) {
                            // swallow audit errors to avoid blocking enrollment
                        }
                    }
                }
            }
        });

        $enrolledCount = is_countable($enrolledStudents) ? count($enrolledStudents) : 0;

        return redirect()->back()->with('success', $enrolledCount > 0
            ? ($newStudentData ? 'Student account created and enrolled successfully.' : 'Students enrolled successfully.')
            : 'No students were enrolled.');
    }
}
