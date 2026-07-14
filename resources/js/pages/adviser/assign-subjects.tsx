import { Head, router } from '@inertiajs/react';
import { Users, Plus, Trash2, RefreshCw, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import SearchableSelect from '@/components/searchable-select';

type Teacher = {
    uuid: string;
    name: string;
    email: string;
    is_substitute?: boolean;
};

type Subject = {
    uuid: string;
    name: string;
    code?: string | null;
    teachers: Teacher[];
};

type Section = {
    uuid: string;
    name: string;
    grade_level: string | null;
};

type Props = {
    section: Section;
    subjects: Subject[];
    assignableTeachersPerSubject: Record<string, any[]>;
    allSections?: Section[];
    hasAccessAdmin?: boolean;
};

export default function AssignSubjects({
    section: initialSection,
    subjects,
    assignableTeachersPerSubject,
    allSections = [],
    hasAccessAdmin = false,
}: Props) {
    const subjectList = useMemo(() => (Array.isArray(subjects) ? subjects : []), [subjects]);
    const assignableMap = useMemo(
        () => (assignableTeachersPerSubject ?? {}) as Record<string, any[]>,
        [assignableTeachersPerSubject],
    );

    const [currentSection] = useState(initialSection);
    const [addingToSubject, setAddingToSubject] = useState('');
    const [addTeacherUuid, setAddTeacherUuid] = useState('');
    const [isSubstitute, setIsSubstitute] = useState(false);
    const [replacing, setReplacing] = useState<{ subjectUuid: string; teacherUuid: string } | null>(null);
    const [replaceTeacherUuid, setReplaceTeacherUuid] = useState('');

    function switchSection(sectionUuid: string) {
        router.get(
            '/adviser/assign-subjects',
            { section_uuid: sectionUuid },
            { only: ['section', 'subjects', 'assignableTeachersPerSubject', 'allSections'] },
        );
    }

    function addTeacher(subjectUuid: string) {
        if (!addTeacherUuid) {
return;
}

        router.post(
            '/adviser/assign-subjects',
            {
                subject_uuid: subjectUuid,
                teacher_uuid: addTeacherUuid,
                is_substitute: isSubstitute,
                section_uuid: hasAccessAdmin ? currentSection.uuid : undefined,
            },
            {
                onSuccess: () => {
                    setAddingToSubject('');
                    setAddTeacherUuid('');
                    setIsSubstitute(false);
                    router.reload({ only: ['subjects'] });
                },
            },
        );
    }

    function removeTeacher(subjectUuid: string, teacherUuid: string) {
        const params = new URLSearchParams();

        if (hasAccessAdmin) {
params.set('section_uuid', currentSection.uuid);
}

        router.delete(
            `/adviser/assign-subjects/${teacherUuid}/${subjectUuid}?${params.toString()}`,
            {
                onSuccess: () => {
                    router.reload({ only: ['subjects'] });
                },
            },
        );
    }

    function replaceTeacher(subjectUuid: string, oldTeacherUuid: string) {
        if (!replaceTeacherUuid) {
return;
}

        const params = new URLSearchParams();

        if (hasAccessAdmin) {
params.set('section_uuid', currentSection.uuid);
}

        router.delete(
            `/adviser/assign-subjects/${oldTeacherUuid}/${subjectUuid}?${params.toString()}`,
            {
                onSuccess: () => {
                    router.post(
                        '/adviser/assign-subjects',
                        {
                            subject_uuid: subjectUuid,
                            teacher_uuid: replaceTeacherUuid,
                            is_substitute: false,
                            section_uuid: hasAccessAdmin ? currentSection.uuid : undefined,
                        },
                        {
                            onSuccess: () => {
                                setReplacing(null);
                                setReplaceTeacherUuid('');
                                router.reload({ only: ['subjects'] });
                            },
                        },
                    );
                },
            },
        );
    }

    return (
        <>
            <Head title="Assign Teachers" />
            <PortalPageShell
                title="Assign Teachers"
                description={
                    hasAccessAdmin
                        ? `Manage per-section teacher assignments.`
                        : `Manage teacher assignments for section ${currentSection.name}.`
                }
            >
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    {hasAccessAdmin && allSections.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Section
                            </label>
                            <select
                                value={currentSection.uuid}
                                onChange={(e) => switchSection(e.target.value)}
                                className="mt-1 w-full max-w-md rounded-2xl border border-input bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                            >
                                {allSections.map((s) => (
                                    <option key={s.uuid} value={s.uuid}>
                                        {s.name}
                                        {s.grade_level ? ` — ${s.grade_level}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <Users className="size-5 text-sky-600" />
                        <div>
                            <h2 className="text-lg font-semibold">
                                {currentSection.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {currentSection.grade_level ?? 'Advisory'} ·{' '}
                                {subjectList.length} subject{subjectList.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {subjectList.length === 0 && (
                        <div className="mt-5 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                            No subjects are linked to your section yet. Ask an
                            admin to assign subjects to your class section.
                        </div>
                    )}

                    {/* Per-subject cards */}
                    <div className="mt-5 space-y-4">
                        {subjectList.map((subject) => {
                            const assignedTeachers = subject.teachers ?? [];
                            const isAdding = addingToSubject === subject.uuid;
                            const isReplacing = replacing?.subjectUuid === subject.uuid;

                            return (
                                <div
                                    key={subject.uuid}
                                    className="rounded-2xl border border-border bg-muted/30 p-4"
                                >
                                    {/* Subject header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <UserCheck className="size-4 text-sky-600" />
                                            <div>
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    {subject.name}
                                                    {subject.code ? (
                                                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                                            ({subject.code})
                                                        </span>
                                                    ) : null}
                                                </h3>
                                                {assignedTeachers.length === 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        No teacher assigned
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {!isAdding && assignedTeachers.length === 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAddingToSubject(subject.uuid);
                                                    setAddTeacherUuid('');
                                                    setIsSubstitute(false);
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                                            >
                                                <Plus className="size-3.5" />
                                                Assign Teacher
                                            </button>
                                        )}
                                    </div>

                                    {/* Assigned teachers list */}
                                    {assignedTeachers.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {assignedTeachers.map((teacher) => {
                                                const isReplacingThis =
                                                    isReplacing && replacing?.teacherUuid === teacher.uuid;

                                                return (
                                                    <div
                                                        key={teacher.uuid}
                                                        className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                                                                {teacher.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-foreground">
                                                                    {teacher.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {teacher.email}
                                                                    {teacher.is_substitute ? (
                                                                        <span className="ml-1.5 text-orange-600">
                                                                            (Substitute)
                                                                        </span>
                                                                    ) : (
                                                                        <span className="ml-1.5 text-muted-foreground">
                                                                            (Primary)
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {isReplacingThis ? (
                                                                <div className="flex items-center gap-2">
                                                                    <SearchableSelect
                                                                        value={replaceTeacherUuid}
                                                                        onChange={setReplaceTeacherUuid}
                                                                        placeholder="Select replacement"
                                                                        className="w-56"
                                                                        options={(assignableMap[subject.uuid] ?? [])
                                                                            .filter((t: any) => t.uuid !== teacher.uuid)
                                                                            .map((t: any) => ({
                                                                                value: t.uuid,
                                                                                label: t.name,
                                                                                sublabel: t.email,
                                                                            }))}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            replaceTeacher(subject.uuid, teacher.uuid)
                                                                        }
                                                                        disabled={!replaceTeacherUuid}
                                                                        className="inline-flex items-center gap-1 rounded-2xl bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
                                                                    >
                                                                        <RefreshCw className="size-3" />
                                                                        Confirm
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setReplacing(null);
                                                                            setReplaceTeacherUuid('');
                                                                        }}
                                                                        className="inline-flex items-center gap-1 rounded-2xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setReplacing({
                                                                                subjectUuid: subject.uuid,
                                                                                teacherUuid: teacher.uuid,
                                                                            });
                                                                            setReplaceTeacherUuid('');
                                                                        }}
                                                                        className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                                    >
                                                                        <RefreshCw className="size-3" />
                                                                        Replace
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeTeacher(subject.uuid, teacher.uuid)
                                                                        }
                                                                        className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                                    >
                                                                        <Trash2 className="size-3" />
                                                                        Remove
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Add another teacher */}
                                            {!isAdding && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAddingToSubject(subject.uuid);
                                                        setAddTeacherUuid('');
                                                        setIsSubstitute(false);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-sky-300 hover:text-sky-600"
                                                >
                                                    <Plus className="size-3.5" />
                                                    Add Another Teacher
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Add teacher form (inline) */}
                                    {isAdding && (
                                        <div className="mt-3 space-y-3 rounded-xl border border-border bg-background p-3">
                                            <div>
                                                <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                    Select Teacher
                                                </label>
                                                <SearchableSelect
                                                    value={addTeacherUuid}
                                                    onChange={setAddTeacherUuid}
                                                    placeholder="Search for a teacher..."
                                                    className="mt-1"
                                                    options={(assignableMap[subject.uuid] ?? [])
                                                        .filter((t: any) =>
                                                            !assignedTeachers.some((a: any) => a.uuid === t.uuid),
                                                        )
                                                        .map((t: any) => ({
                                                            value: t.uuid,
                                                            label: t.name,
                                                            sublabel: t.email,
                                                        }))}
                                                />
                                            </div>

                                            <label className="flex items-center gap-2 text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={isSubstitute}
                                                    onChange={(e) => setIsSubstitute(e.target.checked)}
                                                    className="h-4 w-4 rounded border-input"
                                                />
                                                Assign as substitute teacher
                                            </label>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => addTeacher(subject.uuid)}
                                                    disabled={!addTeacherUuid}
                                                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
                                                >
                                                    <Plus className="mr-1.5 inline size-3.5" />
                                                    Assign
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAddingToSubject('');
                                                        setAddTeacherUuid('');
                                                    }}
                                                    className="rounded-2xl border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </PortalPageShell>
        </>
    );
}
