import { Megaphone } from 'lucide-react';
import { SectionShell } from '@/components/student-dashboard/section-shell';
import { useAnnouncements } from '@/contexts/announcements-context';

type AnnouncementsSectionProps = {
    unseenCount: number;
};

export function AnnouncementsSection({
    unseenCount,
}: AnnouncementsSectionProps) {
    const { unread } = useAnnouncements();

    const displayCount = Math.max(unseenCount, unread);

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
