import { useSyncExternalStore } from 'react';
import { usePreferences } from '@/hooks/use-preferences';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const isDarkMode = (appearance: Appearance): boolean => {
    return appearance === 'dark' || (appearance === 'system' && prefersDark());
};

export function initializeTheme(): void {
    // Theme is now applied through the preferences system so it syncs
    // across devices for the same account. initializePreferences handles
    // applying the stored value; call it from app.tsx instead.
}

export function useAppearance(): UseAppearanceReturn {
    const { preferences, updatePreferences } = usePreferences();

    const appearance: Appearance = (preferences.appearance as Appearance) ?? 'system';
    const resolvedAppearance: ResolvedAppearance = isDarkMode(appearance)
        ? 'dark'
        : 'light';

    const updateAppearance = (mode: Appearance): void => {
        updatePreferences({ appearance: mode });
    };

    return { appearance, resolvedAppearance, updateAppearance } as const;
}
