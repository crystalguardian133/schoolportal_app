import { School2 } from 'lucide-react';
import { SectionShell } from '@/components/student-dashboard/section-shell';

type GradesSectionProps = {
    averageGrade: number | null;
};

export function GradesSection({ averageGrade }: GradesSectionProps) {
    return (
        <SectionShell
            id="grades"
            title="Grades"
            description={
                averageGrade !== null
                    ? `Your average grade for the quarter is ${averageGrade}%`
                    : 'View your latest grades, evaluation status, and class performance updates.'
            }
            icon={School2}
            iconClassName="size-5 text-violet-600"
            linkHref="/student/grades"
            linkLabel="View subjects"
            linkClassName="text-violet-700 hover:underline"
        />
    );
}
