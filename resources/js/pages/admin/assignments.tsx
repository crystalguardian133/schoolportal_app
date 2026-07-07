import { Head, router } from '@inertiajs/react';
import { ArrowRightLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ReassignAssignmentModal from '@/components/admin/reassign-assignment-modal';

function toArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (value && Array.isArray(value.data)) {
        return value.data;
    }

    if (value && typeof value === 'object') {
        return Object.values(value);
    }

    return [];
}

export default function Assignments({ subjects, teachers }) {
    const subjectList = toArray(subjects);
    const teacherList = toArray(teachers);
    const [selectedSubjectUuid, setSelectedSubjectUuid] = useState(subjectList[0]?.uuid ?? '');
    const [rows, setRows] = useState(() =>
        subjectList.map((subject) => ({ subject_uuid: subject.uuid, teacher_uuid: subject.subject_teacher_uuid ?? null }))
    );
    const [reassignState, setReassignState] = useState({
        open: false,
        teacher: null,
        sourceSubject: null,
    });

    const selectedSubjectIndex = subjectList.findIndex((subject) => subject.uuid === selectedSubjectUuid);
    const selectedSubject = subjectList[selectedSubjectIndex] ?? subjectList[0] ?? null;
    const selectedRow = rows[selectedSubjectIndex] ?? rows[0] ?? null;
    const selectedTeacher = teacherList.find((teacher) => teacher.uuid === selectedRow?.teacher_uuid) ?? null;
    const assignedTeachers = selectedTeacher ? [selectedTeacher] : [];
    const assignedCount = rows.filter((row) => row.teacher_uuid).length;
    const unassignedCount = rows.length - assignedCount;

    function setTeacher(idx, teacherUuid) {
        const copy = [...rows];

        if (!copy[idx]) {
return;
}

        copy[idx].teacher_uuid = teacherUuid;
        setRows(copy);
    }

    function save(idx) {
        const row = rows[idx];

        if (!row) {
return;
}

        router.post('/admin/assignments', row);
    }

    function removeAssignment(idx) {
        const row = rows[idx];

        if (!row) {
return;
}

        const removedTeacherUuid = row.teacher_uuid;

        router.post('/admin/assignments', {
            subject_uuid: row.subject_uuid,
            teacher_uuid: null,
        }, {
            preserveScroll: true,
        });

        const copy = [...rows];
        copy[idx] = { ...copy[idx], teacher_uuid: null };
        setRows(copy);

        if (reassignState.teacher?.uuid === removedTeacherUuid) {
            setReassignState({ open: false, teacher: null, sourceSubject: null });
        }
    }

    function openReassignModal(idx) {
        const row = rows[idx];

        if (!row || !row.teacher_uuid) {
return;
}

        const teacher = teacherList.find((item) => item.uuid === row.teacher_uuid) ?? null;
        const sourceSubject = subjectList[idx] ?? null;

        if (!teacher || !sourceSubject) {
return;
}

        setReassignState({
            open: true,
            teacher,
            sourceSubject,
        });
    }

    function handleReassigned(targetSubjectUuid) {
        const sourceSubjectUuid = reassignState.sourceSubject?.uuid;
        const teacherUuid = reassignState.teacher?.uuid;

        if (!sourceSubjectUuid || !teacherUuid) {
            return;
        }

        const copy = [...rows];
        const sourceIndex = copy.findIndex((row) => row.subject_uuid === sourceSubjectUuid);
        const targetIndex = copy.findIndex((row) => row.subject_uuid === targetSubjectUuid);

        if (sourceIndex >= 0) {
            copy[sourceIndex] = { ...copy[sourceIndex], teacher_uuid: null };
        }

        if (targetIndex >= 0) {
            copy[targetIndex] = { ...copy[targetIndex], teacher_uuid: teacherUuid };
        }

        setRows(copy);
    }

    return (
        <div className="min-h-screen bg-background px-4 py-6 text-foreground">
            <Head title="Assignments" />

            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                    <div className="relative px-6 py-8 sm:px-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(148,163,184,0.08),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(100,116,139,0.06),_transparent_34%)]" />
                        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl space-y-3">
                                <div className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                    Administrative Tools
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Assign Teachers to Subjects</h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Use the subject dropdown to focus on one subject at a time while keeping the assigned teachers visible in a compact table.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
                                <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Subjects</div>
                                    <div className="mt-1 text-2xl font-semibold">{rows.length}</div>
                                </div>
                                <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Assigned</div>
                                    <div className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{assignedCount}</div>
                                </div>
                                <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Unassigned</div>
                                    <div className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">{unassignedCount}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                        <div className="space-y-1">
                            <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Subject Picker</div>
                            <h2 className="text-xl font-semibold">Choose a subject</h2>
                            <p className="text-sm text-muted-foreground">Switch subjects from the dropdown and update the assigned teacher without scrolling.</p>
                        </div>

                        <div className="mt-5 space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject</label>
                            <select
                                value={selectedSubjectUuid}
                                onChange={(e) => setSelectedSubjectUuid(e.target.value)}
                                className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                            >
                                {subjectList.map((subject) => (
                                    <option key={subject.uuid} value={subject.uuid}>
                                        {subject.name}{subject.code ? ` (${subject.code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-5 rounded-2xl border border-border bg-muted/50 p-4">
                            <div className="text-sm font-medium text-foreground">Selected Subject</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                                {selectedSubject?.name}{selectedSubject?.code ? ` • ${selectedSubject.code}` : ''}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">To reassign, choose a different subject from the dropdown and save a different teacher.</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground border border-border">Subjects: {subjectList.length}</span>
                                <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-border">Assigned: {assignedCount}</span>
                                <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 border border-border">Unassigned: {unassignedCount}</span>
                            </div>
                        </div>

                        <div className="mt-5 flex items-end gap-3">
                            <div className="min-w-0 flex-1">
                                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Teacher</label>
                                <select
                                    value={selectedRow?.teacher_uuid ?? ''}
                                    onChange={(e) => setTeacher(selectedSubjectIndex >= 0 ? selectedSubjectIndex : 0, e.target.value || null)}
                                    className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                                >
                                    <option value="">(unassigned)</option>
                                    {teacherList.map((teacher) => (
                                        <option key={teacher.uuid} value={teacher.uuid}>{teacher.name} — {teacher.email}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => save(selectedSubjectIndex >= 0 ? selectedSubjectIndex : 0)}
                                className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-ring/20"
                            >
                                Save
                            </button>
                        </div>
                    </article>

                    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Assigned Teachers</div>
                                <h2 className="text-xl font-semibold">Current subject assignments</h2>
                            </div>
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                {assignedTeachers.length} teacher{assignedTeachers.length === 1 ? '' : 's'}
                            </span>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                            <table className="min-w-full divide-y divide-border text-left text-sm">
                                <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Teacher</th>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                        <th className="px-4 py-3 font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {assignedTeachers.length > 0 ? assignedTeachers.map((teacher) => (
                                        <tr key={teacher.uuid} className="hover:bg-muted/60 align-top">
                                            <td className="px-4 py-3 font-medium text-foreground">{teacher.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{teacher.email}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAssignment(selectedSubjectIndex >= 0 ? selectedSubjectIndex : 0)}
                                                        className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        Remove
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => openReassignModal(selectedSubjectIndex >= 0 ? selectedSubjectIndex : 0)}
                                                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                                                    >
                                                        <ArrowRightLeft className="size-3.5" />
                                                        Reassign
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">No teacher assigned yet for this subject.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {selectedTeacher ? (
                            <div className="mt-4 rounded-2xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                                Preview: <span className="font-medium text-foreground">{selectedTeacher.name}</span> is currently selected in the editor.
                                <div className="mt-3 text-xs text-muted-foreground">
                                    Use the table actions to remove this teacher or move them to another subject.
                                </div>
                            </div>
                        ) : null}
                    </article>
                </section>
            </div>

            <ReassignAssignmentModal
                open={reassignState.open}
                onOpenChange={(open) => setReassignState((current) => ({ ...current, open }))}
                teacher={reassignState.teacher}
                sourceSubject={reassignState.sourceSubject}
                subjects={subjectList}
                onReassigned={handleReassigned}
            />
        </div>
    );
}
