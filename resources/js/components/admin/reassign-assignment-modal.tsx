import { router } from '@inertiajs/react';
import { ArrowRightLeft, School2, UserRound, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

function subjectLabel(subject) {
    return `${subject.name}${subject.code ? ` (${subject.code})` : ''}`;
}

export default function ReassignAssignmentModal({
    open,
    onOpenChange,
    teacher,
    sourceSubject,
    subjects,
    onReassigned,
}) {
    const [targetSubjectUuid, setTargetSubjectUuid] = useState('');
    const [processing, setProcessing] = useState(false);

    const availableSubjects = useMemo(
        () => subjects.filter((subject) => subject.uuid !== sourceSubject?.uuid),
        [sourceSubject?.uuid, subjects],
    );

    useEffect(() => {
        if (!open) {
            setTargetSubjectUuid('');
            setProcessing(false);

            return;
        }

        setTargetSubjectUuid(availableSubjects[0]?.uuid ?? '');
    }, [availableSubjects, open]);

    function handleConfirm() {
        if (!teacher || !sourceSubject || !targetSubjectUuid || processing) {
            return;
        }

        setProcessing(true);

        router.post(
            '/admin/assignments',
            {
                subject_uuid: targetSubjectUuid,
                teacher_uuid: teacher.uuid,
                reassign_from_subject_uuid: sourceSubject.uuid,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onReassigned(targetSubjectUuid);
                    onOpenChange(false);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <div className="mb-2 inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-muted text-foreground">
                        <ArrowRightLeft className="size-5" />
                    </div>
                    <DialogTitle>Reassign teacher</DialogTitle>
                    <DialogDescription>
                        Move this teacher to another subject and clear the current source assignment.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-xl border border-border bg-card p-2 text-muted-foreground">
                                <UserRound className="size-4" />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Teacher</div>
                                <div className="font-medium text-foreground">{teacher?.name ?? '—'}</div>
                                <div className="text-muted-foreground">{teacher?.email ?? ''}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-xl border border-border bg-card p-2 text-muted-foreground">
                                <School2 className="size-4" />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Current subject</div>
                                <div className="font-medium text-foreground">{sourceSubject ? subjectLabel(sourceSubject) : '—'}</div>
                                <div className="text-muted-foreground">Will be cleared after reassignment</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Reassign to subject
                        </label>
                        <select
                            value={targetSubjectUuid}
                            onChange={(e) => setTargetSubjectUuid(e.target.value)}
                            className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                            disabled={availableSubjects.length === 0}
                        >
                            {availableSubjects.length > 0 ? (
                                availableSubjects.map((subject) => (
                                    <option key={subject.uuid} value={subject.uuid}>
                                        {subjectLabel(subject)}
                                    </option>
                                ))
                            ) : (
                                <option value="">No available subjects</option>
                            )}
                        </select>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                            <Users className="size-4" />
                            Reassign summary
                        </div>
                        <p className="mt-2">
                            This will detach <span className="font-medium text-foreground">{teacher?.name ?? 'the teacher'}</span> from <span className="font-medium text-foreground">{sourceSubject ? subjectLabel(sourceSubject) : 'the current subject'}</span> and attach them to the selected subject.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleConfirm} disabled={processing || !targetSubjectUuid || availableSubjects.length === 0}>
                        <ArrowRightLeft className="mr-2 size-4" />
                        {processing ? 'Reassigning...' : 'Reassign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
