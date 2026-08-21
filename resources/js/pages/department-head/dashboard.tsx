import { Head } from '@inertiajs/react';
import { Building2, Users } from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';

type Teacher = {
    uuid: string;
    name: string;
    email: string;
};

type Department = {
    uuid: string;
    name: string;
    description: string | null;
};

type Props = {
    department: Department;
    teachers: Teacher[];
};

export default function DepartmentHeadDashboard({ department, teachers }: Props) {
    return (
        <>
            <Head title={`Department: ${department.name}`} />
            <PortalPageShell
                title={department.name}
                description={department.description || 'Department overview and teacher list.'}
            >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                <Building2 className="size-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{department.name}</div>
                                <div className="text-sm text-muted-foreground">Department</div>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                <Users className="size-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{teachers.length}</div>
                                <div className="text-sm text-muted-foreground">Teachers</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="size-5 text-sky-600" />
                        <h2 className="text-lg font-semibold">Teachers in Department</h2>
                    </div>

                    {teachers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No teachers assigned to this department yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                    {teachers.map((t) => (
                                        <tr key={t.uuid} className="hover:bg-sidebar-accent/40">
                                            <td className="px-4 py-3 font-medium text-sidebar-foreground">{t.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{t.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </PortalPageShell>
        </>
    );
}
