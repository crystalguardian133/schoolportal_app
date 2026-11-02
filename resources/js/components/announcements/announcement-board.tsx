import { router } from '@inertiajs/react';
import {
    ChevronDown,
    ImagePlus,
    Link2,
    Paperclip,
    Pencil,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { AnnouncementModal } from '@/components/announcement-modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAnnouncements } from '@/contexts/announcements-context';

export type BoardAnnouncement = {
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

export type BoardSectionOption = {
    uuid: string;
    name: string;
    grade_level?: string | null;
    /** Optional suffix marker, e.g. ' (SUB)' for substitute sections. */
    tag?: string | null;
};

export type BoardScopeConfig =
    /** Full picker (admin): any scope, any section. */
    | {
          mode: 'full';
          classSections: BoardSectionOption[];
          sectionNames: string[];
      }
    /**
     * Restricted picker (teacher): only the listed scopes, class scope
     * locked to one fixed section, section scope from the given options.
     */
    | {
          mode: 'scoped';
          allowedScopes: Array<'system' | 'class' | 'section'>;
          defaultScope: string;
          classSectionUuid: string;
          classSectionName: string;
          sectionOptions: BoardSectionOption[];
      };

export type AnnouncementBoardProps = {
    announcements?: BoardAnnouncement[];
    sort?: string;
    /** Endpoint base, e.g. '/admin/announcements'. */
    basePath: string;
    /** Show create form + edit/delete actions. False = read-only feed. */
    manageable: boolean;
    scope?: BoardScopeConfig;
    notify?: (message: string, type?: 'success' | 'error') => void;
};

function defaultNotify(message: string, type: 'success' | 'error' = 'success') {
    window.dispatchEvent(
        new CustomEvent('local-toast', { detail: { message, type } }),
    );
}

export function AnnouncementBoard({
    announcements = [],
    sort = 'latest',
    basePath,
    manageable,
    scope,
    notify = defaultNotify,
}: AnnouncementBoardProps) {
    const initialScope =
        scope?.mode === 'scoped'
            ? scope.defaultScope
            : 'system';
    const initialClassUuid =
        scope?.mode === 'scoped' ? scope.classSectionUuid : '';

    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: '',
        body: '',
        scope: initialScope,
        class_section_uuid: initialClassUuid,
        section_name: '',
    });
    const [editAnnouncement, setEditAnnouncement] =
        useState<BoardAnnouncement | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(
        null,
    );
    const [selectedAnnouncement, setSelectedAnnouncement] =
        useState<BoardAnnouncement | null>(null);
    const [currentSort, setCurrentSort] = useState(sort);
    const [prevSortProp, setPrevSortProp] = useState(sort);
    const [deleteTarget, setDeleteTarget] =
        useState<BoardAnnouncement | null>(null);

    // Object URLs are created in event handlers (never in effects) and
    // revoked when replaced, on submit, or on unmount.
    const previewUrlRef = useRef<string | null>(null);

    function revokePreviewUrl() {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
    }

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);

    // Keep local sort in sync when the server round-trips a new value.
    if (prevSortProp !== sort) {
        setPrevSortProp(sort);
        setCurrentSort(sort);
    }

    useAnnouncements({
        markSeenOnMount: true,
        onUpdate: () => {
            // Local form/modal state lives in useState, so it survives a
            // plain reload; no preserveState needed (and ReloadOptions
            // doesn't accept it).
            router.reload({ only: ['announcements'] });
        },
    });

    function handleImageFile(file: File | null) {
        revokePreviewUrl();
        setImageFile(file);

        if (!file) {
            setImagePreview(null);

            return;
        }

        const url = URL.createObjectURL(file);
        previewUrlRef.current = url;
        setImagePreview(url);
    }

    function handleEditImageFile(file: File | null) {
        revokePreviewUrl();
        setEditImageFile(file);

        if (!file) {
            setEditImagePreview(null);

            return;
        }

        const url = URL.createObjectURL(file);
        previewUrlRef.current = url;
        setEditImagePreview(url);
    }

    function resetForm() {
        setForm({
            title: '',
            body: '',
            scope: initialScope,
            class_section_uuid: initialClassUuid,
            section_name: '',
        });
    }

    function handleScopeChange(nextScope: string) {
        if (scope?.mode === 'scoped') {
            setForm({
                ...form,
                scope: nextScope,
                class_section_uuid:
                    nextScope === 'class' ? scope.classSectionUuid : '',
                section_name: '',
            });

            return;
        }

        setForm({
            ...form,
            scope: nextScope,
            class_section_uuid: '',
            section_name: '',
        });
    }

    // Scoped mode without any usable target (e.g. teacher with no sections).
    const scopedUsable =
        !scope ||
        scope.mode === 'full' ||
        scope.allowedScopes.length > 0;

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (form.scope === 'class' && !form.class_section_uuid) {
            notify('Please select a section.', 'error');

            return;
        }

        if (form.scope === 'section' && !form.section_name) {
            notify('Please select a section.', 'error');

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

        router.post(basePath, payload, {
            onFinish: () => setSaving(false),
            onSuccess: () => {
                notify('Announcement created successfully.', 'success');
                resetForm();
                handleImageFile(null);
            },
            onError: (errors) => {
                const firstError = Object.values(errors || {})[0];
                notify(
                    (firstError as string) ||
                        'Unable to create announcement.',
                    'error',
                );
            },
        });
    }

    function openEdit(announcement: BoardAnnouncement) {
        revokePreviewUrl();
        setEditAnnouncement(announcement);
        setForm({
            title: announcement.title,
            body: announcement.body,
            scope: announcement.scope,
            class_section_uuid: announcement.class_section_uuid ?? '',
            section_name: announcement.section_name ?? '',
        });
        setEditImageFile(null);
        setEditImagePreview(null);
    }

    // Newly-picked file wins; otherwise fall back to the stored image.
    const shownEditPreview =
        editImagePreview ?? editAnnouncement?.image_url ?? null;

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();

        if (!editAnnouncement) {
            return;
        }

        // Scoped mode locks the original target (teacher behavior); full
        // mode allows changing it (admin behavior).
        const locked = scope?.mode === 'scoped';

        setEditSaving(true);
        const payload = new FormData();
        payload.append('title', form.title);
        payload.append('body', form.body);
        payload.append(
            'scope',
            locked ? editAnnouncement.scope : form.scope,
        );
        payload.append(
            'class_section_uuid',
            locked
                ? (editAnnouncement.class_section_uuid ?? '')
                : form.class_section_uuid,
        );
        payload.append(
            'section_name',
            locked
                ? (editAnnouncement.section_name ?? '')
                : form.section_name,
        );

        if (editImageFile) {
            payload.append('image', editImageFile);
        }

        router.patch(`${basePath}/${editAnnouncement.uuid}`, payload, {
            onFinish: () => setEditSaving(false),
            onSuccess: () => {
                notify('Announcement updated successfully.', 'success');
                setEditAnnouncement(null);
                handleEditImageFile(null);
            },
            onError: (errors) => {
                const firstError = Object.values(errors || {})[0];
                notify(
                    (firstError as string) ||
                        'Unable to update announcement.',
                    'error',
                );
            },
        });
    }

    function deleteAnnouncement(uuid: string) {
        router.delete(`${basePath}/${uuid}`, {
            onSuccess: () => {
                notify('Announcement deleted successfully.', 'success');
            },
            onError: () => {
                notify('Unable to delete announcement.', 'error');
            },
        });
    }

    function handleSortChange(nextSort: string) {
        setCurrentSort(nextSort);
        router.get(
            basePath,
            { sort: nextSort },
            { preserveState: true, preserveScroll: true },
        );
    }

    const submitDisabled =
        saving ||
        !form.title.trim() ||
        !form.body.trim() ||
        (form.scope === 'class' && !form.class_section_uuid) ||
        (form.scope === 'section' && !form.section_name);

    return (
        <>
            <div
                className={
                    manageable
                        ? 'grid w-full items-start gap-4 lg:grid-cols-[30%_70%]'
                        : 'flex w-full flex-col'
                }
            >
                {manageable && (
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
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        Title
                                    </Label>
                                    <span className="text-[11px] tabular-nums text-muted-foreground/70">
                                        {form.title.length}/{200}
                                    </span>
                                </div>
                                <Input
                                    value={form.title}
                                    maxLength={200}
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
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase">
                                            reddit-style editor
                                        </span>
                                        <span className="text-[11px] tabular-nums text-muted-foreground/70">
                                            {form.body.length}/{400}
                                        </span>
                                    </div>
                                </div>
                                <textarea
                                    value={form.body}
                                    maxLength={400}
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
                                                handleImageFile(
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

                            {!scopedUsable && (
                                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                                    You are not assigned to any section. Contact
                                    an administrator to be assigned before
                                    posting announcements.
                                </div>
                            )}

                            {scopedUsable && scope?.mode === 'scoped' && (
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        Scope
                                    </Label>
                                    <select
                                        value={form.scope}
                                        onChange={(e) =>
                                            handleScopeChange(e.target.value)
                                        }
                                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    >
                                        {scope.allowedScopes.includes(
                                            'system',
                                        ) && (
                                            <option value="system">
                                                System wide
                                            </option>
                                        )}
                                        {scope.allowedScopes.includes(
                                            'class',
                                        ) && (
                                            <option value="class">
                                                Class wide (Adviser)
                                            </option>
                                        )}
                                        {scope.allowedScopes.includes(
                                            'section',
                                        ) && (
                                            <option value="section">
                                                Section wide
                                            </option>
                                        )}
                                    </select>
                                </div>
                            )}

                            {scopedUsable &&
                                scope?.mode === 'scoped' &&
                                form.scope === 'class' && (
                                    <div className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                                        Announcing to your adviser section:{' '}
                                        <span className="font-medium text-foreground">
                                            {scope.classSectionName}
                                        </span>
                                    </div>
                                )}

                            {scopedUsable &&
                                scope?.mode === 'scoped' &&
                                form.scope === 'section' &&
                                scope.sectionOptions.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                            Section
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
                                            <option value="">
                                                Select a section
                                            </option>
                                            {scope.sectionOptions.map(
                                                (section) => (
                                                    <option
                                                        key={section.uuid}
                                                        value={section.name}
                                                    >
                                                        {section.name}
                                                        {section.tag ?? ''}
                                                        {section.grade_level
                                                            ? ` (${section.grade_level})`
                                                            : ''}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <p className="text-xs text-muted-foreground">
                                            Your announcement will only be
                                            visible to students in the selected
                                            section.
                                        </p>
                                    </div>
                                )}

                            {scopedUsable &&
                                scope?.mode === 'scoped' &&
                                form.scope === 'section' &&
                                scope.sectionOptions.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                                        No sections available for section-wide
                                        announcements.
                                    </div>
                                )}

                            {scopedUsable &&
                                scope?.mode === 'scoped' &&
                                form.scope === 'system' && (
                                    <div className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                                        This announcement will be visible to all
                                        users in the portal.
                                    </div>
                                )}

                            {(!scope || scope.mode === 'full') && (
                                <>
                                    <div className="grid gap-2">
                                        <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                            Scope
                                        </Label>
                                        <select
                                            value={form.scope}
                                            onChange={(e) =>
                                                handleScopeChange(
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                        >
                                            <option value="system">
                                                System wide
                                            </option>
                                            <option value="class">
                                                Class wide
                                            </option>
                                            <option value="section">
                                                Section wide
                                            </option>
                                        </select>
                                    </div>

                                    {form.scope === 'class' &&
                                        scope?.mode === 'full' && (
                                            <div className="grid gap-2">
                                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                                    Class section
                                                </Label>
                                                <select
                                                    value={
                                                        form.class_section_uuid
                                                    }
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
                                                    {scope.classSections.map(
                                                        (section) => (
                                                            <option
                                                                key={
                                                                    section.uuid
                                                                }
                                                                value={
                                                                    section.uuid
                                                                }
                                                            >
                                                                {section.name}
                                                                {section.grade_level
                                                                    ? ` (${section.grade_level})`
                                                                    : ''}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                        )}

                                    {form.scope === 'section' &&
                                        scope?.mode === 'full' && (
                                            <div className="grid gap-2">
                                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                                    Section name
                                                </Label>
                                                <select
                                                    value={form.section_name}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            section_name:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                                >
                                                    <option value="">
                                                        Select section
                                                    </option>
                                                    {scope.sectionNames.map(
                                                        (sectionName) => (
                                                            <option
                                                                key={sectionName}
                                                                value={
                                                                    sectionName
                                                                }
                                                            >
                                                                {sectionName}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                        )}
                                </>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    disabled={
                                        submitDisabled || !scopedUsable
                                    }
                                    className="gap-2 rounded-full px-5"
                                >
                                    <Paperclip className="size-4" />
                                    {saving ? 'Publishing…' : 'Publish post'}
                                </Button>
                            </div>
                        </div>
                    </form>
                )}

                <div className="flex max-h-[calc(100vh-220px)] flex-col rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Sparkles className="size-4" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                    {manageable
                                        ? 'Recent announcements'
                                        : 'Latest announcements'}
                                </div>
                                <div className="text-xs text-muted-foreground dark:text-sidebar-foreground/70">
                                    {announcements.length}{' '}
                                    {announcements.length === 1
                                        ? 'post'
                                        : 'posts'}
                                </div>
                            </div>
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
                    <div
                        className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]"
                        style={{
                            scrollbarGutter: 'stable',
                        }}
                    >
                        {announcements.length === 0 ? (
                            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-sidebar-border/70 bg-sidebar/40 p-6 text-center text-sm text-muted-foreground dark:text-sidebar-foreground/70">
                                {manageable
                                    ? 'No announcements yet. Create your first post above.'
                                    : 'No announcements available.'}
                            </div>
                        ) : (
                            announcements.map((announcement) => (
                                <article
                                    key={announcement.uuid}
                                    className="group overflow-hidden rounded-2xl border border-sidebar-border/70 bg-sidebar/30 p-4 transition hover:border-primary/40 hover:bg-sidebar/40 dark:bg-sidebar/60 dark:hover:bg-sidebar/70"
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

            {selectedAnnouncement && (
                <AnnouncementModal
                    announcement={selectedAnnouncement}
                    open={!!selectedAnnouncement}
                    onOpenChange={(open) =>
                        !open && setSelectedAnnouncement(null)
                    }
                />
            )}

            {manageable && (
                <Dialog
                    open={!!editAnnouncement}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditAnnouncement(null);
                            handleEditImageFile(null);
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit announcement</DialogTitle>
                        </DialogHeader>
                        {editAnnouncement && (
                            <form
                                onSubmit={submitEdit}
                                className="mt-2 space-y-4"
                            >
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                            Title
                                        </Label>
                                        <span className="text-[11px] tabular-nums text-muted-foreground/70">
                                            {form.title.length}/200
                                        </span>
                                    </div>
                                    <Input
                                        value={form.title}
                                        maxLength={200}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                title: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                            Body
                                        </Label>
                                        <span className="text-[11px] tabular-nums text-muted-foreground/70">
                                            {form.body.length}/400
                                        </span>
                                    </div>
                                    <textarea
                                        value={form.body}
                                        maxLength={400}
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
                                        {shownEditPreview ? (
                                            <img
                                                src={shownEditPreview}
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
                                                    handleEditImageFile(
                                                        e.target.files?.[0] ??
                                                            null,
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>
                                </div>
                                {(!scope || scope.mode === 'full') && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                                Scope
                                            </Label>
                                            <select
                                                value={form.scope}
                                                onChange={(e) =>
                                                    handleScopeChange(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                            >
                                                <option value="system">
                                                    System wide
                                                </option>
                                                <option value="class">
                                                    Class wide
                                                </option>
                                                <option value="section">
                                                    Section wide
                                                </option>
                                            </select>
                                        </div>
                                        {form.scope === 'class' &&
                                            scope?.mode === 'full' && (
                                                <div className="grid gap-2">
                                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                                        Class section
                                                    </Label>
                                                    <select
                                                        value={
                                                            form.class_section_uuid
                                                        }
                                                        onChange={(e) =>
                                                            setForm({
                                                                ...form,
                                                                class_section_uuid:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                                    >
                                                        <option value="">
                                                            Select class section
                                                        </option>
                                                        {scope.classSections.map(
                                                            (section) => (
                                                                <option
                                                                    key={
                                                                        section.uuid
                                                                    }
                                                                    value={
                                                                        section.uuid
                                                                    }
                                                                >
                                                                    {
                                                                        section.name
                                                                    }
                                                                    {section.grade_level
                                                                        ? ` (${section.grade_level})`
                                                                        : ''}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                            )}
                                        {form.scope === 'section' &&
                                            scope?.mode === 'full' && (
                                                <div className="grid gap-2">
                                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                                        Section name
                                                    </Label>
                                                    <select
                                                        value={form.section_name}
                                                        onChange={(e) =>
                                                            setForm({
                                                                ...form,
                                                                section_name:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                                    >
                                                        <option value="">
                                                            Select section
                                                        </option>
                                                        {scope.sectionNames.map(
                                                            (sectionName) => (
                                                                <option
                                                                    key={
                                                                        sectionName
                                                                    }
                                                                    value={
                                                                        sectionName
                                                                    }
                                                                >
                                                                    {
                                                                        sectionName
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                            )}
                                    </>
                                )}
                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button
                                            variant="secondary"
                                            type="button"
                                        >
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
                                        {editSaving
                                            ? 'Saving…'
                                            : 'Save changes'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            )}

            {manageable && (
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
            )}
        </>
    );
}
