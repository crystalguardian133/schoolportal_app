import { Head, router } from '@inertiajs/react';
import { CalendarDays, Plus, Trash2, Printer, X, User, MapPin, Users } from 'lucide-react';
import { useState, useMemo } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import SearchableSelect from '@/components/searchable-select';

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
    class_section_uuid: string;
    section_name?: string;
    subject: string;
    subject_code?: string;
    teacher_uuid: string;
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
    section?: Section | null;
    subjects: Subject[];
    allSchedules: ScheduleEntry[];
    allTeachers: {uuid: string; name: string}[];
    allRooms: string[];
    allSections?: Section[];
    hasAccessAdmin?: boolean;
    schoolYear?: string | null;
    flash?: { success?: string; error?: string };
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Generate time slots from 07:00 to 17:00
const TIME_SLOTS: string[] = [];
for (let i = 7; i <= 17; i++) {
    TIME_SLOTS.push(`${i.toString().padStart(2, '0')}:00`);
    if (i !== 17) TIME_SLOTS.push(`${i.toString().padStart(2, '0')}:30`);
}

export default function ScheduleCreate({
    section: initialSection,
    subjects,
    allSchedules = [],
    allTeachers = [],
    allRooms = [],
    allSections = [],
    hasAccessAdmin = false,
    schoolYear,
    flash,
}: Props) {
    const [currentSection] = useState(initialSection);
    
    // View state
    const [viewMode, setViewMode] = useState<'section' | 'teacher' | 'room'>('section');
    const [selectedTeacherUuid, setSelectedTeacherUuid] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [subjectUuid, setSubjectUuid] = useState(subjects[0]?.uuid ?? '');
    const [scheduleDay, setScheduleDay] = useState('Monday');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('09:00');
    const [room, setRoom] = useState('');

    function switchSection(sectionUuid: string) {
        router.get(
            '/admin/schedules',
            { section_uuid: sectionUuid },
            { only: ['section', 'subjects', 'allSchedules', 'allSections', 'allTeachers', 'allRooms'] },
        );
    }

    function submitSchedule(e: React.FormEvent) {
        e.preventDefault();
        if (!subjectUuid || !currentSection) return;

        const subject = subjects.find((s) => s.uuid === subjectUuid);
        if (!subject || !subject.teacher) return;

        router.post(
            '/admin/schedules',
            {
                section_uuid: currentSection.uuid,
                subject_uuid: subjectUuid,
                teacher_uuid: subject.teacher.uuid,
                entries: [{
                    day: scheduleDay,
                    start_time: startTime,
                    end_time: endTime,
                    room: room || null,
                }],
            },
            {
                onSuccess: () => {
                    setIsModalOpen(false);
                    router.reload({ only: ['allSchedules', 'allRooms'] });
                },
            },
        );
    }

    function removeSchedule(id: number) {
        router.delete(`/admin/schedules/${id}`, {
            onSuccess: () => {
                router.reload({ only: ['allSchedules', 'allRooms'] });
            },
        });
    }

    const filteredSchedules = useMemo(() => {
        return allSchedules.filter((s) => {
            if (viewMode === 'section') return s.class_section_uuid === currentSection?.uuid;
            if (viewMode === 'teacher') return s.teacher_uuid === selectedTeacherUuid;
            if (viewMode === 'room') return s.room === selectedRoom;
            return false;
        });
    }, [allSchedules, viewMode, currentSection, selectedTeacherUuid, selectedRoom]);

    const titleText = useMemo(() => {
        if (viewMode === 'section') return currentSection ? `Section: ${currentSection.name}` : 'Section Schedule';
        if (viewMode === 'teacher') {
            const t = allTeachers.find((x) => x.uuid === selectedTeacherUuid);
            return t ? `Teacher: ${t.name}` : 'Teacher Schedule';
        }
        if (viewMode === 'room') return selectedRoom ? `Room: ${selectedRoom}` : 'Room Schedule';
        return 'Schedule';
    }, [viewMode, currentSection, selectedTeacherUuid, selectedRoom, allTeachers]);

    // Check if a schedule block falls into a cell
    function getScheduleForSlot(day: string, time: string) {
        return filteredSchedules.filter(s => {
            return s.day === day && time >= s.start_time && time < s.end_time;
        });
    }

    if (!currentSection) {
        return (
            <>
                <Head title="Manage Schedules" />
                <PortalPageShell title="Manage Schedules" description="Create and manage class schedules for sections.">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-12 text-center shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-medium text-foreground">No class sections found</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {hasAccessAdmin
                                ? "Please create a class section first before creating schedules."
                                : "You have not been assigned to a class section."}
                        </p>
                    </div>
                </PortalPageShell>
            </>
        );
    }

    return (
        <>
            <Head title="Manage Schedules" />
            
            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-sidebar">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Plot Schedule Block</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={submitSchedule} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Subject</label>
                                <select value={subjectUuid} onChange={(e) => setSubjectUuid(e.target.value)} required className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
                                    {subjects.map((s) => (
                                        <option key={s.uuid} value={s.uuid} disabled={!s.teacher}>
                                            {s.name} {s.teacher ? `(${s.teacher.name})` : '(No Teacher)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Day</label>
                                    <select value={scheduleDay} onChange={(e) => setScheduleDay(e.target.value)} required className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Room (Optional)</label>
                                    <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring" placeholder="e.g. Rm 101" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">Start Time</label>
                                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground uppercase mb-1">End Time</label>
                                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
                                </div>
                            </div>
                            <button type="submit" className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                                Save Schedule Block
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <PortalPageShell
                title="Manage Schedules"
                description={hasAccessAdmin ? 'Interactive timetable grid for sections, teachers, and rooms.' : `Manage schedules for section ${currentSection.name}.`}
            >
                {/* Print Header (Only visible when printing) */}
                <div className="hidden print:block mb-8 text-center">
                    <h1 className="text-2xl font-bold uppercase tracking-widest text-black">Dulag National High School</h1>
                    <h2 className="text-lg font-semibold text-gray-800">{schoolYear} Schedule</h2>
                    <h3 className="text-md text-gray-600 mt-2 font-medium">{titleText}</h3>
                </div>

                {flash?.error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 print:hidden">
                        {flash.error}
                    </div>
                )}
                {flash?.success && (
                    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 print:hidden">
                        {flash.success}
                    </div>
                )}

                <div className="print:hidden mb-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm dark:bg-sidebar">
                    <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-1">
                        <button onClick={() => setViewMode('section')} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${viewMode === 'section' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Users className="size-4" /> Section
                        </button>
                        {hasAccessAdmin && (
                            <>
                                <button onClick={() => setViewMode('teacher')} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${viewMode === 'teacher' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <User className="size-4" /> Teacher
                                </button>
                                <button onClick={() => setViewMode('room')} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${viewMode === 'room' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <MapPin className="size-4" /> Room
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {viewMode === 'section' && hasAccessAdmin && (
                            <select value={currentSection.uuid} onChange={(e) => switchSection(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring">
                                {allSections.map(s => <option key={s.uuid} value={s.uuid}>{s.name} {s.grade_level ? `(${s.grade_level})` : ''}</option>)}
                            </select>
                        )}
                        {viewMode === 'teacher' && (
                            <div className="w-56">
                                <SearchableSelect
                                    value={selectedTeacherUuid}
                                    onChange={setSelectedTeacherUuid}
                                    placeholder="Select Teacher"
                                    options={allTeachers.map(t => ({ value: t.uuid, label: t.name }))}
                                />
                            </div>
                        )}
                        {viewMode === 'room' && (
                            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring w-48">
                                <option value="" disabled>Select Room</option>
                                {allRooms.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        )}

                        {viewMode === 'section' && (
                            <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition">
                                <Plus className="size-4" /> Add Block
                            </button>
                        )}
                        <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition">
                            <Printer className="size-4" /> Print PDF
                        </button>
                    </div>
                </div>

                {/* Timetable Grid */}
                <div className="rounded-2xl border border-sidebar-border bg-white shadow-sm dark:bg-sidebar print:border-none print:shadow-none print:bg-transparent">
                    <div className="p-4 border-b border-border print:hidden">
                        <h2 className="text-lg font-semibold">{titleText}</h2>
                        <p className="text-sm text-muted-foreground">{schoolYear} · DepEd Administrative View</p>
                    </div>
                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="min-w-[800px] w-full table-fixed border-collapse text-sm print:min-w-full">
                            <thead>
                                <tr>
                                    <th className="w-24 border-b border-r border-border p-3 text-center font-semibold text-muted-foreground uppercase tracking-wider text-xs print:border-black print:text-black">Time</th>
                                    {DAYS.map(day => (
                                        <th key={day} className="border-b border-r border-border p-3 text-center font-semibold text-muted-foreground uppercase tracking-wider text-xs last:border-r-0 print:border-black print:text-black">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {TIME_SLOTS.map((time, idx) => {
                                    if (idx === TIME_SLOTS.length - 1) return null; // Skip last one as it's an end boundary
                                    const nextTime = TIME_SLOTS[idx + 1];
                                    
                                    return (
                                        <tr key={time} className="h-14">
                                            <td className="border-b border-r border-border p-2 text-center text-xs text-muted-foreground align-top whitespace-nowrap print:border-black print:text-black">
                                                {time} - {nextTime}
                                            </td>
                                            {DAYS.map(day => {
                                                const schedulesInSlot = getScheduleForSlot(day, time);
                                                
                                                return (
                                                    <td key={`${day}-${time}`} className="border-b border-r border-border p-1 align-top last:border-r-0 min-w-0 print:border-black">
                                                        <div className="flex flex-col gap-1 h-full min-w-0">
                                                            {schedulesInSlot.map(sched => (
                                                                <div key={sched.id} className="relative group min-w-0 rounded-lg bg-sky-50 p-2 border border-sky-100 dark:bg-sky-950/30 dark:border-sky-900 print:bg-transparent print:border-black">
                                                                    {viewMode === 'section' && hasAccessAdmin && (
                                                                        <button 
                                                                            onClick={() => removeSchedule(sched.id)}
                                                                            className="absolute top-1 right-1 hidden group-hover:flex size-5 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 print:hidden"
                                                                        >
                                                                            <Trash2 className="size-3" />
                                                                        </button>
                                                                    )}
                                                                    <div className="font-semibold text-sky-800 dark:text-sky-300 print:text-black leading-tight text-xs truncate">
                                                                        {sched.subject} {sched.subject_code ? `(${sched.subject_code})` : ''}
                                                                    </div>
                                                                    {viewMode !== 'section' && (
                                                                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate print:text-gray-800">
                                                                            <span className="font-medium">Sec:</span> {sched.section_name}
                                                                        </div>
                                                                    )}
                                                                    {viewMode !== 'teacher' && (
                                                                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate print:text-gray-800">
                                                                            <span className="font-medium">Tr:</span> {sched.teacher}
                                                                        </div>
                                                                    )}
                                                                    {viewMode !== 'room' && sched.room && (
                                                                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate print:text-gray-800">
                                                                            <span className="font-medium">Rm:</span> {sched.room}
                                                                        </div>
                                                                    )}
                                                                    <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-1 whitespace-nowrap print:text-gray-600">
                                                                        {sched.start_time} - {sched.end_time}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PortalPageShell>

            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                    /* Hide sidebar and navigation dynamically */
                    nav, header, aside, .sidebar { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                }
            `}} />
        </>
    );
}
