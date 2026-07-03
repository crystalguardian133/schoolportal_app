import { useEffect, useState } from 'react';

type ToastProps = {
    message?: string | null;
    type?: 'success' | 'error' | 'info';
    onClose?: () => void;
    ttl?: number;
};

export default function Toast({ message, type = 'success', onClose, ttl = 3000 }: ToastProps) {
    const [visible, setVisible] = useState(!!message);

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

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 transform-gpu transition-all duration-300 ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
        >
            <div className="flex items-start gap-4 rounded-lg bg-white/90 dark:bg-slate-800/80 p-4 shadow-lg backdrop-blur-md">
                <div className="flex-shrink-0">
                    {type === 'success' ? (
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-600 dark:text-green-200">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth="1.5">
                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center text-red-600 dark:text-red-200">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth="1.5">
                                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="min-w-0">
                    <div className="text-sm font-medium text-sidebar-foreground dark:text-white">{type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice'}</div>
                    <div className="mt-1 text-sm text-muted-foreground dark:text-gray-200">{message}</div>
                </div>

                <button
                    onClick={() => {
                        setVisible(false);
                        onClose?.();
                    }}
                    className="ml-4 rounded bg-transparent px-2 py-1 text-muted-foreground hover:text-sidebar-foreground dark:text-gray-200 dark:hover:text-white"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
