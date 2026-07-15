import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Bug,
    Lightbulb,
    MessageSquare,
    X,
    Send,
    ImagePlus,
    ArrowLeft,
    Lock,
    Unlock,
    Check,
    Eye,
    Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

type Reply = {
    id: string;
    message: string;
    images: string[] | null;
    user: { id: number; name: string };
    created_at: string;
};

type Report = {
    id: string;
    type: string;
    subject: string;
    message: string;
    images: string[] | null;
    status: string;
    closed: boolean;
    user: { id: number; name: string; email: string };
    replies: Reply[];
    created_at: string;
};

type Props = {
    report: Report;
};

const typeConfig = {
    bug: { label: 'Bug Report', icon: Bug, bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    suggestion: { label: 'Suggestion', icon: Lightbulb, bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    feedback: { label: 'Feedback', icon: MessageSquare, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; bg: string }> = {
    pending: { label: 'Pending', icon: Clock, bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    under_review: { label: 'Under Review', icon: Eye, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    accepted: { label: 'Accepted', icon: Check, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    rejected: { label: 'Rejected', icon: X, bg: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

export default function ReportShow({ report }: Props) {
    const { props } = usePage();
    const flash: any = props.flash || {};
    const auth = props.auth as { user: { id: number }; permissions: string[] };
    const isDeveloper = auth.permissions.includes('access developer dashboard');

    const [replyText, setReplyText] = useState('');
    const [replyImages, setReplyImages] = useState<File[]>([]);
    const [replyImagePreviews, setReplyImagePreviews] = useState<string[]>([]);

    const cfg = typeConfig[report.type as keyof typeof typeConfig] ?? typeConfig.feedback;
    const status = statusConfig[report.status] ?? statusConfig.pending;
    const TypeIcon = cfg.icon;
    const StatusIcon = status.icon;

    function handleReplyImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (files.length + replyImages.length > 5) return;
        const newImages = [...replyImages, ...files].slice(0, 5);
        setReplyImages(newImages);
        setReplyImagePreviews(newImages.map((f) => URL.createObjectURL(f)));
    }

    function removeReplyImage(index: number) {
        URL.revokeObjectURL(replyImagePreviews[index]);
        setReplyImages(replyImages.filter((_, i) => i !== index));
        setReplyImagePreviews(replyImagePreviews.filter((_, i) => i !== index));
    }

    function submitReply() {
        if (!replyText.trim()) return;
        const formData = new FormData();
        formData.append('message', replyText);
        replyImages.forEach((img) => formData.append('images[]', img));

        router.post(`/feedback/${report.id}/reply`, formData, {
            onSuccess: () => {
                setReplyText('');
                setReplyImages([]);
                setReplyImagePreviews([]);
            },
            forceFormData: true,
        });
    }

    function closeThread() {
        router.post(`/feedback/${report.id}/close`);
    }

    function reopenThread() {
        router.post(`/feedback/${report.id}/reopen`);
    }

    return (
        <>
            <Head title={report.subject} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Hero banner */}
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <Link
                        href="/feedback"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Reports
                    </Link>

                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className={cn('mt-1 rounded-xl p-3', cfg.bg)}>
                                <TypeIcon className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{report.subject}</h1>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.bg)}>
                                        <TypeIcon className="size-3" />
                                        {cfg.label}
                                    </span>
                                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', status.bg)}>
                                        <StatusIcon className="size-3" />
                                        {status.label}
                                    </span>
                                    {report.closed && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                            <Lock className="size-3" />
                                            Closed
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    by {report.user.name} ({report.user.email}) · {formatDate(report.created_at, 'MMM d, yyyy h:mm a')}
                                </p>
                            </div>
                        </div>

                        {isDeveloper && (
                            <div className="flex gap-2">
                                {report.closed ? (
                                    <button
                                        onClick={reopenThread}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                    >
                                        <Unlock className="size-4" />
                                        Reopen Thread
                                    </button>
                                ) : (
                                    <button
                                        onClick={closeThread}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                    >
                                        <Lock className="size-4" />
                                        Close Thread
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Original message */}
                    <div className="mt-6 rounded-xl bg-muted/50 p-5">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.message}</p>
                    </div>

                    {report.images && report.images.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-3">
                            {report.images.map((img, i) => (
                                <a key={i} href={`/storage/${img}`} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={`/storage/${img}`}
                                        alt="Report image"
                                        className="size-24 rounded-xl border border-border object-cover transition hover:opacity-80"
                                    />
                                </a>
                            ))}
                        </div>
                    )}
                </section>

                {/* Thread / Replies */}
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <h2 className="text-lg font-semibold">
                        Thread
                        {report.replies.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({report.replies.length} {report.replies.length === 1 ? 'reply' : 'replies'})
                            </span>
                        )}
                    </h2>

                    {flash.error && (
                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                            {flash.error}
                        </div>
                    )}

                    {report.replies.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">No replies yet.</p>
                    ) : (
                        <div className="mt-5 space-y-4">
                            {report.replies.map((reply) => {
                                const isOwnReply = reply.user.id === report.user.id;
                                return (
                                    <div
                                        key={reply.id}
                                        className={cn(
                                            'rounded-xl p-4',
                                            isOwnReply ? 'bg-muted' : 'bg-primary/5 border border-primary/20',
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'text-xs font-semibold',
                                                isOwnReply ? 'text-foreground' : 'text-primary',
                                            )}>
                                                {reply.user.name}
                                            </span>
                                            {!isOwnReply && (
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Developer</span>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(reply.created_at, 'MMM d, yyyy h:mm a')}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                                        {reply.images && reply.images.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {reply.images.map((img, i) => (
                                                    <a key={i} href={`/storage/${img}`} target="_blank" rel="noopener noreferrer">
                                                        <img
                                                            src={`/storage/${img}`}
                                                            alt="Reply image"
                                                            className="size-20 rounded-lg border border-border object-cover transition hover:opacity-80"
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Reply input */}
                    {!report.closed ? (
                        <div className="mt-6 space-y-3">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            submitReply();
                                        }
                                    }}
                                    placeholder="Write a reply..."
                                    className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                                />
                                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted">
                                    <ImagePlus className="size-4" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleReplyImageChange}
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={submitReply}
                                    disabled={!replyText.trim()}
                                    className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                                >
                                    <Send className="size-4" />
                                    Send
                                </button>
                            </div>

                            {replyImagePreviews.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {replyImagePreviews.map((src, i) => (
                                        <div key={i} className="relative size-16 overflow-hidden rounded-lg border border-border">
                                            <img src={src} alt="" className="size-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeReplyImage(i)}
                                                className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                            <Lock className="size-4" />
                            This thread is closed. No new replies can be sent.
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

ReportShow.layout = undefined;
