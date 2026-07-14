import { Head } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';

type ScheduleEntry = {
    day: string;
    start_time: string;
    end_time: string;
    subject: string;
    section: string;
    room: string;
};

type Props = {
    schedules?: ScheduleEntry[];
};

export default function TeacherSchedule({ schedules = [] }: Props) {
    const sorted = [...schedules].sort((a, b) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);

        if (dayDiff !== 0) {
return dayDiff;
}

        return a.start_time.localeCompare(b.start_time);
    });

    return (
        <>
            <Head title="Schedule" />
            <PortalPageShell
                title="Schedule"
                description="Check your weekly teaching schedule and time slots."
            >
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-center gap-3">
                        <CalendarDays className="size-5 text-sky-600" />
                        <h2 className="text-lg font-semibold">
                            Weekly Schedule
                        </h2>
                    </div>
                    <div className="table-scroll-container table-scroll-small mt-5 rounded-xl border border-sidebar-border/70">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Day
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Time
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Subject
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Section
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Room
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                {sorted.length > 0 ? (
                                    sorted.map((item, index) => (
                                        <tr
                                            key={`${item.day}-${item.start_time}-${index}`}
                                            className="hover:bg-sidebar-accent/40"
                                        >
                                            <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                {item.day}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.start_time} - {item.end_time}
                                            </td>
                                            <td className="px-4 py-3 text-sidebar-foreground">
                                                {item.subject}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.section}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.room || '—'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-10 text-center text-sm text-muted-foreground"
                                        >
                                            No schedule entries found. Ask an
                                            administrator to create your schedule.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </PortalPageShell>
        </>
    );
}
