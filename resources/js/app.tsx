import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { MusicPlayerProvider } from '@/contexts/music-player-context';
import AppLayout from '@/layouts/app-layout';
import LoginPortalLayout from '@/layouts/auth/login-portal-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    pages: './pages',
    layout: (name) => {
        switch (true) {
            case name === 'auth/login':
                return LoginPortalLayout;
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
    withApp(app) {
        return (
            <MusicPlayerProvider>
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </MusicPlayerProvider>
        );
    },
    progress: {
        color: '#4B5563',
        delay: 500,
        showSpinner: false,
    },
});

// This will set light / dark mode on load...
initializeTheme();
