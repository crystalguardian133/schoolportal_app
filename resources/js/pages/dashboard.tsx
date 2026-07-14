import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    GraduationCap,
    BookOpenText,
    Megaphone,
    CalendarDays,
    ClipboardList,
    QrCode,
    Award,
    BarChart3,
} from 'lucide-react';
import { useAnnouncementRealtime } from '@/hooks/use-announcement-realtime';
import { QrCodeModal } from '@/components/qr-code-modal';
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
        lrn: string | null;
        qrToken: string | null;
    } | null;
    subjectsEnrolledCount?: number;
    averageGrade?: number | null;
    unseenAnnouncementsCount?: number;
};

function formatGrade(n: number | null): string {
    if (n === null || n === undefined) return '—';
    return (Math.round(n * 100) / 100).toFixed(2);
}

export default function Dashboard() {
    const {
        auth,
        student,
        subjectsEnrolledCount,
        averageGrade,
        unseenAnnouncementsCount,
    } = usePage<DashboardPageProps>().props;
    const { unreadCount } = useAnnouncementRealtime();
    const announcementCount = Math.max(unseenAnnouncementsCount ?? 0, unreadCount);
    const [qrOpen, setQrOpen] = useState(false);

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">

                {/* Welcome hero */}
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Welcome back,</p>
                            <h1 className="mt-1 text-2xl font-bold">
                                {student?.firstName || auth.user?.name?.split(' ')[0] || 'Student'}
                            </h1>
                            {student && (
                                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                    {student.gradeLevel && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                                            <GraduationCap className="size-3" />
                                            {student.gradeLevel}
                                        </span>
                                    )}
                                    {student.section && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                            Section {student.section}
                                        </span>
                                    )}
                                    {student.schoolYear && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                            <CalendarDays className="size-3" />
                                            {student.schoolYear}
                                        </span>
                                    )}
                                    {student.lrn && (
                                        <span className="text-xs text-muted-foreground">
                                            LRN: {student.lrn}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 p-4 text-white shadow-lg">
                            <GraduationCap className="size-8" />
                        </div>
                    </div>
                </section>

                {/* Metric cards */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        label="Average Grade"
                        value={formatGrade(averageGrade)}
                        icon={Award}
                        color="violet"
                        href="/student/grades"
                    />
                    <MetricCard
                        label="Subjects Enrolled"
                        value={String(subjectsEnrolledCount ?? 0)}
                        icon={BookOpenText}
                        color="emerald"
                        href="/student/subjects-enrolled"
                    />
                    <MetricCard
                        label="Announcements"
                        value={String(announcementCount)}
                        subtitle={announcementCount > 0 ? 'new' : 'all read'}
                        icon={Megaphone}
                        color="amber"
                        href="/student/announcements"
                    />
                    <MetricCard
                        label="QR Code"
                        value="Scan"
                        subtitle="Show to teacher"
                        icon={QrCode}
                        color="sky"
                        onClick={() => setQrOpen(true)}
                    />
                </section>

                {/* Quick navigation */}
                <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Quick Access
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <QuickLink
                            title="Grades"
                            description="View quarterly grades and general average"
                            icon={BarChart3}
                            href="/student/grades"
                            color="violet"
                        />
                        <QuickLink
                            title="Subjects Enrolled"
                            description="See your enrolled subjects and schedules"
                            icon={BookOpenText}
                            href="/student/subjects-enrolled"
                            color="emerald"
                        />
                        <QuickLink
                            title="Pre-registration"
                            description="Confirm enrollment details and documents"
                            icon={ClipboardList}
                            href="/student/pre-registration"
                            color="amber"
                        />
                        <QuickLink
                            title="Announcements"
                            description="Latest school notices and reminders"
                            icon={Megaphone}
                            href="/student/announcements"
                            color="rose"
                        />
                    </div>
                </section>
            </div>

            {student?.qrToken && (
                <QrCodeModal
                    open={qrOpen}
                    onClose={() => setQrOpen(false)}
                    studentName={student.name}
                    lrn={student.lrn}
                    qrToken={student.qrToken}
                />
            )}
        </>
    );
}

const colorMap = {
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
} as const;

function MetricCard({
    label,
    value,
    subtitle,
    icon: Icon,
    color,
    href,
    onClick,
}: {
    label: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    color: keyof typeof colorMap;
    href?: string;
    onClick?: () => void;
}) {
    const className =
        'group flex h-[108px] flex-col justify-between rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-sidebar-border dark:bg-sidebar' +
        (onClick ? ' cursor-pointer' : '');

    const content = (
        <div className={className}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <div className={`rounded-xl p-2 ${colorMap[color]}`}>
                    <Icon className="size-4" />
                </div>
            </div>
            <div>
                <p className="text-2xl font-bold">{value}</p>
                {subtitle && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
                )}
            </div>
        </div>
    );

    if (onClick) return <button type="button" onClick={onClick}>{content}</button>;
    return <a href={href!}>{content}</a>;
}

function QuickLink({
    title,
    description,
    icon: Icon,
    href,
    color,
}: {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    color: keyof typeof colorMap;
}) {
    return (
        <a
            href={href}
            className="group flex items-start gap-4 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-sidebar-border dark:bg-sidebar"
        >
            <div className={`shrink-0 rounded-xl p-2.5 ${colorMap[color]}`}>
                <Icon className="size-5" />
            </div>
            <div className="min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary">{title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            </div>
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
