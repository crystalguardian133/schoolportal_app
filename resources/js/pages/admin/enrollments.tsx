import type { PageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { PageLoader } from '@/components/page-loader';

type Student = {
    uuid: string;
    name: string;
    student_id: string;
    section?: string | null;
    grade_level?: string | null;
    last_grade_level?: string | null;
    previous_section?: string | null;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    email?: string | null;
};
type StudentPage = {
    data: Student[];
    current_page: number;
    last_page: number;
    total: number;
    per_page?: number;
};
type ClassSection = {
    uuid: string;
    name: string;
    grade_level?: string | null;
    school_year?: string | null;
    subject_count: number;
    subjects: { uuid: string; name: string; code?: string | null }[];
};
type EnrollmentsFilters = {
    q?: string | null;
    per_page?: number | string;
    section_uuid?: string | null;
    sort_by?: 'name' | 'grade_level';
    sort_direction?: 'asc' | 'desc';
};
type EnrollmentsPageProps = PageProps & {
    students?: StudentPage;
    classSections?: ClassSection[];
    selectedSection?: ClassSection | null;
    filters?: EnrollmentsFilters;
};

export default function AdminEnrollments() {
    const { props } = usePage<EnrollmentsPageProps>();
    const studentsProp = props.students || {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    };
    const students: Student[] = studentsProp.data || [];
    const classSections: ClassSection[] = props.classSections || [];
    const selectedSection: ClassSection | null = props.selectedSection || null;
    const filters = props.filters || {
        q: '',
        per_page: 25,
        section_uuid: '',
        sort_by: 'name',
        sort_direction: 'asc',
    };
    const selectedSectionGrade = selectedSection?.grade_level ?? null;

    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [query, setQuery] = useState<string>(filters.q ?? '');
    const [perPage, setPerPage] = useState<number>(
        typeof filters.per_page === 'number' ? filters.per_page : 25,
    );
    const [classSectionUuid, setClassSectionUuid] = useState<string>(
        filters.section_uuid ?? classSections[0]?.uuid ?? '',
    );
    const [sortBy, setSortBy] = useState<'name' | 'grade_level'>(
        filters.sort_by ?? 'name',
    );
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
        filters.sort_direction ?? 'asc',
    );
    const [submitting, setSubmitting] = useState(false);
    const initialRender = useRef(true);

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;

            return;
        }

        const timer = window.setTimeout(() => {
            setSelectedStudents([]);
            reload({
                q: query,
                per_page: perPage,
                section_uuid: classSectionUuid || undefined,
                sort_by: sortBy,
                sort_direction: sortDirection,
            });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [query, perPage, classSectionUuid, sortBy, sortDirection]);

    function toggleStudent(uuid: string) {
        setSelectedStudents((prev) =>
            prev.includes(uuid)
                ? prev.filter((item) => item !== uuid)
                : [...prev, uuid],
        );
    }

    function reload(
        params: Record<string, string | number | null | undefined>,
    ) {
        router.get('/admin/enrollments', params, {
            preserveState: true,
            replace: true,
        });
    }

    function enroll() {
        if (!classSectionUuid) {
            return;
        }

        setSubmitting(true);
        router.post(
            '/admin/enrollments',
            {
                class_section_uuid: classSectionUuid,
                student_uuids: selectedStudents,
            },
            {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    window.dispatchEvent(
                        new CustomEvent('local-toast', {
                            detail: {
                                message: 'Students enrolled into class section',
                                type: 'success',
                            },
                        }),
                    );
                    setSelectedStudents([]);
                    reload({
                        q: query,
                        per_page: perPage,
                        section_uuid: classSectionUuid,
                        sort_by: sortBy,
                        sort_direction: sortDirection,
                    });
                },
            },
        );
    }

    function promoteStudent(uuid: string) {
        router.post(
            `/admin/students/${uuid}/promote`,
            {},
            {
                onSuccess: () => {
                    window.dispatchEvent(
                        new CustomEvent('local-toast', {
                            detail: {
                                message: 'Student promoted successfully',
                                type: 'success',
                            },
                        }),
                    );
                    reload({
                        q: query,
                        per_page: perPage,
                        sort_by: sortBy,
                        sort_direction: sortDirection,
                    });
                },
            },
        );
    }

    function openCreateStudentPage() {
        router.get('/admin/create-student');
    }

    function toggleSort(column: 'name' | 'grade_level') {
        if (sortBy === column) {
            setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));

            return;
        }

        setSortBy(column);
        setSortDirection(column === 'grade_level' ? 'desc' : 'asc');
    }

    function sortLabel(column: string, label: string) {
        const active = sortBy === column;
        const arrow = active ? (sortDirection === 'asc' ? '↑' : '↓') : '↕';

        return `${label} ${arrow}`;
    }

    function selectAllPage() {
        setSelectedStudents(students.map((student) => student.uuid));
    }

    function formatStudentName(student: Student) {
        const last = (student.last_name || '').trim();
        const first = (student.first_name || '').trim();
        const middle = (student.middle_name || '').trim();

        if (last || first || middle) {
            const middleInitial = middle
                ? ` ${middle.charAt(0).toUpperCase()}`
                : '';

            return last
                ? `${last}, ${first}${middleInitial}`.trim()
                : `${first}${middleInitial}`.trim();
        }

        return student.name;
    }

    return (
        <>
            <Head title="Enroll Students" />
            <PortalPageShell
                title="Enroll Students"
                description="Pick a class section, then enroll a block of students into all of its pre-assigned subjects."
            >
                <PageLoader skeleton="table">
                <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                    <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="flex flex-wrap items-end gap-2">
                            <h2 className="text-lg font-semibold">Students</h2>
                            <div className="ml-auto flex flex-wrap items-end gap-2">
                                <label className="space-y-1 text-sm">
                                    <span className="block text-muted-foreground">
                                        Search
                                    </span>
                                    <input
                                        placeholder="Search name, student id, or section"
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                        className="w-64 rounded border px-2 py-1"
                                    />
                                </label>
                                <label className="space-y-1 text-sm">
                                    <span className="block text-muted-foreground">
                                        Per page
                                    </span>
                                    <select
                                        value={perPage}
                                        onChange={(e) =>
                                            setPerPage(Number(e.target.value))
                                        }
                                        className="rounded border px-2 py-1"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                </label>
                                <button
                                    type="button"
                                    onClick={selectAllPage}
                                    className="rounded border px-3 py-1"
                                >
                                    Select page
                                </button>
                                <div className="text-sm text-muted-foreground">
                                    {studentsProp.total ?? 0} total
                                </div>
                            </div>
                        </div>

                        <div className="table-scroll-container table-scroll-small mt-4 rounded-xl border border-sidebar-border/70">
                            <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    students.length > 0 &&
                                                    selectedStudents.length ===
                                                        students.length
                                                }
                                                onChange={() =>
                                                    setSelectedStudents(
                                                        selectedStudents.length ===
                                                            students.length
                                                            ? []
                                                            : students.map(
                                                                  (student) =>
                                                                      student.uuid,
                                                              ),
                                                    )
                                                }
                                            />
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Student
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Student ID
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleSort('grade_level')
                                                }
                                                className="flex items-center gap-1 text-left hover:text-foreground"
                                            >
                                                {sortLabel(
                                                    'grade_level',
                                                    'Grade Level',
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Last Grade Level
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Last Section
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Placement Check
                                        </th>
                                        <th className="px-4 py-3 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                    {students.map((student) => {
                                        const placementCheck =
                                            !selectedSectionGrade ||
                                            !student.grade_level
                                                ? 'Review'
                                                : !student.section
                                                  ? 'Review'
                                                  : student.grade_level ===
                                                      selectedSectionGrade
                                                    ? 'OK'
                                                    : 'Check';

                                        return (
                                            <tr
                                                key={student.uuid}
                                                className="hover:bg-sidebar-accent/40"
                                            >
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(
                                                            student.uuid,
                                                        )}
                                                        onChange={() =>
                                                            toggleStudent(
                                                                student.uuid,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                    {formatStudentName(
                                                        student,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {student.student_id}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {student.grade_level ??
                                                        'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {student.last_grade_level ??
                                                        'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {student.previous_section ??
                                                        'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {placementCheck}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {(() => {
                                                        const alreadyPromoted =
                                                            student.last_grade_level !=
                                                                null &&
                                                            student.grade_level !==
                                                                student.last_grade_level;

                                                        return (
                                                            <button
                                                                type="button"
                                                                disabled={alreadyPromoted}
                                                                onClick={() =>
                                                                    promoteStudent(
                                                                        student.uuid,
                                                                    )
                                                                }
                                                                className="rounded px-3 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300"
                                                                title={
                                                                    alreadyPromoted
                                                                        ? 'Student has already been promoted'
                                                                        : undefined
                                                                }
                                                            >
                                                                {alreadyPromoted
                                                                    ? 'Promoted'
                                                                    : 'Promote'}
                                                            </button>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <button
                                disabled={studentsProp.current_page <= 1}
                                onClick={() =>
                                    reload({
                                        q: query,
                                        per_page: perPage,
                                        page:
                                            (studentsProp.current_page || 1) -
                                            1,
                                        section_uuid:
                                            classSectionUuid || undefined,
                                        sort_by: sortBy,
                                        sort_direction: sortDirection,
                                    })
                                }
                                className="rounded border px-3 py-1 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <div className="text-sm text-muted-foreground">
                                Page {studentsProp.current_page} of{' '}
                                {studentsProp.last_page}
                            </div>
                            <button
                                disabled={
                                    (studentsProp.current_page || 1) >=
                                    (studentsProp.last_page || 1)
                                }
                                onClick={() =>
                                    reload({
                                        q: query,
                                        per_page: perPage,
                                        page:
                                            (studentsProp.current_page || 1) +
                                            1,
                                        section_uuid:
                                            classSectionUuid || undefined,
                                        sort_by: sortBy,
                                        sort_direction: sortDirection,
                                    })
                                }
                                className="rounded border px-3 py-1 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Class Section Target
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Choose a class section and the selected students
                                will be enrolled into every subject attached to
                                it.
                            </p>
                        </div>

                        <div className="rounded-xl border border-sidebar-border/70 p-4">
                            <label className="text-sm font-medium">
                                Class Section
                            </label>
                            <select
                                value={classSectionUuid}
                                onChange={(e) =>
                                    setClassSectionUuid(e.target.value)
                                }
                                className="mt-2 w-full rounded border px-2 py-2"
                            >
                                <option value="">
                                    -- Select class section --
                                </option>
                                {classSections.map((section) => (
                                    <option
                                        key={section.uuid}
                                        value={section.uuid}
                                    >
                                        {section.name}{' '}
                                        {section.grade_level
                                            ? `· ${section.grade_level}`
                                            : ''}{' '}
                                        {section.school_year
                                            ? `· ${section.school_year}`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                            {selectedSection && (
                                <div className="mt-3 rounded-lg border border-sidebar-border/70 p-3 text-sm">
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
                                        {selectedSection.subject_count}{' '}
                                        subject(s) attached
                                    </div>
                                    <div className="mt-1 text-muted-foreground">
                                        Students are checked against the
                                        selected section's level before
                                        enrollment.
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-sm font-medium">
                                            Subjects
                                        </div>
                                        <ul className="mt-2 space-y-1 text-muted-foreground">
                                            {selectedSection.subjects.map(
                                                (subject) => (
                                                    <li key={subject.uuid}>
                                                        {subject.name}{' '}
                                                        {subject.code
                                                            ? `(${subject.code})`
                                                            : ''}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-sidebar-border/70 p-4">
                            <div className="text-sm font-medium">
                                Selected Students
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                                {selectedStudents.length} student(s) selected
                            </div>
                            <div className="mt-3 max-h-48 overflow-auto rounded border border-sidebar-border/70 p-2 text-sm">
                                {selectedStudents.length > 0 ? (
                                    students
                                        .filter((student) =>
                                            selectedStudents.includes(
                                                student.uuid,
                                            ),
                                        )
                                        .map((student) => (
                                            <div
                                                key={student.uuid}
                                                className="flex items-center justify-between py-1"
                                            >
                                                <span>{student.name}</span>
                                                <span className="text-muted-foreground">
                                                    {student.student_id}
                                                </span>
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-muted-foreground">
                                        No students selected.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-sidebar-border/70 p-4">
                            <div className="text-sm font-medium">
                                Create Student
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                                Create a new student account on the dedicated
                                page.
                            </div>
                            <div className="mt-3">
                                <button
                                    type="button"
                                    onClick={openCreateStudentPage}
                                    className="rounded bg-indigo-600 px-4 py-2 text-white"
                                >
                                    Open Create Student Page
                                </button>
                            </div>
                        </div>

                        <button
                            disabled={
                                submitting ||
                                !classSectionUuid ||
                                selectedStudents.length === 0
                            }
                            onClick={enroll}
                            className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
                        >
                            {submitting
                                ? 'Enrolling…'
                                : 'Enroll Block Into Section'}
                        </button>
                    </section>
                </div>
                </PageLoader>
            </PortalPageShell>
        </>
    );
}
