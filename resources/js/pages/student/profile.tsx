import { Head } from '@inertiajs/react';
import { User, MapPin, School, Phone, Calendar, Hash } from 'lucide-react';
import { StudentPageShell } from '@/components/student-page-shell';

type Props = {
    student: {
        uuid: string;
        name: string;
        first_name: string | null;
        middle_name: string | null;
        last_name: string | null;
        lrn: string | null;
        student_id: string | null;
        grade_level: string | null;
        section: string | null;
        school_year: string | null;
        birthday: string | null;
        age: number | null;
        address: string | null;
        address_zone_street: string | null;
        address_barangay: string | null;
        address_municipality: string | null;
        address_province: string | null;
        contact_number: string | null;
        previous_school: string | null;
        last_school_year: string | null;
        last_grade_level: string | null;
    };
};

export default function StudentProfile({ student }: Props) {
    const formatAddress = () => {
        if (student.address) return student.address;
        
        const parts = [
            student.address_zone_street,
            student.address_barangay,
            student.address_municipality,
            student.address_province
        ].filter(Boolean);
        
        return parts.length > 0 ? parts.join(', ') : 'Not specified';
    };

    return (
        <>
            <Head title="My Profile" />
            <StudentPageShell title="My Profile">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="col-span-full md:col-span-2 lg:col-span-1 space-y-6">
                        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar text-center">
                            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                <User className="h-12 w-12" />
                            </div>
                            <h2 className="mt-4 text-xl font-bold">{student.name}</h2>
                            <p className="text-sm text-muted-foreground">{student.lrn ? `LRN: ${student.lrn}` : 'No LRN assigned'}</p>
                            
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {student.grade_level && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        Grade {student.grade_level}
                                    </span>
                                )}
                                {student.section && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        Section {student.section}
                                    </span>
                                )}
                                {student.school_year && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        S.Y. {student.school_year}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-full md:col-span-2 space-y-6">
                        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                                <User className="size-5 text-violet-600" />
                                Personal Information
                            </h3>
                            
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                                    <p className="mt-1 font-medium">{student.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Student ID / LRN</label>
                                    <p className="mt-1 font-medium">{student.student_id || student.lrn || '—'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="size-3.5" /> Date of Birth
                                    </label>
                                    <p className="mt-1 font-medium">{student.birthday || '—'} {student.age ? `(${student.age} yrs)` : ''}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Phone className="size-3.5" /> Contact Number
                                    </label>
                                    <p className="mt-1 font-medium">{student.contact_number || '—'}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <MapPin className="size-3.5" /> Address
                                    </label>
                                    <p className="mt-1 font-medium">{formatAddress()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                                <School className="size-5 text-emerald-600" />
                                Educational Background
                            </h3>
                            
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground">Previous School</label>
                                    <p className="mt-1 font-medium">{student.previous_school || '—'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Last Grade Level Completed</label>
                                    <p className="mt-1 font-medium">{student.last_grade_level || '—'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Last School Year</label>
                                    <p className="mt-1 font-medium">{student.last_school_year || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </StudentPageShell>
        </>
    );
}
