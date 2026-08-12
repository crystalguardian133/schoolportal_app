import { Head } from '@inertiajs/react';
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { StudentPageShell } from '@/components/student-page-shell';

type AttendanceStats = {
    overallRate: number;
    present: number;
    late: number;
    absent: number;
    total: number;
};

type SubjectAttendance = {
    subjectName: string;
    subjectCode: string;
    stats: {
        total: number;
        present: number;
        late: number;
        absent: number;
        rate: number;
    };
    history: {
        date: string;
        time: string;
        status: string;
        notes: string | null;
    }[];
};

type Props = {
    student: {
        name: string;
        lrn: string | null;
    };
    stats: AttendanceStats;
    attendanceBySubject: SubjectAttendance[];
};

export default function StudentAttendance({ student, stats, attendanceBySubject }: Props) {
    return (
        <StudentPageShell
            pageTitle="Attendance History"
            breadcrumbs={[{ title: 'Attendance', href: '/student/attendance' }]}
        >
            <Head title="Attendance - DNHS School Portal" />

            <div className="space-y-6">
                {/* Overall Stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border bg-card p-4">
                        <div className="text-sm font-medium text-muted-foreground">Overall Rate</div>
                        <div className="mt-1 text-2xl font-bold">{stats.overallRate}%</div>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <CheckCircle2 className="size-4 text-emerald-500" /> Present
                        </div>
                        <div className="mt-1 text-2xl font-bold">{stats.present}</div>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Clock className="size-4 text-amber-500" /> Late
                        </div>
                        <div className="mt-1 text-2xl font-bold">{stats.late}</div>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <XCircle className="size-4 text-red-500" /> Absent
                        </div>
                        <div className="mt-1 text-2xl font-bold">{stats.absent}</div>
                    </div>
                </div>

                {/* Subject breakdown */}
                <div className="space-y-6">
                    {attendanceBySubject.map((subject) => (
                        <div key={subject.subjectCode} className="overflow-hidden rounded-lg border bg-card">
                            <div className="border-b bg-muted/30 p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="font-semibold text-card-foreground">{subject.subjectName}</h3>
                                        <p className="text-sm text-muted-foreground">{subject.subjectCode}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                                        <div className="text-emerald-500">P: {subject.stats.present}</div>
                                        <div className="text-amber-500">L: {subject.stats.late}</div>
                                        <div className="text-red-500">A: {subject.stats.absent}</div>
                                        <div className="text-card-foreground">({subject.stats.rate}%)</div>
                                    </div>
                                </div>
                            </div>

                            {subject.history.length > 0 ? (
                                <div className="divide-y">
                                    {subject.history.map((record, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="size-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium text-card-foreground">
                                                        {new Date(record.date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{record.time}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {record.notes && (
                                                    <span className="text-xs text-muted-foreground max-w-[120px] truncate sm:max-w-none">
                                                        {record.notes}
                                                    </span>
                                                )}
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        record.status === 'present'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : record.status === 'late'
                                                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}
                                                >
                                                    {record.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-sm text-muted-foreground">No attendance records found for this subject.</div>
                            )}
                        </div>
                    ))}

                    {attendanceBySubject.length === 0 && (
                        <div className="rounded-lg border border-dashed p-12 text-center">
                            <p className="text-muted-foreground">No attendance records found.</p>
                        </div>
                    )}
                </div>
            </div>
        </StudentPageShell>
    );
}
