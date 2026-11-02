import { Head } from '@inertiajs/react';
import {
    AnnouncementBoard
    
    
} from '@/components/announcements/announcement-board';
import type {BoardAnnouncement, BoardSectionOption} from '@/components/announcements/announcement-board';
import { PortalPageShell } from '@/components/portal-page-shell';

type AdminAnnouncementsProps = {
    announcements?: BoardAnnouncement[];
    classSections?: BoardSectionOption[];
    sectionNames?: string[];
    sort?: string;
};

export default function AdminAnnouncements({
    announcements = [],
    classSections = [],
    sectionNames = [],
    sort = 'latest',
}: AdminAnnouncementsProps) {
    function notify(message: string, type: 'success' | 'error' = 'success') {
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

    return (
        <>
            <Head title="Announcements" />
            <PortalPageShell
                title="Announcements"
                description="Create system-wide, class-wide, or section-wide announcements."
            >
                <AnnouncementBoard
                    announcements={announcements}
                    sort={sort}
                    basePath="/admin/announcements"
                    manageable
                    scope={{ mode: 'full', classSections, sectionNames }}
                    notify={notify}
                />
            </PortalPageShell>
        </>
    );
}
