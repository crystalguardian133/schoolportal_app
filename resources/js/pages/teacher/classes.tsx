import { Head, Link } from '@inertiajs/react';
import { Users, ArrowRight } from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';

type ClassItem = {
    id: string;
    subjectId: string;
    sectionUuid: string;
    section: string;
    gradeLevel: string | null;
    subject: string;
    students: number;
    timeSchedule: string;
    subject_teacher_uuid: string | null;
};

type SectionGroup = {
    section: string;
    gradeLevel: string | null;
    classes: ClassItem[];
};

type Props = {
    classes?: ClassItem[];
    sections?: SectionGroup[];
};

export default function TeacherClasses({ classes = [], sections = [] }: Props) {
    const sectionList = Array.isArray(sections) ? sections : [];

    if (sectionList.length === 0 && classes.length > 0) {
        const grouped = classes.reduce<Record<string, ClassItem[]>>((acc, item) => {
            if (!acc[item.section]) {
acc[item.section] = [];
}

            acc[item.section].push(item);

            return acc;
        }, {});

        return (
            <>
                <Head title="Classes" />
                <PortalPageShell
                    title="Classes"
                    description="View your class assignments and teaching load for the current term."
                >
                    <SectionContent sections={Object.entries(grouped).map(([section, items]) => ({
                        section,
                        gradeLevel: items[0]?.gradeLevel ?? null,
                        classes: items,
                    }))} />
                </PortalPageShell>
            </>
        );
    }

    return (
        <>
            <Head title="Classes" />
            <PortalPageShell
                title="Classes"
                description="View your class assignments and teaching load for the current term."
            >
                <SectionContent sections={sectionList} />
            </PortalPageShell>
        </>
    );
}

function SectionContent({ sections }: { sections: SectionGroup[] }) {
    if (sections.length === 0) {
        return (
            <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                <div className="flex items-center gap-3">
                    <Users className="size-5 text-sky-600" />
                    <h2 className="text-lg font-semibold">My Class Load</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    No classes assigned for the current school year.
                </p>
            </section>
        );
    }

    return (
        <div className="space-y-6">
            {sections.map((group) => (
                <section
                    key={group.section}
                    className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar"
                >
                    <div className="flex items-center gap-3">
                        <Users className="size-5 text-sky-600" />
                        <div>
                            <h2 className="text-lg font-semibold">
                                {group.section}
                            </h2>
                            {group.gradeLevel && (
                                <p className="text-sm text-muted-foreground">
                                    {group.gradeLevel}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="table-scroll-container table-scroll-small mt-4 rounded-xl border border-sidebar-border/70">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Subject
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Schedule
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Enrolled Students
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                {group.classes.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-sidebar-accent/40"
                                    >
                                        <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                            {item.subject}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {item.timeSchedule || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {item.students}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/teacher/classes/${item.id}`}
                                                className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
                                            >
                                                Manage{' '}
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ))}
        </div>
    );
}
