import { Head, Link } from '@inertiajs/react';
import { Bell, ClipboardList, CalendarDays, BookOpenText } from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';

type Props = {
    user: { name: string; email: string };
    recentAnnouncements: Array<{
        title: string;
        body: string;
        scope: string;
        created_at: string;
    }>;
};

export default function StaffDashboard({ user, recentAnnouncements }: Props) {
    const firstName = user?.name?.split(' ')[0] ?? 'Staff';

    return (
        <>
            <Head title="Staff Dashboard" />
            <PortalPageShell
                title={`Welcome, ${firstName}`}
                description="Non-teaching staff portal overview."
                showBackLink={false}
            >
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link href="/teacher/classes" className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
                                <ClipboardList className="h-4 w-4" /> Classes
                            </Link>
                            <Link href="/teacher/schedule" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <CalendarDays className="h-4 w-4" /> Schedule
                            </Link>
                            <Link href="/teacher/announcements" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <Bell className="h-4 w-4" /> Announcements
                            </Link>
                            <Link href="/student/subjects-enrolled" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <BookOpenText className="h-4 w-4" /> Subjects
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-lg font-semibold">Recent Announcements</h3>
                        {recentAnnouncements.length === 0 ? (
                            <p className="mt-3 text-sm text-muted-foreground">No announcements yet.</p>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {recentAnnouncements.map((a, i) => (
                                    <li key={i} className="rounded-lg border p-3">
                                        <div className="font-medium">{a.title}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">{a.created_at}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </PortalPageShell>
        </>
    );
}
