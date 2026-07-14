<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Subject;
use App\Models\User;
use App\Models\ClassSection;
use Illuminate\Support\Facades\DB;

class AdviserAssignmentController extends Controller
{
    private function authorizeAdviser(Request $request): User
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $hasAccessAdmin = method_exists($user, 'hasPermission') && $user->hasPermission('access admin');
        $hasAssignSubjects = method_exists($user, 'hasPermission') && $user->hasPermission('assign subjects');
        $isAdviser = ! empty($user->is_adviser) && ! empty($user->adviser_section);

        if (! $hasAccessAdmin && ! $hasAssignSubjects && ! $isAdviser) {
            abort(403);
        }

        return $user;
    }

    private function getAdviserSection(User $user): ?ClassSection
    {
        return ClassSection::query()
            ->where('name', $user->adviser_section)
            ->first();
    }

    public function index(Request $request): Response
    {
        $user = $this->authorizeAdviser($request);

        $hasAccessAdmin = method_exists($user, 'hasPermission') && $user->hasPermission('access admin');
        $hasAssignSubjects = method_exists($user, 'hasPermission') && $user->hasPermission('assign subjects');
        $canSwitchSections = $hasAccessAdmin || $hasAssignSubjects;
        $section = null;

        if ($canSwitchSections && $request->query('section_uuid')) {
            $section = ClassSection::query()->where('uuid', $request->query('section_uuid'))->first();
        } else {
            $section = $this->getAdviserSection($user);
        }

        if (! $section) {
            abort(404);
        }

        // Get subjects linked to this section
        $subjectUuids = DB::table('class_section_subjects')
            ->where('class_section_uuid', $section->uuid)
            ->pluck('subject_uuid');

        // Get section-specific teacher assignments from the new table
        $sectionAssignments = DB::table('class_section_subject_teacher')
            ->where('class_section_uuid', $section->uuid)
            ->get()
            ->keyBy(fn ($row) => $row->subject_uuid);

        $subjects = Subject::query()
            ->select(['uuid', 'name', 'code'])
            ->whereIn('uuid', $subjectUuids)
            ->orderBy('name')
            ->get()
            ->map(function (Subject $subject) use ($sectionAssignments) {
                $assignment = $sectionAssignments->get($subject->uuid);

                $teachers = [];
                if ($assignment) {
                    $teacher = User::query()->where('uuid', $assignment->teacher_uuid)->first();
                    if ($teacher) {
                        $teachers[] = [
                            'uuid' => $teacher->uuid,
                            'name' => $teacher->name,
                            'email' => $teacher->email,
                            'is_substitute' => $assignment->is_substitute,
                        ];
                    }
                }

                return [
                    'uuid' => $subject->uuid,
                    'name' => $subject->name,
                    'code' => $subject->code,
                    'teachers' => $teachers,
                ];
            })
            ->values();

        // For each subject, find teachers eligible to teach it (per-section or global)
        $sectionSubjectTeachers = DB::table('class_section_subject_teacher')
            ->where('class_section_uuid', $section->uuid)
            ->whereIn('subject_uuid', $subjectUuids)
            ->get()
            ->groupBy('subject_uuid');

        $globalSubjectTeachers = DB::table('subject_teacher')
            ->whereIn('subject_uuid', $subjectUuids)
            ->get()
            ->groupBy('subject_uuid');

        $assignableTeacherUuidsPerSubject = [];
        foreach ($subjectUuids as $subjectUuid) {
            $sectionUuids = isset($sectionSubjectTeachers[$subjectUuid])
                ? $sectionSubjectTeachers[$subjectUuid]->pluck('teacher_uuid')->toArray()
                : [];
            $globalUuids = isset($globalSubjectTeachers[$subjectUuid])
                ? $globalSubjectTeachers[$subjectUuid]->pluck('teacher_uuid')->toArray()
                : [];
            $assignableTeacherUuidsPerSubject[$subjectUuid] = array_values(array_unique(array_merge($sectionUuids, $globalUuids)));
        }

        // Collect all unique teacher UUIDs across all subjects for a single query
        $allTeacherUuids = array_unique(array_merge(...array_values($assignableTeacherUuidsPerSubject)));
        $allTeachers = User::query()
            ->whereIn('uuid', $allTeacherUuids)
            ->get(['uuid', 'name', 'email', 'profile_picture'])
            ->keyBy('uuid');

        // Build per-subject assignable teacher lists
        $assignableTeachersPerSubject = [];
        foreach ($assignableTeacherUuidsPerSubject as $subjectUuid => $uuids) {
            $assignableTeachersPerSubject[$subjectUuid] = collect($uuids)
                ->map(fn ($uuid) => $allTeachers->get($uuid))
                ->filter()
                ->values()
                ->toArray();
        }

        return Inertia::render('adviser/assign-subjects', [
            'section' => [
                'uuid' => $section->uuid,
                'name' => $section->name,
                'grade_level' => $section->grade_level,
            ],
            'subjects' => $subjects,
            'assignableTeachersPerSubject' => $assignableTeachersPerSubject,
            'allSections' => $canSwitchSections ? ClassSection::query()->select(['uuid', 'name', 'grade_level'])->orderBy('name')->get() : [],
            'hasAccessAdmin' => $canSwitchSections,
        ]);
    }

    public function assignTeacher(Request $request)
    {
        $user = $this->authorizeAdviser($request);

        $data = $request->validate([
            'subject_uuid' => 'required|string',
            'teacher_uuid' => 'required|string',
            'is_substitute' => 'nullable|boolean',
            'section_uuid' => 'nullable|string',
        ]);

        $hasAccessAdmin = method_exists($user, 'hasPermission') && $user->hasPermission('access admin');
        $hasAssignSubjects = method_exists($user, 'hasPermission') && $user->hasPermission('assign subjects');
        $canSwitchSections = $hasAccessAdmin || $hasAssignSubjects;

        $section = null;
        if ($canSwitchSections && ! empty($data['section_uuid'])) {
            $section = ClassSection::query()->where('uuid', $data['section_uuid'])->first();
        } else {
            $section = $this->getAdviserSection($user);
        }

        if (! $section) {
            return back()->with('error', 'Section not found.');
        }

        // Verify subject belongs to adviser's section
        $isLinked = DB::table('class_section_subjects')
            ->where('class_section_uuid', $section->uuid)
            ->where('subject_uuid', $data['subject_uuid'])
            ->exists();

        if (! $isLinked) {
            return back()->with('error', 'Subject is not part of your section.');
        }

        // Upsert into the per-section table
        DB::table('class_section_subject_teacher')->updateOrInsert(
            [
                'class_section_uuid' => $section->uuid,
                'subject_uuid' => $data['subject_uuid'],
            ],
            [
                'teacher_uuid' => $data['teacher_uuid'],
                'is_substitute' => $data['is_substitute'] ?? false,
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );

        return back()->with('success', 'Teacher assigned successfully.');
    }

    public function removeTeacher(Request $request, string $teacherUuid, string $subjectUuid)
    {
        $user = $this->authorizeAdviser($request);

        $hasAccessAdmin = method_exists($user, 'hasPermission') && $user->hasPermission('access admin');
        $hasAssignSubjects = method_exists($user, 'hasPermission') && $user->hasPermission('assign subjects');
        $canSwitchSections = $hasAccessAdmin || $hasAssignSubjects;

        $section = null;
        if ($canSwitchSections && $request->query('section_uuid')) {
            $section = ClassSection::query()->where('uuid', $request->query('section_uuid'))->first();
        } else {
            $section = $this->getAdviserSection($user);
        }

        if (! $section) {
            return back()->with('error', 'Section not found.');
        }

        // Verify subject belongs to adviser's section
        $isLinked = DB::table('class_section_subjects')
            ->where('class_section_uuid', $section->uuid)
            ->where('subject_uuid', $subjectUuid)
            ->exists();

        if (! $isLinked) {
            return back()->with('error', 'Subject is not part of your section.');
        }

        $deleted = DB::table('class_section_subject_teacher')
            ->where('class_section_uuid', $section->uuid)
            ->where('subject_uuid', $subjectUuid)
            ->where('teacher_uuid', $teacherUuid)
            ->delete();

        if ($deleted) {
            return back()->with('success', 'Teacher removed from subject.');
        }

        return back()->with('error', 'Assignment not found.');
    }
}
