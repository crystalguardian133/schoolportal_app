import { Head, usePage, router } from '@inertiajs/react';
import {
    Megaphone,
    ChevronDown,
    Sparkles,
    Paperclip,
    ImagePlus,
    Link2,
} from 'lucide-react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnnouncementModal } from '@/components/announcement-modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAnnouncementRealtime } from '@/hooks/use-announcement-realtime';

type AnnouncementRow = {
    uuid: string;
    title: string;
    body: string;
    scope: 'system' | 'class' | 'section';
    target_label: string;
    created_by?: string | null;
    created_by_user_uuid?: string | null;
    created_at?: string | null;
    image_url?: string | null;
    can_edit?: boolean;
    can_delete?: boolean;
    class_section_uuid?: string | null;
    section_name?: string | null;
};

type ClassSectionRow = {
    uuid: string;
    name: string;
    grade_level?: string | null;
    is_substitute?: boolean;
};

export default function TeacherAnnouncements() {
    const { props } = usePage<{
        announcements?: AnnouncementRow[];
        allowedSections?: ClassSectionRow[];
        allSections?: ClassSectionRow[];
        isFullAdmin?: boolean;
        isAdviser?: boolean;
        adviserSectionUuid?: string | null;
        sort?: string;
    }>();

    const announcements = props.announcements || [];
    const allowedSections = props.allowedSections || [];
    const allSections = props.allSections || [];
    const isFullAdmin = props.isFullAdmin || false;
    const isAdviser = props.isAdviser || false;
    const adviserSectionUuid = props.adviserSectionUuid || null;
    const sort = props.sort || 'latest';

    // Derive what the user can do
    const canClassScope = isAdviser && !!adviserSectionUuid;
    const sectionPool = isFullAdmin ? allSections : allowedSections;
    const hasNoSections = !isFullAdmin && !canClassScope && sectionPool.length === 0;

    // Determine default scope
    const defaultScope = canClassScope ? 'class' : isFullAdmin ? 'system' : sectionPool.length > 0 ? 'section' : 'section';

    const [selectedAnnouncement, setSelectedAnnouncement] =
        useState<AnnouncementRow | null>(null);
    const [editAnnouncement, setEditAnnouncement] =
        useState<AnnouncementRow | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(
        null,
    );
    const [currentSort, setCurrentSort] = useState(sort);
    const [deleteTarget, setDeleteTarget] = useState<AnnouncementRow | null>(
        null,
    );

    // Creation form state
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: '',
        body: '',
        scope: defaultScope,
        class_section_uuid: canClassScope ? (adviserSectionUuid ?? '') : '',
        section_name: '',
    });

    const { unreadCount, markAsRead } = useAnnouncementRealtime(() => {
        router.reload({ only: ['announcements'] });
    });

    useEffect(() => {
        setCurrentSort(sort);
    }, [sort]);

    useEffect(() => {
        if (!imageFile) {
            setImagePreview(null);

            return;
        }

        const previewUrl = URL.createObjectURL(imageFile);
        setImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [imageFile]);

    useEffect(() => {
        if (!editAnnouncement) {
            setEditImagePreview(null);
            setEditImageFile(null);

            return;
        }

        if (!editImageFile) {
            setEditImagePreview(editAnnouncement.image_url ?? null);

            return;
        }

        const previewUrl = URL.createObjectURL(editImageFile);
        setEditImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [editImageFile, editAnnouncement]);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(
            new CustomEvent('local-toast', { detail: { message, type } }),
        );
    }

    function resetForm() {
        setForm({
            title: '',
            body: '',
            scope: defaultScope,
            class_section_uuid: canClassScope ? (adviserSectionUuid ?? '') : '',
            section_name: '',
        });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (form.scope === 'class' && !form.class_section_uuid) {
            showToast('Please select a section.', 'error');

            return;
        }

        if (form.scope === 'section' && !form.section_name) {
            showToast('Please select a section.', 'error');

            return;
        }

        setSaving(true);
        const payload = new FormData();
        payload.append('title', form.title);
        payload.append('body', form.body);
        payload.append('scope', form.scope);
        payload.append('class_section_uuid', form.class_section_uuid);
        payload.append('section_name', form.section_name);

        if (imageFile) {
            payload.append('image', imageFile);
        }

        router.post('/teacher/announcements', payload, {
            onFinish: () => setSaving(false),
            onSuccess: () => {
                showToast('Announcement created successfully.', 'success');
                resetForm();
                setImageFile(null);
            },
            onError: (errors) => {
                const firstError = Object.values(errors || {})[0];
                showToast(
                    (firstError as string) || 'Unable to create announcement.',
                    'error',
                );
            },
        });
    }

    function openEdit(announcement: AnnouncementRow) {
        setEditAnnouncement(announcement);
        setForm({
            title: announcement.title,
            body: announcement.body,
            scope: announcement.scope,
            class_section_uuid: announcement.class_section_uuid ?? '',
            section_name: announcement.section_name ?? '',
        });
        setEditImageFile(null);
        setEditImagePreview(announcement.image_url ?? null);
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();

        if (!editAnnouncement) {
return;
}

        setEditSaving(true);
        const payload = new FormData();
        payload.append('title', form.title);
        payload.append('body', form.body);
        payload.append('scope', editAnnouncement.scope);
        payload.append('class_section_uuid', editAnnouncement.class_section_uuid ?? '');
        payload.append('section_name', editAnnouncement.section_name ?? '');

        if (editImageFile) {
            payload.append('image', editImageFile);
        }

        router.patch(`/teacher/announcements/${editAnnouncement.uuid}`, payload, {
            onFinish: () => setEditSaving(false),
            onSuccess: () => {
                setEditAnnouncement(null);
                showToast('Announcement updated successfully.', 'success');
            },
            onError: (errors) => {
                const firstError = Object.values(errors || {})[0];
                showToast(
                    (firstError as string) || 'Unable to update announcement.',
                    'error',
                );
            },
        });
    }

    function deleteAnnouncement(uuid: string) {
        router.delete(`/teacher/announcements/${uuid}`, {
            onSuccess: () => {
                showToast('Announcement deleted successfully.', 'success');
            },
            onError: () => {
                showToast('Unable to delete announcement.', 'error');
            },
        });
    }

    function handleSortChange(nextSort: string) {
        setCurrentSort(nextSort);
        router.get(
            '/teacher/announcements',
            { sort: nextSort },
            { preserveState: true, preserveScroll: true },
        );
    }

    function handleScopeChange(nextScope: string) {
        setForm({
            ...form,
            scope: nextScope,
            class_section_uuid: nextScope === 'class' && canClassScope ? (adviserSectionUuid ?? '') : '',
            section_name: '',
        });
    }

    const adviserSectionName = canClassScope
        ? (allowedSections.find((s) => s.uuid === adviserSectionUuid)?.name ?? 'Unknown')
        : '';

    const submitDisabled =
        saving ||
        !form.title.trim() ||
        !form.body.trim() ||
        (form.scope === 'class' && !form.class_section_uuid) ||
        (form.scope === 'section' && !form.section_name) ||
        hasNoSections;

    return (
        <>
            <Head title="Announcements" />
            <PortalPageShell
                title="Announcements"
                description="Create and view announcements for your assigned sections."
            >
                <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
                    {/* Create form */}
                    <form
                        onSubmit={submit}
                        className="rounded-[28px] border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar"
                    >
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                            <Sparkles className="size-4 text-amber-500" />
                            Create Announcement
                        </div>

                        <div className="space-y-3">
                            {/* Title */}
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                    Title
                                </Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm({ ...form, title: e.target.value })
                                    }
                                    placeholder="Announcement title"
                                />
                            </div>

                            {/* Body */}
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                    Post
                                </Label>
                                <textarea
                                    value={form.body}
                                    onChange={(e) =>
                                        setForm({ ...form, body: e.target.value })
                                    }
                                    rows={9}
                                    className="w-full rounded-[20px] border border-border bg-background px-4 py-4 text-sm leading-6 transition outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    placeholder="Share the announcement details here..."
                                />
                            </div>

                            {/* Cover image */}
                            <div className="rounded-[22px] border border-dashed border-sidebar-border/80 bg-sidebar/30 p-4 dark:bg-sidebar/70">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-medium text-foreground dark:text-sidebar-foreground">
                                            Cover image
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground dark:text-sidebar-foreground/70">
                                            Upload one image to attach to the announcement.
                                        </div>
                                    </div>
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sidebar-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:bg-sidebar dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/70">
                                        <ImagePlus className="size-4" />
                                        <span>Choose image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) =>
                                                setImageFile(e.target.files?.[0] ?? null)
                                            }
                                        />
                                    </label>
                                </div>

                                {imagePreview ? (
                                    <div className="mt-4 overflow-hidden rounded-[18px] border border-sidebar-border/70 bg-background">
                                        <img
                                            src={imagePreview}
                                            alt="Announcement preview"
                                            className="h-56 w-full object-cover"
                                        />
                                        <div className="flex items-center gap-2 border-t border-sidebar-border/70 px-3 py-2 text-xs text-muted-foreground">
                                            <Link2 className="size-3.5" />
                                            Ready to post with image
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 flex h-56 items-center justify-center rounded-[18px] border border-dashed border-sidebar-border/70 bg-background text-sm text-muted-foreground">
                                        No image selected
                                    </div>
                                )}
                            </div>

                            {/* No sections at all */}
                            {hasNoSections && (
                                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                                    You are not assigned to any section. Contact an administrator to be assigned before posting announcements.
                                </div>
                            )}

                            {/* Scope selector */}
                            {!hasNoSections && (isFullAdmin || canClassScope || sectionPool.length > 0) && (
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        Scope
                                    </Label>
                                    <select
                                        value={form.scope}
                                        onChange={(e) => handleScopeChange(e.target.value)}
                                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    >
                                        {isFullAdmin && <option value="system">System wide</option>}
                                        {canClassScope && <option value="class">Class wide (Adviser)</option>}
                                        {sectionPool.length > 0 && <option value="section">Section wide</option>}
                                    </select>
                                </div>
                            )}

                            {/* Class scope — adviser section auto-selected */}
                            {form.scope === 'class' && canClassScope && (
                                <div className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                                    Announcing to your adviser section:{' '}
                                    <span className="font-medium text-foreground">
                                        {adviserSectionName}
                                    </span>
                                </div>
                            )}

                            {/* Section scope — dropdown */}
                            {form.scope === 'section' && sectionPool.length > 0 && (
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        Section
                                    </Label>
                                    <select
                                        value={form.section_name}
                                        onChange={(e) =>
                                            setForm({ ...form, section_name: e.target.value })
                                        }
                                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    >
                                        <option value="">Select a section</option>
                                        {sectionPool.map((section) => (
                                            <option key={section.uuid} value={section.name}>
                                                {section.name}
                                                {section.is_substitute ? ' (SUB)' : ''}
                                                {section.grade_level
                                                    ? ` (${section.grade_level})`
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        Your announcement will only be visible to students in the selected section.
                                    </p>
                                </div>
                            )}

                            {/* Section scope — empty */}
                            {form.scope === 'section' && sectionPool.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                                    No sections available for section-wide announcements.
                                </div>
                            )}

                            {/* System scope info */}
                            {form.scope === 'system' && (
                                <div className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                                    This announcement will be visible to all users in the portal.
                                </div>
                            )}

                            {/* Submit */}
                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    disabled={submitDisabled}
                                    className="gap-2 rounded-full px-5"
                                >
                                    <Paperclip className="size-4" />
                                    {saving ? 'Publishing...' : 'Publish post'}
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* Announcements list */}
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                Recent announcements
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                    Sort
                                    <div className="relative">
                                        <select
                                            value={currentSort}
                                            onChange={(e) =>
                                                handleSortChange(e.target.value)
                                            }
                                            className="appearance-none rounded-xl border border-border bg-background py-1.5 pr-8 pl-3 text-xs transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                        >
                                            <option value="latest">Latest</option>
                                            <option value="oldest">Oldest</option>
                                            <option value="author">By author</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted-foreground" />
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {announcements.length === 0 ? (
                                <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar/40 p-4 text-sm text-muted-foreground dark:text-sidebar-foreground/70">
                                    No announcements yet.
                                </div>
                            ) : (
                                announcements.map((announcement) => (
                                    <article
                                        key={announcement.uuid}
                                        className="overflow-hidden rounded-2xl border border-sidebar-border/70 bg-sidebar/30 p-4 dark:bg-sidebar/60"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedAnnouncement(announcement)
                                                }
                                                className="text-left"
                                            >
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                                        {announcement.title}
                                                    </h3>
                                                    <div className="mt-1 text-xs text-muted-foreground dark:text-sidebar-foreground/70">
                                                        {announcement.target_label}
                                                        {announcement.created_by
                                                            ? ` · by ${announcement.created_by}`
                                                            : ''}
                                                    </div>
                                                </div>
                                            </button>
                                            <span className="rounded-full border border-sidebar-border/70 px-3 py-1 text-xs text-muted-foreground dark:text-sidebar-foreground/70">
                                                {announcement.scope}
                                            </span>
                                        </div>
                                        {announcement.image_url ? (
                                            <div className="mt-3 overflow-hidden rounded-[18px] border border-sidebar-border/70 bg-background">
                                                <img
                                                    src={announcement.image_url}
                                                    alt={announcement.title}
                                                    className="max-h-80 w-full object-cover"
                                                />
                                            </div>
                                        ) : null}
                                        <p className="mt-3 text-sm leading-6 whitespace-pre-line text-foreground dark:text-sidebar-foreground">
                                            {announcement.body}
                                        </p>
                                        {(announcement.can_edit ||
                                            announcement.can_delete) && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {announcement.can_edit && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="gap-1.5 rounded-full"
                                                        onClick={() =>
                                                            openEdit(announcement)
                                                        }
                                                    >
                                                        <Pencil className="size-3.5" />
                                                        Edit
                                                    </Button>
                                                )}
                                                {announcement.can_delete && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="gap-1.5 rounded-full"
                                                        onClick={() =>
                                                            setDeleteTarget(announcement)
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </PortalPageShell>

            {selectedAnnouncement && (
                <AnnouncementModal
                    announcement={selectedAnnouncement}
                    open={!!selectedAnnouncement}
                    onOpenChange={(open) =>
                        !open && setSelectedAnnouncement(null)
                    }
                />
            )}

            <Dialog
                open={!!editAnnouncement}
                onOpenChange={(open) => !open && setEditAnnouncement(null)}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit announcement</DialogTitle>
                    </DialogHeader>
                    {editAnnouncement && (
                        <form onSubmit={submitEdit} className="mt-2 space-y-4">
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                    Title
                                </Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm({ ...form, title: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                    Body
                                </Label>
                                <textarea
                                    value={form.body}
                                    onChange={(e) =>
                                        setForm({ ...form, body: e.target.value })
                                    }
                                    rows={8}
                                    className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-6 transition outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                    Cover image
                                </Label>
                                <div className="flex items-center gap-3">
                                    {editImagePreview ? (
                                        <img
                                            src={editImagePreview}
                                            alt={editAnnouncement.title}
                                            className="h-32 w-32 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-sidebar-border/70 text-xs text-muted-foreground">
                                            No image
                                        </div>
                                    )}
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sidebar-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:bg-sidebar dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/70">
                                        <ImagePlus className="size-4" />
                                        <span>Change image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) =>
                                                setEditImageFile(
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary" type="button">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={
                                        editSaving ||
                                        !form.title.trim() ||
                                        !form.body.trim()
                                    }
                                    className="gap-2 rounded-full px-5"
                                >
                                    {editSaving ? 'Saving...' : 'Save changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete announcement"
                description="This action cannot be undone. Are you sure you want to permanently delete this announcement?"
                confirmLabel="Delete"
                onConfirm={() => {
                    if (deleteTarget) {
                        deleteAnnouncement(deleteTarget.uuid);
                    }

                    setDeleteTarget(null);
                }}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            />
        </>
    );
}
