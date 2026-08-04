import { Head, router } from '@inertiajs/react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';

type SubjectTeacher = {
    uuid: string;
    name: string;
} | null;

type Subject = {
    uuid: string;
    name: string;
    code?: string | null;
    teacher: SubjectTeacher;
};

type ScheduleEntry = {
    id: number;
    subject: string;
    teacher: string;
    day: string;
    start_time: string;
    end_time: string;
    room: string | null;
};

type Section = {
    uuid: string;
    name: string;
    grade_level: string | null;
};

type Props = {
    section: Section;
    subjects: Subject[];
    schedules: ScheduleEntry[];
    allSections?: Section[];
    hasAccessAdmin?: boolean;
    schoolYear?: string | null;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type QueuedEntry = {
    day: string;
    start_time: string;
    end_time: string;
    room: string;
};

const blankEntry = (): QueuedEntry => ({
    day: 'Monday',
    start_time: '08:00',
    end_time: '10:00',
    room: '',
});

export default function ScheduleCreate({
    section: initialSection,
    subjects,
    schedules,
    allSections = [],
    hasAccessAdmin = false,
    schoolYear,
}: Props) {
    const [currentSection, setCurrentSection] = useState(initialSection);
    const [selectedSubjectUuid, setSelectedSubjectUuid] = useState(subjects[0]?.uuid ?? '');
    const [queue, setQueue] = useState<QueuedEntry[]>([blankEntry()]);

    function switchSection(sectionUuid: string) {
        router.get(
            '/admin/schedules',
            { section_uuid: sectionUuid },
            { only: ['section', 'subjects', 'schedules', 'allSections'] },
        );
    }

    function updateQueue(index: number, field: keyof QueuedEntry, value: string) {
        setQueue((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
    }

    function addQueueRow() {
        setQueue((prev) => [...prev, blankEntry()]);
    }

    function removeQueueRow(index: number) {
        setQueue((prev) => prev.filter((_, i) => i !== index));
    }

    function submitSchedule() {
        if (!selectedSubjectUuid || queue.length === 0) {
return;
}

        const subject = subjects.find((s) => s.uuid === selectedSubjectUuid);

        if (!subject || !subject.teacher) {
return;
}

        router.post(
            '/admin/schedules',
            {
                section_uuid: currentSection.uuid,
                subject_uuid: selectedSubjectUuid,
                teacher_uuid: subject.teacher.uuid,
                entries: queue.map((e) => ({
                    day: e.day,
                    start_time: e.start_time,
                    end_time: e.end_time,
                    room: e.room || null,
                })),
            },
            {
                onSuccess: () => {
                    setQueue([blankEntry()]);
                    router.reload({ only: ['schedules'] });
                },
            },
        );
    }

    function removeSchedule(id: number) {
        router.delete(`/admin/schedules/${id}`, {
            onSuccess: () => {
                router.reload({ only: ['schedules'] });
            },
        });
    }

    const selectedSubject = subjects.find((s) => s.uuid === selectedSubjectUuid);

    return (
        <>
            <Head title="Manage Schedules" />
            <PortalPageShell
                title="Manage Schedules"
                description={
                    hasAccessAdmin
                        ? 'Create and manage class schedules for sections.'
                        : `Manage schedules for section ${currentSection.name}.`
                }
            >
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    {hasAccessAdmin && allSections.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Section
                            </label>
                            <select
                                value={currentSection.uuid}
                                onChange={(e) => switchSection(e.target.value)}
                                className="mt-1 w-full max-w-md rounded-2xl border border-input bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                            >
                                {allSections.map((s) => (
                                    <option key={s.uuid} value={s.uuid}>
                                        {s.name}
                                        {s.grade_level ? ` — ${s.grade_level}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <CalendarDays className="size-5 text-sky-600" />
                        <div>
                            <h2 className="text-lg font-semibold">
                                {currentSection.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {currentSection.grade_level ?? 'Section'} ·{' '}
                                {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                                {schoolYear ? ` · ${schoolYear}` : ''}
                            </p>
                        </div>
                    </div>

                    {/* Add schedule form */}
                    <div className="mt-5 space-y-4 rounded-2xl border border-border bg-muted/50 p-4">
                        <div>
                            <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Subject
                            </label>
                            <select
                                value={selectedSubjectUuid}
                                onChange={(e) => setSelectedSubjectUuid(e.target.value)}
                                className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                            >
                                {subjects.map((subject) => (
                                    <option key={subject.uuid} value={subject.uuid}>
                                        {subject.name}
                                        {subject.code ? ` (${subject.code})` : ''}
                                        {subject.teacher ? ` — ${subject.teacher.name}` : ' — No teacher'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedSubject && !selectedSubject.teacher && (
                            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                                No teacher assigned to this subject yet. Please assign a teacher first via the Assign Subjects page.
                            </div>
                        )}

                        {/* Queued day+time entries */}
                        <div className="space-y-3">
                            {queue.map((entry, idx) => (
                                <div key={idx} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-3">
                                    <div className="min-w-[140px] flex-1">
                                        <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">Day</label>
                                        <select
                                            value={entry.day}
                                            onChange={(e) => updateQueue(idx, 'day', e.target.value)}
                                            className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-2.5 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                        >
                                            {DAYS.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="min-w-[130px] flex-1">
                                        <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">Start</label>
                                        <input
                                            type="time"
                                            value={entry.start_time}
                                            onChange={(e) => updateQueue(idx, 'start_time', e.target.value)}
                                            className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-2.5 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                        />
                                    </div>
                                    <div className="min-w-[130px] flex-1">
                                        <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">End</label>
                                        <input
                                            type="time"
                                            value={entry.end_time}
                                            onChange={(e) => updateQueue(idx, 'end_time', e.target.value)}
                                            className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-2.5 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                        />
                                    </div>
                                    <div className="min-w-[120px] flex-1">
                                        <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">Room</label>
                                        <input
                                            type="text"
                                            value={entry.room}
                                            onChange={(e) => updateQueue(idx, 'room', e.target.value)}
                                            placeholder="Optional"
                                            className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-2.5 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                        />
                                    </div>
                                    {queue.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQueueRow(idx)}
                                            className="rounded-2xl border border-border bg-background p-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={addQueueRow}
                                className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                                <Plus className="mr-1.5 inline h-4 w-4" />
                                Add Day
                            </button>
                            <button
                                type="button"
                                onClick={submitSchedule}
                                disabled={!selectedSubjectUuid || !selectedSubject?.teacher || queue.length === 0}
                                className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 focus:ring-4 focus:ring-ring/20 focus:outline-none disabled:opacity-50"
                            >
                                <Plus className="mr-1.5 inline h-4 w-4" />
                                Save {queue.length} {queue.length === 1 ? 'Entry' : 'Entries'}
                            </button>
                        </div>
                    </div>

                    {/* Current schedules table */}
                    <div className="mt-5">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Current Schedule
                        </h3>
                        <div className="table-scroll-container table-scroll-small mt-3 rounded-xl border border-sidebar-border/70">
                            <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Subject</th>
                                        <th className="px-4 py-3 font-medium">Teacher</th>
                                        <th className="px-4 py-3 font-medium">Day</th>
                                        <th className="px-4 py-3 font-medium">Time</th>
                                        <th className="px-4 py-3 font-medium">Room</th>
                                        <th className="px-4 py-3 font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                    {schedules.length > 0 ? (
                                        schedules.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-sidebar-accent/40"
                                            >
                                                <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                    {item.subject}
                                                </td>
                                                <td className="px-4 py-3 text-sidebar-foreground">
                                                    {item.teacher}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {item.day}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {item.start_time} - {item.end_time}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {item.room ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSchedule(item.id)}
                                                        className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-10 text-center text-sm text-muted-foreground"
                                            >
                                                No schedule entries yet for this section.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </PortalPageShell>
        </>
    );
}
