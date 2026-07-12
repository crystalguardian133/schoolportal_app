import { Megaphone } from 'lucide-react';
import { SectionShell } from '@/components/student-dashboard/section-shell';
import { useAnnouncementRealtime } from '@/hooks/use-announcement-realtime';

type AnnouncementsSectionProps = {
    unseenCount: number;
};

export function AnnouncementsSection({
    unseenCount,
}: AnnouncementsSectionProps) {
    const { unreadCount } = useAnnouncementRealtime();

    const displayCount = Math.max(unseenCount, unreadCount);

    return (
        <SectionShell
            id="announcements"
            title="Announcements"
            description={
                displayCount > 0
                    ? `${displayCount} unseen announcement${displayCount !== 1 ? 's' : ''}`
                    : 'No unread announcements'
            }
            icon={Megaphone}
            iconClassName="size-5 text-amber-600"
            linkHref="/student/announcements"
            linkLabel="View all"
            linkClassName="text-amber-700 hover:underline"
        />
    );
}
