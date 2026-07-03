import { Head, Link } from '@inertiajs/react';
import { Users, ArrowRight } from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';

type TeacherClass = {
    id: string;
    section: string;
    subject: string;
    students: number;
    timeSchedule: string;
};

type Props = {
    classes: TeacherClass[];
};

export default function TeacherClasses({ classes }: Props) {
    const classList = Array.isArray(classes) ? classes : (classes ? Object.values(classes) : []);

    return (
        <>
            <Head title="Classes" />
            <PortalPageShell title="Classes" description="View your class assignments and teaching load for the current term.">
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-center gap-3">
                        <Users className="size-5 text-sky-600" />
                        <h2 className="text-lg font-semibold">My Class Load</h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Choose a class first. You will be taken to the manage class page before you can see the student table.
                    </p>
                    <div className="mt-5 rounded-xl border border-sidebar-border/70 table-scroll-container table-scroll-small">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Section</th>
                                    <th className="px-4 py-3 font-medium">Subject</th>
                                    <th className="px-4 py-3 font-medium">Schedule</th>
                                    <th className="px-4 py-3 font-medium">Enrolled Students</th>
                                    <th className="px-4 py-3 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                    {classList.map((item) => (
                                    <tr key={item.id} className="hover:bg-sidebar-accent/40">
                                        <td className="px-4 py-3 font-medium text-sidebar-foreground">{item.section}</td>
                                        <td className="px-4 py-3 text-sidebar-foreground">{item.subject}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.timeSchedule}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.students}</td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/teacher/classes/${item.id}`}
                                                className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
                                            >
                                                Manage <ArrowRight className="size-4" />
                                            </Link>
                                        </td>
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
