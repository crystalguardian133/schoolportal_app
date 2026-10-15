import { createInertiaApp } from '@inertiajs/react';
import { useEffect } from 'react';
import { PwaBanners } from '@/components/pwa/pwa-banners';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AnnouncementsProvider } from '@/contexts/announcements-context';
import { MusicPlayerProvider } from '@/contexts/music-player-context';
import { PwaProvider } from '@/contexts/pwa-context';
import { initializeTheme } from '@/hooks/use-appearance';
import {
    initializePreferences,
    syncServerPreferences,
} from '@/hooks/use-preferences';
import AppLayout from '@/layouts/app-layout';
import LoginLayout from '@/layouts/auth/login-top-header-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    pages: './pages',
    layout: (name) => {
        switch (true) {
            case name === 'auth/login':
                return LoginLayout;
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app, { page }) {
        const props = page.props as {
            auth?: {
                user?: { uuid?: string; role?: string | null } | null;
                permissions?: string[];
            };
            unreadAnnouncementsCount?: number;
            preferences?: unknown;
        };
        const authUser = props.auth?.user;
        const permissions = props.auth?.permissions ?? [];
        const canUseMusic = permissions.includes('access music player');

        return (
            <PreferencesSync
                server={props.preferences}
                userUuid={authUser?.uuid ?? null}
            >
                <PwaProvider>
                <MusicPlayerProvider canUseMusic={canUseMusic}>
                    <TooltipProvider delayDuration={0}>
                        <AnnouncementsProvider
                            initialUnreadCount={props.unreadAnnouncementsCount}
                            initialUrl={page.url}
                            role={authUser?.role ?? null}
                            authenticated={!!authUser}
                        >
                            {app}
                            <Toaster />
                            <PwaBanners />
                        </AnnouncementsProvider>
                    </TooltipProvider>
                </MusicPlayerProvider>
            </PwaProvider>
            </PreferencesSync>
        );
    },
    progress: {
        color: '#4B5563',
        delay: 500,
        showSpinner: false,
    },
});

// Merges server (per-account) prefs on sign-in/user-switch only. Guests keep
// device-local prefs; everyday navigation never clobbers unsaved edits.
function PreferencesSync({
    server,
    userUuid,
    children,
}: {
    server: unknown;
    userUuid: string | null;
    children: React.ReactNode;
}) {
    useEffect(() => {
        if (userUuid) {
            syncServerPreferences(server);
        }
        // Intentionally keyed on identity only (see above).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userUuid]);

    return <>{children}</>;
}

// This will set light / dark mode on load...
initializeTheme();

// ...and apply saved webpage customization pre-paint (device-local copy;
// server copy merges in via PreferencesSync once React mounts).
initializePreferences();
