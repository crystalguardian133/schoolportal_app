import { Head, Link } from '@inertiajs/react';
import {
    Bug,
    Lightbulb,
    MessageSquare,
    Clock,
    Eye,
    Check,
    X,
    Users,
    FileText,
    ArrowRight,
} from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { SimpleBarChart, SimplePieChart } from '@/components/charts';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

type Props = {
    user: { name: string; email: string };
    stats: {
        totalReports: number;
        pendingReports: number;
        underReviewReports: number;
        acceptedReports: number;
        rejectedReports: number;
        totalUsers: number;
    };
    typeBreakdown: {
        bugs: number;
        suggestions: number;
        feedback: number;
    };
    recentReports: Array<{
        id: string;
        type: string;
        subject: string;
        status: string;
        user_name: string;
        created_at: string;
    }>;
};

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

export default function DeveloperDashboard({ user, stats, typeBreakdown, recentReports }: Props) {
    const firstName = user?.name?.split(' ')[0] ?? 'Developer';

    return (
        <>
            <Head title="Developer Dashboard" />
            <PortalPageShell
                title={`Welcome, ${firstName}`}
                description="System overview and report management."
                showBackLink={false}
                showHero
            >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<FileText className="h-5 w-5" />}
                        label="Total Reports"
                        value={stats.totalReports}
                        color="violet"
                    />
                    <StatCard
                        icon={<Clock className="h-5 w-5" />}
                        label="Pending"
                        value={stats.pendingReports}
                        color="amber"
                    />
                    <StatCard
                        icon={<Eye className="h-5 w-5" />}
                        label="Under Review"
                        value={stats.underReviewReports}
                        color="blue"
                    />
                    <StatCard
                        icon={<Users className="h-5 w-5" />}
                        label="Total Users"
                        value={stats.totalUsers}
                        color="emerald"
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <SimpleBarChart
                        title="Status Overview"
                        data={[
                            { label: 'Pending', value: stats.pendingReports },
                            { label: 'Under Review', value: stats.underReviewReports },
                            { label: 'Accepted', value: stats.acceptedReports },
                            { label: 'Rejected', value: stats.rejectedReports },
                        ]}
                    />
                    <SimplePieChart
                        title="Report Types"
                        data={[
                            { label: 'Bugs', value: typeBreakdown.bugs },
                            { label: 'Suggestions', value: typeBreakdown.suggestions },
                            { label: 'Feedback', value: typeBreakdown.feedback },
                        ]}
                    />
                </div>

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

                    {recentReports.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">No reports yet.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {recentReports.map((report) => {
                                const type = typeConfig[report.type] ?? typeConfig.feedback;
                                const status = statusConfig[report.status] ?? statusConfig.pending;
                                const TypeIcon = type.icon;
                                const StatusIcon = status.icon;

                                return (
                                    <div
                                        key={report.id}
                                        className="flex items-center justify-between rounded-xl border border-border p-3 transition hover:bg-muted/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn('rounded-lg p-2', type.bg)}>
                                                <TypeIcon className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{report.subject}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    by {report.user_name} · {formatDate(report.created_at, 'MMM d, h:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', status.bg)}>
                                            <StatusIcon className="mr-1 inline size-3" />
                                            {status.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </PortalPageShell>
        </>
    );
}

const colorMap = {
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
} as const;

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: keyof typeof colorMap;
}) {
    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
            <div className="flex items-center gap-3">
                <div className={cn('rounded-lg p-2', colorMap[color])}>{icon}</div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </div>
        </div>
    );
}

DeveloperDashboard.layout = undefined;
