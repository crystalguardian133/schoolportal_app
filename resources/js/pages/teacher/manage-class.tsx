import { Head, Link, router, usePage } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';

type TeacherClass = {
    id: string;
    section: string;
    subject: string;
    students: number;
    timeSchedule: string;
};

type StudentRow = {
    name: string;
    lrn: string;
    studentId: string;
    uuid?: string;
    q1: number | null;
    q2: number | null;
    q3: number | null;
};

type Props = {
    classes: TeacherClass[];
    selectedClass: TeacherClass;
    students: StudentRow[];
    advisorySubjects?: { uuid: string; name: string; teacher?: string }[];
    advisoryMatrix?: {
        [studentUuid: string]: {
            [subjectUuid: string]: {
                q1: number | null;
                q2: number | null;
                q3: number | null;
                total: number | null;
            };
        };
    };
    studentAverages?: {
        [studentUuid: string]: {
            q1: number | null;
            q2: number | null;
            q3: number | null;
            overall: number | null;
        };
    };
    canEdit?: boolean;
};

export default function ManageClass({
    classes,
    selectedClass,
    students,
    advisorySubjects,
    advisoryMatrix,
    studentAverages,
    canEdit = false,
}: Props) {
    const classList = Array.isArray(classes)
        ? classes
        : classes
          ? Object.values(classes)
          : [];

    const [gradeRows, setGradeRows] = useState(() =>
        students.map((s) => ({
            studentId: s.studentId,
            q1: s.q1 ?? null,
            q2: s.q2 ?? null,
            q3: s.q3 ?? null,
        })),
    );

    function setGrade(
        idx: number,
        field: 'q1' | 'q2' | 'q3',
        value: number | null,
    ) {
        const copy = [...gradeRows];
        copy[idx] = { ...copy[idx], [field]: value };
        setGradeRows(copy);
    }

    useEffect(() => {
        // Keep local gradeRows in sync when server props change (e.g., after save)
        setGradeRows(
            students.map((s) => ({
                studentId: s.studentId,
                q1: s.q1 ?? null,
                q2: s.q2 ?? null,
                q3: s.q3 ?? null,
            })),
        );
    }, [students]);

    const [submitting, setSubmitting] = useState(false);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    function saveGrades() {
        setSubmitting(true);
        router.post(
            `/teacher/classes/${selectedClass.id}/grades`,
            { grades: gradeRows },
            {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    // trigger a client toast since partial reloads may not include flash
                    window.dispatchEvent(
                        new CustomEvent('local-toast', {
                            detail: {
                                message: 'Grades updated',
                                type: 'success',
                            },
                        }),
                    );
                    router.reload({ only: ['students'] });
                },
            },
        );
    }

    const hasChanges = useMemo(() => {
        if (!students || students.length !== gradeRows.length) {
            return true;
        }

        for (let i = 0; i < students.length; i++) {
            const s = students[i];
            const g = gradeRows[i];

            if ((s.q1 ?? null) !== (g.q1 ?? null)) {
                return true;
            }

            if ((s.q2 ?? null) !== (g.q2 ?? null)) {
                return true;
            }

            if ((s.q3 ?? null) !== (g.q3 ?? null)) {
                return true;
            }
        }

        return false;
    }, [students, gradeRows]);

    // Toasts are now handled globally by PortalPageShell via Inertia flash props

    return (
        <>
            <Head title={`Manage ${selectedClass.section}`} />
            <PortalPageShell
                title="Manage Class"
                description="Choose a class first, then enter grades for the students in that class."
            >
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-center gap-3">
                        <Users className="size-5 text-sky-600" />
                        <div>
                            <h2 className="text-lg font-semibold">
                                {selectedClass.section}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {selectedClass.subject} ·{' '}
                                {selectedClass.timeSchedule}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {classList.map((item) => (
                            <Link
                                key={item.id}
                                href={`/teacher/classes/${item.id}`}
                                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                                    item.id === selectedClass.id
                                        ? 'border-sky-600 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200'
                                        : 'border-sidebar-border/70 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                }`}
                            >
                                {item.section} · {item.subject}
                            </Link>
                        ))}
                    </div>

                    {!canEdit && (
                        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                            You do not have permission to edit grades for this
                            class.
                        </div>
                    )}

                    <div className="table-scroll-container table-scroll-manage mt-5 rounded-xl border border-sidebar-border/70">
                        {selectedClass.subject === 'Advisory' ? (
                            <>
                                <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                    <thead className="sticky top-0 z-20 bg-sidebar/60 text-left text-muted-foreground">
                                        <tr>
                                            <th className="w-10 px-3 py-2 font-medium"></th>
                                            <th className="sticky left-0 z-30 bg-sidebar/60 px-4 py-3 font-medium">
                                                Student
                                            </th>
                                            {advisorySubjects?.map((sub) => (
                                                <th
                                                    key={sub.uuid}
                                                    className="px-4 py-3 text-center font-medium whitespace-nowrap"
                                                >
                                                    {sub.name}
                                                </th>
                                            ))}
                                            <th className="sticky right-0 z-30 bg-sidebar/60 px-4 py-3 text-center font-medium">
                                                Overall
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                        {students.map((student) => (
                                            <>
                                                <tr
                                                    key={student.studentId}
                                                    className="hover:bg-sidebar-accent/40"
                                                >
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            onClick={() =>
                                                                setExpandedStudent(
                                                                    expandedStudent ===
                                                                        student.uuid
                                                                        ? null
                                                                        : student.uuid,
                                                                )
                                                            }
                                                            className="rounded p-1 text-muted-foreground hover:text-sidebar-foreground"
                                                            aria-label="Toggle details"
                                                        >
                                                            {expandedStudent ===
                                                            student.uuid
                                                                ? '▾'
                                                                : '▸'}
                                                        </button>
                                                    </td>
                                                    <td className="sticky left-0 z-20 bg-white px-4 py-3 font-medium text-sidebar-foreground dark:bg-sidebar">
                                                        {student.name}
                                                    </td>
                                                    {advisorySubjects?.map(
                                                        (sub) => {
                                                            const cell =
                                                                advisoryMatrix?.[
                                                                    student.uuid ??
                                                                        ''
                                                                ]?.[sub.uuid];
                                                            const display =
                                                                cell?.total ??
                                                                '-';
                                                            const tooltip = `Q1: ${cell?.q1 ?? '-'}\nQ2: ${cell?.q2 ?? '-'}\nQ3: ${cell?.q3 ?? '-'}`;

                                                            return (
                                                                <td
                                                                    key={`${student.studentId}-${sub.uuid}`}
                                                                    className="px-4 py-3 text-center text-muted-foreground"
                                                                    title={
                                                                        tooltip
                                                                    }
                                                                >
                                                                    {display}
                                                                </td>
                                                            );
                                                        },
                                                    )}
                                                    {(() => {
                                                        const overall =
                                                            studentAverages?.[
                                                                student.uuid ??
                                                                    ''
                                                            ]?.overall;
                                                        const isNum =
                                                            typeof overall ===
                                                            'number';
                                                        const colorClass = isNum
                                                            ? overall! >= 75
                                                                ? 'text-emerald-600'
                                                                : 'text-rose-600'
                                                            : 'text-sidebar-foreground';

                                                        return (
                                                            <td
                                                                className={`sticky right-0 z-20 bg-white px-4 py-3 text-center font-semibold dark:bg-sidebar ${colorClass}`}
                                                            >
                                                                {isNum
                                                                    ? overall
                                                                    : '-'}
                                                            </td>
                                                        );
                                                    })()}
                                                </tr>

                                                {expandedStudent ===
                                                    student.uuid && (
                                                    <tr className="bg-white/50 dark:bg-sidebar/60">
                                                        <td
                                                            colSpan={
                                                                advisorySubjects
                                                                    ? advisorySubjects.length +
                                                                      3
                                                                    : 3
                                                            }
                                                            className="px-4 py-3"
                                                        >
                                                            <div className="flex flex-col gap-3">
                                                                <div className="text-sm font-medium">
                                                                    {
                                                                        student.name
                                                                    }{' '}
                                                                    — Detailed
                                                                    Grades
                                                                </div>
                                                                <div className="overflow-auto">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th className="px-2 py-1 text-left">
                                                                                    Subject
                                                                                </th>
                                                                                <th className="px-2 py-1 text-center">
                                                                                    Q1
                                                                                </th>
                                                                                <th className="px-2 py-1 text-center">
                                                                                    Q2
                                                                                </th>
                                                                                <th className="px-2 py-1 text-center">
                                                                                    Q3
                                                                                </th>
                                                                                <th className="px-2 py-1 text-center">
                                                                                    Total
                                                                                </th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {advisorySubjects?.map(
                                                                                (
                                                                                    sub,
                                                                                ) => {
                                                                                    const cell =
                                                                                        advisoryMatrix?.[
                                                                                            student.uuid ??
                                                                                                ''
                                                                                        ]?.[
                                                                                            sub
                                                                                                .uuid
                                                                                        ];

                                                                                    return (
                                                                                        <tr
                                                                                            key={`detail-${student.studentId}-${sub.uuid}`}
                                                                                        >
                                                                                            <td className="px-2 py-1">
                                                                                                {
                                                                                                    sub.name
                                                                                                }
                                                                                            </td>
                                                                                            <td className="px-2 py-1 text-center">
                                                                                                {cell?.q1 ??
                                                                                                    '-'}
                                                                                            </td>
                                                                                            <td className="px-2 py-1 text-center">
                                                                                                {cell?.q2 ??
                                                                                                    '-'}
                                                                                            </td>
                                                                                            <td className="px-2 py-1 text-center">
                                                                                                {cell?.q3 ??
                                                                                                    '-'}
                                                                                            </td>
                                                                                            <td className="px-2 py-1 text-center font-semibold">
                                                                                                {cell?.total ??
                                                                                                    '-'}
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                },
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium">
                                                                        Averages
                                                                    </div>
                                                                    <div className="mt-1 text-sm text-muted-foreground">
                                                                        Q1:{' '}
                                                                        {studentAverages?.[
                                                                            student.uuid ??
                                                                                ''
                                                                        ]?.q1 ??
                                                                            '-'}{' '}
                                                                        · Q2:{' '}
                                                                        {studentAverages?.[
                                                                            student.uuid ??
                                                                                ''
                                                                        ]?.q2 ??
                                                                            '-'}{' '}
                                                                        · Q3:{' '}
                                                                        {studentAverages?.[
                                                                            student.uuid ??
                                                                                ''
                                                                        ]?.q3 ??
                                                                            '-'}{' '}
                                                                        ·
                                                                        Overall:{' '}
                                                                        {studentAverages?.[
                                                                            student.uuid ??
                                                                                ''
                                                                        ]
                                                                            ?.overall ??
                                                                            '-'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        ) : (
                            <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Student
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            LRN
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Student ID
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium">
                                            Q1
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium">
                                            Q2
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium">
                                            Q3
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium">
                                            TOTAL
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                    {students.map((student, idx) => {
                                        const total = Math.round(
                                            (gradeRows[idx].q1 +
                                                gradeRows[idx].q2 +
                                                gradeRows[idx].q3) /
                                                3,
                                        );

                                        return (
                                            <tr
                                                key={student.studentId}
                                                className="hover:bg-sidebar-accent/40"
                                            >
                                                <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                    {student.name}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {student.lrn}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {student.studentId}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sidebar-foreground">
                                                    <input
                                                        type="number"
                                                        value={
                                                            gradeRows[idx].q1 ??
                                                            ''
                                                        }
                                                        disabled={!canEdit}
                                                        onChange={(e) => {
                                                            const v =
                                                                e.target.value;
                                                            setGrade(
                                                                idx,
                                                                'q1',
                                                                v === ''
                                                                    ? null
                                                                    : Number(v),
                                                            );
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'Enter'
                                                            ) {
                                                                e.preventDefault();

                                                                if (
                                                                    !submitting &&
                                                                    hasChanges
                                                                ) {
                                                                    saveGrades();
                                                                }
                                                            }
                                                        }}
                                                        className="w-16 rounded border px-2 py-1 text-center"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center text-sidebar-foreground">
                                                    <input
                                                        type="number"
                                                        value={
                                                            gradeRows[idx].q2 ??
                                                            ''
                                                        }
                                                        disabled={!canEdit}
                                                        onChange={(e) => {
                                                            const v =
                                                                e.target.value;
                                                            setGrade(
                                                                idx,
                                                                'q2',
                                                                v === ''
                                                                    ? null
                                                                    : Number(v),
                                                            );
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'Enter'
                                                            ) {
                                                                e.preventDefault();

                                                                if (
                                                                    !submitting &&
                                                                    hasChanges
                                                                ) {
                                                                    saveGrades();
                                                                }
                                                            }
                                                        }}
                                                        className="w-16 rounded border px-2 py-1 text-center"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center text-sidebar-foreground">
                                                    <input
                                                        type="number"
                                                        value={
                                                            gradeRows[idx].q3 ??
                                                            ''
                                                        }
                                                        disabled={!canEdit}
                                                        onChange={(e) => {
                                                            const v =
                                                                e.target.value;
                                                            setGrade(
                                                                idx,
                                                                'q3',
                                                                v === ''
                                                                    ? null
                                                                    : Number(v),
                                                            );
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'Enter'
                                                            ) {
                                                                e.preventDefault();

                                                                if (
                                                                    !submitting &&
                                                                    hasChanges
                                                                ) {
                                                                    saveGrades();
                                                                }
                                                            }
                                                        }}
                                                        className="w-16 rounded border px-2 py-1 text-center"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center font-semibold text-sidebar-foreground">
                                                    {total}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {canEdit && (
                        <div className="mt-4">
                            <button
                                onClick={saveGrades}
                                disabled={submitting || !hasChanges}
                                className={`rounded-md px-4 py-2 text-white disabled:opacity-50 ${submitting || !hasChanges ? 'bg-gray-400' : 'bg-sky-600'}`}
                            >
                                {submitting ? 'Saving…' : 'Save grades'}
                            </button>
                        </div>
                    )}
                </section>
            </PortalPageShell>
        </>
    );
}
