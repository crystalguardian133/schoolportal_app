import { Head, Link, router } from '@inertiajs/react';
import { Users, LayoutGrid, BookOpen, Bell, BarChart3 } from 'lucide-react';
import { lazy, Suspense, useState, useCallback } from 'react';
import { CommandPalette  } from '@/components/command-palette';
import type {CommandItem} from '@/components/command-palette';
import { PageLoader } from '@/components/page-loader';
import { PortalPageShell } from '@/components/portal-page-shell';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { getFirstName } from '@/lib/utils';

const SimpleBarChart = lazy(() =>
    import('@/components/charts').then((m) => ({ default: m.SimpleBarChart })),
);

type Props = {
    user: { name: string; email: string; roles?: string[] };
    tools: Array<{ label: string; href: string }>;
    stats?: {
        totalStudents: number;
        totalSections: number;
        totalSubjects: number;
    };
    recentAnnouncements?: Array<{
        title: string;
        body: string;
        scope: string;
        created_at: string;
    }>;
};

const commandItems: CommandItem[] = [
    { id: 'users', label: 'Manage Users', section: 'Navigation', action: () => router.visit('/admin/users') },
    { id: 'students', label: 'Enrollments', section: 'Navigation', action: () => router.visit('/admin/enrollments') },
    { id: 'sections', label: 'Manage Sections', section: 'Navigation', action: () => router.visit('/admin/sections') },
    { id: 'subjects', label: 'Manage Subjects', section: 'Navigation', action: () => router.visit('/admin/subjects') },
    { id: 'schedule', label: 'Manage Schedules', section: 'Navigation', action: () => router.visit('/admin/schedules') },
    { id: 'school-years', label: 'School Years', section: 'Navigation', action: () => router.visit('/admin/school-years') },
    { id: 'announcements', label: 'Announcements', section: 'Navigation', action: () => router.visit('/admin/announcements') },
    { id: 'id-cards', label: 'ID Cards', section: 'Navigation', action: () => router.visit('/admin/id-cards') },
    { id: 'roles', label: 'Roles & Permissions', section: 'Navigation', action: () => router.visit('/admin/roles') },
    { id: 'system-logs', label: 'System Logs', section: 'Navigation', action: () => router.visit('/admin/system-logs') },
];

export default function AdminDashboard({ user, tools, stats, recentAnnouncements }: Props) {
    const firstName = getFirstName(user?.name) || 'Admin';
    const [cmdOpen, setCmdOpen] = useState(false);
    const toggleCmd = useCallback(() => setCmdOpen((o) => !o), []);
    useCommandPalette(toggleCmd);

    return (
        <>
            <Head title="Admin Dashboard" />
            <PortalPageShell
                title={`Welcome, ${firstName}`}
                description="Administrative tools and quick actions."
                showBackLink={false}
                showHero
            >
                <PageLoader skeleton="dashboard">
                {stats && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <StatCard
                                icon={<Users className="h-5 w-5" />}
                                label="Total Students"
                                value={stats.totalStudents}
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

                        <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-muted" />}>
                            <SimpleBarChart
                                title="Overview"
                                data={[
                                    { label: 'Students', value: stats.totalStudents },
                                    { label: 'Sections', value: stats.totalSections },
                                    { label: 'Subjects', value: stats.totalSubjects },
                                ]}
                            />
                        </Suspense>
                    </>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {tools?.map((t) => (
                                <Link
                                    key={t.href}
                                    href={t.href}
                                    className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium hover:bg-sidebar-accent"
                                >
                                    {t.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-lg font-semibold">Recent Announcements</h3>
                        {!recentAnnouncements || recentAnnouncements.length === 0 ? (
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
                </PageLoader>
            </PortalPageShell>

            <CommandPalette
                items={commandItems}
                open={cmdOpen}
                onClose={() => setCmdOpen(false)}
                placeholder="Search admin tools..."
            />
        </>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">{icon}</div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </div>
        </div>
    );
}
