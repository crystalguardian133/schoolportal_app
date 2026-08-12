import { Head, Link, usePage } from '@inertiajs/react';
import {
    GraduationCap,
    BookOpenText,
    Megaphone,
    CalendarDays,
    ClipboardList,
    QrCode,
    Award,
    BarChart3,
    Users,
    LayoutGrid,
    BookOpen,
    FileText,
    Clock,
    Eye,
    MessageSquare,
    Bug,
    Lightbulb,
    Check,
    X,
    ArrowRight,
    UserCircle,
} from 'lucide-react';
import { useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { QrCodeModal } from '@/components/qr-code-modal';
import { useAnnouncementRealtime } from '@/hooks/use-announcement-realtime';
import { cn, getFirstName } from '@/lib/utils';
import { dashboard } from '@/routes';

type SectionStat = { label: string; value: number };

type SectionTool = { label: string; href: string };

type SectionAnnouncement = {
    title: string;
    body: string;
    scope: string;
    created_at: string;
};

type SectionReport = {
    id: string;
    type: string;
    subject: string;
    status: string;
    user_name: string;
    created_at: string;
};

type RoleSection = {
    key: 'school-head' | 'admin' | 'department-head' | 'teacher' | 'staff' | 'developer' | 'empty';
    label: string;
    stats?: SectionStat[];
    tools?: SectionTool[];
    activeSchoolYear?: {
        name: string;
        start_date: string;
        end_date: string;
    } | null;
    recentAnnouncements?: SectionAnnouncement[];
    typeBreakdown?: { bugs: number; suggestions: number; feedback: number };
    recentReports?: SectionReport[];
    message?: string;
};

type StudentData = {
    name: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gradeLevel: string | null;
    section: string | null;
    schoolYear: string | null;
    lrn: string | null;
    qrToken: string | null;
};

type StudentSection = {
    key: 'student';
    label: string;
    student: StudentData | null;
    subjectsEnrolledCount: number;
    averageGrade: number | null;
    unseenAnnouncementsCount: number;
};

type DashboardSection = RoleSection | StudentSection;

type Props = {
    auth: {
        user?: {
            name: string;
            role?: 'student' | 'staff' | 'admin' | string | null;
            uuid?: string;
        } | null;
    };
    user?: { name: string; email: string };
    sections: DashboardSection[];
};

function formatGrade(n: number | null): string {
    if (n === null || n === undefined) {
        return '—';
    }

    return (Math.round(n * 100) / 100).toFixed(2);
}

export default function Dashboard({ user, sections }: Props) {
    const { auth } = usePage<Props>().props;
    const firstName = getFirstName(user?.name ?? auth.user?.name) || 'there';
    const { unreadCount } = useAnnouncementRealtime();
    const [qrOpen, setQrOpen] = useState(false);

    const studentSection = sections.find(
        (s): s is StudentSection => s.key === 'student',
    );

    return (
        <>
            <Head title="Dashboard" />
            <PortalPageShell
                title={`Welcome, ${firstName}`}
                description="Your personalized overview across all your roles."
                showBackLink={false}
                showHero
            >
                <div className="flex flex-col gap-8">
                    {sections.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No dashboard content is available for your account yet.
                        </p>
                    ) : (
                        sections.map((section) =>
                            section.key === 'student' ? (
                                <StudentSectionBlock
                                    key={section.key}
                                    section={section}
                                    unreadCount={unreadCount}
                                    onOpenQr={() => setQrOpen(true)}
                                />
                            ) : (
                                <RoleSectionBlock
                                    key={section.key}
                                    section={section}
                                />
                            ),
                        )
                    )}
                </div>
            </PortalPageShell>

            {studentSection?.student?.qrToken && (
                <QrCodeModal
                    open={qrOpen}
                    onClose={() => setQrOpen(false)}
                    studentName={studentSection.student.name}
                    lrn={studentSection.student.lrn}
                    qrToken={studentSection.student.qrToken}
                />
            )}
        </>
    );
}

function SectionHeading({ label }: { label: string }) {
    return (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
        </h2>
    );
}

