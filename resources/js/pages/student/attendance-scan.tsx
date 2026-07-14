import { Head, router } from '@inertiajs/react';
import { CheckCircle, XCircle, Clock, ScanLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';

type Session = {
    uuid: string;
    subject: string;
    section: string;
    date: string;
    start_time: string;
    end_time: string;
    window_start: string;
    window_end: string;
    is_active: boolean;
    within_window: boolean;
} | null;

type Props = {
    session: Session;
    error: string | null;
};

export default function AttendanceScan({ session, error }: Props) {
    const [result, setResult] = useState<{ success: boolean; message: string; status?: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    async function submitAttendance() {
        if (!session || submitting) return;

        const token = window.location.pathname.split('/').pop() ?? '';
        setSubmitting(true);

        try {
            const res = await fetch('/attendance/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                    ),
                },
                body: JSON.stringify({ qr_token: token }),
            });

            const data = await res.json();
            setResult(data);
        } catch {
            setResult({ success: false, message: 'Failed to submit attendance.' });
        } finally {
            setSubmitting(false);
        }
    }

    if (error || !session) {
        return (
            <>
                <Head title="Attendance Scan" />
                <PortalPageShell title="Attendance Scan">
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-sidebar-border/70 bg-white p-10 text-center shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <XCircle className="size-16 text-red-500" />
                        <h2 className="text-xl font-semibold text-red-600">Invalid QR Code</h2>
                        <p className="text-muted-foreground">{error ?? 'This QR code is not valid.'}</p>
                        <button
                            type="button"
                            onClick={() => router.get('/student/subjects-enrolled')}
                            className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                        >
                            Go Back
                        </button>
                    </div>
                </PortalPageShell>
            </>
        );
    }

    if (result) {
        return (
            <>
                <Head title="Attendance Result" />
                <PortalPageShell title="Attendance Result">
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-sidebar-border/70 bg-white p-10 text-center shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        {result.success ? (
                            <CheckCircle className="size-16 text-green-500" />
                        ) : (
                            <XCircle className="size-16 text-red-500" />
                        )}
                        <h2 className={`text-xl font-semibold ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                            {result.success ? 'Attendance Recorded' : 'Attendance Failed'}
                        </h2>
                        <p className="text-muted-foreground">{result.message}</p>
                        {result.status && (
                            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                                result.status === 'present'
                                    ? 'bg-green-100 text-green-700'
                                    : result.status === 'late'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                            }`}>
                                {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                        >
                            Scan Again
                        </button>
                    </div>
                </PortalPageShell>
            </>
        );
    }

    const windowActive = session.within_window && session.is_active;

    return (
        <>
            <Head title={`Attendance — ${session.subject}`} />
            <PortalPageShell title="Attendance Scan">
                <div className="mx-auto max-w-md">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="text-center">
                            <ScanLine className="mx-auto size-12 text-sky-600" />
                            <h2 className="mt-3 text-xl font-semibold">{session.subject}</h2>
                            <p className="text-sm text-muted-foreground">{session.section} · {session.date}</p>
                        </div>

                        <div className="mt-5 space-y-3 rounded-xl border border-border bg-muted/50 p-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Class Time</span>
                                <span className="font-medium">{session.start_time} — {session.end_time}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">QR Window</span>
                                <span className="font-medium">{session.window_start} — {session.window_end}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Current Time</span>
                                <span className="font-mono font-medium">{currentTime}</span>
                            </div>
                        </div>

                        {windowActive ? (
                            <div className="mt-5 space-y-4">
                                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm text-green-800">
                                    <CheckCircle className="mx-auto mb-2 size-6 text-green-600" />
                                    <p className="font-medium">Attendance window is open</p>
                                    <p className="mt-1 text-xs text-green-700">
                                        Scan complete by {session.window_end}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={submitAttendance}
                                    disabled={submitting}
                                    className="w-full rounded-2xl bg-green-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Mark My Attendance'}
                                </button>
                            </div>
                        ) : (
                            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-800">
                                <Clock className="mx-auto mb-2 size-6 text-red-600" />
                                <p className="font-medium">
                                    {session.is_active
                                        ? 'Attendance window is closed'
                                        : 'This session is inactive'}
                                </p>
                                <p className="mt-1 text-xs text-red-700">
                                    Please see your teacher for manual attendance recording.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </PortalPageShell>
        </>
    );
}
