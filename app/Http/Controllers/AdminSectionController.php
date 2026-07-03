<?php

namespace App\Http\Controllers;

use App\Models\ClassSection;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSectionController extends Controller
{
    private function currentSchoolYear(): string
    {
        return date('Y');
    }

    private function authorizeSections(Request $request): void
    {
        $user = $request->user();

        if (! $user || ! method_exists($user, 'hasRole') || (! $user->hasRole('admin') && ! $user->hasRole('principal') && ! $user->hasRole('registrar'))) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $this->authorizeSections($request);

        $q = $request->query('q');
        $perPage = (int) $request->query('per_page', 25);
        $activeSectionUuid = $request->query('section_uuid');

        $studentsQuery = DB::table('students')->select(['uuid', 'name', 'student_id', 'section', 'grade_level']);
        if (! empty($q)) {
            $studentsQuery->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('student_id', 'like', "%{$q}%")
                    ->orWhere('section', 'like', "%{$q}%");
            });
        }

        $students = $studentsQuery
            ->orderBy('section')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        $sections = ClassSection::query()
            ->withCount('subjects')
            ->get()
            ->sortBy('name')
            ->values()
            ->map(function (ClassSection $section) {
                $studentCount = DB::table('students')->where('section', $section->name)->count();

                return [
                    'uuid' => $section->uuid,
                    'name' => $section->name,
                    'grade_level' => $section->grade_level,
                    'school_year' => $section->school_year,
                    'student_count' => $studentCount,
                    'subject_count' => $section->subjects_count,
                ];
            })
            ->all();

        $subjects = Subject::query()
            ->select(['uuid', 'name', 'code', 'subject_teacher_uuid'])
            ->get()
            ->sortBy('name')
            ->values();

        $assignedSubjectUuids = $subjects
            ->filter(fn (Subject $subject) => ! empty($subject->subject_teacher_uuid))
            ->map(fn (Subject $subject) => $subject->uuid)
            ->values()
            ->all();

        $selectedSection = null;
        $sectionStudents = [];
        $sectionSubjects = [];

        if (! empty($activeSectionUuid)) {
            $selectedSection = ClassSection::query()->with('subjects')->where('uuid', $activeSectionUuid)->first();

            if ($selectedSection) {
                $sectionStudents = DB::table('students')
                    ->select(['uuid', 'name', 'student_id', 'section', 'grade_level'])
                    ->where('section', $selectedSection->name)
                    ->orderBy('name')
                    ->get();

                $sectionSubjects = $selectedSection->subjects->map(fn (Subject $subject) => [
                    'uuid' => $subject->uuid,
                    'name' => $subject->name,
                    'code' => $subject->code,
                    'subject_teacher_uuid' => $subject->subject_teacher_uuid,
                ])->all();
            }
        }

        return inertia('admin/sections', [
            'students' => $students,
            'sections' => $sections,
            'sectionStudents' => $sectionStudents,
            'sectionSubjects' => $sectionSubjects,
            'subjects' => $subjects,
            'assignedSubjectUuids' => $assignedSubjectUuids,
            'selectedSection' => $selectedSection ? [
                'uuid' => $selectedSection->uuid,
                'name' => $selectedSection->name,
                'grade_level' => $selectedSection->grade_level,
                'school_year' => $selectedSection->school_year,
            ] : null,
            'filters' => [
                'q' => $q,
                'per_page' => $perPage,
                'section_uuid' => $activeSectionUuid,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeSections($request);

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'grade_level' => 'nullable|string|max:100',
            'subject_uuids' => 'nullable|array',
            'subject_uuids.*' => 'string',
        ]);

        $subjectUuids = $data['subject_uuids'] ?? [];

        if (empty($subjectUuids)) {
            $subjectUuids = Subject::all()
                ->filter(fn (Subject $subject) => ! empty($subject->subject_teacher_uuid))
                ->map(fn (Subject $subject) => $subject->uuid)
                ->values()
                ->all();
        }

        $section = ClassSection::query()->create([
            'name' => trim($data['name']),
            'grade_level' => $data['grade_level'] ?? null,
            'school_year' => $this->currentSchoolYear(),
        ]);

        $section->subjects()->sync($subjectUuids);

        return back()->with('success', 'Class section created successfully.');
    }

    public function update(Request $request)
    {
        $this->authorizeSections($request);

        $data = $request->validate([
            'section_uuid' => 'required|string',
            'name' => 'required|string|max:100',
            'grade_level' => 'nullable|string|max:100',
            'subject_uuids' => 'nullable|array',
            'subject_uuids.*' => 'string',
        ]);

        $section = ClassSection::query()->with('subjects')->where('uuid', $data['section_uuid'])->first();

        if (! $section) {
            return back()->with('error', 'Class section not found.');
        }

        $oldName = $section->name;
        $newName = trim($data['name']);
        $subjectUuids = $data['subject_uuids'] ?? $section->subjects->pluck('uuid')->values()->all();

        $section->update([
            'name' => $newName,
            'grade_level' => $data['grade_level'] ?? null,
            'school_year' => $section->school_year ?: $this->currentSchoolYear(),
        ]);

        $section->subjects()->sync($subjectUuids);

        return back()->with('success', 'Class section updated successfully.');
    }
}
