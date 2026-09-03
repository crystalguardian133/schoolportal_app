import { Head, Link, router, usePage } from '@inertiajs/react';
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
import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

type Reply = {
    id: string;
    message: string;
    images: string[] | null;
    user: { id: number; name: string } | null;
    created_at: string;
};

type Report = {
    id: string;
    ticket_id: string;
    type: string;
    subject: string;
    message: string;
    images: string[] | null;
    status: string;
    closed: boolean;
    user: { id: number; name: string; email: string } | null;
    contact_email: string | null;
    replies: Reply[];
    created_at: string;
};

function displayName(report: Report): string {
    return report.user?.name ?? report.contact_email ?? 'Guest';
}

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
    const canClose = isDeveloper || (!!report.user && auth.user.id === report.user.id);

    const [replyText, setReplyText] = useState('');
    const [replyImages, setReplyImages] = useState<File[]>([]);
    const [replyImagePreviews, setReplyImagePreviews] = useState<string[]>([]);

    const cfg = typeConfig[report.type as keyof typeof typeConfig] ?? typeConfig.feedback;
    const status = statusConfig[report.status] ?? statusConfig.pending;
    const TypeIcon = cfg.icon;
    const StatusIcon = status.icon;

    useEffect(() => {
        if (report.closed) {
            return;
        }

        const poll = router.poll(3500, { only: ['report'] });

        return () => {
            poll.destroy();
        };
    }, [report.closed]);

    function handleReplyImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);

        if (files.length + replyImages.length > 5) {
            return;
        }

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
        if (!replyText.trim()) {
            return;
        }

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
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-3 sm:gap-6 sm:p-4">
                {/* Hero banner */}
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-4 shadow-sm dark:border-sidebar-border dark:bg-sidebar sm:p-6">
                    <Link
                        href="/feedback"
                        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:mb-4"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Reports
                    </Link>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className={cn('mt-1 rounded-xl p-2 sm:p-3', cfg.bg)}>
                                <TypeIcon className="size-5 sm:size-6" />
                            </div>
<div className="min-w-0 flex-1">
                                    <h1 className="text-xl font-bold sm:text-2xl">{report.subject}</h1>
                                    <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                        {report.ticket_id}
                                    </span>
                                <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
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
                                    <span className="block sm:inline">
                                        by {displayName(report)}
                                        {report.user?.email ? ` (${report.user.email})` : ''}
                                    </span>
                                    <span className="hidden sm:inline"> </span>
                                    <span className="block text-xs text-muted-foreground sm:inline sm:text-sm">· {formatDate(report.created_at, 'MMM d, yyyy h:mm a')}</span>
                                </p>
                            </div>
                        </div>

                        {canClose && (
                            <div className="flex gap-2 sm:shrink-0">
                                {report.closed ? (
                                    <button
                                        onClick={reopenThread}
                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted sm:w-auto"
                                    >
                                        <Unlock className="size-4" />
                                        Reopen Thread
                                    </button>
                                ) : (
                                    <button
                                        onClick={closeThread}
                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted sm:w-auto"
                                    >
                                        <Lock className="size-4" />
                                        Close Thread
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Original message */}
                    <div className="mt-4 rounded-xl bg-muted/50 p-3 sm:mt-6 sm:p-5">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.message}</p>
                    </div>

                    {report.images && report.images.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-3">
                            {report.images.map((img, i) => (
                                <a key={i} href={`/storage/${img}`} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={`/storage/${img}`}
                                        alt="Report image"
                                        className="size-16 rounded-xl border border-border object-cover transition hover:opacity-80 sm:size-24"
                                    />
                                </a>
                            ))}
                        </div>
                    )}
                </section>

                {/* Thread / Replies */}
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-4 shadow-sm dark:border-sidebar-border dark:bg-sidebar sm:p-6">
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
                        <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
                            {report.replies.map((reply) => {
                                const isOwnReply = !!report.user && !!reply.user && reply.user.id === report.user.id;

                                return (
                                    <div
                                        key={reply.id}
                                        className={cn(
                                            'rounded-xl p-3 sm:p-4',
                                            isOwnReply ? 'bg-muted' : 'bg-primary/5 border border-primary/20',
                                        )}
                                    >
                                        <div className="flex flex-wrap items-center gap-1.5 gap-y-1 sm:gap-2">
                                            <span className={cn(
                                                'text-xs font-semibold',
                                                isOwnReply ? 'text-foreground' : 'text-primary',
                                            )}>
                                                {reply.user?.name ?? 'Guest'}
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
                                                            className="size-14 rounded-lg border border-border object-cover transition hover:opacity-80 sm:size-20"
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
                        <div className="mt-5 space-y-3 sm:mt-6">
                            <div className="flex flex-col gap-3 sm:flex-row">
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
                                <div className="flex gap-3">
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
                                        className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto sm:flex-none"
                                    >
                                        <Send className="size-4" />
                                        Send
                                    </button>
                                </div>
                            </div>

                            {replyImagePreviews.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {replyImagePreviews.map((src, i) => (
                                        <div key={i} className="relative size-14 overflow-hidden rounded-lg border border-border sm:size-16">
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
                        <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground sm:mt-6 sm:p-4">
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
