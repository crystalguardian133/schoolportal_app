import { Head, router } from '@inertiajs/react';
import { ArrowRightLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ReassignAssignmentModal from '@/components/admin/reassign-assignment-modal';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

type Teacher = {
    uuid: string;
    name: string;
    email: string;
    profile_picture?: string | null;
    is_substitute?: boolean;
};

type Subject = {
    uuid: string;
    name: string;
    code?: string | null;
    teachers: Teacher[];
};

function TeachersListModal({ open, onOpenChange, subject, onRemoveTeacher }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject: Subject | null;
    onRemoveTeacher: (teacherUuid: string) => void;
}) {
    if (!subject) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Teachers for {subject.name}</DialogTitle>
                <div className="mt-4 space-y-2">
                    {subject.teachers.length > 0 ? (
                        subject.teachers.map((teacher) => (
                            <div
                                key={teacher.uuid}
                                className="flex items-center justify-between rounded-lg border p-3"
                            >
                                <div className="flex items-center gap-3">
                                    {teacher.profile_picture ? (
                                        <img
                                            src={`/assets/profile_pictures/${teacher.profile_picture.replace('profile_pictures/', '')}`}
                                            alt={teacher.name}
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-medium">
                                            {teacher.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium">
                                            {teacher.name}
                                            {teacher.is_substitute && ' (Substitute)'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {teacher.email}
                                        </div>
                                    </div>
                                </div>
                                <DialogClose asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRemoveTeacher(teacher.uuid)}
                                        className="text-red-500"
                                    >
                                        Remove
                                    </Button>
                                </DialogClose>
                            </div>
                        ))
                    ) : (
                        <div className="text-muted-foreground">No teachers assigned.</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function Assignments({ subjects, teachers }) {
    const subjectList: Subject[] = (toArray(subjects) || []).map((s: any) => ({
        ...s,
        teachers: s.teachers || [],
    }));
    const teacherList: Teacher[] = toArray(teachers);

    const [selectedSubjectUuid, setSelectedSubjectUuid] = useState(
        subjectList[0]?.uuid ?? '',
    );
    const [selectedTeacherUuid, setSelectedTeacherUuid] = useState<string | ''>('');
    const [isSubstitute, setIsSubstitute] = useState(false);
    const [teacherListModalOpen, setTeacherListModalOpen] = useState(false);
    const [reassignState, setReassignState] = useState({
        open: false,
        teacher: null,
        sourceSubject: null,
    });

    const selectedSubjectIndex = subjectList.findIndex(
        (subject) => subject.uuid === selectedSubjectUuid,
    );
    const selectedSubject =
        subjectList[selectedSubjectIndex] ?? subjectList[0] ?? null;
    const assignedTeachers = selectedSubject?.teachers ?? [];
    const assignedCount = subjectList.filter(
        (s) => s.teachers.length > 0,
    ).length;
    const unassignedCount = subjectList.length - assignedCount;

    function addTeacher() {
        if (!selectedSubject || !selectedTeacherUuid) return;

        router.post(
            '/admin/assignments',
            {
                subject_uuid: selectedSubject.uuid,
                teacher_uuid: selectedTeacherUuid,
                is_substitute: isSubstitute,
            },
            {
                onSuccess: () => {
                    router.reload({ only: ['subjects'] });
                    setSelectedTeacherUuid('');
                    setIsSubstitute(false);
                },
            },
        );
    }

    function removeTeacher(teacherUuid: string) {
        if (!selectedSubject) return;

        router.post(
            '/admin/assignments',
            {
                subject_uuid: selectedSubject.uuid,
                teacher_uuid: null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['subjects'] });
                },
            },
        );

        if (reassignState.teacher?.uuid === teacherUuid) {
            setReassignState({
                open: false,
                teacher: null,
                sourceSubject: null,
            });
        }
    }

    function openReassignModal(teacher: Teacher) {
        setReassignState({
            open: true,
            teacher,
            sourceSubject: selectedSubject,
        });
    }

    function handleReassigned(targetSubjectUuid: string) {
        const sourceSubjectUuid = reassignState.sourceSubject?.uuid;
        const teacherUuid = reassignState.teacher?.uuid;

        if (!sourceSubjectUuid || !teacherUuid) {
            return;
        }

        router.reload({ only: ['subjects'] });

        setReassignState({
            open: false,
            teacher: null,
            sourceSubject: null,
        });
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
                                <div className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                    Administrative Tools
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Assign Teachers to Subjects
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Use the subject dropdown to focus on one
                                    subject at a time while keeping the assigned
                                    teachers visible in a compact table.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
                                <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                    <div className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Subjects
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold">
                                        {subjectList.length}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                    <div className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Assigned
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                                        {assignedCount}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                    <div className="text-xs tracking-wide text-muted-foreground uppercase">
                                        Unassigned
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                                        {unassignedCount}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                        <div className="space-y-1">
                            <div className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                Subject Picker
                            </div>
                            <h2 className="text-xl font-semibold">
                                Choose a subject
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Switch subjects from the dropdown and update the
                                assigned teachers without scrolling.
                            </p>
                        </div>

                        <div className="mt-5 space-y-2">
                            <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Subject
                            </label>
                            <select
                                value={selectedSubjectUuid}
                                onChange={(e) =>
                                    setSelectedSubjectUuid(e.target.value)
                                }
                                className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                            >
                                {subjectList.map((subject) => (
                                    <option
                                        key={subject.uuid}
                                        value={subject.uuid}
                                    >
                                        {subject.name}
                                        {subject.code ? ` (${subject.code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-5 space-y-4 rounded-2xl border border-border bg-muted/50 p-4">
                            <div>
                                <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Add Teacher
                                </label>
                                <select
                                    value={selectedTeacherUuid}
                                    onChange={(e) =>
                                        setSelectedTeacherUuid(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                >
                                    <option value="">Select a teacher</option>
                                    {teacherList.map((teacher) => (
                                        <option
                                            key={teacher.uuid}
                                            value={teacher.uuid}
                                        >
                                            {teacher.name} — {teacher.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <label className="flex items-center gap-2 text-xs">
                                <input
                                    type="checkbox"
                                    checked={isSubstitute}
                                    onChange={(e) =>
                                        setIsSubstitute(e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-input"
                                />
                                Assign as substitute teacher
                            </label>

                            <button
                                type="button"
                                onClick={addTeacher}
                                disabled={!selectedTeacherUuid}
                                className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 focus:ring-4 focus:ring-ring/20 focus:outline-none disabled:opacity-50"
                            >
                                <Plus className="mr-2 inline h-4 w-4" />
                                Add Teacher
                            </button>
                        </div>

                        <div className="mt-5 rounded-2xl border border-border bg-muted/50 p-4">
                            <div className="text-sm font-medium text-foreground">
                                Selected Subject
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                                {selectedSubject?.name}
                                {selectedSubject?.code
                                    ? ` • ${selectedSubject.code}`
                                    : ''}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Add teachers using the form above. Use the table
                                on the right to view and manage assignments.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                    Subjects: {subjectList.length}
                                </span>
                                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    Assigned: {assignedCount}
                                </span>
                                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                    Unassigned: {unassignedCount}
                                </span>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                    Assigned Teachers
                                </div>
                                <h2 className="text-xl font-semibold">
                                    Current subject assignments
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                    {assignedTeachers.length} teacher
                                    {assignedTeachers.length === 1 ? '' : 's'}
                                </span>
                                {assignedTeachers.length >= 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setTeacherListModalOpen(true)}
                                        className="rounded-2xl bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                                    >
                                        View all
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                            <table className="min-w-full divide-y divide-border text-left text-sm">
                                <thead className="bg-muted text-xs tracking-wide text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Teacher
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {assignedTeachers.length > 0 ? (
                                        assignedTeachers.map((teacher) => (
                                            <tr
                                                key={teacher.uuid}
                                                className="align-top hover:bg-muted/60"
                                            >
                                                <td className="px-4 py-3 font-medium text-foreground">
                                                    {teacher.profile_picture ? (
                                                        <img
                                                            src={`/assets/profile_pictures/${teacher.profile_picture.replace('profile_pictures/', '')}`}
                                                            alt={teacher.name}
                                                            className="mr-2 inline h-5 w-5 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                                                            {teacher.name.charAt(0)}
                                                        </span>
                                                    )}
                                                    {teacher.name}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {teacher.email}
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    {teacher.is_substitute ? (
                                                        <span className="text-orange-600">
                                                            Substitute
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Primary
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeTeacher(
                                                                    teacher.uuid,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            Remove
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openReassignModal(
                                                                    teacher,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                                                        >
                                                            <ArrowRightLeft className="size-3.5" />
                                                            Reassign
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-10 text-center text-sm text-muted-foreground"
                                            >
                                                No teachers assigned yet for this
                                                subject.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {assignedTeachers.length > 0 ? (
                            <div className="mt-4 rounded-2xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    {assignedTeachers.length} teacher
                                    {assignedTeachers.length === 1 ? '' : 's'}{' '}
                                    assigned
                                </span>{' '}
                                to this subject.
                                <div className="mt-3 text-xs text-muted-foreground">
                                    Use the table actions to remove a teacher or
                                    reassign them to another subject.
                                </div>
                            </div>
                        ) : null}
                    </article>
                </section>
            </div>

            <ReassignAssignmentModal
                open={reassignState.open}
                onOpenChange={(open) =>
                    setReassignState((current) => ({ ...current, open }))
                }
                teacher={reassignState.teacher}
                sourceSubject={reassignState.sourceSubject}
                subjects={subjectList}
                onReassigned={handleReassigned}
            />
            
            <TeachersListModal
                open={teacherListModalOpen}
                onOpenChange={setTeacherListModalOpen}
                subject={selectedSubject}
                onRemoveTeacher={(teacherUuid) => removeTeacher(teacherUuid)}
            />
        </div>
    );
}