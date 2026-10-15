import type { PageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    Search,
    UserPlus,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageLoader } from '@/components/page-loader';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Student = {
    uuid: string;
    name: string;
    student_id: string;
    section?: string | null;
    grade_level?: string | null;
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
};
type EnrollmentsPageProps = PageProps & {
    students?: StudentPage;
    classSections?: ClassSection[];
    filters?: EnrollmentsFilters;
};

type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string }[] = [
    { n: 1, label: 'Target section' },
    { n: 2, label: 'Pick students' },
    { n: 3, label: 'Review & enroll' },
];

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
        sort_by: 'name',
        sort_direction: 'asc',
    };

    const [step, setStep] = useState<Step>(1);
    const [classSectionUuid, setClassSectionUuid] = useState<string>('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [query, setQuery] = useState<string>(filters.q ?? '');
    const perPage =
        typeof filters.per_page === 'number' ? filters.per_page : 25;
    const [unassignedOnly, setUnassignedOnly] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const initialRender = useRef(true);

    // Section picker controls: grade filter + sorting, all client-side since
    // every section already ships in props.
    const [sectionGrade, setSectionGrade] = useState<string>('');
    const [sectionSort, setSectionSort] = useState<
        'name-asc' | 'name-desc' | 'grade-asc' | 'grade-desc'
    >('name-asc');

    const sectionGrades = useMemo(() => {
        const seen = new Map<number, string>();

        for (const section of classSections) {
            const match = (section.grade_level ?? '').match(/(\d+)/);

            if (match) {
                seen.set(Number(match[1]), section.grade_level as string);
            }
        }

        return [...seen.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([, label]) => label);
    }, [classSections]);

    function sectionGradeRank(grade?: string | null): number {
        const match = (grade ?? '').match(/(\d+)/);

        return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
    }

    const listedSections = useMemo(() => {
        const filtered = sectionGrade
            ? classSections.filter(
                  (section) => section.grade_level === sectionGrade,
              )
            : [...classSections];
        filtered.sort((a, b) => {
            if (sectionSort.startsWith('grade')) {
                const diff =
                    sectionGradeRank(a.grade_level) -
                    sectionGradeRank(b.grade_level);

                if (diff !== 0) {
                    return sectionSort === 'grade-asc' ? diff : -diff;
                }
            }

            const names = a.name.localeCompare(b.name);

            return sectionSort === 'name-desc' ? -names : names;
        });

        return filtered;
    }, [classSections, sectionGrade, sectionSort]);

    // Directory of every student ever seen (across pages/searches) so the
    // review step can name selections that are no longer in view. Selection
    // intentionally survives search, sort, and pagination. A ref (not state)
    // is enough: it is only read during renders triggered by other state.
    const seenRef = useRef<Record<string, { name: string; student_id: string }>>(
        {},
    );
    useEffect(() => {
        for (const student of students) {
            seenRef.current[student.uuid] ??= {
                name: student.name,
                student_id: student.student_id,
            };
        }
    }, [students]);
    const directory = seenRef.current;

    const selectedSection: ClassSection | null =
        classSections.find((section) => section.uuid === classSectionUuid) ??
        null;

    // Section-first eligibility replaces the old anchor-grade maze: once a
    // target is picked, only matching (or ungraded) students are offered.
    const eligibleStudents = useMemo(() => {
        if (!selectedSection?.grade_level) {
            return students;
        }

        return students.filter(
            (student) =>
                !student.grade_level ||
                student.grade_level === selectedSection.grade_level,
        );
    }, [students, selectedSection]);

    const visibleStudents = useMemo(() => {
        if (!unassignedOnly) {
            return eligibleStudents;
        }

        return eligibleStudents.filter((student) => !student.section);
    }, [eligibleStudents, unassignedOnly]);

    const canReachStep = (target: Step): boolean => {
        if (target === 1) {
            return true;
        }

        if (target === 2) {
            return selectedSection !== null;
        }

        return selectedSection !== null && selectedStudents.length > 0;
    };

    function goToStep(target: Step) {
        if (canReachStep(target)) {
            setStep(target);
        }
    }

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;

            return;
        }

        const timer = window.setTimeout(() => {
            // NOTE: selection is deliberately NOT cleared here.
            reload({
                q: query,
                per_page: perPage,
            });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [query, perPage]);

    function reload(
        params: Record<string, string | number | null | undefined>,
    ) {
        router.get('/admin/enrollments', params, {
            preserveState: true,
            replace: true,
        });
    }

    function toggleStudent(uuid: string) {
        setSelectedStudents((prev) =>
            prev.includes(uuid)
                ? prev.filter((item) => item !== uuid)
                : [...prev, uuid],
        );
    }

    function selectAllVisible() {
        setSelectedStudents((prev) => {
            const next = new Set(prev);

            for (const student of visibleStudents) {
                next.add(student.uuid);
            }

            return [...next];
        });
    }

    function clearSelection() {
        setSelectedStudents([]);
    }

    function handleSectionChange(uuid: string) {
        setClassSectionUuid(uuid);
        // Changing target invalidates previous picks (different grade pool).
        setSelectedStudents([]);

        if (uuid) {
            setStep(2);
        }
    }

    function enroll() {
        if (!selectedSection || selectedStudents.length === 0) {
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
                                message: `${selectedStudents.length} student${selectedStudents.length === 1 ? '' : 's'} enrolled into ${selectedSection.name}`,
                                type: 'success',
                            },
                        }),
                    );
                    // Keep the section for rapid repeat batches.
                    setSelectedStudents([]);
                    setStep(2);
                    reload({
                        q: query,
                        per_page: perPage,
                    });
                },
            },
        );
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
                description="Pick a class section, choose students, review, then enroll the block into every attached subject."
            >
                <PageLoader skeleton="table">
                    {/* Stepper */}
                    <ol className="mb-4 flex items-center gap-2">
                        {STEPS.map((item, index) => {
                            const reachable = canReachStep(item.n);
                            const active = step === item.n;
                            const done =
                                (item.n === 1 && selectedSection !== null) ||
                                (item.n === 2 &&
                                    selectedStudents.length > 0);

                            return (
                                <li
                                    key={item.n}
                                    className="flex items-center gap-2"
                                >
                                    {index > 0 && (
                                        <span className="mx-1 h-px w-6 bg-sidebar-border sm:w-10" />
                                    )}
                                    <button
                                        type="button"
                                        disabled={!reachable}
                                        onClick={() => goToStep(item.n)}
                                        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                            active
                                                ? 'bg-emerald-600 text-white'
                                                : done
                                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                  : 'bg-muted text-muted-foreground'
                                        } ${reachable && !active ? 'hover:bg-muted/70' : ''} disabled:cursor-not-allowed disabled:opacity-70`}
                                    >
                                        <span className="flex size-5 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
                                            {done && !active ? (
                                                <CheckCircle2 className="size-3.5" />
                                            ) : (
                                                item.n
                                            )}
                                        </span>
                                        {item.label}
                                    </button>
                                </li>
                            );
                        })}
                        <li className="ml-auto hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                            {selectedStudents.length > 0 && (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    {selectedStudents.length} selected
                                </span>
                            )}
                        </li>
                    </ol>

                    {/* Step 1: target section */}
                    {step === 1 && (
                        <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                                        <GraduationCap className="size-5 text-muted-foreground" />
                                        Where are these students going?
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Choose the class section first — the
                                        student list in the next step only shows
                                        eligible students for its grade level.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                        value={sectionGrade || '__all__'}
                                        onValueChange={(value) =>
                                            setSectionGrade(
                                                value === '__all__' ? '' : value,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="w-fit gap-1.5">
                                            <SelectValue placeholder="Grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">
                                                All grades
                                            </SelectItem>
                                            {sectionGrades.map((grade) => (
                                                <SelectItem
                                                    key={grade}
                                                    value={grade}
                                                >
                                                    {grade}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={sectionSort}
                                        onValueChange={(
                                            value:
                                                | 'name-asc'
                                                | 'name-desc'
                                                | 'grade-asc'
                                                | 'grade-desc',
                                        ) => setSectionSort(value)}
                                    >
                                        <SelectTrigger className="w-fit gap-1.5">
                                            <SelectValue placeholder="Sort" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name-asc">
                                                Section A–Z
                                            </SelectItem>
                                            <SelectItem value="name-desc">
                                                Section Z–A
                                            </SelectItem>
                                            <SelectItem value="grade-asc">
                                                Grade 7–12
                                            </SelectItem>
                                            <SelectItem value="grade-desc">
                                                Grade 12–7
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                    {listedSections.length} of{' '}
                                    {classSections.length} sections
                                </span>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {listedSections.map((section) => {
                                    const active =
                                        section.uuid === classSectionUuid;

                                    return (
                                        <button
                                            key={section.uuid}
                                            type="button"
                                            onClick={() =>
                                                handleSectionChange(
                                                    section.uuid,
                                                )
                                            }
                                            className={`rounded-xl border p-4 text-left transition-colors ${
                                                active
                                                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/30 dark:bg-emerald-900/20'
                                                    : 'border-sidebar-border/70 hover:border-emerald-500/50 hover:bg-sidebar-accent/30'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold">
                                                    {section.name}
                                                </span>
                                                {active && (
                                                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                                                )}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                                                    {section.grade_level ??
                                                        'Grade n/a'}
                                                </span>
                                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                                    {section.school_year ??
                                                        'Year auto-assigned'}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                    <BookOpen className="size-3" />
                                                    {section.subject_count}{' '}
                                                    subject(s)
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                                {listedSections.length === 0 && (
                                    <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
                                        {classSections.length === 0
                                            ? 'No class sections exist yet. Create one under Class Sections first.'
                                            : 'No sections match this grade filter.'}
                                    </p>
                                )}
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button
                                    type="button"
                                    disabled={!selectedSection}
                                    onClick={() => goToStep(2)}
                                    className="bg-emerald-600 hover:bg-emerald-500"
                                >
                                    Pick students
                                    <ArrowRight className="size-4" />
                                </Button>
                            </div>
                        </section>
                    )}

                    {/* Step 2: students */}
                    {step === 2 && selectedSection && (
                        <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <div className="flex flex-wrap items-center gap-3">
                                <div>
                                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                                        <Users className="size-5 text-muted-foreground" />
                                        Pick students for {selectedSection.name}
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Only {selectedSection.grade_level ??
                                            'eligible'}{' '}
                                        students are listed. Selection survives
                                        search and pagination.
                                    </p>
                                </div>
                                <div className="ml-auto flex flex-wrap items-center gap-2">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search name, ID, or section"
                                            value={query}
                                            onChange={(e) =>
                                                setQuery(e.target.value)
                                            }
                                            className="w-full pl-8 sm:w-64"
                                        />
                                    </div>
                                    <div className="flex overflow-hidden rounded-lg border border-sidebar-border/70 text-sm">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setUnassignedOnly(false)
                                            }
                                            className={`px-3 py-1.5 ${!unassignedOnly ? 'bg-sidebar-accent font-medium' : 'text-muted-foreground'}`}
                                        >
                                            All eligible
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setUnassignedOnly(true)
                                            }
                                            className={`px-3 py-1.5 ${unassignedOnly ? 'bg-sidebar-accent font-medium' : 'text-muted-foreground'}`}
                                        >
                                            Unassigned only
                                        </button>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={selectAllVisible}
                                    >
                                        Select visible
                                    </Button>
                                    {selectedStudents.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearSelection}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            Clear ({selectedStudents.length})
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 max-h-[46vh] overflow-auto rounded-xl border border-sidebar-border/70 lg:max-h-[54vh]">
                                <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                    <thead className="sticky top-0 z-10 bg-sidebar text-left text-xs font-medium uppercase tracking-wide text-muted-foreground shadow-[0_1px_0_0_var(--sidebar-border)]">
                                        <tr>
                                            <th className="w-10 bg-sidebar px-4 py-3" />
                                            <th className="bg-sidebar px-4 py-3 font-medium">
                                                Student
                                            </th>
                                            <th className="bg-sidebar px-4 py-3 font-medium">
                                                Student ID
                                            </th>
                                            <th className="bg-sidebar px-4 py-3 font-medium">
                                                Grade Level
                                            </th>
                                            <th className="bg-sidebar px-4 py-3 font-medium">
                                                Current Section
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                        {visibleStudents.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-4 py-12 text-center"
                                                >
                                                    <Users className="mx-auto size-8 text-muted-foreground/50" />
                                                    <p className="mt-2 text-sm font-medium">
                                                        No eligible students
                                                    </p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        Try a different search,
                                                        or create a new student.
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                        {visibleStudents.map((student) => (
                                            <tr
                                                key={student.uuid}
                                                className="hover:bg-sidebar-accent/40"
                                            >
                                                <td className="px-4 py-3">
                                                    <Checkbox
                                                        checked={selectedStudents.includes(
                                                            student.uuid,
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleStudent(
                                                                student.uuid,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                    {formatStudentName(student)}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {student.student_id}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {student.grade_level ??
                                                        'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {student.section ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
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
                                                (studentsProp.current_page ||
                                                    1) - 1,
                                        })
                                    }
                                >
                                    <ChevronLeft className="size-3.5" />
                                    Prev
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                    Page {studentsProp.current_page} of{' '}
                                    {studentsProp.last_page} ·{' '}
                                    {studentsProp.total ?? 0} total
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
                                                (studentsProp.current_page ||
                                                    1) + 1,
                                        })
                                    }
                                >
                                    Next
                                    <ChevronRight className="size-3.5" />
                                </Button>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => goToStep(1)}
                                >
                                    <ArrowLeft className="size-4" />
                                    Change section
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.get(
                                                '/admin/create-student',
                                            )
                                        }
                                    >
                                        <UserPlus className="size-4" />
                                        New student
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={
                                            selectedStudents.length === 0
                                        }
                                        onClick={() => goToStep(3)}
                                        className="bg-emerald-600 hover:bg-emerald-500"
                                    >
                                        Review (
                                        {selectedStudents.length})
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Step 3: review */}
                    {step === 3 && selectedSection && (
                        <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <CheckCircle2 className="size-5 text-emerald-600" />
                                Review enrollment
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {selectedStudents.length} student
                                {selectedStudents.length === 1 ? '' : 's'}{' '}
                                into {selectedSection.name} — every subject
                                below is attached automatically.
                            </p>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-sidebar-border/70 p-4">
                                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Target section
                                    </div>
                                    <div className="mt-1 font-semibold">
                                        {selectedSection.name} ·{' '}
                                        {selectedSection.grade_level ??
                                            'Grade n/a'}
                                    </div>
                                    <div className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Subjects (
                                        {selectedSection.subjects.length})
                                    </div>
                                    <ul className="mt-2 max-h-56 space-y-1 overflow-auto text-sm text-muted-foreground">
                                        {selectedSection.subjects.map(
                                            (subject) => (
                                                <li
                                                    key={subject.uuid}
                                                    className="flex items-center gap-2"
                                                >
                                                    <BookOpen className="size-3.5 shrink-0" />
                                                    {subject.name}{' '}
                                                    {subject.code
                                                        ? `(${subject.code})`
                                                        : ''}
                                                </li>
                                            ),
                                        )}
                                        {selectedSection.subjects.length ===
                                            0 && (
                                            <li>
                                                No subjects assigned to this
                                                section yet.
                                            </li>
                                        )}
                                    </ul>
                                </div>
                                <div className="rounded-xl border border-sidebar-border/70 p-4">
                                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Students ({selectedStudents.length})
                                    </div>
                                    <ul className="mt-2 max-h-56 space-y-1 overflow-auto text-sm">
                                        {selectedStudents.map((uuid) => {
                                            const entry = directory[uuid];

                                            return (
                                                <li
                                                    key={uuid}
                                                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent/40"
                                                >
                                                    <span className="truncate font-medium">
                                                        {entry?.name ?? uuid}
                                                    </span>
                                                    <span className="shrink-0 text-xs text-muted-foreground">
                                                        {entry?.student_id ??
                                                            ''}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => goToStep(2)}
                                >
                                    <ArrowLeft className="size-4" />
                                    Back to students
                                </Button>
                                <Button
                                    type="button"
                                    size="lg"
                                    disabled={
                                        submitting ||
                                        selectedStudents.length === 0
                                    }
                                    onClick={enroll}
                                    className="bg-emerald-600 hover:bg-emerald-500"
                                >
                                    <GraduationCap className="size-4" />
                                    {submitting
                                        ? 'Enrolling…'
                                        : `Enroll ${selectedStudents.length} student${selectedStudents.length === 1 ? '' : 's'}`}
                                </Button>
                            </div>
                        </section>
                    )}
                </PageLoader>
            </PortalPageShell>
        </>
    );
}
