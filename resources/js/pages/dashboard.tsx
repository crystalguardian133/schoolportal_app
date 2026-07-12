import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
    AnnouncementsSection,
    GradesSection,
    PreRegistrationSection,
    SubjectsEnrolledSection,
    WelcomeSection,
} from '@/components/student-dashboard';
import { dashboard } from '@/routes';

type DashboardPageProps = {
    auth: {
        user?: {
            name: string;
            role: 'student' | 'staff' | 'admin' | null;
            uuid?: string;
        } | null;
    };
    student?: {
        name: string;
        firstName: string;
        middleName: string;
        lastName: string;
        gradeLevel: string | null;
        section: string | null;
        schoolYear: string | null;
    } | null;
    subjectsEnrolledCount?: number;
    averageGrade?: number | null;
    unseenAnnouncementsCount?: number;
};

export default function Dashboard() {
    const {
        auth,
        subjectsEnrolledCount,
        averageGrade,
        unseenAnnouncementsCount,
    } = usePage<DashboardPageProps>().props;
    const firstName = auth.user?.name?.split(' ')[0] ?? 'Student';
    const isStaff = auth.user?.role === 'staff';

    return (
        <>
            <Head title="Dashboard" />
            <div
                id="dashboard"
                className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4"
            >
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <WelcomeSection firstName={firstName} />
                    {isStaff ? (
                        <>
                            <SectionCardLink
                                title="Classes"
                                description="View class loads and assigned sections."
                                href="/teacher/classes"
                            />
                            <SectionCardLink
                                title="Schedule"
                                description="Open your weekly teaching schedule."
                                href="/teacher/schedule"
                            />
                            <SectionCardLink
                                title="Announcements"
                                description="See staff notices and reminders."
                                href="/teacher/announcements"
                            />
                        </>
                    ) : (
                        <>
                            <PreRegistrationSection />
                            <GradesSection
                                averageGrade={averageGrade ?? null}
                            />
                            <SubjectsEnrolledSection
                                subjectsCount={subjectsEnrolledCount ?? 0}
                            />
                            <AnnouncementsSection
                                unseenCount={unseenAnnouncementsCount ?? 0}
                            />
                        </>
                    )}
                </section>

                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <h3 className="text-lg font-semibold">Overview</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Use the sidebar to jump between dashboard sections. This
                        layout now adapts to student and teacher roles.
                    </p>
                </section>
            </div>
        </>
    );
}

function SectionCardLink({
    title,
    description,
    href,
}: {
    title: string;
    description: string;
    href: string;
}) {
    return (
        <a
            href={href}
            className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-sidebar-border dark:bg-sidebar"
        >
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {description}
            </p>
        </a>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
