import { Head } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';

const schedule = [
    { day: 'Monday', time: '8:00 AM - 10:00 AM', subject: 'Mathematics' },
    { day: 'Wednesday', time: '8:00 AM - 10:00 AM', subject: 'Science' },
    { day: 'Friday', time: '8:00 AM - 9:30 AM', subject: 'English Communication' },
];

export default function TeacherSchedule() {
    return (
        <>
            <Head title="Schedule" />
            <PortalPageShell title="Schedule" description="Check your weekly teaching schedule and time slots.">
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-center gap-3">
                        <CalendarDays className="size-5 text-sky-600" />
                        <h2 className="text-lg font-semibold">Weekly Schedule</h2>
                    </div>
                    <div className="mt-5 rounded-xl border border-sidebar-border/70 table-scroll-container table-scroll-small">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Day</th>
                                    <th className="px-4 py-3 font-medium">Time</th>
                                    <th className="px-4 py-3 font-medium">Subject</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                {schedule.map((item) => (
                                    <tr key={`${item.day}-${item.time}`} className="hover:bg-sidebar-accent/40">
                                        <td className="px-4 py-3 font-medium text-sidebar-foreground">{item.day}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.time}</td>
                                        <td className="px-4 py-3 text-sidebar-foreground">{item.subject}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </PortalPageShell>
        </>
    );
}
