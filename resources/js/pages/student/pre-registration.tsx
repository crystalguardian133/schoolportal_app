import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { StudentPageShell } from '@/components/student-page-shell';

export default function PreRegistration() {
    return (
        <>
            <Head title="Pre-registration" />
            <StudentPageShell
                title="Pre-registration"
                description="Enrollment is completed on site, so this page only provides the downloadable enrollment form."
            >
                <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-center gap-3">
                        <Download className="size-5 text-sky-600" />
                        <h2 className="text-lg font-semibold">
                            Download Enrollment Form
                        </h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Please download, print, and bring this form during
                        on-site enrollment.
                    </p>

                    <a
                        href="/enrollment-form.html"
                        download
                        className="mt-5 inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                    >
                        Download Enrollment Form
                    </a>
                </section>
            </StudentPageShell>
        </>
    );
}
