import { useEffect, useState } from 'react';

type ToastProps = {
    message?: string | null;
    type?: 'success' | 'error' | 'info';
    onClose?: () => void;
    ttl?: number;
    link?: string | null;
    linkLabel?: string;
};

export default function Toast({ message, type = 'success', onClose, ttl = 3000, link, linkLabel = 'View' }: ToastProps) {
    const [visible, setVisible] = useState(!!message);
    const clickable = !!link;

    useEffect(() => {
        setVisible(!!message);
        if (!message) return;
        const t = setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, ttl);
        return () => clearTimeout(t);
    }, [message, ttl, onClose]);

    if (!message) return null;

    const goto = () => {
        if (link) {
            window.location.href = link;
        }
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 transform-gpu transition-all duration-300 ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
        >
            <div
                role={clickable ? 'link' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? goto : undefined}
                onKeyDown={clickable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goto();
                    }
                } : undefined}
                className={`flex w-80 max-w-[calc(100vw-3rem)] cursor-${clickable ? 'pointer' : 'default'} items-start gap-4 rounded-lg bg-white/90 p-4 text-left shadow-lg backdrop-blur-md transition hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 ${
                    clickable ? 'ring-1 ring-primary/40' : ''
                }`}
            >
                <div className="flex-shrink-0">
                    {type === 'success' ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth="1.5">
                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth="1.5">
                                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-sidebar-foreground dark:text-white">{type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice'}</div>
                    <div className="mt-1 text-sm text-muted-foreground dark:text-gray-200">{message}</div>
                    {clickable ? (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {linkLabel}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    ) : null}
                </div>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setVisible(false);
                        onClose?.();
                    }}
                    className="ml-2 flex-shrink-0 rounded bg-transparent px-2 py-1 text-muted-foreground hover:text-sidebar-foreground dark:text-gray-200 dark:hover:text-white"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
