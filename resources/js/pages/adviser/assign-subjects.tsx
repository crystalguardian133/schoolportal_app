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
    units: number;
    teachers: Teacher[];
};

type Section = {
    uuid: string;
    name: string;
    grade_level: string | null;
};

type Props = {
    section?: Section | null;
    subjects: Subject[];
    assignableTeachersPerSubject: Record<string, any[]>;
    teacherWorkloads?: Record<string, number>;
    allSections?: Section[];
    hasAccessAdmin?: boolean;
};

export default function AssignSubjects({
    section: initialSection,
    subjects,
    assignableTeachersPerSubject,
    teacherWorkloads = {},
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
                section_uuid: hasAccessAdmin ? currentSection!.uuid : undefined,
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
params.set('section_uuid', currentSection!.uuid);
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
                            section_uuid: hasAccessAdmin ? currentSection!.uuid : undefined,
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

    if (!currentSection) {
        return (
            <>
                <Head title="Assign Teachers" />
                <PortalPageShell title="Assign Teachers" description="Manage per-section teacher assignments.">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-12 text-center shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-medium text-foreground">No class sections found</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {hasAccessAdmin
                                ? "Please create a class section first before assigning subjects."
                                : "You have not been assigned to a class section."}
                        </p>
                    </div>
                </PortalPageShell>
            </>
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

                    {/* Per-subject table */}
                    <div className="mt-5 overflow-auto rounded-2xl border border-sidebar-border/70 shadow-sm">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm text-left">
                            <thead className="bg-sidebar/60 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Code</th>
                                    <th className="px-4 py-3 font-medium">Subject</th>
                                    <th className="px-4 py-3 font-medium text-center">Units</th>
                                    <th className="px-4 py-3 font-medium">Assigned Teacher</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                {subjectList.map((subject) => {
                                    const assignedTeachers = subject.teachers ?? [];
                                    const isAdding = addingToSubject === subject.uuid;
                                    const isReplacing = replacing?.subjectUuid === subject.uuid;
                                    const hasNoTeacher = assignedTeachers.length === 0;

                                    return (
                                        <tr key={subject.uuid} className={hasNoTeacher ? 'bg-red-50/50 dark:bg-red-950/20' : 'hover:bg-sidebar-accent/40'}>
                                            <td className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{subject.code || '-'}</td>
                                            <td className="px-4 py-3 font-semibold text-foreground">{subject.name}</td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{subject.units}</td>
                                            <td className="px-4 py-3">
                                                {assignedTeachers.length > 0 ? (
                                                    <div className="flex flex-col gap-3">
                                                        {assignedTeachers.map((teacher) => {
                                                            const isReplacingThis = isReplacing && replacing?.teacherUuid === teacher.uuid;
                                                            return (
                                                                <div key={teacher.uuid} className="flex flex-col gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                                                                            {teacher.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-sm font-medium">{teacher.name}</span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {teacher.is_substitute ? <span className="text-orange-600">(Substitute)</span> : '(Primary)'}
                                                                            </span>
                                                                        </div>
                                                                        {!isReplacingThis && (
                                                                            <div className="ml-auto flex items-center gap-1">
                                                                                <button type="button" onClick={() => { setReplacing({ subjectUuid: subject.uuid, teacherUuid: teacher.uuid }); setReplaceTeacherUuid(''); }} className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground rounded transition">
                                                                                    <RefreshCw className="size-3.5" />
                                                                                </button>
                                                                                <button type="button" onClick={() => removeTeacher(subject.uuid, teacher.uuid)} className="p-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition dark:hover:bg-red-950/30">
                                                                                    <Trash2 className="size-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {isReplacingThis && (
                                                                        <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-muted/40 border border-border">
                                                                            <div className="flex-1 min-w-[200px]">
                                                                                <SearchableSelect
                                                                                    value={replaceTeacherUuid}
                                                                                    onChange={setReplaceTeacherUuid}
                                                                                    placeholder="Select replacement"
                                                                                    options={(assignableMap[subject.uuid] ?? []).filter((t: any) => t.uuid !== teacher.uuid).map((t: any) => {
                                                                                        const currentUnits = teacherWorkloads[t.uuid] || 0;
                                                                                        const overloaded = currentUnits + subject.units > 30;
                                                                                        return {
                                                                                            value: t.uuid,
                                                                                            label: overloaded ? `⚠️ ${t.name}` : t.name,
                                                                                            sublabel: `${currentUnits} units assigned. ${overloaded ? 'Overload warning.' : ''}`,
                                                                                        };
                                                                                    })}
                                                                                />
                                                                            </div>
                                                                            <button type="button" onClick={() => replaceTeacher(subject.uuid, teacher.uuid)} disabled={!replaceTeacherUuid} className="rounded bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50 transition">Confirm</button>
                                                                            <button type="button" onClick={() => { setReplacing(null); setReplaceTeacherUuid(''); }} className="rounded border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition">Cancel</button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-red-600 font-medium flex items-center gap-1">⚠️ No teacher assigned</span>
                                                )}
                                                
                                                {/* Add teacher form (inline) */}
                                                {isAdding && (
                                                    <div className="mt-3 p-3 rounded-xl border border-border bg-muted/30">
                                                        <SearchableSelect
                                                            value={addTeacherUuid}
                                                            onChange={setAddTeacherUuid}
                                                            placeholder="Select teacher..."
                                                            options={(assignableMap[subject.uuid] ?? []).filter((t: any) => !assignedTeachers.some((a: any) => a.uuid === t.uuid)).map((t: any) => {
                                                                const currentUnits = teacherWorkloads[t.uuid] || 0;
                                                                const overloaded = currentUnits + subject.units > 30;
                                                                return {
                                                                    value: t.uuid,
                                                                    label: overloaded ? `⚠️ ${t.name}` : t.name,
                                                                    sublabel: `${currentUnits} units assigned. ${overloaded ? 'Overload warning.' : ''}`,
                                                                };
                                                            })}
                                                        />
                                                        <div className="mt-3 flex items-center gap-2 text-xs">
                                                            <input type="checkbox" checked={isSubstitute} onChange={(e) => setIsSubstitute(e.target.checked)} className="h-4 w-4 rounded border-input" />
                                                            Assign as substitute
                                                        </div>
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <button type="button" onClick={() => addTeacher(subject.uuid)} disabled={!addTeacherUuid} className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition">Assign</button>
                                                            <button type="button" onClick={() => { setAddingToSubject(''); setAddTeacherUuid(''); }} className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition">Cancel</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right align-top">
                                                {!isAdding && (
                                                    <button type="button" onClick={() => { setAddingToSubject(subject.uuid); setAddTeacherUuid(''); setIsSubstitute(false); }} className="inline-flex items-center gap-1 rounded bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition">
                                                        <Plus className="size-3" /> Assign
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-sidebar/30">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 font-semibold text-right text-muted-foreground uppercase tracking-wider text-xs">Total Units:</td>
                                    <td className="px-4 py-3 font-bold text-center text-lg text-sky-700 dark:text-sky-400">
                                        {subjectList.reduce((sum, s) => sum + (s.units || 0), 0)}
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>
            </PortalPageShell>
        </>
    );
}
