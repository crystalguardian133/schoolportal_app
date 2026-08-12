import { Head } from '@inertiajs/react';
import { Users, BookOpen, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';

type StudentOverview = {
    uuid: string;
    name: string;
    lrn: string | null;
    grades: {
        average: number | null;
        failing_count: number;
        subjects_count: number;
    };
    attendance: {
        rate: number;
        present: number;
        absent: number;
    };
};

type Props = {
    section: string;
    schoolYear: string;
    students: StudentOverview[];
};

export default function AdviserDashboard({ section, schoolYear, students }: Props) {
    const totalStudents = students.length;
    const failingStudents = students.filter(s => s.grades.failing_count > 0).length;
    const lowAttendanceStudents = students.filter(s => s.attendance.rate < 80).length;
    
    return (
        <PortalPageShell
            title={`Advisory Dashboard - Section ${section}`}
            description={`Overview for School Year ${schoolYear}`}
        >
            <Head title={`Adviser Dashboard - ${section}`} />

            <div className="space-y-6">
                {/* Stats Row */}
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-3">
                            <Users className="size-5 text-blue-500" />
                            <h3 className="font-semibold text-card-foreground">Total Students</h3>
                        </div>
                        <p className="mt-2 text-3xl font-bold">{totalStudents}</p>
                    </div>
                    
                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="size-5 text-red-500" />
                            <h3 className="font-semibold text-card-foreground">Failing Students</h3>
                        </div>
                        <p className="mt-2 text-3xl font-bold text-red-600">{failingStudents}</p>
                        <p className="text-xs text-muted-foreground mt-1">Students with failing grades</p>
                    </div>

                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="size-5 text-amber-500" />
                            <h3 className="font-semibold text-card-foreground">Low Attendance</h3>
                        </div>
                        <p className="mt-2 text-3xl font-bold text-amber-600">{lowAttendanceStudents}</p>
                        <p className="text-xs text-muted-foreground mt-1">Students &lt; 80% rate</p>
                    </div>
                </div>

                {/* Students Table */}
                <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="p-4 border-b bg-muted/30">
                        <h3 className="font-semibold">Class Roster</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Student Name</th>
                                    <th className="px-6 py-3 text-center">Subjects</th>
                                    <th className="px-6 py-3 text-center">Average</th>
                                    <th className="px-6 py-3 text-center">Failing</th>
                                    <th className="px-6 py-3 text-center">Attendance Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {students.length > 0 ? (
                                    students.map(student => (
                                        <tr key={student.uuid} className="hover:bg-muted/50 transition">
                                            <td className="px-6 py-4 font-medium">
                                                {student.name}
                                                {student.lrn && <div className="text-xs text-muted-foreground">{student.lrn}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-center">{student.grades.subjects_count}</td>
                                            <td className="px-6 py-4 text-center">
                                                {student.grades.average ? (
                                                    <span className={`font-semibold ${student.grades.average < 75 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        {student.grades.average.toFixed(2)}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {student.grades.failing_count > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full text-xs font-medium">
                                                        <AlertCircle className="size-3" />
                                                        {student.grades.failing_count}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs bg-muted px-2 py-0.5 rounded-full">None</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`font-semibold ${student.attendance.rate < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {student.attendance.rate}%
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({student.attendance.present} present)
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                            No students found in this section.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PortalPageShell>
    );
}
