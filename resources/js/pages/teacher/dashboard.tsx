import { Head, Link } from '@inertiajs/react';
import { BookOpen, Users, Bell, BarChart3, CalendarDays } from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';

type Props = {
    user: { name: string; email: string };
    stats: {
        assignedSubjects: number;
        totalStudents: number;
    };
    recentAnnouncements: Array<{
        title: string;
        body: string;
        scope: string;
        created_at: string;
    }>;
};

export default function TeacherDashboard({ user, stats, recentAnnouncements }: Props) {
    const firstName = user?.name?.split(' ')[0] ?? 'Teacher';

    return (
        <>
            <Head title="Teacher Dashboard" />
            <PortalPageShell
                title={`Welcome, ${firstName}`}
                description="Your teaching overview at a glance."
                showBackLink={false}
                showHero
            >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<BookOpen className="h-5 w-5" />}
                        label="Assigned Subjects"
                        value={stats.assignedSubjects}
                    />
                    <StatCard
                        icon={<Users className="h-5 w-5" />}
                        label="Total Students"
                        value={stats.totalStudents}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link href="/teacher/classes" className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
                                <Users className="h-4 w-4" /> My Classes
                            </Link>
                            <Link href="/teacher/grades" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <BarChart3 className="h-4 w-4" /> Edit Grades
                            </Link>
                            <Link href="/teacher/schedule" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <CalendarDays className="h-4 w-4" /> Schedule
                            </Link>
                            <Link href="/teacher/announcements" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <Bell className="h-4 w-4" /> Announcements
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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">{icon}</div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </div>
        </div>
    );
}
