import { Head, router } from '@inertiajs/react';
import { Pencil, Save, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { exportPdf } from '@/lib/pdf-export';

type Subject = {
    uuid: string;
    name: string;
    code: string | null;
    time_schedule: string | null;
    section: string;
    sectionUuid: string | null;
};

type StudentRow = {
    enrollmentId: number;
    studentUuid: string;
    name: string;
    lrn: string | null;
    studentId: string | null;
    q1: number | null;
    q2: number | null;
    q3: number | null;
    total: number | null;
};

type Props = {
    subjects: Subject[];
    selectedSubject: Subject | null;
    selectedSubjectUuid: string | null;
    selectedSectionUuid: string | null;
    students: StudentRow[];
    totalStudents: number;
    currentPage: number;
    perPage: number;
    search: string;
    gradesLocked: boolean;
    schoolYears: { name: string; status: string; is_active: boolean }[];
    selectedSchoolYear: string;
};

export default function TeacherGrades({
    subjects,
    selectedSubject,
    selectedSubjectUuid,
    selectedSectionUuid: serverSectionUuid,
    students,
    totalStudents,
    currentPage,
    perPage,
    search: serverSearch,
    gradesLocked,
    schoolYears,
    selectedSchoolYear: serverSchoolYear,
}: Props) {
    const [search, setSearch] = useState(serverSearch);
    const [selectedSchoolYear, setSelectedSchoolYear] = useState(serverSchoolYear);
    const [selectedSectionUuid, setSelectedSectionUuid] = useState<string | null>(serverSectionUuid);
    const [gradeRows, setGradeRows] = useState<(number | null)[][]>(() =>
        students.map((s) => [s.q1 ?? null, s.q2 ?? null, s.q3 ?? null]),
    );
    const [submitting, setSubmitting] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const totalPages = Math.max(1, Math.ceil(totalStudents / perPage));

    useEffect(() => {
        setGradeRows(students.map((s) => [s.q1 ?? null, s.q2 ?? null, s.q3 ?? null]));
    }, [students]);

    useEffect(() => {
        setSearch(serverSearch);
    }, [serverSearch]);

    useEffect(() => {
        return () => {
            if (searchTimer.current) {
clearTimeout(searchTimer.current);
}
        };
    }, []);

    const hasChanges = useMemo(() => {
        if (students.length !== gradeRows.length) {
return true;
}

        for (let i = 0; i < students.length; i++) {
            if ((students[i].q1 ?? null) !== (gradeRows[i]?.[0] ?? null)) {
return true;
}

            if ((students[i].q2 ?? null) !== (gradeRows[i]?.[1] ?? null)) {
return true;
}

            if ((students[i].q3 ?? null) !== (gradeRows[i]?.[2] ?? null)) {
return true;
}
        }

        return false;
    }, [students, gradeRows]);

    const pageNumbers = useMemo(() => {
        const pages: (number | '...')[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
pages.push(i);
}
        } else {
            pages.push(1);

            if (currentPage > 3) {
pages.push('...');
}

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
pages.push(i);
}

            if (currentPage < totalPages - 2) {
pages.push('...');
}

            pages.push(totalPages);
        }

        return pages;
    }, [currentPage, totalPages]);

    function navigate(params: Record<string, string | number>) {
        router.get('/teacher/grades', params, {
            only: ['students', 'totalStudents', 'currentPage', 'search', 'selectedSubject', 'selectedSubjectUuid', 'selectedSectionUuid', 'selectedSchoolYear', 'gradesLocked'],
            preserveState: true,
        });
    }

    function handleSubjectChange(value: string) {
        setSearch('');
        // value format: "{subjectUuid}" or "{subjectUuid}:{sectionUuid}"
        const [subjectUuid, sectionUuid] = value.split(':');
        setSelectedSectionUuid(sectionUuid ?? null);
        navigate({
            subject_uuid: subjectUuid,
            section_uuid: sectionUuid ?? '',
            school_year: selectedSchoolYear,
        });
    }

    function handleSchoolYearChange(year: string) {
        setSelectedSchoolYear(year);
        setSearch('');
        navigate({
            subject_uuid: selectedSubjectUuid ?? '',
            section_uuid: selectedSectionUuid ?? '',
            school_year: year,
            page: 1,
        });
    }

    function handleSearchInput(value: string) {
        setSearch(value);

        if (searchTimer.current) {
clearTimeout(searchTimer.current);
}

        searchTimer.current = setTimeout(() => {
            navigate({
                subject_uuid: selectedSubjectUuid ?? '',
                section_uuid: selectedSectionUuid ?? '',
                school_year: selectedSchoolYear,
                search: value.trim(),
            });
        }, 400);
    }

    function handleSearchKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            if (searchTimer.current) {
clearTimeout(searchTimer.current);
}

            navigate({
                subject_uuid: selectedSubjectUuid ?? '',
                section_uuid: selectedSectionUuid ?? '',
                school_year: selectedSchoolYear,
                search: search.trim(),
            });
        }
    }

    function goToPage(page: number) {
        if (page < 1 || page > totalPages) {
return;
}

        navigate({
            subject_uuid: selectedSubjectUuid ?? '',
            section_uuid: selectedSectionUuid ?? '',
            school_year: selectedSchoolYear,
            page,
            search: search.trim(),
        });
    }

    function setGrade(idx: number, field: 0 | 1 | 2, value: number | null) {
        setGradeRows((prev) => {
            const copy = [...prev];
            copy[idx] = [...(copy[idx] ?? [null, null, null])];
            copy[idx][field] = value;

            return copy;
        });
    }

    function saveGrades() {
        if (!selectedSubjectUuid) {
return;
}

        setSubmitting(true);
        const payload = students.map((s, i) => ({
            studentId: s.studentId,
            q1: gradeRows[i]?.[0] ?? null,
            q2: gradeRows[i]?.[1] ?? null,
            q3: gradeRows[i]?.[2] ?? null,
        }));
        router.post(
            `/teacher/grades/${selectedSubjectUuid}`,
            { grades: payload, school_year: selectedSchoolYear, section_uuid: selectedSectionUuid ?? '' },
            {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    window.dispatchEvent(
                        new CustomEvent('local-toast', {
                            detail: { message: 'Grades updated', type: 'success' },
                        }),
                    );
                    navigate({
                        subject_uuid: selectedSubjectUuid,
                        section_uuid: selectedSectionUuid ?? '',
                        school_year: selectedSchoolYear,
                        page: currentPage,
                        search: search.trim(),
                    });
                },
            },
        );
    }

    function downloadGradesPdf() {
        if (!selectedSubject) {
return;
}

        const headers = ['Student', 'LRN', 'Q1', 'Q2', 'Q3', 'Total'];
        const rows = students.map((s) => [
            s.name,
            s.lrn ?? '—',
            s.q1 ?? '—',
            s.q2 ?? '—',
            s.q3 ?? '—',
            s.total ?? '—',
        ]);
        exportPdf({
            title: `Grades – ${selectedSubject.name}`,
            subtitle: selectedSubject.section ? `Section: ${selectedSubject.section}` : undefined,
            headers,
            rows,
            filename: `grades-${selectedSubject.code || selectedSubject.name}-${selectedSubject.section}`.replace(/\s+/g, '-').toLowerCase(),
        });
    }

    const startItem = totalStudents === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, totalStudents);

    return (
        <>
            <Head title="Edit Grades" />
            <PortalPageShell
                title="Edit Grades"
                description="Select a subject to view and edit student grades."
            >
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-center gap-3">
                        <Pencil className="size-5 text-sky-600" />
                        <h2 className="text-lg font-semibold">Grade Editing</h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Choose a subject below, then edit Q1, Q2, and Q3 grades for each student.
                    </p>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-sidebar-foreground">Select Subject</label>
                        <select
                            value={selectedSectionUuid ? `${selectedSubjectUuid}:${selectedSectionUuid}` : (selectedSubjectUuid ?? '')}
                            onChange={(e) => e.target.value && handleSubjectChange(e.target.value)}
                            className="mt-1 w-full max-w-md rounded-md border border-sidebar-border/70 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none dark:bg-sidebar"
                        >
                            <option value="">-- Select a subject --</option>
                            {subjects.map((s) => (
                                <option key={`${s.uuid}:${s.sectionUuid ?? ''}`} value={`${s.uuid}:${s.sectionUuid ?? ''}`}>
                                    {s.name} ({s.section})
                                </option>
                            ))}
                        </select>
                    </div>

                    {schoolYears.length > 0 && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-sidebar-foreground">School Year</label>
                            <select
                                value={selectedSchoolYear}
                                onChange={(e) => handleSchoolYearChange(e.target.value)}
                                className="mt-1 w-full max-w-md rounded-md border border-sidebar-border/70 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none dark:bg-sidebar"
                            >
                                <option value="">All School Years</option>
                                {schoolYears.map((sy) => (
                                    <option key={sy.name} value={sy.name}>
                                        {sy.name} {sy.is_active ? '(Active)' : sy.status === 'ended' ? '(Ended)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedSubject && (
                        <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200">
                            <span className="font-semibold">{selectedSubject.name}</span> — {selectedSubject.section}
                            {selectedSubject.time_schedule && <> · {selectedSubject.time_schedule}</>}
                        </div>
                    )}

                    {selectedSubjectUuid && gradesLocked && (
                        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                            <span className="font-semibold">Grades are locked.</span> This school year has ended and grades can no longer be edited. Please contact an admin or registrar for grade manipulation.
                        </div>
                    )}

                    {selectedSubjectUuid && (
                        <>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, LRN, or student ID…"
                                        value={search}
                                        onChange={(e) => handleSearchInput(e.target.value)}
                                        onKeyDown={handleSearchKeyDown}
                                        className="w-full rounded-md border border-sidebar-border/70 bg-white pl-9 pr-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none dark:bg-sidebar"
                                    />
                                </div>
                                {totalStudents > 0 && (
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                        Showing {startItem}–{endItem} of {totalStudents}
                                        {search.trim() ? ` matching "${search}"` : ''}
                                    </span>
                                )}
                            </div>

                            {students.length > 0 ? (
                                <>
                                    <div className="table-scroll-container table-scroll-manage mt-3 rounded-xl border border-sidebar-border/70">
                                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Student</th>
                                                    <th className="px-4 py-3 font-medium">LRN</th>
                                                    <th className="px-4 py-3 font-medium">Student ID</th>
                                                    <th className="px-4 py-3 text-center font-medium">Q1</th>
                                                    <th className="px-4 py-3 text-center font-medium">Q2</th>
                                                    <th className="px-4 py-3 text-center font-medium">Q3</th>
                                                    <th className="px-4 py-3 text-center font-medium">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                                {students.map((student, idx) => {
                                                    const q1 = gradeRows[idx]?.[0];
                                                    const q2 = gradeRows[idx]?.[1];
                                                    const q3 = gradeRows[idx]?.[2];
                                                    const total =
                                                        q1 != null && q2 != null && q3 != null
                                                            ? Math.round((q1 + q2 + q3) / 3)
                                                            : '—';

                                                    return (
                                                        <tr key={student.enrollmentId} className="hover:bg-sidebar-accent/40">
                                                            <td className="px-4 py-3 font-medium text-sidebar-foreground">{student.name}</td>
                                                            <td className="px-4 py-3 text-muted-foreground">{student.lrn ?? '—'}</td>
                                                            <td className="px-4 py-3 text-muted-foreground">{student.studentId ?? '—'}</td>
                                                            {([0, 1, 2] as const).map((fi) => (
                                                                <td key={fi} className="px-4 py-3 text-center text-sidebar-foreground">
                                                                    <input
                                                                        type="number"
                                                                        value={gradeRows[idx]?.[fi] ?? ''}
                                                                        min={0}
                                                                        max={100}
                                                                        disabled={gradesLocked}
                                                                        onChange={(e) => {
                                                                            const v = e.target.value;
                                                                            setGrade(idx, fi, v === '' ? null : Number(v));
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();

                                                                                if (!submitting && hasChanges && !gradesLocked) {
saveGrades();
}
                                                                            }
                                                                        }}
                                                                        className="w-16 rounded border px-2 py-1 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    />
                                                                </td>
                                                            ))}
                                                            <td className="px-4 py-3 text-center font-semibold text-sidebar-foreground">{total}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={saveGrades}
                                                disabled={submitting || !hasChanges || gradesLocked}
                                                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-white disabled:opacity-50 ${
                                                    submitting || !hasChanges ? 'bg-gray-400' : 'bg-sky-600 hover:bg-sky-700'
                                                }`}
                                            >
                                                <Save className="size-4" />
                                                {submitting ? 'Saving…' : 'Save grades'}
                                            </button>

                                            <button
                                                onClick={downloadGradesPdf}
                                                disabled={!selectedSubject}
                                                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                                            >
                                                <Download className="size-4" />
                                                Download PDF
                                            </button>
                                        </div>

                                        {totalPages > 1 && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => goToPage(1)}
                                                    disabled={currentPage === 1}
                                                    className="inline-flex items-center justify-center size-8 rounded-md border border-sidebar-border/70 text-sm font-medium disabled:opacity-40 hover:bg-sidebar-accent"
                                                    title="First page"
                                                >
                                                    <ChevronsLeft className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => goToPage(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="inline-flex items-center justify-center size-8 rounded-md border border-sidebar-border/70 text-sm font-medium disabled:opacity-40 hover:bg-sidebar-accent"
                                                    title="Previous page"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </button>

                                                {pageNumbers.map((p, i) =>
                                                    p === '...' ? (
                                                        <span key={`dots-${i}`} className="px-1 text-muted-foreground">…</span>
                                                    ) : (
                                                        <button
                                                            key={p}
                                                            onClick={() => goToPage(p)}
                                                            className={`inline-flex items-center justify-center size-8 rounded-md border text-sm font-medium ${
                                                                p === currentPage
                                                                    ? 'border-sky-600 bg-sky-600 text-white'
                                                                    : 'border-sidebar-border/70 hover:bg-sidebar-accent'
                                                            }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ),
                                                )}

                                                <button
                                                    onClick={() => goToPage(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="inline-flex items-center justify-center size-8 rounded-md border border-sidebar-border/70 text-sm font-medium disabled:opacity-40 hover:bg-sidebar-accent"
                                                    title="Next page"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => goToPage(totalPages)}
                                                    disabled={currentPage === totalPages}
                                                    className="inline-flex items-center justify-center size-8 rounded-md border border-sidebar-border/70 text-sm font-medium disabled:opacity-40 hover:bg-sidebar-accent"
                                                    title="Last page"
                                                >
                                                    <ChevronsRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="mt-5 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                                    {search.trim()
                                        ? `No students match "${search}" in this subject. Try a different search.`
                                        : 'No students are enrolled in this subject yet.'}
                                </div>
                            )}
                        </>
                    )}

                    {!selectedSubjectUuid && (
                        <div className="mt-5 rounded-md border border-sidebar-border/70 bg-sidebar-accent/30 p-4 text-sm text-muted-foreground">
                            Select a subject above to view and edit student grades.
                        </div>
                    )}
                </section>
            </PortalPageShell>
        </>
    );
}
