import { Bell, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export function PwaPushBanner() {
    const { supported, pushEnabled, enabled, denied, isBusy, enable } =
        usePushNotifications();
    const [dismissed, setDismissed] = useState(false);

    const visible =
        supported &&
        pushEnabled &&
        !enabled &&
        !denied &&
        !dismissed &&
        !isBusy;

    if (!visible) {
        return null;
    }

    const handleEnable = async () => {
        const success = await enable();

        if (success) {
            setDismissed(true);
            toast.success('Notifications enabled. You will be alerted about new announcements.');
        } else if (
            typeof Notification !== 'undefined' &&
            Notification.permission === 'denied'
        ) {
            setDismissed(true);
            toast.error('Notifications are blocked. Allow them in your browser settings.');
        }
    };

    return (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
            <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-popover p-3 shadow-lg">
                <Bell className="size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Enable notifications</p>
                    <p className="text-xs text-muted-foreground">
                        Get alerted about new announcements, even when the app
                        is closed.
                    </p>
                </div>
                <Button size="sm" onClick={handleEnable} className="shrink-0">
                    Allow
                </Button>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    aria-label="Dismiss"
                    className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}