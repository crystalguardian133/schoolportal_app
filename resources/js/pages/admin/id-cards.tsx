import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode } from 'lucide-react';

type UserRow = {
    uuid: string;
    student_id?: string | null;
    lrn?: string | null;
    name: string;
    section?: string | null;
    grade_level?: string | null;
    profile_picture?: string | null;
    email?: string | null;
};

export default function AdminIdCards() {
    const { props } = usePage();
    const usersProp = props.users || {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    };
    const users: UserRow[] = usersProp.data || [];
    const filters = props.filters || { type: 'student', q: '', per_page: 50 };

    const [search, setSearch] = useState(filters.q);
    const [type, setType] = useState(filters.type);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(
            '/admin/id-cards',
            { type, q: search, per_page: 50 },
            { preserveState: true },
        );
    }

    function printCards() {
        const printContent = document.getElementById('id-cards-print');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ID Cards</title>
                <style>
                    @page { size: letter; margin: 0.5in; }
                    body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
                    .print-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5in; }
                    .id-card { 
                        border: 2px solid #000; 
                        border-radius: 8px; 
                        padding: 16px; 
                        height: 2.5in; 
                        box-sizing: border-box;
                        page-break-inside: avoid;
                    }
                    .id-card-header { 
                        text-align: center; 
                        font-size: 10px; 
                        font-weight: bold; 
                        border-bottom: 1px solid #ccc; 
                        padding-bottom: 8px; 
                        margin-bottom: 8px;
                    }
                    .id-card-content { display: flex; gap: 12px; }
                    .id-card-photo { 
                        width: 60px; 
                        height: 70px; 
                        background: #eee; 
                        border-radius: 4px; 
                        flex-shrink: 0;
                        overflow: hidden;
                    }
                    .id-card-photo img { width: 100%; height: 100%; object-fit: cover; }
                    .id-card-info { flex: 1; font-size: 11px; }
                    .id-card-info div { margin-bottom: 4px; }
                    .id-card-label { font-weight: 600; color: #555; }
                    @media print {
                        .no-print { display: none !important;
                    }
                </style>
            </head>
            <body>
                <div class="print-container">${printContent.innerHTML}</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }

    return (
        <>
            <Head title="ID Cards" />
            <PortalPageShell
                title="ID Cards"
                description="Generate and print student and staff ID cards."
            >
                <div className="no-print mb-4 flex items-center justify-between gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="rounded-md border bg-transparent px-3 py-2 text-sm"
                        >
                            <option value="student">Students</option>
                            <option value="staff">Staff/Teachers</option>
                        </select>
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-48"
                        />
                        <Button type="submit" size="sm">
                            Search
                        </Button>
                    </form>
                    <Button onClick={printCards} size="sm" variant="outline">
                        <QrCode className="mr-2 h-4 w-4" />
                        Print ID Cards
                    </Button>
                </div>

                <div
                    id="id-cards-print"
                    className="grid max-w-3xl grid-cols-2 gap-4"
                >
                    {users.map((user) => (
                        <div
                            key={user.uuid}
                            className="id-card rounded-lg border border-gray-300 p-3"
                        >
                            <div className="id-card-header mb-2 border-b border-gray-200 pb-1 text-center text-xs font-bold">
                                SCHOOL ID CARD
                            </div>
                            <div className="id-card-content flex gap-3">
                                <div className="id-card-photo h-20 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-200">
                                    {user.profile_picture ? (
                                        <img
                                            src={`/assets/profile_pictures/${user.profile_picture.split('/')[1] || 'students'}/${user.profile_picture.split('/').pop()}`}
                                            alt={user.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-gray-500">
                                            No Photo
                                        </div>
                                    )}
                                </div>
                                <div className="id-card-info flex-1 text-xs">
                                    <div className="mb-1">
                                        <span className="font-semibold">
                                            Name:
                                        </span>{' '}
                                        {user.name}
                                    </div>
                                    {user.student_id && (
                                        <div className="mb-1">
                                            <span className="font-semibold">
                                                ID:
                                            </span>{' '}
                                            {user.student_id}
                                        </div>
                                    )}
                                    {user.lrn && (
                                        <div className="mb-1">
                                            <span className="font-semibold">
                                                LRN:
                                            </span>{' '}
                                            {user.lrn}
                                        </div>
                                    )}
                                    {user.section && (
                                        <div className="mb-1">
                                            <span className="font-semibold">
                                                Section:
                                            </span>{' '}
                                            {user.section}
                                        </div>
                                    )}
                                    {user.grade_level && (
                                        <div className="mb-1">
                                            <span className="font-semibold">
                                                Grade:
                                            </span>{' '}
                                            {user.grade_level}
                                        </div>
                                    )}
                                    {user.email && (
                                        <div className="mb-1">
                                            <span className="font-semibold">
                                                Email:
                                            </span>{' '}
                                            {user.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PortalPageShell>
        </>
    );
}
