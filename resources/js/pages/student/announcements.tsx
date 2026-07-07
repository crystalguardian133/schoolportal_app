import { Head, usePage, router } from '@inertiajs/react';
import { Megaphone, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnnouncementModal } from '@/components/announcement-modal';
import { StudentPageShell } from '@/components/student-page-shell';
import { useAnnouncementRealtime } from '@/hooks/use-announcement-realtime';

type AnnouncementRow = {
    uuid: string;
    title: string;
    body: string;
    scope: 'system' | 'class' | 'section';
    target_label: string;
    created_by?: string | null;
    created_at?: string | null;
    image_url?: string | null;
};

export default function Announcements() {
    const { props } = usePage<{ announcements?: AnnouncementRow[]; sort?: string }>();
    const announcements = props.announcements || [];
    const sort = props.sort || 'latest';
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementRow | null>(null);
    const [currentSort, setCurrentSort] = useState(sort);

    const { unreadCount, markAsRead } = useAnnouncementRealtime(() => {
        router.reload({ only: ['announcements'], preserveState: true });
    });

    useEffect(() => {
        setCurrentSort(sort);
    }, [sort]);

    function handleSortChange(nextSort: string) {
        setCurrentSort(nextSort);
        router.get('/student/announcements', { sort: nextSort }, { preserveState: true, preserveScroll: true });
    }

    return (
        <>
            <Head title="Announcements" />
            <StudentPageShell
                title="Announcements"
                description="Read school notices, reminders, schedule updates, and important alerts."
            >
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <Megaphone className="size-5 text-amber-600" />
                            <h2 className="text-lg font-semibold">Latest announcements</h2>
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
                            </article>
                        ))}
                    </div>
                </section>
            </StudentPageShell>

            {selectedAnnouncement && (
                <AnnouncementModal
                    announcement={selectedAnnouncement}
                    open={!!selectedAnnouncement}
                    onOpenChange={(open) => !open && setSelectedAnnouncement(null)}
                />
            )}
        </>
    );
}
