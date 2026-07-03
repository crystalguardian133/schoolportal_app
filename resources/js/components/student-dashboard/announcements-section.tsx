import { Megaphone } from 'lucide-react';
import { SectionShell } from '@/components/student-dashboard/section-shell';

export function AnnouncementsSection() {
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