function StudentSectionBlock({
    section,
    unreadCount,
    onOpenQr,
}: {
    section: StudentSection;
    unreadCount: number;
    onOpenQr: () => void;
}) {
    const { student, subjectsEnrolledCount, averageGrade, unseenAnnouncementsCount } = section;
    const announcementCount = Math.max(unseenAnnouncementsCount ?? 0, unreadCount);

    return (
        <section className="flex flex-col gap-4">
            <SectionHeading label={section.label} />

            {student && (
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    label="My Profile"
                    value="View"
                    subtitle="Student Information"
                    icon={UserCircle}
                    color="blue"
                    href="/student/profile"
                />
                <MetricCard
                    label="QR Code"
                    value="Scan"
                    subtitle="Show to teacher"
                    icon={QrCode}
                    color="sky"
                    onClick={onOpenQr}
                />
            </div>

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
    );
}

function RoleSectionBlock({ section }: { section: RoleSection }) {
    return (
        <section className="flex flex-col gap-4">
            <SectionHeading label={section.label} />

            {section.message && (
                <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 text-sm text-muted-foreground shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    {section.message}
                </div>
            )}

            {section.stats && section.stats.length > 0 && (
                <div
                    className={cn(
                        'grid gap-4 sm:grid-cols-2',
                        section.stats.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
                    )}
                >
                    {section.stats.map((stat) => (
                        <SectionStatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                        />
                    ))}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                {section.tools && section.tools.length > 0 && (
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {section.tools.map((t) => (
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
                )}

                {section.activeSchoolYear && (
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-lg font-semibold">Active School Year</h3>
                        <div className="mt-3 space-y-1">
                            <div className="text-xl font-bold">
                                {section.activeSchoolYear.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {section.activeSchoolYear.start_date} — {section.activeSchoolYear.end_date}
                            </div>
                        </div>
                    </div>
                )}

                {section.typeBreakdown && (
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-lg font-semibold">Report Types</h3>
                        <div className="mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
                            <BreakdownStat
                                label="Bugs"
                                value={section.typeBreakdown.bugs}
                                icon={Bug}
                                color="rose"
                            />
                            <BreakdownStat
                                label="Suggestions"
                                value={section.typeBreakdown.suggestions}
                                icon={Lightbulb}
                                color="amber"
                            />
                            <BreakdownStat
                                label="Feedback"
                                value={section.typeBreakdown.feedback}
                                icon={MessageSquare}
                                color="blue"
                            />
                        </div>
                    </div>
                )}

                {section.recentAnnouncements && (
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-lg font-semibold">Recent Announcements</h3>
                        {section.recentAnnouncements.length === 0 ? (
                            <p className="mt-3 text-sm text-muted-foreground">
                                No announcements yet.
                            </p>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {section.recentAnnouncements.map((a, i) => (
                                    <li key={i} className="rounded-lg border p-3">
                                        <div className="font-medium">{a.title}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {a.created_at}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {section.recentReports && section.recentReports.length > 0 && (
                <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Recent Reports</h3>
                        <Link
                            href="/developer/reports"
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                            View all <ArrowRight className="size-4" />
                        </Link>
                    </div>
                    <div className="mt-4 space-y-3">
                        {section.recentReports.map((report) => {
                            const TypeIcon = typeConfig[report.type]?.icon ?? MessageSquare;
                            const StatusIcon = statusConfig[report.status]?.icon ?? Clock;

                            return (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between rounded-xl border border-border p-3 transition hover:bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn('rounded-lg p-2', typeConfig[report.type]?.bg ?? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300')}>
                                            <TypeIcon className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{report.subject}</p>
                                            <p className="text-xs text-muted-foreground">
                                                by {report.user_name} · {report.created_at}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusConfig[report.status]?.bg ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300')}>
                                        <StatusIcon className="mr-1 inline size-3" />
                                        {statusConfig[report.status]?.label ?? report.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; bg: string }> = {
    pending: { label: 'Pending', icon: Clock, bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    under_review: { label: 'Under Review', icon: Eye, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    accepted: { label: 'Accepted', icon: Check, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    rejected: { label: 'Rejected', icon: X, bg: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

const typeConfig: Record<string, { label: string; icon: typeof Bug; bg: string }> = {
    bug: { label: 'Bug', icon: Bug, bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    suggestion: { label: 'Suggestion', icon: Lightbulb, bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    feedback: { label: 'Feedback', icon: MessageSquare, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
};

const colorMap = {
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
} as const;

const statIconMap: Array<{ match: string; icon: React.ElementType }> = [
    { match: 'student', icon: Users },
    { match: 'teacher', icon: GraduationCap },
    { match: 'section', icon: LayoutGrid },
    { match: 'subject', icon: BookOpen },
    { match: 'report', icon: FileText },
    { match: 'pending', icon: Clock },
    { match: 'under review', icon: Eye },
    { match: 'user', icon: Users },
];

function SectionStatCard({ label, value }: { label: string; value: number }) {
    const Icon = statIconMap.find((entry) => label.toLowerCase().includes(entry.match))?.icon ?? BarChart3;

    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </div>
        </div>
    );
}

function BreakdownStat({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: keyof typeof colorMap;
}) {
    return (
        <div className="rounded-xl border border-sidebar-border/70 p-3">
            <div className={cn('mb-2 inline-flex rounded-lg p-2', colorMap[color])}>
                <Icon className="size-4" />
            </div>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
        </div>
    );
}

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

    if (onClick) {
        return <button type="button" onClick={onClick}>{content}</button>;
    }

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
