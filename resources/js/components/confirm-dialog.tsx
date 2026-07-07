import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
};

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'destructive',
    onConfirm,
    onOpenChange,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogTitle>{title}</DialogTitle>
                {description ? (
                    <DialogDescription>{description}</DialogDescription>
                ) : null}
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" type="button">
                            {cancelLabel}
                        </Button>
                    </DialogClose>
                    <Button variant={variant} onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
