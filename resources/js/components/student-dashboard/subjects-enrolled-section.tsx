import { BookOpenText } from 'lucide-react';
import { SectionShell } from '@/components/student-dashboard/section-shell';

export function SubjectsEnrolledSection() {
    return (
        <SectionShell
            id="subjects-enrolled"
            title="Subjects Enrolled"
            description="See the subjects assigned to your current grade level and enrollment record."
            icon={BookOpenText}
            iconClassName="size-5 text-emerald-600"
            linkHref="/student/subjects-enrolled"
            linkLabel="Back to top"
            linkClassName="text-emerald-700 hover:underline"
        />
    );
}
