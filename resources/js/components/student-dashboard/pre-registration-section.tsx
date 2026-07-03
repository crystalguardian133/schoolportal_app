import { CalendarDays } from 'lucide-react';
import { SectionShell } from '@/components/student-dashboard/section-shell';

export function PreRegistrationSection() {
    return (
        <SectionShell
            id="pre-registration"
            title="Pre-registration"
            description="Review your subjects, submit requested documents, and confirm your enrollment details."
            icon={CalendarDays}
            iconClassName="size-5 text-sky-600"
            linkHref="/student/pre-registration"
            linkLabel="Open section"
            linkClassName="text-sky-700 hover:underline"
        />
    );
}
