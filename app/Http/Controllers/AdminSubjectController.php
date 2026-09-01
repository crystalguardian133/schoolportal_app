<?php

namespace App\Http\Controllers;

use App\Models\MajorSubject;
use App\Models\Subject;
use App\Models\ClassSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSubjectController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();

        $hasPermission = $user && method_exists($user, 'hasPermission') && (
            $user->hasPermission('manage subjects')
            || $user->hasPermission('manage assignments')
        );

        if (! $user || ! $hasPermission) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $user = $request->user();
        $q = $request->query('q');
        $perPage = (int) $request->query('per_page', 25);
        $majorId = $request->query('major_id');

        $subjectsQuery = Subject::query()
            ->select(['uuid', 'name', 'code', 'category', 'track', 'strand', 'level', 'description', 'major_subject_id'])
            ->with(['teachers', 'majorSubject'])
            ->when($q, fn ($query, $search) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            }))
            ->when($majorId, fn ($query, $id) => $query->where('major_subject_id', $id));

        // Advisers only see subjects linked to their section
        $hasManageSubjects = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage subjects');
        $isAdviser = $user && ! empty($user->is_adviser);

        if ($isAdviser && ! $hasManageSubjects && ! empty($user->adviser_section)) {
            $sectionUuids = ClassSection::query()
                ->where('name', $user->adviser_section)
                ->pluck('uuid');

            $subjectUuids = DB::table('class_section_subjects')
                ->whereIn('class_section_uuid', $sectionUuids)
                ->pluck('subject_uuid');

            $subjectsQuery->whereIn('uuid', $subjectUuids);
        }

        $subjects = $subjectsQuery
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Subject $subject) => [
                'uuid' => $subject->uuid,
                'name' => $subject->name,
                'code' => $subject->code,
                'category' => $subject->category,
                'track' => $subject->track,
                'strand' => $subject->strand,
                'level' => $subject->level,
                'description' => $subject->description,
                'major_subject_id' => $subject->major_subject_id,
                'major_subject' => $subject->majorSubject ? [
                    'uuid' => $subject->majorSubject->uuid,
                    'name' => $subject->majorSubject->name,
                    'code' => $subject->majorSubject->code,
                ] : null,
                'teachers' => $subject->teachers->map(fn ($teacher) => [
                    'uuid' => $teacher->uuid,
                    'name' => $teacher->name,
                    'email' => $teacher->email,
                    'pivot' => [
                        'is_substitute' => $teacher->pivot->is_substitute ?? false,
                    ],
                ]),
            ]);

        $assignableTeachers = \App\Models\User::query()
            ->where(function ($query) {
                $query->whereHas('roles', function ($q) {
                    $q->where('name', 'staff');
                })
                ->orWhereHas('roles.permissions', function ($q) {
                    $q->whereRaw('LOWER(name) = ?', ['assign subject teacher']);
                })
                ->orWhereHas('roles.permissions', function ($q) {
                    $q->whereRaw('LOWER(name) = ?', ['access admin']);
                })
                ->orWhere('is_adviser', true);
            })
            ->get(['uuid', 'name', 'email', 'profile_picture']);

        $stats = [
            'total' => Subject::query()->count(),
            'core' => Subject::query()->where('category', 'Core')->count(),
            'applied' => Subject::query()->where('category', 'Applied')->count(),
            'specialized' => Subject::query()->where('category', 'Specialized')->count(),
            'no_category' => Subject::query()->whereNull('category')->count(),
            'majors' => MajorSubject::query()->count(),
            'major_subjects' => Subject::query()->whereNotNull('major_subject_id')->count(),
        ];

        $majors = MajorSubject::query()
            ->withCount('subjects')
            ->orderBy('name')
            ->get(['uuid', 'name', 'code']);

        $allSubjects = Subject::query()
            ->orderBy('name')
            ->get(['uuid', 'name', 'code', 'category', 'track', 'strand'])
            ->map(fn (Subject $subject) => [
                'uuid' => $subject->uuid,
                'name' => $subject->name,
                'code' => $subject->code,
                'category' => $subject->category,
                'track' => $subject->track,
                'strand' => $subject->strand,
            ]);

        return inertia('admin/subjects', [
            'subjects' => $subjects,
            'assignableTeachers' => $assignableTeachers,
            'allSubjects' => $allSubjects,
            'majors' => $majors,
            'stats' => $stats,
            'filters' => [
                'q' => $q,
                'per_page' => $perPage,
                'major_id' => $majorId,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:50',
            'level' => 'nullable|string|in:jhs,shs',
            'category' => 'nullable|string|max:100',
            'track' => 'nullable|string|max:255',
            'strand' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'major_subject_id' => 'nullable|string|exists:major_subjects,uuid',
        ]);

        $level = $data['level'] ?? null;

        $subject = Subject::query()->create([
            'name' => trim($data['name']),
            'code' => $data['code'] ? strtoupper(trim($data['code'])) : null,
            'level' => $level,
            'category' => $data['category'] ? trim($data['category']) : null,
            'track' => $level === 'jhs' ? null : ($data['track'] ? trim($data['track']) : null),
            'strand' => $level === 'jhs' ? null : ($data['strand'] ? trim($data['strand']) : null),
            'description' => $data['description'] ?? null,
            'major_subject_id' => $data['major_subject_id'] ?? null,
        ]);

        return back()->with('success', 'Subject created successfully.');
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $hasManagePermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage subjects');
        $isAdviser = $user && ! empty($user->is_adviser);
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasManagePermission && ! $hasRole && ! $isAdviser)) {
            abort(403);
        }

        $data = $request->validate([
            'subject_uuid' => 'required|string',
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:50',
            'level' => 'nullable|string|in:jhs,shs',
            'category' => 'nullable|string|max:100',
            'track' => 'nullable|string|max:255',
            'strand' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'major_subject_id' => 'nullable|string|exists:major_subjects,uuid',
        ]);

        $subject = Subject::query()->where('uuid', $data['subject_uuid'])->first();

        if (! $subject) {
            return back()->with('error', 'Subject not found.');
        }

        $level = $data['level'] ?? $subject->level;

        $subject->update([
            'name' => trim($data['name']),
            'code' => $data['code'] ? strtoupper(trim($data['code'])) : null,
            'level' => $level,
            'category' => $data['category'] ? trim($data['category']) : null,
            'track' => $level === 'jhs' ? null : ($data['track'] ? trim($data['track']) : null),
            'strand' => $level === 'jhs' ? null : ($data['strand'] ? trim($data['strand']) : null),
            'description' => $data['description'] ?? null,
            'major_subject_id' => array_key_exists('major_subject_id', $data) ? ($data['major_subject_id'] ?? null) : $subject->major_subject_id,
        ]);

        return back()->with('success', 'Subject updated successfully.');
    }

    public function assignTeacher(Request $request)
    {
        $user = $request->user();
        $canAssignTeacher = $user && (
            $user->is_adviser
            || (method_exists($user, 'hasPermission') && $user->hasPermission('assign subject teacher'))
        );
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $canAssignTeacher && ! $hasRole)) {
            abort(403);
        }

        $data = $request->validate([
            'subject_uuid' => 'required|string',
            'teacher_uuid' => 'nullable|string',
            'teacher_uuids' => 'nullable|array',
            'teacher_uuids.*' => 'string',
            'is_substitute' => 'nullable|boolean',
            'reassign_from_subject_uuid' => 'nullable|string',
        ]);

        $subject = Subject::query()->where('uuid', $data['subject_uuid'])->first();

        if (! $subject) {
            return back()->with('error', 'Subject not found.');
        }

        // Reassign: detach the teacher from their source subject before attaching
        $sourceSubjectUuid = $data['reassign_from_subject_uuid'] ?? null;
        $singleTeacherUuid = $data['teacher_uuid'] ?? null;

        if (! empty($sourceSubjectUuid) && $sourceSubjectUuid !== $subject->uuid && $singleTeacherUuid) {
            DB::table('subject_teacher')
                ->where('subject_uuid', $sourceSubjectUuid)
                ->where('teacher_uuid', $singleTeacherUuid)
                ->delete();
        }

        // Collect teacher UUIDs: support both single (teacher_uuid) and batch (teacher_uuids)
        $teacherUuids = [];
        if (! empty($data['teacher_uuids']) && is_array($data['teacher_uuids'])) {
            $teacherUuids = $data['teacher_uuids'];
        } elseif (! empty($singleTeacherUuid)) {
            $teacherUuids = [$singleTeacherUuid];
        }

        foreach ($teacherUuids as $teacherUuid) {
            $exists = DB::table('subject_teacher')
                ->where('subject_uuid', $subject->uuid)
                ->where('teacher_uuid', $teacherUuid)
                ->exists();

            if (! $exists) {
                $subject->teachers()->attach($teacherUuid, [
                    'is_substitute' => $data['is_substitute'] ?? false,
                ]);
            } else {
                DB::table('subject_teacher')
                    ->where('subject_uuid', $subject->uuid)
                    ->where('teacher_uuid', $teacherUuid)
                    ->update([
                        'is_substitute' => $data['is_substitute'] ?? false,
                        'updated_at' => now(),
                    ]);
            }
        }

        return back()->with('success', 'Subject teacher assigned successfully.');
    }

    public function removeTeacher(Request $request, string $teacherUuid, string $subjectUuid)
    {
        $user = $request->user();
        $canAssignTeacher = $user && (
            $user->is_adviser
            || (method_exists($user, 'hasPermission') && $user->hasPermission('assign subject teacher'))
        );
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $canAssignTeacher && ! $hasRole)) {
            abort(403);
        }

        $deleted = DB::table('subject_teacher')
            ->where('subject_uuid', $subjectUuid)
            ->where('teacher_uuid', $teacherUuid)
            ->delete();

        if ($deleted) {
            return back()->with('success', 'Teacher removed from subject.');
        }

        return back()->with('error', 'Assignment not found.');
    }

    public function destroy(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'subject_uuid' => 'required|string',
        ]);

        $subject = Subject::query()->where('uuid', $data['subject_uuid'])->first();

        if (! $subject) {
            return back()->with('error', 'Subject not found.');
        }

        $subject->delete();

        return back()->with('success', 'Subject deleted successfully.');
    }

    public function storeMajor(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => 'required|string|max:100|unique:major_subjects,name',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $major = MajorSubject::create([
            'name' => trim($data['name']),
            'code' => $data['code'] ? strtoupper(trim($data['code'])) : null,
            'description' => $data['description'] ?? null,
        ]);

        return response()->json([
            'uuid' => $major->uuid,
            'name' => $major->name,
            'code' => $major->code,
        ], 201);
    }
}