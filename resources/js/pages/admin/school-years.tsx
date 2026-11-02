import { Head, router, usePage } from '@inertiajs/react';
import { CalendarPlus, CalendarOff, Users, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageLoader } from '@/components/page-loader';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/dates';

type SchoolYearRow = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    enrollment_start: string | null;
    enrollment_end: string | null;
    status: string;
    student_count: number;
};

type RolloverEntry = {
    uuid: string;
    name: string;
    from: string | null;
    to: string | null;
    average: number | null;
    reason?: string | null;
};

type RolloverPreview = {
    school_year: string;
    status: string;
    counts: { promoted: number; graduated: number; retained: number };
    promoted: RolloverEntry[];
    graduated: RolloverEntry[];
    retained: RolloverEntry[];
};

type CurrentYear = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    enrollment_start: string | null;
    enrollment_end: string | null;
    status: string;
} | null;

export default function AdminSchoolYears() {
    const props = usePage<any>().props;
    const schoolYears: SchoolYearRow[] = props.schoolYears || [];
    const currentYear: CurrentYear = props.currentYear || null;

    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        start_date: '',
        end_date: '',
        enrollment_start: '',
        enrollment_end: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [endTarget, setEndTarget] = useState<SchoolYearRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SchoolYearRow | null>(null);
    const [preview, setPreview] = useState<RolloverPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(
            new CustomEvent('local-toast', { detail: { message, type } }),
        );
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        router.post('/admin/school-years', form, {
            onFinish: () => setSubmitting(false),
            onSuccess: () => {
                setCreateOpen(false);
                setForm({ name: '', start_date: '', end_date: '', enrollment_start: '', enrollment_end: '' });
                showToast('School year created successfully.', 'success');
            },
            onError: (errors) => {
                const firstError = Object.values(errors || {})[0];
                showToast(
                    (firstError as string) || 'Unable to create school year.',
                    'error',
                );
            },
        });
    }

    function openEndPreview(sy: SchoolYearRow) {
        setEndTarget(sy);
        setPreview(null);
        setPreviewError(null);
        setPreviewLoading(true);

        fetch(`/admin/school-years/${sy.id}/rollover-preview`, {
            headers: { Accept: 'application/json' },
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Preview failed (${res.status})`);
                }

                return res.json();
            })
            .then((data) => {
                setPreview(data as RolloverPreview);
                setPreviewLoading(false);
            })
            .catch((err) => {
                setPreviewError(
                    err instanceof Error ? err.message : 'Preview failed.',
                );
                setPreviewLoading(false);
            });
    }

    function closeEndPreview() {
        setEndTarget(null);
        setPreview(null);
        setPreviewError(null);
    }

    function endYear() {
        if (!endTarget) {
            return;
        }

        router.post(
            `/admin/school-years/${endTarget.id}/end`,
            {},
            {
                onSuccess: (page: any) => {
                    const message =
                        page?.props?.flash?.success ??
                        'School year ended.';
                    closeEndPreview();
                    showToast(message, 'success');
                },
                onError: () => {
                    showToast('Unable to end school year.', 'error');
                },
            },
        );
    }

    function deleteYear() {
        if (!deleteTarget) {
return;
}

        router.delete(`/admin/school-years/${deleteTarget.id}`, {
            onSuccess: () => {
                setDeleteTarget(null);
                showToast('School year deleted.', 'success');
            },
            onError: () => {
                showToast('Unable to delete school year.', 'error');
            },
        });
    }

    function statusBadge(status: string) {
        if (status === 'active') {
return (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Active
                </span>
            );
}

        if (status === 'ended') {
return (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Ended
                </span>
            );
}

        return (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {status}
            </span>
        );
    }

    return (
        <>
            <Head title="School Years" />

            <PortalPageShell
                title="School Years"
                description="Manage school year periods and student promotions."
            >
                <PageLoader skeleton="table">
                <div className="flex flex-col gap-6">
                    {/* Current Year Card */}
                    {currentYear && (
                        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Current School Year
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-foreground">
                                        {currentYear.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(currentYear.start_date)} –{' '}
                                        {formatDate(currentYear.end_date)}
                                    </p>
                                    {(currentYear.enrollment_start || currentYear.enrollment_end) && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Enrollment: {formatDate(currentYear.enrollment_start)} –{' '}
                                            {formatDate(currentYear.enrollment_end)}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {statusBadge(currentYear.status)}
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() =>
                                            setEndTarget(
                                                schoolYears.find(
                                                    (s) => s.id === currentYear.id,
                                                ) || null,
                                            )
                                        }
                                    >
                                        <CalendarOff className="size-3.5" />
                                        End Year
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Create Button + Table */}
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">
                                All School Years
                            </h3>
                            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="gap-1.5 rounded-full">
                                        <CalendarPlus className="size-3.5" />
                                        New School Year
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>Create School Year</DialogTitle>
                                    <DialogDescription>
                                        Set up a new school year period. Only one can be active at a
                                        time.
                                    </DialogDescription>
                                    <form onSubmit={submitCreate} className="mt-4 space-y-4">
                                        <div className="grid gap-2">
                                            <Label>Name (e.g. 2026-2027)</Label>
                                            <Input
                                                value={form.name}
                                                onChange={(e) =>
                                                    setForm({ ...form, name: e.target.value })
                                                }
                                                placeholder="2026-2027"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label>Start Date</Label>
                                                <Input
                                                    type="date"
                                                    value={form.start_date}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            start_date: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>End Date</Label>
                                                <Input
                                                    type="date"
                                                    value={form.end_date}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            end_date: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label>Enrollment Start</Label>
                                                <Input
                                                    type="date"
                                                    value={form.enrollment_start}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            enrollment_start: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Enrollment End</Label>
                                                <Input
                                                    type="date"
                                                    value={form.enrollment_end}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            enrollment_end: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="secondary" type="button">
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    submitting ||
                                                    !form.name.trim() ||
                                                    !form.start_date ||
                                                    !form.end_date
                                                }
                                            >
                                                {submitting ? 'Creating...' : 'Create'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="pb-3 pr-4">Name</th>
                                        <th className="pb-3 pr-4">Start Date</th>
                                        <th className="pb-3 pr-4">End Date</th>
                                        <th className="pb-3 pr-4">Enrollment Period</th>
                                        <th className="pb-3 pr-4">Status</th>
                                        <th className="pb-3 pr-4 text-right">Students</th>
                                        <th className="pb-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schoolYears.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                No school years found.
                                            </td>
                                        </tr>
                                    ) : (
                                        schoolYears.map((sy) => (
                                            <tr
                                                key={sy.id}
                                                className="border-b border-border/50 last:border-0"
                                            >
                                                <td className="py-3 pr-4 font-medium text-foreground">
                                                    {sy.name}
                                                </td>
                                                <td className="py-3 pr-4 text-muted-foreground">
                                                    {formatDate(sy.start_date)}
                                                </td>
                                                <td className="py-3 pr-4 text-muted-foreground">
                                                    {formatDate(sy.end_date)}
                                                </td>
                                                <td className="py-3 pr-4 text-muted-foreground text-xs">
                                                    {sy.enrollment_start || sy.enrollment_end
                                                        ? `${formatDate(sy.enrollment_start)} – ${formatDate(sy.enrollment_end)}`
                                                        : '—'}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {statusBadge(sy.status)}
                                                </td>
                                                <td className="py-3 pr-4 text-right text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Users className="size-3.5" />
                                                        {sy.student_count}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="inline-flex gap-2">
                                                        {sy.status === 'active' && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="gap-1.5"
                                                                onClick={() => openEndPreview(sy)}
                                                            >
                                                                <CalendarOff className="size-3.5" />
                                                                End
                                                            </Button>
                                                        )}
                                                        {sy.status !== 'active' && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="gap-1.5"
                                                                onClick={() => setDeleteTarget(sy)}
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                                Delete
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                </PageLoader>
            </PortalPageShell>

            <Dialog
                open={!!endTarget}
                onOpenChange={(open) => !open && closeEndPreview()}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogTitle>
                        End School Year “{endTarget?.name}”?
                    </DialogTitle>
                    <DialogDescription>
                        Grades are archived, sections are cleared, and every
                        student is auto-promoted (average ≥ 75), graduated
                        (Grade 12, average ≥ 75), or retained. Audit rows are
                        written per student. This cannot be undone.
                    </DialogDescription>
                    {previewLoading && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            Computing rollover preview…
                        </p>
                    )}
                    {previewError && (
                        <p className="py-6 text-center text-sm text-destructive">
                            {previewError}
                        </p>
                    )}
                    {preview && (
                        <div className="mt-2 space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-lg bg-emerald-100 px-2 py-3 dark:bg-emerald-900/30">
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                        {preview.counts.promoted}
                                    </div>
                                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                        Promoted
                                    </div>
                                </div>
                                <div className="rounded-lg bg-sky-100 px-2 py-3 dark:bg-sky-900/30">
                                    <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">
                                        {preview.counts.graduated}
                                    </div>
                                    <div className="text-xs font-medium text-sky-700 dark:text-sky-300">
                                        Graduated
                                    </div>
                                </div>
                                <div className="rounded-lg bg-amber-100 px-2 py-3 dark:bg-amber-900/30">
                                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                        {preview.counts.retained}
                                    </div>
                                    <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                        Retained
                                    </div>
                                </div>
                            </div>
                            {(
                                [
                                    ['Promoted', preview.promoted, 'to'],
                                    ['Graduated', preview.graduated, null],
                                    ['Retained', preview.retained, 'reason'],
                                ] as const
                            ).map(([label, list]) => (
                                <details
                                    key={label}
                                    className="rounded-lg border border-sidebar-border/70"
                                >
                                    <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                                        {label} ({list.length})
                                    </summary>
                                    <ul className="max-h-44 space-y-1 overflow-auto px-3 pb-3 text-sm text-muted-foreground">
                                        {list.length === 0 && (
                                            <li>None.</li>
                                        )}
                                        {list.map((entry) => (
                                            <li
                                                key={entry.uuid}
                                                className="flex items-center justify-between gap-2"
                                            >
                                                <span className="truncate">
                                                    {entry.name}
                                                </span>
                                                <span className="shrink-0 text-xs">
                                                    {entry.from ?? '—'}
                                                    {entry.to
                                                        ? ` → ${entry.to}`
                                                        : ''}
                                                    {entry.average != null
                                                        ? ` · avg ${entry.average}`
                                                        : ''}
                                                    {entry.reason
                                                        ? ` · ${entry.reason}`
                                                        : ''}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            ))}
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={previewLoading || !preview}
                            onClick={endYear}
                        >
                            End Year
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete School Year"
                description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all student enrollment records for that year. This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={deleteYear}
                variant="destructive"
            />
        </>
    );
}
