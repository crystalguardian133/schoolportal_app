import { Head, Link } from '@inertiajs/react';
import { Users, GraduationCap, LayoutGrid, BookOpen, Bell, CalendarClock, Shield } from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';

type Props = {
    user: { name: string; email: string };
    stats: {
        totalStudents: number;
        totalTeachers: number;
        totalSections: number;
        totalSubjects: number;
    };
    activeSchoolYear: {
        name: string;
        start_date: string;
        end_date: string;
    } | null;
    recentAnnouncements: Array<{
        title: string;
        body: string;
        scope: string;
        created_at: string;
    }>;
};

export default function SchoolHeadDashboard({ user, stats, activeSchoolYear, recentAnnouncements }: Props) {
    const firstName = user?.name?.split(' ')[0] ?? 'School Head';

    return (
        <>
            <Head title="School Head Dashboard" />
            <PortalPageShell
                title={`Welcome, ${firstName}`}
                description="School-wide overview and administration."
                showBackLink={false}
                showHero
            >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Users className="h-5 w-5" />}
                        label="Total Students"
                        value={stats.totalStudents}
                    />
                    <StatCard
                        icon={<GraduationCap className="h-5 w-5" />}
                        label="Total Teachers"
                        value={stats.totalTeachers}
                    />
                    <StatCard
                        icon={<LayoutGrid className="h-5 w-5" />}
                        label="Total Sections"
                        value={stats.totalSections}
                    />
                    <StatCard
                        icon={<BookOpen className="h-5 w-5" />}
                        label="Total Subjects"
                        value={stats.totalSubjects}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link href="/admin/enrollments" className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
                                <Users className="h-4 w-4" /> Enrollments
                            </Link>
                            <Link href="/admin/subjects" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <BookOpen className="h-4 w-4" /> Subjects
                            </Link>
                            <Link href="/admin/sections" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <LayoutGrid className="h-4 w-4" /> Sections
                            </Link>
                            <Link href="/admin/users" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <Shield className="h-4 w-4" /> Users
                            </Link>
                            <Link href="/admin/announcements" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <Bell className="h-4 w-4" /> Announcements
                            </Link>
                            <Link href="/admin/school-years" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent">
                                <CalendarClock className="h-4 w-4" /> School Year
                            </Link>
                        </div>
                    </div>

                    {activeSchoolYear && (
                        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <h3 className="text-lg font-semibold">Active School Year</h3>
                            <div className="mt-3 space-y-1">
                                <div className="text-xl font-bold">{activeSchoolYear.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {activeSchoolYear.start_date} — {activeSchoolYear.end_date}
                                </div>
                            </div>
                        </div>
                    )}

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
                <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">{icon}</div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </div>
        </div>
    );
}
