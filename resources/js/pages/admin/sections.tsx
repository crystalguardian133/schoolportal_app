import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageLoader } from '@/components/page-loader';
import { PortalPageShell } from '@/components/portal-page-shell';

type Subject = {
    uuid: string;
    name: string;
    code?: string | null;
    description?: string | null;
    teachers?: { uuid: string }[];
};

type ClassSection = {
    uuid: string;
    name: string;
    grade_level?: string | null;
    school_year?: string | null;
    student_count: number;
    subject_count: number;
    subjects?: { uuid: string; name: string; code?: string | null }[];
};

type SectionStudent = {
    uuid: string;
    name: string;
    student_id: string;
    section?: string | null;
    grade_level?: string | null;
};

type SectionSubject = {
    uuid: string;
    name: string;
    code?: string | null;
    teachers?: string[];
};

const YEAR_LEVEL_OPTIONS = [
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
];

export default function AdminSections() {
    const { props } = usePage();
    const classSections: ClassSection[] = props.sections || [];
    const subjects: Subject[] = props.subjects || [];
    const assignedSubjectUuids: string[] = props.assignedSubjectUuids || [];
    const selectedSection: {
        uuid: string;
        name: string;
        grade_level?: string | null;
        school_year?: string | null;
    } | null = props.selectedSection || null;
    const selectedSectionStudents: SectionStudent[] =
        props.sectionStudents || [];
    const selectedSectionSubjects: SectionSubject[] =
        props.sectionSubjects || [];
    const filters = props.filters || { section_uuid: '' };

    const createDefaults = useMemo(
        () =>
            assignedSubjectUuids.length > 0
                ? assignedSubjectUuids
                : subjects.map((subject) => subject.uuid),
        [assignedSubjectUuids, subjects],
    );
    const selectedSubjectDefaults = useMemo(
        () =>
            selectedSectionSubjects.length > 0
                ? selectedSectionSubjects.map((subject) => subject.uuid)
                : createDefaults,
        [selectedSectionSubjects, createDefaults],
    );

    const [createName, setCreateName] = useState('');
    const [createGradeLevel, setCreateGradeLevel] = useState('');
    const [createSubjectUuids, setCreateSubjectUuids] =
        useState<string[]>(createDefaults);
    const [editName, setEditName] = useState(selectedSection?.name ?? '');
    const [editGradeLevel, setEditGradeLevel] = useState(
        selectedSection?.grade_level ?? '',
    );
    const [editSubjectUuids, setEditSubjectUuids] = useState<string[]>(
        selectedSubjectDefaults,
    );
    const [filterGradeLevel, setFilterGradeLevel] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        setEditName(selectedSection?.name ?? '');
        setEditGradeLevel(selectedSection?.grade_level ?? '');
        setEditSubjectUuids(selectedSubjectDefaults);
    }, [selectedSection?.uuid, selectedSubjectDefaults]);

    function toggleCreateSubject(uuid: string) {
        setCreateSubjectUuids((prev) =>
            prev.includes(uuid)
                ? prev.filter((id) => id !== uuid)
                : [...prev, uuid],
        );
    }

    function toggleEditSubject(uuid: string) {
        setEditSubjectUuids((prev) =>
            prev.includes(uuid)
                ? prev.filter((id) => id !== uuid)
                : [...prev, uuid],
        );
    }

    function selectSection(uuid: string) {
        router.get(
            '/admin/sections',
            { section_uuid: uuid },
            { preserveState: true, replace: true },
        );
    }

    function createSection() {
        setSubmitting(true);
        router.post(
            '/admin/sections',
            {
                name: createName,
                grade_level: createGradeLevel || null,
                subject_uuids: createSubjectUuids,
            },
            {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    window.dispatchEvent(
                        new CustomEvent('local-toast', {
                            detail: {
                                message: 'Class section created',
                                type: 'success',
                            },
                        }),
                    );
                    setCreateName('');
                    setCreateGradeLevel('');
                    setCreateSubjectUuids(createDefaults);
                    router.reload({
                        only: ['sections', 'subjects', 'assignedSubjectUuids'],
                    });
                },
            },
        );
    }

    function updateSection() {
        if (!selectedSection) {
            return;
        }

        setSubmitting(true);
        router.patch(
            '/admin/sections',
            {
                section_uuid: selectedSection.uuid,
                name: editName,
                grade_level: editGradeLevel || null,
                subject_uuids: editSubjectUuids,
            },
            {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    window.dispatchEvent(
                        new CustomEvent('local-toast', {
                            detail: {
                                message: 'Class section updated',
                                type: 'success',
                            },
                        }),
                    );
                    router.reload({
                        only: [
                            'sections',
                            'sectionStudents',
                            'sectionSubjects',
                            'selectedSection',
                        ],
                    });
                },
            },
        );
    }

    return (
        <>
            <Head title="Class Sections" />
            <PortalPageShell
                title="Class Sections"
                description="Create sections and pre-assign their subjects before enrolling whole blocks of students."
            >
                <PageLoader skeleton="table">
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Create Class Section
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Subjects are preselected from currently
                                    assigned subjects, and you can adjust them
                                    before saving.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <input
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                placeholder="Section name (e.g. 7-A)"
                                className="rounded border px-3 py-2"
                            />
                            <select
                                value={createGradeLevel}
                                onChange={(e) =>
                                    setCreateGradeLevel(e.target.value)
                                }
                                className="rounded border px-3 py-2"
                            >
                                <option value="">-- Year Level --</option>
                                {YEAR_LEVEL_OPTIONS.map((level) => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-4 rounded-xl border border-sidebar-border/70 p-4">
                            <div className="text-sm font-medium">
                                Pre-assigned Subjects
                            </div>
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                                {subjects.map((subject) => {
                                    const preselected =
                                        createSubjectUuids.includes(
                                            subject.uuid,
                                        );

                                    return (
                                        <label
                                            key={subject.uuid}
                                            className={`flex items-start gap-3 rounded border px-3 py-2 ${preselected ? 'border-sky-600 bg-sky-50 dark:bg-sky-950' : 'border-sidebar-border/70'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={preselected}
                                                onChange={() =>
                                                    toggleCreateSubject(
                                                        subject.uuid,
                                                    )
                                                }
                                                className="mt-1"
                                            />
                                            <span className="text-sm">
                                                <span className="block font-medium text-sidebar-foreground">
                                                    {subject.name}
                                                </span>
                                                <span className="block text-xs text-muted-foreground">
                                                    {subject.code || 'No code'}
                                                    {subject.teachers?.length
                                                        ? ' · assigned'
                                                        : ' · unassigned'}
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                            <button
                                disabled={submitting || !createName}
                                onClick={createSection}
                                className="rounded bg-sky-600 px-4 py-2 text-white disabled:opacity-50"
                            >
                                Create Section
                            </button>
                            <div className="text-sm text-muted-foreground">
                                {createSubjectUuids.length} subject(s) selected
                            </div>
                        </div>

                        <div className="mt-4 flex items-end gap-2">
                            <label className="space-y-1 text-sm">
                                <span className="block text-muted-foreground">
                                    Filter by year level
                                </span>
                                <select
                                    value={filterGradeLevel}
                                    onChange={(e) =>
                                        setFilterGradeLevel(e.target.value)
                                    }
                                    className="rounded border px-2 py-1"
                                >
                                    <option value="">All</option>
                                    {YEAR_LEVEL_OPTIONS.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="text-sm text-muted-foreground">
                                {classSections.filter(
                                    (s) =>
                                        !filterGradeLevel ||
                                        s.grade_level === filterGradeLevel,
                                ).length}{' '}
                                section(s)
                            </div>
                        </div>

                        <div className="table-scroll-container table-scroll-small mt-5 rounded-xl border border-sidebar-border/70">
                            <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Section
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Grade Level
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            School Year
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Students
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Subjects
                                        </th>
                                        <th className="px-4 py-3 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                    {classSections
                                        .filter(
                                            (s) =>
                                                !filterGradeLevel ||
                                                s.grade_level ===
                                                    filterGradeLevel,
                                        )
                                        .map((section) => (
                                        <tr
                                            key={section.uuid}
                                            className={`hover:bg-sidebar-accent/40 ${filters.section_uuid === section.uuid ? 'bg-sky-50 dark:bg-sky-950/40' : ''}`}
                                        >
                                            <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                {section.name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {section.grade_level || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {section.school_year || 'Auto'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {section.student_count}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {section.subjects && section.subjects.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {section.subjects
                                                            .slice(0, 3)
                                                            .map((subject) => (
                                                            <span
                                                                key={subject.uuid}
                                                                className="inline-block rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                                                            >
                                                                {subject.name}
                                                            </span>
                                                        ))}
                                                        {section.subjects.length > 3 && (
                                                            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground dark:bg-muted/50">
                                                                +
                                                                {section.subjects.length - 3}{' '}
                                                                more subjects
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs italic">None</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() =>
                                                        selectSection(
                                                            section.uuid,
                                                        )
                                                    }
                                                    className="rounded border px-3 py-1"
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Manage Selected Section
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Edit section details, sync its subjects, and
                                review its roster.
                            </p>
                        </div>

                        {selectedSection ? (
                            <>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <input
                                        value={editName}
                                        onChange={(e) =>
                                            setEditName(e.target.value)
                                        }
                                        className="rounded border px-3 py-2"
                                    />
                                    <select
                                        value={editGradeLevel}
                                        onChange={(e) =>
                                            setEditGradeLevel(e.target.value)
                                        }
                                        className="rounded border px-3 py-2"
                                    >
                                        <option value="">-- Year Level --</option>
                                        {YEAR_LEVEL_OPTIONS.map((level) => (
                                            <option key={level} value={level}>
                                                {level}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    School year is auto-assigned when a block is
                                    enrolled.
                                </div>

                                <div className="rounded-xl border border-sidebar-border/70 p-4">
                                    <div className="text-sm font-medium">
                                        Attached Subjects
                                    </div>
                                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                                        {subjects.map((subject) => {
                                            const checked =
                                                editSubjectUuids.includes(
                                                    subject.uuid,
                                                );

                                            return (
                                                <label
                                                    key={subject.uuid}
                                                    className={`flex items-start gap-3 rounded border px-3 py-2 ${checked ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950' : 'border-sidebar-border/70'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() =>
                                                            toggleEditSubject(
                                                                subject.uuid,
                                                            )
                                                        }
                                                        className="mt-1"
                                                    />
                                                    <span className="text-sm">
                                                        <span className="block font-medium text-sidebar-foreground">
                                                            {subject.name}
                                                        </span>
<span className="block text-xs text-muted-foreground">
                                                                {subject.code ||
                                                                    'No code'}
                                                                {subject.teachers?.length
                                                                    ? ' · assigned'
                                                                    : ' · unassigned'}
                                                            </span>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-sidebar-border/70 p-3 text-sm">
                                    <div className="font-medium text-sidebar-foreground">
                                        {selectedSection.name}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {selectedSection.grade_level ??
                                            'Grade n/a'}{' '}
                                        ·{' '}
                                        {selectedSection.school_year ??
                                            'School year auto-assigned'}
                                    </div>
                                    <div className="mt-2 text-muted-foreground">
                                        {selectedSectionSubjects.length}{' '}
                                        subject(s) currently attached
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        disabled={submitting || !editName}
                                        onClick={updateSection}
                                        className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        disabled={submitting || selectedSectionStudents.length === 0}
                                        onClick={() => setShowClearDialog(true)}
                                        className="rounded border border-amber-500 bg-amber-50 px-4 py-2 text-amber-700 disabled:opacity-50 dark:bg-amber-950 dark:text-amber-300"
                                    >
                                        Clear Students ({selectedSectionStudents.length})
                                    </button>
                                    <button
                                        disabled={submitting}
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="rounded border border-red-500 bg-red-50 px-4 py-2 text-red-700 disabled:opacity-50 dark:bg-red-950 dark:text-red-300"
                                    >
                                        Delete Section
                                    </button>
                                </div>

                                <div className="rounded-xl border border-sidebar-border/70 p-4">
                                    <div className="text-sm font-medium">
                                        Section Roster
                                    </div>
                                    <div className="mt-3 max-h-56 overflow-auto rounded border border-sidebar-border/70 p-2 text-sm">
                                        {selectedSectionStudents.length > 0 ? (
                                            selectedSectionStudents.map(
                                                (student) => (
                                                    <div
                                                        key={student.uuid}
                                                        className="flex items-center justify-between py-1"
                                                    >
                                                        <span>
                                                            {student.name}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {student.student_id}
                                                        </span>
                                                    </div>
                                                ),
                                            )
                                        ) : (
                                            <div className="text-muted-foreground">
                                                No students currently linked to
                                                this section.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-xl border border-dashed border-sidebar-border/70 p-4 text-sm text-muted-foreground">
                                Select a section from the list on the left to
                                edit its subjects and roster.
                            </div>
                        )}
                    </section>
                </div>
                </PageLoader>
            </PortalPageShell>

            <ConfirmDialog
                open={showClearDialog}
                onOpenChange={setShowClearDialog}
                title="Clear Students"
                description={`Remove all ${selectedSectionStudents.length} student(s) from ${selectedSection?.name ?? ''}? They will not be deleted, only unassigned from this section.`}
                confirmLabel="Clear Students"
                variant="default"
                onConfirm={() => {
                    if (!selectedSection) {
return;
}

                    setSubmitting(true);
                    setShowClearDialog(false);
                    router.delete(`/admin/sections/${selectedSection.uuid}/clear-students`, {
                        onFinish: () => setSubmitting(false),
                        onSuccess: () => {
                            window.dispatchEvent(new CustomEvent('local-toast', { detail: { message: `Students cleared from ${selectedSection.name}`, type: 'success' } }));
                            router.reload({ only: ['sectionStudents', 'sections'] });
                        },
                    });
                }}
            />

            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete Section"
                description={`Delete section "${selectedSection?.name ?? ''}"? This will also remove all ${selectedSectionStudents.length} student(s) from this section and detach all subjects. This cannot be undone.`}
                confirmLabel="Delete Section"
                variant="destructive"
                onConfirm={() => {
                    if (!selectedSection) {
return;
}

                    setSubmitting(true);
                    setShowDeleteDialog(false);
                    router.delete(`/admin/sections/${selectedSection.uuid}`, {
                        onFinish: () => setSubmitting(false),
                        onSuccess: () => {
                            window.dispatchEvent(new CustomEvent('local-toast', { detail: { message: `Section ${selectedSection.name} deleted`, type: 'success' } }));
                            router.get('/admin/sections', {}, { only: ['sections', 'selectedSection', 'sectionStudents', 'sectionSubjects'] });
                        },
                    });
                }}
            />
        </>
    );
}
