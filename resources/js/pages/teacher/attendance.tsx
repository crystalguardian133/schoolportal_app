import { Head, router, useForm } from '@inertiajs/react';
import { CalendarCheck, Plus, Trash2, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import { useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';

type TeacherClass = {
    id: number;
    subject: string;
    section: string;
    day: string;
    start_time: string;
    end_time: string;
};

type Session = {
    id: number;
    uuid: string;
    subject: string;
    section: string;
    date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    is_active: boolean;
    total_students: number;
    present_count: number;
    window_start: string;
    window_end: string;
};

type Props = {
    sessions: Session[];
    teacherClasses: TeacherClass[];
};

export default function TeacherAttendance({ sessions, teacherClasses }: Props) {
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        schedule_id: teacherClasses[0]?.id?.toString() ?? '',
        date: new Date().toISOString().split('T')[0],
        duration_minutes: '15',
    });

    function createSession(e: React.FormEvent) {
        e.preventDefault();
        post('/teacher/attendance/sessions', {
            onSuccess: () => {
                setShowForm(false);
                setData('schedule_id', teacherClasses[0]?.id?.toString() ?? '');
                setData('duration_minutes', '15');
            },
        });
    }

    function toggleSession(id: number) {
        router.patch(`/teacher/attendance/sessions/${id}/toggle`);
    }

    function deleteSession(id: number) {
        if (confirm('Delete this attendance session?')) {
            router.delete(`/teacher/attendance/sessions/${id}`);
        }
    }

    const selectedClass = teacherClasses.find((c) => c.id.toString() === data.schedule_id);

    return (
        <>
            <Head title="Attendance" />
            <PortalPageShell
                title="Attendance"
                description="Create and manage QR code attendance sessions."
            >
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CalendarCheck className="size-5 text-sky-600" />
                            <div>
                                <h2 className="text-lg font-semibold">Attendance Sessions</h2>
                                <p className="text-sm text-muted-foreground">
                                    {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowForm(!showForm)}
                            className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                        >
                            <Plus className="mr-1.5 inline h-4 w-4" />
                            New Session
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={createSession} className="mt-5 space-y-4 rounded-2xl border border-border bg-muted/50 p-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Class / Schedule
                                    </label>
                                    <select
                                        value={data.schedule_id}
                                        onChange={(e) => setData('schedule_id', e.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    >
                                        {teacherClasses.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.subject} — {c.section} ({c.day} {c.start_time}-{c.end_time})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.schedule_id && <p className="mt-1 text-xs text-red-500">{errors.schedule_id}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Duration (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={120}
                                        value={data.duration_minutes}
                                        onChange={(e) => setData('duration_minutes', e.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    />
                                    {errors.duration_minutes && <p className="mt-1 text-xs text-red-500">{errors.duration_minutes}</p>}
                                    {selectedClass && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            QR window: {data.date} {selectedClass.start_time} — {(() => {
                                                const start = new Date(`2000-01-01T${selectedClass.start_time}`);
                                                const dur = parseInt(data.duration_minutes) || 15;
                                                const end = new Date(start.getTime() + dur * 60000);
                                                const schedEnd = new Date(`2000-01-01T${selectedClass.end_time}`);
                                                const actual = end > schedEnd ? schedEnd : end;

                                                return actual.toTimeString().slice(0, 5);
                                            })()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
                                >
                                    Create Session
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                {/* Sessions list */}
                <div className="mt-5 space-y-3">
                    {sessions.length === 0 ? (
                        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-10 text-center text-sm text-muted-foreground shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            No attendance sessions yet. Click "New Session" to create one.
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session.id}
                                className="rounded-2xl border border-sidebar-border/70 bg-white p-4 shadow-sm dark:border-sidebar-border dark:bg-sidebar"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{session.subject}</h3>
                                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                                {session.section}
                                            </span>
                                            {!session.is_active && (
                                                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {session.date} · {session.window_start} — {session.window_end} ·{' '}
                                            {session.present_count}/{session.total_students} present
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => router.get(`/teacher/attendance/sessions/${session.id}`)}
                                            className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                        >
                                            <Eye className="size-3.5" />
                                            Open
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleSession(session.id)}
                                            className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                        >
                                            {session.is_active ? <ToggleRight className="size-3.5 text-green-600" /> : <ToggleLeft className="size-3.5" />}
                                            {session.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteSession(session.id)}
                                            className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-red-600"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </PortalPageShell>
        </>
    );
}
