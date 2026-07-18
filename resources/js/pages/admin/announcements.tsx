import { Head, router } from '@inertiajs/react';
import {
    ImagePlus,
    Link2,
    Sparkles,
    Paperclip,
    Pencil,
    Trash2,
    ChevronDown,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { PageLoader } from '@/components/page-loader';

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
};

export default function AdminAnnouncements({
    announcements = [],
    classSections = [],
    sectionNames = [],
    sort = 'latest',
}: {
    announcements?: AnnouncementRow[];
    classSections?: ClassSectionRow[];
    sectionNames?: string[];
    sort?: string;
}) {
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: '',
        body: '',
        scope: 'system',
        class_section_uuid: '',
        section_name: '',
    });
    const [editAnnouncement, setEditAnnouncement] =
        useState<AnnouncementRow | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(
        null,
    );
    const [selectedAnnouncement, setSelectedAnnouncement] =
        useState<AnnouncementRow | null>(null);
    const [currentSort, setCurrentSort] = useState(sort);
    const [deleteTarget, setDeleteTarget] = useState<AnnouncementRow | null>(
        null,
    );

    const { unreadCount, markAsRead } = useAnnouncementRealtime(() => {
        router.reload({ only: ['announcements'], preserveState: true });
    });

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
            new CustomEvent('local-toast', {
                detail: {
                    message,
                    type,
                    link: '/admin/announcements',
                    linkLabel: 'View announcements',
                },
            }),
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
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

        router.post('/admin/announcements', payload, {
            onFinish: () => setSaving(false),
            onSuccess: () => {
                showToast('Announcement created successfully.', 'success');
                setForm({
                    title: '',
                    body: '',
                    scope: 'system',
                    class_section_uuid: '',
                    section_name: '',
                });
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
        payload.append('scope', form.scope);
        payload.append('class_section_uuid', form.class_section_uuid);
        payload.append('section_name', form.section_name);

        if (editImageFile) {
            payload.append('image', editImageFile);
        }

        router.patch(`/admin/announcements/${editAnnouncement.uuid}`, payload, {
            onFinish: () => setEditSaving(false),
            onSuccess: () => {
                showToast('Announcement updated successfully.', 'success');
                setEditAnnouncement(null);
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
        router.delete(`/admin/announcements/${uuid}`, {
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
            '/admin/announcements',
            { sort: nextSort },
            { preserveState: true, preserveScroll: true },
        );
    }

    useEffect(() => {
        setCurrentSort(sort);
    }, [sort]);

    return (
        <>
            <Head title="Announcements" />
            <PortalPageShell
                title="Announcements"
                description="Create system-wide, class-wide, or section-wide announcements."
            >
                <PageLoader skeleton="cards">
                <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
                    <form
                        onSubmit={submit}
                        className="rounded-[28px] border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar"
                    >
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                            <Sparkles className="size-4 text-amber-500" />
                            Create Announcement
                        </div>

                        <div className="space-y-3">
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                    Title
                                </Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            title: e.target.value,
                                        })
                                    }
                                    placeholder="Announcement title"
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        Post
                                    </Label>
                                    <span className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase">
                                        reddit-style editor
                                    </span>
                                </div>
                                <textarea
                                    value={form.body}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            body: e.target.value,
                                        })
                                    }
                                    rows={9}
                                    className="w-full rounded-[20px] border border-border bg-background px-4 py-4 text-sm leading-6 transition outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    placeholder="Share the announcement details here..."
                                />
                            </div>

                            <div className="rounded-[22px] border border-dashed border-sidebar-border/80 bg-sidebar/30 p-4 dark:bg-sidebar/70">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-medium text-foreground dark:text-sidebar-foreground">
                                            Cover image
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground dark:text-sidebar-foreground/70">
                                            Upload one image to attach to the
                                            announcement.
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
                                                setImageFile(
                                                    e.target.files?.[0] ?? null,
                                                )
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

                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                    Scope
                                </Label>
                                <select
                                    value={form.scope}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            scope: e.target.value,
                                            class_section_uuid: '',
                                            section_name: '',
                                        })
                                    }
                                    className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                >
                                    <option value="system">System wide</option>
                                    <option value="class">Class wide</option>
                                    <option value="section">
                                        Section wide
                                    </option>
                                </select>
                            </div>

                            {form.scope === 'class' ? (
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        Class section
                                    </Label>
                                    <select
                                        value={form.class_section_uuid}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                class_section_uuid:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    >
                                        <option value="">
                                            Select class section
                                        </option>
                                        {classSections.map((section) => (
                                            <option
                                                key={section.uuid}
                                                value={section.uuid}
                                            >
                                                {section.name}
                                                {section.grade_level
                                                    ? ` (${section.grade_level})`
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            {form.scope === 'section' ? (
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        Section name
                                    </Label>
                                    <select
                                        value={form.section_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                section_name: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    >
                                        <option value="">Select section</option>
                                        {sectionNames.map((sectionName) => (
                                            <option
                                                key={sectionName}
                                                value={sectionName}
                                            >
                                                {sectionName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        !form.title.trim() ||
                                        !form.body.trim()
                                    }
                                    className="gap-2 rounded-full px-5"
                                >
                                    <Paperclip className="size-4" />
                                    {saving ? 'Publishing…' : 'Publish post'}
                                </Button>
                            </div>
                        </div>
                    </form>

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
                                            <option value="latest">
                                                Latest
                                            </option>
                                            <option value="oldest">
                                                Oldest
                                            </option>
                                            <option value="author">
                                                By author
                                            </option>
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
                                                    setSelectedAnnouncement(
                                                        announcement,
                                                    )
                                                }
                                                className="text-left"
                                            >
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                                        {announcement.title}
                                                    </h3>
                                                    <div className="mt-1 text-xs text-muted-foreground dark:text-sidebar-foreground/70">
                                                        {
                                                            announcement.target_label
                                                        }
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
                                                            openEdit(
                                                                announcement,
                                                            )
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
                                                            setDeleteTarget(
                                                                announcement,
                                                            )
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
                </PageLoader>
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
                <DialogContent className="max-w-2xl">
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
                                        setForm({
                                            ...form,
                                            title: e.target.value,
                                        })
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
                                        setForm({
                                            ...form,
                                            body: e.target.value,
                                        })
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
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                    Scope
                                </Label>
                                <select
                                    value={form.scope}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            scope: e.target.value,
                                            class_section_uuid: '',
                                            section_name: '',
                                        })
                                    }
                                    className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                >
                                    <option value="system">System wide</option>
                                    <option value="class">Class wide</option>
                                    <option value="section">
                                        Section wide
                                    </option>
                                </select>
                            </div>
                            {form.scope === 'class' && (
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        Class section
                                    </Label>
                                    <select
                                        value={form.class_section_uuid}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                class_section_uuid:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    >
                                        <option value="">
                                            Select class section
                                        </option>
                                        {classSections.map((section) => (
                                            <option
                                                key={section.uuid}
                                                value={section.uuid}
                                            >
                                                {section.name}
                                                {section.grade_level
                                                    ? ` (${section.grade_level})`
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {form.scope === 'section' && (
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        Section name
                                    </Label>
                                    <select
                                        value={form.section_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                section_name: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    >
                                        <option value="">Select section</option>
                                        {sectionNames.map((sectionName) => (
                                            <option
                                                key={sectionName}
                                                value={sectionName}
                                            >
                                                {sectionName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
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
                                    {editSaving ? 'Saving…' : 'Save changes'}
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
