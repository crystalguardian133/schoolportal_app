import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePlus, Link2, Sparkles, Paperclip } from 'lucide-react';

type AnnouncementRow = {
    uuid: string;
    title: string;
    body: string;
    scope: 'system' | 'class' | 'section';
    target_label: string;
    created_by?: string | null;
    created_at?: string | null;
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
}: {
    announcements?: AnnouncementRow[];
    classSections?: ClassSectionRow[];
    sectionNames?: string[];
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

    useEffect(() => {
        if (!imageFile) {
            setImagePreview(null);
            return;
        }

        const previewUrl = URL.createObjectURL(imageFile);
        setImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [imageFile]);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(new CustomEvent('local-toast', { detail: { message, type } }));
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
                setForm({ title: '', body: '', scope: 'system', class_section_uuid: '', section_name: '' });
                setImageFile(null);
                router.reload();
            },
            onError: (errors) => {
                const firstError = Object.values(errors || {})[0];
                showToast((firstError as string) || 'Unable to create announcement.', 'error');
            },
        });
    }

    return (
        <>
            <Head title="Announcements" />
            <PortalPageShell title="Announcements" description="Create system-wide, class-wide, or section-wide announcements.">
                <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
                    <form onSubmit={submit} className="rounded-[28px] border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                            <Sparkles className="size-4 text-amber-500" />
                            Create Announcement
                        </div>

                        <div className="space-y-3">
                            <div className="grid gap-2">
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">Title</Label>
                                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">Post</Label>
                                    <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">reddit-style editor</span>
                                </div>
                                <textarea
                                    value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                                    rows={9}
                                    className="w-full rounded-[20px] border border-border bg-background px-4 py-4 text-sm leading-6 outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    placeholder="Share the announcement details here..."
                                />
                            </div>

                            <div className="rounded-[22px] border border-dashed border-sidebar-border/80 bg-sidebar/30 p-4 dark:bg-sidebar/70">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-medium text-foreground dark:text-sidebar-foreground">Cover image</div>
                                        <div className="mt-1 text-xs text-muted-foreground dark:text-sidebar-foreground/70">Upload one image to attach to the announcement.</div>
                                    </div>
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sidebar-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:bg-sidebar dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/70">
                                        <ImagePlus className="size-4" />
                                        <span>Choose image</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                                    </label>
                                </div>

                                {imagePreview ? (
                                    <div className="mt-4 overflow-hidden rounded-[18px] border border-sidebar-border/70 bg-background">
                                        <img src={imagePreview} alt="Announcement preview" className="h-56 w-full object-cover" />
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
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">Scope</Label>
                                <select
                                    value={form.scope}
                                    onChange={(e) => setForm({ ...form, scope: e.target.value, class_section_uuid: '', section_name: '' })}
                                    className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                                >
                                    <option value="system">System wide</option>
                                    <option value="class">Class wide</option>
                                    <option value="section">Section wide</option>
                                </select>
                            </div>

                            {form.scope === 'class' ? (
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">Class section</Label>
                                    <select
                                        value={form.class_section_uuid}
                                        onChange={(e) => setForm({ ...form, class_section_uuid: e.target.value })}
                                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    >
                                        <option value="">Select class section</option>
                                        {classSections.map((section) => (
                                            <option key={section.uuid} value={section.uuid}>{section.name}{section.grade_level ? ` (${section.grade_level})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            {form.scope === 'section' ? (
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">Section name</Label>
                                    <select
                                        value={form.section_name}
                                        onChange={(e) => setForm({ ...form, section_name: e.target.value })}
                                        className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                                    >
                                        <option value="">Select section</option>
                                        {sectionNames.map((sectionName) => (
                                            <option key={sectionName} value={sectionName}>{sectionName}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={saving || !form.title.trim() || !form.body.trim()} className="gap-2 rounded-full px-5">
                                    <Paperclip className="size-4" />
                                    {saving ? 'Publishing…' : 'Publish post'}
                                </Button>
                            </div>
                        </div>
                    </form>

                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="mb-3 text-sm font-semibold text-foreground dark:text-sidebar-foreground">Recent announcements</div>
                        <div className="space-y-3">
                            {announcements.length === 0 ? (
                                <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar/40 p-4 text-sm text-muted-foreground dark:text-sidebar-foreground/70">
                                    No announcements yet.
                                </div>
                            ) : announcements.map((announcement) => (
                                <article key={announcement.uuid} className="overflow-hidden rounded-2xl border border-sidebar-border/70 bg-sidebar/30 p-4 dark:bg-sidebar/60">
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
                                    {announcement.image_url ? (
                                        <div className="mt-3 overflow-hidden rounded-[18px] border border-sidebar-border/70 bg-background">
                                            <img src={announcement.image_url} alt={announcement.title} className="max-h-80 w-full object-cover" />
                                        </div>
                                    ) : null}
                                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground dark:text-sidebar-foreground">
                                        {announcement.body}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </PortalPageShell>
        </>
    );
}
