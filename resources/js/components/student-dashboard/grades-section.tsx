import { School2 } from 'lucide-react';
import { SectionShell } from '@/components/student-dashboard/section-shell';

export function GradesSection() {
    return (
        <SectionShell
            id="grades"
            title="Grades"
            description="View your latest grades, evaluation status, and class performance updates."
            icon={School2}
            iconClassName="size-5 text-violet-600"
            linkHref="/student/grades"
            linkLabel="View subjects"
            linkClassName="text-violet-700 hover:underline"
        />
    );
}
