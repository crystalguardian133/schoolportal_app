import { Head, Link } from '@inertiajs/react';
import { PortalPageShell } from '@/components/portal-page-shell';

export default function AdminDashboard({ user, tools }: any) {
    return (
        <>
            <Head title="Admin Dashboard" />
            <PortalPageShell
                title="Admin Dashboard"
                description="Administrative tools and quick actions."
            >
                <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">
                            Welcome, {user?.name}
                        </h2>
                        <div className="text-sm text-muted-foreground">
                            Roles: {(user?.roles || []).join(', ')}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {tools?.map((t: any) => (
                            <Link
                                key={t.href}
                                href={t.href}
                                className="rounded-lg border p-4 hover:shadow-sm"
                            >
                                <div className="font-medium">{t.label}</div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    Open {t.label}
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-6">
                        <h3 className="text-sm font-medium">Quick Actions</h3>
                        <div className="mt-2 flex gap-2">
                            <Link
                                href="/admin/enrollments"
                                className="rounded bg-sky-600 px-3 py-2 text-white"
                            >
                                Enroll Students
                            </Link>
                            <Link
                                href="/admin/sections"
                                className="rounded border px-3 py-2"
                            >
                                Manage Sections
                            </Link>
                            <Link
                                href="/admin/assignments"
                                className="rounded border px-3 py-2"
                            >
                                Assign Subjects
                            </Link>
                            <Link
                                href="/admin/enrollment-audits"
                                className="rounded border px-3 py-2"
                            >
                                View Enrollment Audits
                            </Link>
                        </div>
                    </div>
                </div>
            </PortalPageShell>
        </>
    );
}
