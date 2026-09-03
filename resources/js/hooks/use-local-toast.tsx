import { router } from '@inertiajs/react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

type LocalToastPayload = {
    message: string;
    type?: 'success' | 'error' | 'info';
    link?: string | null;
    linkLabel?: string;
    ttl?: number;
};

function ToastIcon({ type }: { type: Exclude<LocalToastPayload['type'], undefined> }) {
    if (type === 'error') {
        return <XCircle className="size-5 text-red-500" strokeWidth={2} />;
    }

    if (type === 'info') {
        return <Info className="size-5 text-sky-500" strokeWidth={2} />;
    }

    return <CheckCircle2 className="size-5 text-emerald-500" strokeWidth={2} />;
}

function ToastContent({ payload }: { payload: LocalToastPayload }) {
    const type = payload.type ?? 'success';

    return (
        <div className="flex w-full items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
                <ToastIcon type={type} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-foreground">
                    {payload.message}
                </p>
                {payload.link ? (
                    <a
                        href={payload.link}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                        {payload.linkLabel ?? 'View'}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="size-3"
                            strokeWidth="2.5"
                        >
                            <path
                                d="M9 6l6 6-6 6"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </a>
                ) : null}
            </div>
        </div>
    );
}

export function useLocalToast(): void {
    useEffect(() => {
        function show(detail: LocalToastPayload) {
            const type = detail.type ?? 'success';
            const duration = detail.ttl ?? (type === 'error' ? 5000 : 3200);

            toast(
                <ToastContent payload={{ ...detail, type }} />,
                {
                    duration,
                },
            );
        }

        function handler(event: Event) {
            const detail = (event as CustomEvent).detail as
                | LocalToastPayload
                | undefined;

            if (!detail?.message) {
                return;
            }

            show(detail);
        }

        window.addEventListener('local-toast', handler as EventListener);

        const flashHandler = router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const toastData = flash?.toast as
                | { type: 'success' | 'error' | 'info'; message: string }
                | undefined;

            if (toastData?.message) {
                show(toastData);

                return;
            }

            if (flash?.success) {
                show({ type: 'success', message: flash.success });
            } else if (flash?.error) {
                show({ type: 'error', message: flash.error });
            }
        });

        return () => {
            window.removeEventListener(
                'local-toast',
                handler as EventListener,
            );
            flashHandler();
        };
    }, []);
}