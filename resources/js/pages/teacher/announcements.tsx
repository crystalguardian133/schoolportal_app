import { Head, usePage } from '@inertiajs/react';
import { Megaphone } from 'lucide-react';
import { PortalPageShell } from '@/components/portal-page-shell';

type AnnouncementRow = {
    uuid: string;
    title: string;
    body: string;
    scope: 'system' | 'class' | 'section';
    target_label: string;
    created_by?: string | null;
    created_at?: string | null;
};

export default function TeacherAnnouncements() {
    const { props } = usePage<{ announcements?: AnnouncementRow[] }>();
    const announcements = props.announcements || [];

    return (
        <>
            <Head title="Announcements" />
            <PortalPageShell title="Announcements" description="View school notices and staff reminders.">
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-center gap-3">
                        <Megaphone className="size-5 text-amber-600" />
                        <h2 className="text-lg font-semibold">Staff Notices</h2>
                    </div>
                    <div className="mt-5 space-y-3">
                        {announcements.length === 0 ? (
                            <div className="rounded-xl border border-sidebar-border/70 px-4 py-3 text-sm text-muted-foreground dark:text-sidebar-foreground/70">
                                No announcements available.
                            </div>
                        ) : announcements.map((announcement) => (
                            <article key={announcement.uuid} className="rounded-xl border border-sidebar-border/70 px-4 py-3">
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
                            </article>
                        ))}
                    </div>
                </section>
            </PortalPageShell>
        </>
    );
}
