import { usePage } from '@inertiajs/react';
import { Megaphone } from 'lucide-react';
import { SectionShell } from '@/components/student-dashboard/section-shell';
import { useAnnouncementRealtime } from '@/hooks/use-announcement-realtime';

export function AnnouncementsSection() {
    const { props } = usePage<{ announcements?: any[] }>();
    const announcements = props.announcements || [];

    useAnnouncementRealtime();

    return (
        <SectionShell
            id="announcements"
            title="Announcements"
            description="Check school announcements, reminders, and important schedule changes."
            icon={Megaphone}
            iconClassName="size-5 text-amber-600"
            linkHref="/student/announcements"
            linkLabel="Back to top"
            linkClassName="text-amber-700 hover:underline"
        />
    );
}
