import type { PageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CheckCircle2,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    GraduationCap,
    Info,
    Search,
    UserPlus,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageLoader } from '@/components/page-loader';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

const MAX_INLINE_SUBJECTS = 2;
const ALL_SECTIONS_VALUE = '__all__';

export default function AdminEnrollments() {
    const { props } = usePage<EnrollmentsPageProps>();
    const studentsProp = props.students || {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    };
    const students: Student[] = useMemo(
        () => studentsProp.data || [],
        [studentsProp.data],
    );
    const classSections: ClassSection[] = useMemo(
        () => props.classSections || [],
        [props.classSections],
    );
    const filters = props.filters || {
        q: '',
        per_page: 25,
        section_uuid: '',
        sort_by: 'name',
        sort_direction: 'asc',
    };

    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [query, setQuery] = useState<string>(filters.q ?? '');
    const [perPage, setPerPage] = useState<number>(
        typeof filters.per_page === 'number' ? filters.per_page : 25,
    );
    const [classSectionUuid, setClassSectionUuid] = useState<string>('');
    const [sortBy, setSortBy] = useState<'name' | 'grade_level'>(
        filters.sort_by ?? 'name',
    );
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
        filters.sort_direction ?? 'asc',
    );
    const [submitting, setSubmitting] = useState(false);
    const [subjectsModalOpen, setSubjectsModalOpen] = useState(false);
    const initialRender = useRef(true);

    const selectedSection: ClassSection | null =
        classSections.find((section) => section.uuid === classSectionUuid) ??
        null;
    const selectedSectionGrade = selectedSection?.grade_level ?? null;

    const selectedStudentsData = useMemo(
        () =>
            students.filter((student) =>
                selectedStudents.includes(student.uuid),
            ),
        [students, selectedStudents],
    );

    const dropdownSections = useMemo(() => {
        if (selectedStudentsData.length === 0) {
            return classSections;
        }

        const grades = selectedStudentsData
            .map((student) => student.grade_level)
            .filter((grade): grade is string => Boolean(grade));

        if (grades.length === 0) {
            return classSections;
        }

        return classSections.filter(
            (section) =>
                grades.length > 0 &&
                grades.every((grade) => grade === section.grade_level),
        );
    }, [classSections, selectedStudentsData]);

    const visibleStudents = useMemo(() => {
        if (!selectedSection) {
            return students;
        }

        const targetGrade = selectedSection.grade_level;

        return students.filter(
            (student) =>
                !student.grade_level || student.grade_level === targetGrade,
        );
    }, [students, selectedSection]);

    const anchorGrade =
        selectedStudents.length > 0
            ? (students.find(
                  (student) => student.uuid === selectedStudents[0],
              )?.grade_level ?? null)
            : null;

    const compatibleVisibleStudents = useMemo(
        () =>
            anchorGrade
                ? visibleStudents.filter(
                      (student) =>
                          !student.grade_level ||
                          student.grade_level === anchorGrade,
                  )
                : visibleStudents,
        [visibleStudents, anchorGrade],
    );

    function isStudentMismatched(student: Student | undefined): boolean {
        if (!student) {
            return false;
        }

        return (
            anchorGrade != null &&
            student.grade_level != null &&
            student.grade_level !== anchorGrade
        );
    }

    function sectionUuidForSelection(nextSelected: string[]): string {
        if (classSectionUuid === ALL_SECTIONS_VALUE) {
            return ALL_SECTIONS_VALUE;
        }

        if (nextSelected.length === 0) {
            return classSectionUuid;
        }

        const grades = students
            .filter((student) => nextSelected.includes(student.uuid))
            .map((student) => student.grade_level)
            .filter((grade): grade is string => Boolean(grade));

        if (grades.length === 0) {
            return classSectionUuid;
        }

        const compatible = classSections.some(
            (section) =>
                section.uuid === classSectionUuid &&
                grades.every((grade) => grade === section.grade_level),
        );

        return compatible ? classSectionUuid : '';
    }

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
                sort_by: sortBy,
                sort_direction: sortDirection,
            });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [query, perPage, sortBy, sortDirection]);

    function toggleStudent(uuid: string) {
        if (isStudentMismatched(students.find((item) => item.uuid === uuid))) {
            return;
        }

        const next = selectedStudents.includes(uuid)
            ? selectedStudents.filter((item) => item !== uuid)
            : [...selectedStudents, uuid];

        setSelectedStudents(next);
        setClassSectionUuid(sectionUuidForSelection(next));
    }

    function handleSectionChange(uuid: string) {
        if (uuid === ALL_SECTIONS_VALUE) {
            setClassSectionUuid(ALL_SECTIONS_VALUE);
            setSubjectsModalOpen(false);

            return;
        }

        const section =
            classSections.find((item) => item.uuid === uuid) ?? null;

        setClassSectionUuid(uuid);
        setSubjectsModalOpen(false);

        if (section) {
            setSelectedStudents((prev) =>
                prev.filter((studentUuid) => {
                    const student = students.find(
                        (item) => item.uuid === studentUuid,
                    );

                    return (
                        !student ||
                        !student.grade_level ||
                        student.grade_level === section.grade_level
                    );
                }),
            );
        }
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
        if (!selectedSection) {
            return;
        }

        const eligibleStudents = selectedStudents.filter((uuid) =>
            visibleStudents.some((student) => student.uuid === uuid),
        );

        if (eligibleStudents.length === 0) {
            return;
        }

        setSubmitting(true);
        router.post(
            '/admin/enrollments',
            {
                class_section_uuid: classSectionUuid,
                student_uuids: eligibleStudents,
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
        const next = compatibleVisibleStudents.map(
            (student) => student.uuid,
        );

        setSelectedStudents(next);
        setClassSectionUuid(sectionUuidForSelection(next));
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

    function placementStatus(status: string) {
        const classes =
            status === 'OK'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : status === 'Check'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground';

        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
            >
                {status === 'OK' && <CheckCircle2 className="size-3" />}
                {status === 'Check' && <CircleAlert className="size-3" />}
                {status === 'Review' && <Info className="size-3" />}
                {status}
            </span>
        );
    }

    return (
        <>
            <Head title="Enroll Students" />
            <PortalPageShell
                title="Enroll Students"
                description="Pick a class section, then enroll a block of students into all of its pre-assigned subjects."
            >
                <PageLoader skeleton="table">
                <div className="grid items-start gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                    <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="flex flex-wrap items-center gap-3">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-semibold">
                                    <Users className="size-5 text-muted-foreground" />
                                    Students
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Checkboxes of students with a different
                                    grade level than the first selected student
                                    are disabled.
                                </p>
                            </div>
                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search name, student id, or section"
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                        className="w-full pl-8 sm:w-64"
                                    />
                                </div>
                                <Select
                                    value={String(perPage)}
                                    onValueChange={(value) =>
                                        setPerPage(Number(value))
                                    }
                                >
                                    <SelectTrigger className="w-fit gap-1.5">
                                        <SelectValue placeholder="Per page" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 25, 50].map((size) => (
                                            <SelectItem
                                                key={size}
                                                value={String(size)}
                                            >
                                                {size} per page
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={selectAllPage}
                                >
                                    <CheckSquare className="size-3.5" />
                                    Select page
                                </Button>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    {selectedSection && (
                                        <span>
                                            {visibleStudents.length} shown of
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                                        {studentsProp.total ?? 0} total
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="table-scroll-container table-scroll-small mt-4 rounded-xl border border-sidebar-border/70">
                            <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                <thead className="bg-sidebar/60 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            <Checkbox
                                                checked={
                                                    selectedStudents.length > 0 &&
                                                    selectedStudents.length <
                                                        compatibleVisibleStudents.length
                                                        ? 'indeterminate'
                                                        : compatibleVisibleStudents.length >
                                                              0 &&
                                                            selectedStudents.length ===
                                                                compatibleVisibleStudents.length
                                                }
                                                onCheckedChange={() => {
                                                    const next =
                                                        selectedStudents.length ===
                                                        compatibleVisibleStudents.length
                                                            ? []
                                                            : compatibleVisibleStudents.map(
                                                                  (student) =>
                                                                      student.uuid,
                                                              );

                                                    setSelectedStudents(next);
                                                    setClassSectionUuid(
                                                        sectionUuidForSelection(
                                                            next,
                                                        ),
                                                    );
                                                }}
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
                                                className="flex items-center gap-1 text-left font-medium hover:text-foreground"
                                            >
                                                {sortLabel(
                                                    'grade_level',
                                                    'Grade Level',
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Last Grade
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Last Section
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Placement
                                        </th>
                                        <th className="px-4 py-3 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                    {visibleStudents.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-4 py-12 text-center"
                                            >
                                                <Users className="mx-auto size-8 text-muted-foreground/50" />
                                                <p className="mt-2 text-sm font-medium text-foreground">
                                                    No students found
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {selectedSection
                                                        ? "No students match the selected section's grade level."
                                                        : 'Try adjusting your search or filters.'}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                    {visibleStudents.map((student) => {
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
                                                    <Checkbox
                                                        checked={selectedStudents.includes(
                                                            student.uuid,
                                                        )}
                                                        disabled={isStudentMismatched(
                                                            student,
                                                        )}
                                                        onCheckedChange={() =>
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
                                                    {placementStatus(
                                                        placementCheck,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {(() => {
                                                        const alreadyPromoted =
                                                            student.last_grade_level !=
                                                                null &&
                                                            student.grade_level !==
                                                                student.last_grade_level;

                                                        return (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                disabled={alreadyPromoted}
                                                                onClick={() =>
                                                                    promoteStudent(
                                                                        student.uuid,
                                                                    )
                                                                }
                                                                className="bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-300"
                                                                title={
                                                                    alreadyPromoted
                                                                        ? 'Student has already been promoted'
                                                                        : undefined
                                                                }
                                                            >
                                                                <GraduationCap className="size-3.5" />
                                                                {alreadyPromoted
                                                                    ? 'Promoted'
                                                                    : 'Promote'}
                                                            </Button>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={studentsProp.current_page <= 1}
                                onClick={() =>
                                    reload({
                                        q: query,
                                        per_page: perPage,
                                        page:
                                            (studentsProp.current_page || 1) -
                                            1,
                                        sort_by: sortBy,
                                        sort_direction: sortDirection,
                                    })
                                }
                            >
                                <ChevronLeft className="size-3.5" />
                                Prev
                            </Button>
                            <div className="text-sm text-muted-foreground">
                                Page {studentsProp.current_page} of{' '}
                                {studentsProp.last_page}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
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
                                        sort_by: sortBy,
                                        sort_direction: sortDirection,
                                    })
                                }
                            >
                                Next
                                <ChevronRight className="size-3.5" />
                            </Button>
                        </div>
                    </section>

                    <section className="flex flex-col space-y-4 self-stretch rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <GraduationCap className="size-5 text-muted-foreground" />
                                Class Section Target
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose a class section and the selected students
                                will be enrolled into every subject attached to
                                it.
                            </p>
                        </div>

                        <div className="rounded-xl border border-sidebar-border/70 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Class Section
                            </div>
                            <Select
                                value={classSectionUuid || undefined}
                                onValueChange={(value) =>
                                    handleSectionChange(value)
                                }
                            >
                                <SelectTrigger className="mt-2 w-full">
                                    <SelectValue placeholder="-- Select class section --" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_SECTIONS_VALUE}>
                                        Show all students
                                    </SelectItem>
                                    <SelectSeparator />
                                    {dropdownSections.map((section) => (
                                        <SelectItem
                                            key={section.uuid}
                                            value={section.uuid}
                                        >
                                            {section.name}
                                            {section.grade_level
                                                ? ` · ${section.grade_level}`
                                                : ''}
                                            {section.school_year
                                                ? ` · ${section.school_year}`
                                                : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedStudentsData.length > 0 &&
                                dropdownSections.length === 0 && (
                                    <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                        <CircleAlert className="size-3.5 shrink-0" />
                                        No class sections match the selected
                                        students' grade level.
                                    </p>
                                )}
                            {selectedSection && (
                                <div className="mt-3 rounded-lg border border-sidebar-border/70 bg-sidebar/30 p-3 text-sm dark:bg-sidebar/40">
                                    <div className="font-medium text-sidebar-foreground">
                                        {selectedSection.name}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                                            {selectedSection.grade_level ??
                                                'Grade n/a'}
                                        </span>
                                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                            {selectedSection.school_year ??
                                                'School year auto-assigned'}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                            <BookOpen className="size-3" />
                                            {selectedSection.subject_count}{' '}
                                            subject(s)
                                        </span>
                                    </div>
                                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Info className="size-3.5 shrink-0" />
                                        Students are checked against the
                                        selected section's level before
                                        enrollment.
                                    </p>
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                                <BookOpen className="size-3.5 text-muted-foreground" />
                                                Subjects
                                            </div>
                                            {selectedSection.subjects.length >
                                                MAX_INLINE_SUBJECTS && (
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    size="sm"
                                                    className="h-auto px-0 text-xs text-sky-600 dark:text-sky-400"
                                                    onClick={() =>
                                                        setSubjectsModalOpen(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    View all{' '}
                                                    {
                                                        selectedSection.subjects
                                                            .length
                                                    }{' '}
                                                    subjects
                                                </Button>
                                            )}
                                        </div>
                                        <ul className="mt-2 space-y-1.5 text-muted-foreground">
                                            {selectedSection.subjects
                                                .slice(0, MAX_INLINE_SUBJECTS)
                                                .map((subject) => (
                                                    <li
                                                        key={subject.uuid}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                                                        <span>
                                                            {subject.name}{' '}
                                                            {subject.code
                                                                ? `(${subject.code})`
                                                                : ''}
                                                        </span>
                                                    </li>
                                                ))}
                                            {selectedSection.subjects.length >
                                                MAX_INLINE_SUBJECTS && (
                                                <li className="pt-0.5 text-xs text-muted-foreground/80">
                                                    +
                                                    {selectedSection.subjects
                                                        .length -
                                                        MAX_INLINE_SUBJECTS}{' '}
                                                    more subjects
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-sidebar-border/70 p-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Users className="size-4 text-muted-foreground" />
                                    Selected Students
                                    {selectedStudents.length > 0 && (
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            {selectedStudents.length}
                                        </span>
                                    )}
                                </div>
                                {selectedStudents.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto px-2 text-xs text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                            setSelectedStudents([]);
                                            setClassSectionUuid(
                                                sectionUuidForSelection([]),
                                            );
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                            <div className="mt-3 max-h-48 space-y-0.5 overflow-auto rounded-lg border border-sidebar-border/70 p-2 text-sm">
                                {selectedStudents.length > 0 ? (
                                    visibleStudents
                                        .filter((student) =>
                                            selectedStudents.includes(
                                                student.uuid,
                                            ),
                                        )
                                        .map((student) => (
                                            <div
                                                key={student.uuid}
                                                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent/40"
                                            >
                                                <span className="truncate font-medium text-sidebar-foreground">
                                                    {student.name}
                                                </span>
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {student.student_id}
                                                </span>
                                            </div>
                                        ))
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 px-2 py-6 text-center text-muted-foreground">
                                        <Users className="size-5 text-muted-foreground/50" />
                                        No students selected.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/30 p-4 dark:bg-sidebar/40">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <UserPlus className="size-4 text-muted-foreground" />
                                Create Student
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                                Create a new student account on the dedicated
                                page.
                            </div>
                            <div className="mt-3">
                                <Button
                                    type="button"
                                    onClick={openCreateStudentPage}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500"
                                >
                                    <UserPlus className="size-4" />
                                    Open Create Student Page
                                </Button>
                            </div>
                        </div>

                        <Button
                            type="button"
                            size="lg"
                            disabled={
                                submitting ||
                                !selectedSection ||
                                selectedStudents.length === 0
                            }
                            onClick={enroll}
                            className="mt-auto w-full bg-emerald-600 hover:bg-emerald-500"
                        >
                            <GraduationCap className="size-4" />
                            {submitting
                                ? 'Enrolling…'
                                : 'Enroll Block Into Section'}
                        </Button>
                    </section>
                </div>
                </PageLoader>

                {selectedSection && (
                    <Dialog
                        open={subjectsModalOpen}
                        onOpenChange={setSubjectsModalOpen}
                    >
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <GraduationCap className="size-5 text-muted-foreground" />
                                    {selectedSection.name}
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedSection.grade_level ??
                                        'Grade n/a'}{' '}
                                    ·{' '}
                                    {selectedSection.school_year ??
                                        'School year auto-assigned'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 grid gap-6 sm:grid-cols-2">
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                        <BookOpen className="size-4 text-muted-foreground" />
                                        Subjects (
                                        {selectedSection.subjects.length})
                                    </div>
                                    <ul className="mt-2 max-h-80 space-y-1 overflow-auto rounded-lg border border-sidebar-border/70 p-3 text-sm text-muted-foreground">
                                        {selectedSection.subjects.map(
                                            (subject) => (
                                                <li
                                                    key={subject.uuid}
                                                    className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-sidebar-accent/40"
                                                >
                                                    <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                                                    {subject.name}{' '}
                                                    {subject.code
                                                        ? `(${subject.code})`
                                                        : ''}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                        <Users className="size-4 text-muted-foreground" />
                                        Selected Students (
                                        {selectedStudents.length})
                                    </div>
                                    <ul className="mt-2 max-h-80 space-y-1 overflow-auto rounded-lg border border-sidebar-border/70 p-3 text-sm text-muted-foreground">
                                        {selectedStudents.length > 0 ? (
                                            visibleStudents
                                                .filter((student) =>
                                                    selectedStudents.includes(
                                                        student.uuid,
                                                    ),
                                                )
                                                .map((student) => (
                                                    <li
                                                        key={student.uuid}
                                                        className="flex items-center justify-between gap-2 rounded-md px-1 py-1 hover:bg-sidebar-accent/40"
                                                    >
                                                        <span className="truncate">
                                                            {student.name}
                                                        </span>
                                                        <span className="shrink-0 text-xs">
                                                            {
                                                                student.student_id
                                                            }
                                                        </span>
                                                    </li>
                                                ))
                                        ) : (
                                            <li className="px-1 py-4 text-center">
                                                No students selected.
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </PortalPageShell>
        </>
    );
}
