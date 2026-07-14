import { Head } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { PortalPageShell } from '@/components/portal-page-shell';

type Props = {
    student: {
        name: string;
        lrn: string | null;
        section: string | null;
        gradeLevel: string | null;
        qrToken: string;
    } | null;
};

export default function StudentQrCode({ student }: Props) {
    if (!student) {
        return (
            <>
                <Head title="My QR Code" />
                <PortalPageShell title="My QR Code">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-10 text-center text-sm text-muted-foreground shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        No student profile found.
                    </div>
                </PortalPageShell>
            </>
        );
    }

    return (
        <>
            <Head title="My QR Code" />
            <PortalPageShell
                title="My QR Code"
                description="Show this QR code to your teacher during attendance."
            >
                <div className="mx-auto max-w-md">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-8 text-center shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <h2 className="text-xl font-semibold">{student.name}</h2>
                        <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                            {student.lrn && <p>LRN: {student.lrn}</p>}
                            {student.section && <p>Section: {student.section}</p>}
                            {student.gradeLevel && <p>Grade: {student.gradeLevel}</p>}
                        </div>

                        <div className="mt-6 inline-block rounded-xl border border-border bg-white p-4">
                            <QRCodeSVG value={student.qrToken} size={220} />
                        </div>

                        <p className="mt-4 text-xs text-muted-foreground">
                            Present this QR code to your teacher when they scan for attendance.
                        </p>
                    </div>
                </div>
            </PortalPageShell>
        </>
    );
}
