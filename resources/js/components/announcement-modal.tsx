import { Megaphone } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { renderTextWithLinks } from '@/lib/linkify';

type AnnouncementRow = {
    uuid: string;
    title: string;
    body: string;
    scope: 'system' | 'class' | 'section';
    target_label: string;
    created_by?: string | null;
    created_at?: string | null;
    image_url?: string | null;
};

type AnnouncementModalProps = {
    announcement: AnnouncementRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function AnnouncementModal({
    announcement,
    open,
    onOpenChange,
}: AnnouncementModalProps) {
    if (!announcement) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Megaphone className="size-5 text-amber-600" />
                        <DialogTitle>{announcement.title}</DialogTitle>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                        {announcement.target_label}
                        {announcement.created_by
                            ? ` · by ${announcement.created_by}`
                            : ''}
                        {announcement.created_at
                            ? ` · ${announcement.created_at}`
                            : ''}
                    </div>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                    {announcement.image_url ? (
                        <div className="overflow-hidden rounded-xl border border-sidebar-border/70">
                            <img
                                src={announcement.image_url}
                                alt={announcement.title}
                                className="max-h-80 w-full object-cover"
                            />
                        </div>
                    ) : null}
                    <p className="text-sm leading-6 text-foreground dark:text-sidebar-foreground">
                        {renderTextWithLinks(announcement.body)}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
