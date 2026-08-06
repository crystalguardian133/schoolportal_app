import { Download, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePwa } from '@/contexts/pwa-context';

export function PwaBanners() {
    const {
        canInstall,
        isStandalone,
        promptInstall,
        offlineReady,
        needRefresh,
        updateSW,
        dismissRefresh,
        dismissReady,
    } = usePwa();
    const [installDismissed, setInstallDismissed] = useState(false);

    useEffect(() => {
        if (offlineReady) {
            toast('Ready to work offline', {
                description:
                    'The portal has been saved on this device and will still open without a connection.',
                duration: 6000,
            });
            dismissReady();
        }
    }, [offlineReady, dismissReady]);

    if (needRefresh) {
        return (
            <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
                <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-popover p-3 shadow-lg">
                    <RefreshCw className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Update available</p>
                        <p className="text-xs text-muted-foreground">
                            A new version of the portal is ready to install.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => updateSW?.(true)}
                        className="shrink-0"
                    >
                        Reload
                    </Button>
                    <button
                        type="button"
                        onClick={dismissRefresh}
                        aria-label="Dismiss"
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>
        );
    }

    if (canInstall && !isStandalone && !installDismissed) {
        return (
            <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
                <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-popover p-3 shadow-lg">
                    <Download className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Install DNHS Portal</p>
                        <p className="text-xs text-muted-foreground">
                            Add it to your home screen for the full app
                            experience.
                        </p>
                    </div>
                    <Button size="sm" onClick={promptInstall} className="shrink-0">
                        Install
                    </Button>
                    <button
                        type="button"
                        onClick={() => setInstallDismissed(true)}
                        aria-label="Dismiss"
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
