import { Head, usePage } from '@inertiajs/react';
import { PortalPageShell } from '@/components/portal-page-shell';

type AuditRow = {
    id: number;
    user_uuid?: string | null;
    student_uuid: string;
    subject_uuid?: string | null;
    school_year?: string | null;
    action: string;
    metadata?: Record<string, any> | null;
    created_at: string;
};

export default function AdminEnrollmentAudits() {
    const { props } = usePage();
    const auditsProp = props.audits || {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    };
    const audits: AuditRow[] = auditsProp.data || [];

    return (
        <>
            <Head title="Enrollment Audits" />
            <PortalPageShell
                title="Enrollment Audits"
                description="Read-only log of enrollment activity."
            >
                <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="mb-3 text-sm text-muted-foreground">
                        Total logs: {auditsProp.total ?? 0}
                    </div>
                    <div className="overflow-auto rounded border border-sidebar-border/70">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        ID
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Action
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Student UUID
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Subject UUID
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        School Year
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Metadata
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Created
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                {audits.map((audit) => (
                                    <tr
                                        key={audit.id}
                                        className="hover:bg-sidebar-accent/40"
                                    >
                                        <td className="px-4 py-3">
                                            {audit.id}
                                        </td>
                                        <td className="px-4 py-3">
                                            {audit.action}
                                        </td>
                                        <td className="px-4 py-3 break-all">
                                            {audit.student_uuid}
                                        </td>
                                        <td className="px-4 py-3 break-all">
                                            {audit.subject_uuid ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {audit.school_year ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 break-all text-muted-foreground">
                                            {audit.metadata
                                                ? JSON.stringify(audit.metadata)
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {audit.created_at}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PortalPageShell>
        </>
    );
}
