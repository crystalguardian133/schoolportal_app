import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';
import { registerSW } from 'virtual:pwa-register';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type PwaContextType = {
    isStandalone: boolean;
    canInstall: boolean;
    promptInstall: () => Promise<void>;
    offlineReady: boolean;
    needRefresh: boolean;
    updateSW: (reloadPage?: boolean) => Promise<void> | undefined;
    dismissReady: () => void;
    dismissRefresh: () => void;
};

const PwaContext = createContext<PwaContextType | null>(null);

export function PwaProvider({ children }: { children: ReactNode }) {
    const [isStandalone, setIsStandalone] = useState(false);
    const [installPrompt, setInstallPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [offlineReady, setOfflineReady] = useState(false);
    const [needRefresh, setNeedRefresh] = useState(false);
    const updateSWRef = useRef<PwaContextType['updateSW']>(undefined);

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        updateSWRef.current = registerSW({
            immediate: true,
            onOfflineReady: () => setOfflineReady(true),
            onNeedRefresh: () => setNeedRefresh(true),
            onRegisterError: () => {},
        });
    }, []);

    const updateSW = useCallback(
        (reloadPage?: boolean) => updateSWRef.current?.(reloadPage),
        [],
    );

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mql = window.matchMedia('(display-mode: standalone)');
        const standaloneInApp =
            'standalone' in window.navigator &&
            (window.navigator as { standalone?: boolean }).standalone === true;

        const update = () => {
            const forced = new URLSearchParams(window.location.search).has('pwa');
            setIsStandalone(mql.matches || standaloneInApp || forced);
        };

        update();
        mql.addEventListener('change', update);

        return () => mql.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const handler = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const promptInstall = useCallback(async () => {
        if (!installPrompt) {
            return;
        }

        await installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
    }, [installPrompt]);

    const dismissReady = useCallback(() => setOfflineReady(false), []);
    const dismissRefresh = useCallback(() => setNeedRefresh(false), []);

    return (
        <PwaContext.Provider
            value={{
                isStandalone,
                canInstall: Boolean(installPrompt),
                promptInstall,
                offlineReady,
                needRefresh,
                updateSW,
                dismissReady,
                dismissRefresh,
            }}
        >
            {children}
        </PwaContext.Provider>
    );
}

export function usePwa(): PwaContextType {
    const context = useContext(PwaContext);

    if (!context) {
        throw new Error('usePwa must be used within a PwaProvider');
    }

    return context;
}
