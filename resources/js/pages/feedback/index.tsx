import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Bug, Lightbulb, MessageSquare, X, Send, ImagePlus, Lock, LifeBuoy } from 'lucide-react';
import { useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

type Report = {
    id: string;
    ticket_id: string;
    type: string;
    subject: string;
    message: string;
    images: string[] | null;
    status: string;
    closed: boolean;
    replies: { id: string }[];
    created_at: string;
};

type Props = {
    reports: Report[];
};

const typeConfig = {
    bug: { label: 'Bug Report', icon: Bug, bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    suggestion: { label: 'Suggestion', icon: Lightbulb, bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    feedback: { label: 'Feedback', icon: MessageSquare, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    support: { label: 'Support', icon: LifeBuoy, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
};

const statusConfig: Record<string, { label: string; bg: string }> = {
    pending: { label: 'Pending', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    under_review: { label: 'Under Review', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    accepted: { label: 'Accepted', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    rejected: { label: 'Rejected', bg: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

export default function FeedbackIndex({ reports }: Props) {
    const { props } = usePage();
    const flash: any = props.flash || {};
    const [activeTab, setActiveTab] = useState<'send' | 'history' | 'support'>('send');
    const [selectedType, setSelectedType] = useState<'bug' | 'suggestion' | 'feedback'>('bug');
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const { data, setData, post, processing, reset } = useForm({
        type: 'bug',
        subject: '',
        message: '',
        images: [] as File[],
    });

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);

        if (files.length + images.length > 5) {
return;
}

        const newImages = [...images, ...files].slice(0, 5);
        setImages(newImages);
        setImagePreviews(newImages.map((f) => URL.createObjectURL(f)));
    }

    function removeImage(index: number) {
        URL.revokeObjectURL(imagePreviews[index]);
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('type', selectedType);
        formData.append('subject', data.subject);
        formData.append('message', data.message);
        images.forEach((img) => formData.append('images[]', img));

        router.post('/feedback', formData, {
            onSuccess: () => {
                reset();
                setImages([]);
                setImagePreviews([]);
                setActiveTab('history');
            },
            forceFormData: true,
        });
    }

    const supportReports = reports.filter((r) => r.type === 'support');
    const myReports = reports.filter((r) => r.type !== 'support');

    return (
        <>
            <Head title="Reports & Feedback" />
            <PortalPageShell
                title="Reports & Feedback"
                description="Submit bug reports, suggestions, or general feedback to the developer."
                showBackLink={false}
            >
                {flash.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                <div className="flex gap-2 border-b border-border pb-3">
                    <button
                        onClick={() => setActiveTab('send')}
                        className={cn(
                            'rounded-lg px-4 py-2 text-sm font-medium transition',
                            activeTab === 'send' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                        )}
                    >
                        Submit Report
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            'rounded-lg px-4 py-2 text-sm font-medium transition',
                            activeTab === 'history' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                        )}
                    >
                        My Reports ({myReports.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('support')}
                        className={cn(
                            'rounded-lg px-4 py-2 text-sm font-medium transition',
                            activeTab === 'support' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                        )}
                    >
                        Support ({supportReports.length})
                    </button>
                </div>

                {activeTab === 'send' && (
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-sm font-medium">Type</label>
                                <div className="mt-2 flex gap-3">
                                    {(Object.keys(typeConfig) as Array<'bug' | 'suggestion' | 'feedback'>).map((type) => {
                                        const cfg = typeConfig[type];
                                        const Icon = cfg.icon;

                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedType(type);
                                                    setData('type', type);
                                                }}
                                                className={cn(
                                                    'flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition',
                                                    selectedType === type
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-border text-muted-foreground hover:bg-muted',
                                                )}
                                            >
                                                <Icon className="size-4" />
                                                {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                                <input
                                    id="subject"
                                    type="text"
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    placeholder="Brief summary of your report"
                                    className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="text-sm font-medium">Message</label>
                                <textarea
                                    id="message"
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    placeholder="Describe the bug, suggestion, or feedback in detail..."
                                    rows={5}
                                    className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Images (optional, max 5)</label>
                                <div className="mt-2 flex flex-wrap gap-3">
                                    {imagePreviews.map((src, i) => (
                                        <div key={i} className="relative size-20 overflow-hidden rounded-xl border border-border">
                                            <img src={src} alt="" className="size-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {images.length < 5 && (
                                        <label className="flex size-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                                            <ImagePlus className="size-5" />
                                            <span className="mt-1 text-[10px]">Upload</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !data.subject || !data.message}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                            >
                                <Send className="size-4" />
                                {processing ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {myReports.length === 0 && (
                            <div className="rounded-2xl border border-sidebar-border/70 bg-white p-12 text-center shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                                <MessageSquare className="mx-auto size-10 text-muted-foreground" />
                                <p className="mt-3 text-sm text-muted-foreground">No reports yet. Submit your first report!</p>
                            </div>
                        )}

                        {myReports.map((report) => {
                            const cfg = typeConfig[report.type as keyof typeof typeConfig] ?? typeConfig.feedback;
                            const status = statusConfig[report.status] ?? statusConfig.pending;
                            const Icon = cfg.icon;
                            const replyCount = report.replies?.length ?? 0;

                            return (
                                <Link
                                    key={report.id}
                                    href={`/feedback/${report.id}`}
                                    className="block rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-primary/20 dark:border-sidebar-border dark:bg-sidebar"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={cn('mt-0.5 rounded-lg p-2', cfg.bg)}>
                                                <Icon className="size-4" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{report.subject}</h3>
                                                <span className="mt-0.5 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    {report.ticket_id}
                                                </span>
                                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{report.message}</p>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', status.bg)}>
                                                        {status.label}
                                                    </span>
                                                    {report.closed && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                            <Lock className="size-3" />
                                                            Closed
                                                        </span>
                                                    )}
                                                    {replyCount > 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-xs text-muted-foreground">
                                        {formatDate(report.created_at, 'MMM d, yyyy h:mm a')}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'support' && (
                    <div className="space-y-4">
                        {supportReports.length === 0 && (
                            <div className="rounded-2xl border border-sidebar-border/70 bg-white p-12 text-center shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                                <LifeBuoy className="mx-auto size-10 text-muted-foreground" />
                                <p className="mt-3 text-sm text-muted-foreground">
                                    No support requests yet. If you ever get locked out of your account, use the
                                    &ldquo;Need help signing in?&rdquo; link on the login page.
                                </p>
                            </div>
                        )}

                        {supportReports.map((report) => {
                            const cfg = typeConfig.support;
                            const status = statusConfig[report.status] ?? statusConfig.pending;
                            const Icon = cfg.icon;
                            const replyCount = report.replies?.length ?? 0;

                            return (
                                <Link
                                    key={report.id}
                                    href={`/feedback/${report.id}`}
                                    className="block rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-primary/20 dark:border-sidebar-border dark:bg-sidebar"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={cn('mt-0.5 rounded-lg p-2', cfg.bg)}>
                                                <Icon className="size-4" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{report.subject}</h3>
                                                <span className="mt-0.5 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    {report.ticket_id}
                                                </span>
                                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{report.message}</p>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', status.bg)}>
                                                        {status.label}
                                                    </span>
                                                    {report.closed && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                            <Lock className="size-3" />
                                                            Closed
                                                        </span>
                                                    )}
                                                    {replyCount > 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-xs text-muted-foreground">
                                        {formatDate(report.created_at, 'MMM d, yyyy h:mm a')}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </PortalPageShell>
        </>
    );
}

FeedbackIndex.layout = undefined;
