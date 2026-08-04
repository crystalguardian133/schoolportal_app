import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Camera, CameraOff, Save, UserCheck, UserX, Clock, Minus, Search, ShieldAlert } from 'lucide-react';
import { useCallback, useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { QrScanner } from '@/components/qr-scanner';

type Student = {
    student_uuid: string;
    student_name: string;
    lrn: string | null;
    qr_token: string | null;
    status: 'present' | 'late' | 'absent' | 'excused';
    recorded_by: 'qr' | 'manual' | null;
    scanned_at: string | null;
    recorded_at: string | null;
    notes: string | null;
};

type Session = {
    id: number;
    uuid: string;
    subject: string;
    section: string;
    sectionUuid: string;
    subjectUuid: string;
    date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    is_active: boolean;
    window_start: string;
    window_end: string;
};

type Props = {
    session: Session;
    students: Student[];
    enrolledUuids: string[];
};

type ScanResult = {
    type: 'success' | 'wrong_section' | 'unknown' | 'error';
    message: string;
    student?: { uuid: string; name: string; lrn: string | null; sections?: string[] };
    status?: string;
};

type SearchResult = {
    uuid: string;
    name: string;
    lrn: string | null;
    section: string;
};

const STATUS_OPTIONS = [
    { value: 'present', label: 'Present', icon: UserCheck, color: 'text-green-600 bg-green-50 border-green-200' },
    { value: 'late', label: 'Late', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    { value: 'absent', label: 'Absent', icon: Minus, color: 'text-red-600 bg-red-50 border-red-200' },
    { value: 'excused', label: 'Excused', icon: UserX, color: 'text-blue-600 bg-blue-50 border-blue-200' },
] as const;

export default function AttendanceSession({ session, students, enrolledUuids }: Props) {
    const [records, setRecords] = useState<Record<string, string>>(
        Object.fromEntries(students.map((s) => [s.student_uuid, s.status]))
    );
    const [scannerActive, setScannerActive] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [overrideStudent, setOverrideStudent] = useState<ScanResult['student'] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showSearch, setShowSearch] = useState(false);

    const handleScan = useCallback((decodedText: string) => {
        fetch(`/teacher/attendance/sessions/${session.id}/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
            },
            body: JSON.stringify({ student_qr_token: decodedText }),
        })
            .then((res) => res.json().then((data) => ({ status: res.status, data })))
            .then(({ status, data }) => {
                if (data.success) {
                    setScanResult({ type: 'success', message: data.message, student: data.student, status: data.status });
                    setRecords((prev) => ({
                        ...prev,
                        [data.student.uuid]: data.status,
                    }));
                } else if (status === 409 && data.reason === 'wrong_section' && data.student) {
                    setScanResult({ type: 'wrong_section', message: data.message, student: data.student });
                    setOverrideStudent(data.student);
                } else {
                    setScanResult({ type: 'error', message: data.message });
                }

                setTimeout(() => setScanResult(null), 5000);
            })
            .catch(() => {
                setScanResult({ type: 'error', message: 'Failed to scan. Try again.' });
                setTimeout(() => setScanResult(null), 3000);
            });
    }, [session.id]);

    function confirmOverride() {
        if (!overrideStudent) {
return;
}

        fetch(`/teacher/attendance/sessions/${session.id}/override`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
            },
            body: JSON.stringify({ student_uuid: overrideStudent.uuid }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setScanResult({ type: 'success', message: data.message + ' (override)', student: data.student, status: data.status });
                    setRecords((prev) => ({
                        ...prev,
                        [data.student.uuid]: data.status,
                    }));
                    router.reload({ only: ['students'] });
                }

                setOverrideStudent(null);
                setTimeout(() => setScanResult(null), 5000);
            });
    }

    function searchForStudent(q: string) {
        setSearchQuery(q);

        if (q.length < 2) {
            setSearchResults([]);

            return;
        }

        fetch(`/teacher/attendance/sessions/${session.id}/search-students?q=${encodeURIComponent(q)}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((res) => res.json())
            .then((data) => setSearchResults(data.students ?? []));
    }

    function overrideManualSearch(student: SearchResult) {
        setOverrideStudent({ uuid: student.uuid, name: student.name, lrn: student.lrn, sections: [student.section] });
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
    }

    function updateStatus(uuid: string, status: string) {
        setRecords((prev) => ({ ...prev, [uuid]: status }));
    }

    function saveAll() {
        const changedStudents = students
            .filter((s) => records[s.student_uuid] !== s.status)
            .map((s) => ({ student_uuid: s.student_uuid, status: records[s.student_uuid] }));

        if (changedStudents.length === 0) {
return;
}

        router.post(`/teacher/attendance/sessions/${session.id}/bulk-manual`, { records: changedStudents });
    }

    const presentCount = Object.values(records).filter((s) => s === 'present' || s === 'late').length;

    return (
        <>
            <Head title={`Attendance — ${session.subject}`} />
            <PortalPageShell
                title={`${session.subject} — ${session.section}`}
                description={`${session.date} · ${session.window_start} — ${session.window_end}`}
            >
                <div className="mb-4">
                    <button
                        type="button"
                        onClick={() => router.get('/teacher/attendance')}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Sessions
                    </button>
                </div>

                {/* Override dialog */}
                {overrideStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-sidebar">
                            <div className="flex items-center gap-3 text-amber-600">
                                <ShieldAlert className="size-6" />
                                <h3 className="text-lg font-semibold">Cross-Section Override</h3>
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">
                                <strong>{overrideStudent.name}</strong> (LRN: {overrideStudent.lrn ?? 'N/A'}) is not enrolled in this section.
                                {overrideStudent.sections && overrideStudent.sections.length > 0 && (
                                    <> Student sections: <strong>{overrideStudent.sections.join(', ')}</strong></>
                                )}
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Override to record their attendance for this session?
                            </p>
                            <div className="mt-5 flex gap-3">
                                <button
                                    type="button"
                                    onClick={confirmOverride}
                                    className="flex-1 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
                                >
                                    Confirm Override
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOverrideStudent(null)}
                                    className="flex-1 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scanner + controls */}
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">Scan & Record</h2>
                            <p className="text-sm text-muted-foreground">
                                {presentCount}/{students.length} present
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setScannerActive(!scannerActive)}
                                className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm transition ${
                                    scannerActive
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-primary text-primary-foreground hover:opacity-90'
                                }`}
                            >
                                {scannerActive ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
                                {scannerActive ? 'Stop Scanner' : 'Scan QR'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSearch(!showSearch)}
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                            >
                                <Search className="size-4" />
                                Search Student
                            </button>
                            <button
                                type="button"
                                onClick={saveAll}
                                disabled={students.every((s) => records[s.student_uuid] === s.status)}
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                            >
                                <Save className="size-4" />
                                Save
                            </button>
                        </div>
                    </div>

                    {scannerActive && (
                        <div className="mt-4 flex items-start gap-4">
                            <div className="w-48 shrink-0">
                                <QrScanner onScan={handleScan} enabled={scannerActive} />
                                <p className="mt-1.5 text-xs text-muted-foreground text-center">
                                    Point at student QR
                                </p>
                            </div>
                            {scanResult && (
                                <div className={`flex-1 rounded-xl border p-3 text-sm ${
                                    scanResult.type === 'success'
                                        ? 'border-green-200 bg-green-50 text-green-800'
                                        : scanResult.type === 'wrong_section'
                                            ? 'border-amber-200 bg-amber-50 text-amber-800'
                                            : 'border-red-200 bg-red-50 text-red-800'
                                }`}>
                                    <span>{scanResult.message}</span>
                                    {scanResult.status && (
                                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                                            scanResult.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {scanResult.status}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {showSearch && (
                        <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => searchForStudent(e.target.value)}
                                    placeholder="Search by name or LRN..."
                                    className="w-full rounded-2xl border border-input bg-background pl-9 pr-3 py-2.5 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    autoFocus
                                />
                            </div>
                            {searchResults.length > 0 && (
                                <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-white dark:bg-sidebar">
                                    {searchResults.map((s) => (
                                        <button
                                            key={s.uuid}
                                            type="button"
                                            onClick={() => overrideManualSearch(s)}
                                            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-sidebar-accent/40"
                                        >
                                            <div>
                                                <span className="font-medium">{s.name}</span>
                                                {s.lrn && <span className="ml-2 text-muted-foreground">({s.lrn})</span>}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{s.section}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Students table */}
                <section className="mt-5 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="table-scroll-container table-scroll-small rounded-xl border border-sidebar-border/70">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Student</th>
                                    <th className="px-4 py-3 font-medium">LRN</th>
                                    <th className="px-4 py-3 font-medium">Method</th>
                                    <th className="px-4 py-3 font-medium">Time</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                {students.map((student) => {
                                    const currentStatus = records[student.student_uuid] ?? 'absent';

                                    return (
                                        <tr key={student.student_uuid} className="hover:bg-sidebar-accent/40">
                                            <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                {student.student_name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {student.lrn ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {student.recorded_by === 'qr' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                        QR
                                                    </span>
                                                ) : student.recorded_by === 'manual' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                        Manual
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {student.scanned_at ?? student.recorded_at ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1.5">
                                                    {STATUS_OPTIONS.map((opt) => {
                                                        const Icon = opt.icon;

                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => updateStatus(student.student_uuid, opt.value)}
                                                                className={`inline-flex items-center gap-1 rounded-2xl border px-2.5 py-1.5 text-xs font-medium transition ${
                                                                    currentStatus === opt.value
                                                                        ? opt.color
                                                                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                                                }`}
                                                            >
                                                                <Icon className="size-3" />
                                                                {opt.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </PortalPageShell>
        </>
    );
}
