import { BookOpenText } from 'lucide-react';
import { SectionShell } from '@/components/student-dashboard/section-shell';

type SubjectsEnrolledSectionProps = {
    subjectsCount: number;
};

export function SubjectsEnrolledSection({
    subjectsCount,
}: SubjectsEnrolledSectionProps) {
    return (
        <SectionShell
            id="subjects-enrolled"
            title="Subjects Enrolled"
            description={`${subjectsCount} subject${subjectsCount !== 1 ? 's' : ''} enrolled`}
            icon={BookOpenText}
            iconClassName="size-5 text-emerald-600"
            linkHref="/student/subjects-enrolled"
            linkLabel="View list"
            linkClassName="text-emerald-700 hover:underline"
        />
    );
}
