import { Head, usePage, router } from '@inertiajs/react';
import { Megaphone, ChevronDown } from 'lucide-react';
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
};

export default function TeacherAnnouncements() {
    const { props } = usePage<{ announcements?: AnnouncementRow[]; sort?: string }>();
    const announcements = props.announcements || [];
    const sort = props.sort || 'latest';

    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementRow | null>(null);
    const [editAnnouncement, setEditAnnouncement] = useState<AnnouncementRow | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [currentSort, setCurrentSort] = useState(sort);
    const [deleteTarget, setDeleteTarget] = useState<AnnouncementRow | null>(null);
    const [form, setForm] = useState({ title: '', body: '' });

    const { unreadCount, markAsRead } = useAnnouncementRealtime(() => {
        router.reload({ only: ['announcements'], preserveState: true });
    });

    useEffect(() => {
        setCurrentSort(sort);
    }, [sort]);

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

    function openEdit(announcement: AnnouncementRow) {
        setEditAnnouncement(announcement);
        setForm({ title: announcement.title, body: announcement.body });
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
            },
            onError: (errors) => {
                const firstError = Object.values(errors || {})[0];
                alert((firstError as string) || 'Unable to update announcement.');
            },
        });
    }

    function deleteAnnouncement(uuid: string) {
        router.delete(`/teacher/announcements/${uuid}`, {
            onSuccess: () => {
            },
            onError: () => {
                alert('Unable to delete announcement.');
            },
        });
    }

    function handleSortChange(nextSort: string) {
        setCurrentSort(nextSort);
        router.get('/teacher/announcements', { sort: nextSort }, { preserveState: true, preserveScroll: true });
    }

    return (
        <>
            <Head title="Announcements" />
            <PortalPageShell title="Announcements" description="View school notices and staff reminders.">
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <Megaphone className="size-5 text-amber-600" />
                            <h2 className="text-lg font-semibold">Staff Notices</h2>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                            Sort
                            <div className="relative">
                                <select
                                    value={currentSort}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="appearance-none rounded-xl border border-border bg-background pl-3 pr-8 py-1.5 text-xs outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                                >
                                    <option value="latest">Latest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="author">By author</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </label>
                    </div>
                    <div className="mt-5 space-y-3">
                        {announcements.length === 0 ? (
                            <div className="rounded-xl border border-sidebar-border/70 px-4 py-3 text-sm text-muted-foreground dark:text-sidebar-foreground/70">
                                No announcements available.
                            </div>
                        ) : announcements.map((announcement) => (
                            <article key={announcement.uuid} className="rounded-xl border border-sidebar-border/70 px-4 py-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAnnouncement(announcement)}
                                    className="w-full text-left"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground dark:text-sidebar-foreground">{announcement.title}</h3>
                                            <div className="mt-1 text-xs text-muted-foreground dark:text-sidebar-foreground/70">
                                                {announcement.target_label}{announcement.created_by ? ` · by ${announcement.created_by}` : ''}
                                            </div>
                                        </div>
                                        <span className="rounded-full border border-sidebar-border/70 px-3 py-1 text-xs text-muted-foreground dark:text-sidebar-foreground/70">
                                            {announcement.scope}
                                        </span>
                                    </div>
                                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-sidebar-foreground">
                                        {announcement.body}
                                    </p>
                                </button>
                                {(announcement.can_edit || announcement.can_delete) && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {announcement.can_edit && (
                                            <Button variant="secondary" size="sm" className="gap-1.5 rounded-full" onClick={() => openEdit(announcement)}>
                                                <Pencil className="size-3.5" />
                                                Edit
                                            </Button>
                                        )}
                                            {announcement.can_delete && (
                                                <Button variant="destructive" size="sm" className="gap-1.5 rounded-full" onClick={() => setDeleteTarget(announcement)}>
                                                    <Trash2 className="size-3.5" />
                                                    Delete
                                                </Button>
                                            )}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </PortalPageShell>

            {selectedAnnouncement && (
                <AnnouncementModal
                    announcement={selectedAnnouncement}
                    open={!!selectedAnnouncement}
                    onOpenChange={(open) => !open && setSelectedAnnouncement(null)}
                />
            )}

            <Dialog open={!!editAnnouncement} onOpenChange={(open) => !open && setEditAnnouncement(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit announcement</DialogTitle>
                    </DialogHeader>
                    {editAnnouncement && (
                        <form onSubmit={submitEdit} className="space-y-4 mt-2">
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">Title</Label>
                                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">Body</Label>
                                <textarea
                                    value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                                    rows={8}
                                    className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-6 outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">Cover image</Label>
                                <div className="flex items-center gap-3">
                                    {editImagePreview ? (
                                        <img src={editImagePreview} alt="Preview" className="h-32 w-32 rounded-xl object-cover" />
                                    ) : (
                                        <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-sidebar-border/70 text-xs text-muted-foreground">
                                            No image
                                        </div>
                                    )}
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sidebar-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:bg-sidebar dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/70">
                                        <ImagePlus className="size-4" />
                                        <span>Change image</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)} />
                                    </label>
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary" type="button">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={editSaving || !form.title.trim() || !form.body.trim()} className="gap-2 rounded-full px-5">
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
