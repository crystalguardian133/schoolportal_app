<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Subject;
use App\Models\User;

class AdminAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (! $user || ! $user->hasRole('admin')) {
            abort(403);
        }

        $teachers = User::query()->whereHas('roles', function ($q) {
            $q->where('name', 'staff');
        })->get(['uuid', 'name', 'email', 'is_adviser', 'adviser_section']);

        $teacherMap = $teachers->keyBy('uuid');

        $subjects = Subject::query()
            ->orderBy('name', 'asc')
            ->get(['uuid', 'name', 'code', 'subject_teacher_uuid'])
            ->map(function (Subject $subject) use ($teacherMap) {
                $assignedTeacher = $subject->subject_teacher_uuid ? $teacherMap->get($subject->subject_teacher_uuid) : null;

                return [
                    'uuid' => $subject->uuid,
                    'name' => $subject->name,
                    'code' => $subject->code,
                    'subject_teacher_uuid' => $subject->subject_teacher_uuid,
                    'assigned_teachers' => $assignedTeacher ? [[
                        'uuid' => $assignedTeacher->uuid,
                        'name' => $assignedTeacher->name,
                        'email' => $assignedTeacher->email,
                    ]] : [],
                ];
            })
            ->values();

        return Inertia::render('admin/assignments', [
            'subjects' => $subjects,
            'teachers' => $teachers,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        if (! $user || ! $user->hasRole('admin')) {
            abort(403);
        }

        $data = $request->validate([
            'subject_uuid' => 'required|string',
            'teacher_uuid' => 'nullable|string',
            'reassign_from_subject_uuid' => 'nullable|string',
            'is_adviser' => 'nullable|boolean',
            'adviser_section' => 'nullable|string',
        ]);

        $subject = Subject::query()->where('uuid', $data['subject_uuid'])->first();
        if (! $subject) {
            return back()->with('error', 'Subject not found');
        }

        $sourceSubjectUuid = $data['reassign_from_subject_uuid'] ?? null;

        if (! empty($sourceSubjectUuid) && $sourceSubjectUuid !== $subject->uuid) {
            $sourceSubject = Subject::query()->where('uuid', $sourceSubjectUuid)->first();

            if ($sourceSubject) {
                $sourceSubject->subject_teacher_uuid = null;
                $sourceSubject->save();
            }
        }

        $subject->subject_teacher_uuid = $data['teacher_uuid'] ?? null;
        $subject->save();

        if (! empty($data['teacher_uuid'])) {
            $teacher = User::query()->where('uuid', $data['teacher_uuid'])->first();
            if ($teacher) {
                $teacher->is_adviser = $data['is_adviser'] ?? false;
                $teacher->adviser_section = $data['adviser_section'] ?? null;
                $teacher->save();
            }
        }

        return back()->with('success', 'Assignment updated');
    }
}
