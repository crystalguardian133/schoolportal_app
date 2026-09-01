import { Head } from '@inertiajs/react';
import { GraduationCap, FileText } from 'lucide-react';
import { StudentPageShell } from '@/components/student-page-shell';

const quarterLabels = ['Q1', 'Q2', 'Q3'];

function roundToHundredth(n: number): number {
    return Math.round(n * 100) / 100;
}

function formatGrade(n: number | null): string {
    if (n === null || n === undefined) {
return '—';
}

    return roundToHundredth(n).toFixed(2);
}

type GradeRow = {
    subjectCode: string | null;
    subjectName: string | null;
    quarters: number[];
    total: number;
};

type YearLevelGroup = {
    yearLevel: string;
    schoolYear: string;
    section: string | null;
    rows: GradeRow[];
};

type GradesPageProps = {
    student: {
        name: string;
        gradeLevel: string | null;
        section: string | null;
        schoolYear: string | null;
    } | null;
    yearLevelGroups: YearLevelGroup[];
};

export default function Grades({ student, yearLevelGroups }: GradesPageProps) {
    async function downloadReportCard(group: YearLevelGroup) {
        const headers = ['Subject Code', 'Subject Name', ...quarterLabels, 'Total'];
        const rows = group.rows.map(row => [
            row.subjectCode || '—',
            row.subjectName || '—',
            ...row.quarters.map(q => formatGrade(q)),
            formatGrade(row.total)
        ]);

        const generalAverage = formatGrade(
            roundToHundredth(
                group.rows.reduce((sum, r) => sum + (r.total ?? 0), 0) / (group.rows.length || 1),
            )
        );

        rows.push(['', 'GENERAL AVERAGE', '', '', '', generalAverage]);

        const { exportPdf } = await import('@/lib/pdf-export');
        exportPdf({
            title: `Report Card - ${group.yearLevel}`,
            subtitle: `Name: ${student?.name} | Section: ${group.section} | S.Y.: ${group.schoolYear}`,
            headers,
            rows,
            filename: `report-card-${student?.name?.replace(/\s+/g, '-').toLowerCase()}-${group.yearLevel.replace(/\s+/g, '-').toLowerCase()}`
        });
    }

    return (
        <>
            <Head title="Grades" />
            <StudentPageShell
                title="Grades"
                description="Review quarterly subject grades for each school year."
            >
                {student ? (
                    <p className="mb-3 text-sm font-medium text-violet-700 dark:text-violet-300">
                        {student.gradeLevel ?? 'Grade level not set'}
                        {student.section ? ` Section ${student.section}` : ''}
                        {student.schoolYear ? ` · ${student.schoolYear}` : ''}
                    </p>
                ) : null}

                {yearLevelGroups.length > 0 ? (
                    yearLevelGroups.map((group) => (
                        <section
                            key={`${group.yearLevel}-${group.schoolYear}`}
                            className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="size-5 text-violet-600" />
                                    <h2 className="text-lg font-semibold">
                                        {group.yearLevel}{' '}
                                        <span className="ml-3 text-sm font-medium text-violet-700 dark:text-violet-300">
                                            {group.schoolYear}
                                        </span>
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => downloadReportCard(group)}
                                    className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-100 dark:border-violet-900/50 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/40"
                                >
                                    <FileText className="size-4" />
                                    Export PDF
                                </button>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                This container shows the quarterly grades for{' '}
                                {group.yearLevel} section {group.section} and
                                the school year when the grades were applied.
                            </p>

                            <div className="table-scroll-container table-scroll-manage mt-5 rounded-xl border border-sidebar-border/70">
                                <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                    <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">
                                                Section
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Subject Code
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Subject Name
                                            </th>
                                            {quarterLabels.map((quarter) => (
                                                <th
                                                    key={quarter}
                                                    className="px-4 py-3 text-center font-medium"
                                                >
                                                    {quarter}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-center font-medium">
                                                TOTAL
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                        {group.rows.map((row) => (
                                            <tr
                                                key={`${group.yearLevel}-${group.section}-${row.subjectCode}`}
                                                className="hover:bg-sidebar-accent/40"
                                            >
                                                <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                    {group.section}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                    {row.subjectCode}
                                                </td>
                                                <td className="px-4 py-3 text-sidebar-foreground">
                                                    {row.subjectName}
                                                </td>
                                                {row.quarters.map(
                                                    (quarterGrade, index) => (
                                                        <td
                                                            key={`${row.subjectCode}-${quarterLabels[index]}`}
                                                            className="px-4 py-3 text-center text-muted-foreground"
                                                        >
                                                            {formatGrade(quarterGrade)}
                                                        </td>
                                                    ),
                                                )}
                                                <td className="px-4 py-3 text-center font-semibold text-sidebar-foreground">
                                                    {formatGrade(row.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-sidebar/60">
                                            <td colSpan={3 + quarterLabels.length} className="px-4 py-3 text-right text-sm font-semibold text-sidebar-foreground">
                                                General Average
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-bold text-sidebar-foreground">
                                                {formatGrade(
                                                    roundToHundredth(
                                                        group.rows.reduce((sum, r) => sum + (r.total ?? 0), 0) / (group.rows.length || 1),
                                                    ),
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>
                    ))
                ) : (
                    <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <p className="text-sm text-muted-foreground">
                            No grade records found for the current student.
                        </p>
                    </section>
                )}
            </StudentPageShell>
        </>
    );
}
