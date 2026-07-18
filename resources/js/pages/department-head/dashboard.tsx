import { Head, Link } from '@inertiajs/react';
import { BookOpen, LayoutGrid, Bell, Users, BarChart3 } from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';

type Props = {
    user: { name: string; email: string };
    stats: {
        totalSubjects: number;
        totalSections: number;
        assignedSubjects: number;
    };
    recentAnnouncements: Array<{
        title: string;
        body: string;
        scope: string;
        created_at: string;
    }>;
};

export default function DepartmentHeadDashboard({ user, stats, recentAnnouncements }: Props) {
    const firstName = user?.name?.split(' ')[0] ?? 'Department Head';

    return (
        <>
            <Head title="Department Head Dashboard" />
            <PortalPageShell
                title={`Welcome, ${firstName}`}
                description="Department oversight and subject management."
                showBackLink={false}
                showHero
            >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        icon={<BookOpen className="h-5 w-5" />}
                        label="Total Subjects"
                        value={stats.totalSubjects}
                    />
                    <StatCard
                        icon={<LayoutGrid className="h-5 w-5" />}
                        label="Total Sections"
                        value={stats.totalSections}
                    />
                    <StatCard
                        icon={<Users className="h-5 w-5" />}
                        label="My Assigned Subjects"
                        value={stats.assignedSubjects}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link href="/admin/subjects" className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
                                <BookOpen className="h-4 w-4" /> Manage Subjects
                            </Link>
                            <Link href="/admin/sections" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <LayoutGrid className="h-4 w-4" /> Sections
                            </Link>
                            <Link href="/admin/announcements" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <Bell className="h-4 w-4" /> Announcements
                            </Link>
                            <Link href="/teacher/grades" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <BarChart3 className="h-4 w-4" /> Grades
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
                <div className="rounded-lg bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">{icon}</div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </div>
        </div>
    );
}
