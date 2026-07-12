import { Head } from '@inertiajs/react';
import { BookOpenText } from 'lucide-react';
import { StudentPageShell } from '@/components/student-page-shell';

type EnrolledSubject = {
    subjectName: string | null;
    subjectCode: string | null;
    timeSchedule: string | null;
    subjectTeacher: string | null;
};

type SubjectsPageProps = {
    student: {
        name: string;
        gradeLevel: string | null;
        section: string | null;
        schoolYear: string | null;
    } | null;
    currentSchoolYear: string | null;
    enrolledSubjects: EnrolledSubject[];
};

export default function SubjectsEnrolled({
    student,
    currentSchoolYear,
    enrolledSubjects,
}: SubjectsPageProps) {
    return (
        <>
            <Head title="Subjects Enrolled" />
            <StudentPageShell
                title="Subjects Enrolled"
                description="See the subjects assigned to the current student record and grade level."
            >
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-center gap-3">
                        <BookOpenText className="size-5 text-emerald-600" />
                        <h2 className="text-lg font-semibold">
                            Currently Enrolled Subjects
                        </h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        This table shows the currently enrolled subjects,
                        subject codes, time schedules, and subject teachers.
                    </p>

                    <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        {student
                            ? `${student.gradeLevel ?? 'Grade level not set'}${student.section ? ` Section ${student.section}` : ''}${currentSchoolYear ? ` · ${currentSchoolYear}` : ''}`
                            : 'No enrolled student record found.'}
                    </p>

                    <div className="table-scroll-container table-scroll-small mt-5 rounded-xl border border-sidebar-border/70">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Subject
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Subject Code
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Time Schedule
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Subject Teacher
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                {enrolledSubjects.length > 0 ? (
                                    enrolledSubjects.map((subject, index) => (
                                        <tr
                                            key={
                                                subject.subjectCode ??
                                                subject.subjectName ??
                                                `subject-${index}`
                                            }
                                            className="hover:bg-sidebar-accent/40"
                                        >
                                            <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                {subject.subjectName}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {subject.subjectCode}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {subject.timeSchedule}
                                            </td>
                                            <td className="px-4 py-3 text-sidebar-foreground">
                                                {subject.subjectTeacher}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            className="px-4 py-6 text-center text-muted-foreground"
                                            colSpan={4}
                                        >
                                            No enrolled subjects found for the
                                            current student.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </StudentPageShell>
        </>
    );
}
