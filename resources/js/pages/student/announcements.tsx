import { Head, usePage } from '@inertiajs/react';
import {
    AnnouncementBoard
    
} from '@/components/announcements/announcement-board';
import type {BoardAnnouncement} from '@/components/announcements/announcement-board';
import { StudentPageShell } from '@/components/student-page-shell';

export default function Announcements() {
    const { props } = usePage<{
        announcements?: BoardAnnouncement[];
        sort?: string;
    }>();
    const announcements = props.announcements || [];
    const sort = props.sort || 'latest';

    return (
        <>
            <Head title="Announcements" />
            <StudentPageShell
                title="Announcements"
                description="Read school notices, reminders, schedule updates, and important alerts."
            >
                <AnnouncementBoard
                    announcements={announcements}
                    sort={sort}
                    basePath="/student/announcements"
                    manageable={false}
                />
            </StudentPageShell>
        </>
    );
}
