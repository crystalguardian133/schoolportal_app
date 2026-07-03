<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Subject;
use App\Models\StudentSubject;

class TeacherGradeController extends Controller
{
    public function update(Request $request, string $classId)
    {
        $user = $request->user();

        $subject = Subject::query()->where('uuid', $classId)->first();
        if (! $subject) {
            return redirect()->back()->with('error', 'Subject not found');
        }

        // Authorization: only admin or assigned teacher can update
        if (! $user->hasRole('admin')) {
            if (empty($subject->subject_teacher_uuid) || $subject->subject_teacher_uuid !== $user->uuid) {
                return redirect()->back()->with('error', 'Forbidden');
            }
        }

        $data = $request->validate([
            'grades' => 'required|array',
            'grades.*.studentId' => 'required|string',
            'grades.*.q1' => 'nullable|integer|min:0|max:100',
            'grades.*.q2' => 'nullable|integer|min:0|max:100',
            'grades.*.q3' => 'nullable|integer|min:0|max:100',
        ]);

        DB::beginTransaction();

        try {
            foreach ($data['grades'] as $row) {
                $studentId = $row['studentId'];

                $enr = StudentSubject::query()
                    ->where('subject_uuid', $subject->uuid)
                    ->whereHas('student', function ($q) use ($studentId) {
                        $q->where('student_id', $studentId);
                    })
                    ->first();

                if (! $enr) {
                    // skip missing enrollment
                    continue;
                }

                $enr->q1 = $row['q1'] ?? $enr->q1;
                $enr->q2 = $row['q2'] ?? $enr->q2;
                $enr->q3 = $row['q3'] ?? $enr->q3;
                $enr->total = (int) round((($enr->q1 ?? 0) + ($enr->q2 ?? 0) + ($enr->q3 ?? 0)) / 3);
                $enr->save();
            }

            DB::commit();
            return redirect()->back()->with('success', 'Grades updated');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Grade update failed: '.$e->getMessage());
            return redirect()->back()->with('error', 'Failed to update grades');
        }
    }
}
