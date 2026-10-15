import { useSyncExternalStore } from 'react';

export type AccentName =
    | 'default'
    | 'emerald'
    | 'violet'
    | 'amber'
    | 'rose'
    | 'slate'
    | 'custom';
export type SidebarPref = 'expanded' | 'collapsed' | 'remember';
export type DensityPref = 'comfortable' | 'compact';
export type FontScalePref = 's' | 'm' | 'l';
export type RadiusPref = 's' | 'm' | 'l';

export type WidgetPrefs = {
    section: string;
    hidden?: string[];
    order?: string[];
};

export type Preferences = {
    accent: AccentName;
    customAccent: string | null;
    radius: RadiusPref;
    reduceMotion: boolean;
    sidebar: SidebarPref;
    density: DensityPref;
    fontScale: FontScalePref;
    widgets: WidgetPrefs[];
};

export const DEFAULT_PREFERENCES: Preferences = {
    accent: 'default',
    customAccent: null,
    radius: 'm',
    reduceMotion: false,
    sidebar: 'remember',
    density: 'comfortable',
    fontScale: 'm',
    widgets: [],
};

type VarSet = Record<string, string>;

type AccentDef = {
    label: string;
    /** Dot color for the swatch UI. */
    dot: string;
    light: VarSet;
    dark: VarSet;
};

/**
 * Accent presets. Keys map 1:1 onto the app.css theme variables
 * (--primary -> --color-primary, etc.). `default` intentionally overrides
 * nothing so the shipped theme stays the source of truth.
 */
export const ACCENTS: Record<AccentName, AccentDef> = {
    default: { label: 'Default', dot: '#3f3f46', light: {}, dark: {} },
    custom: {
        label: 'Custom',
        dot: 'conic-gradient(#e11d48,#d97706,#059669,#2563eb,#7c3aed,#e11d48)',
        light: {},
        dark: {},
    },
    emerald: {
        label: 'Emerald',
        dot: '#059669',
        light: {
            '--primary': 'oklch(0.6 0.15 163)',
            '--primary-foreground': 'oklch(0.985 0 0)',
            '--ring': 'oklch(0.7 0.14 163)',
            '--sidebar-primary': 'oklch(0.6 0.15 163)',
            '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
            '--chart-1': 'oklch(0.6 0.15 163)',
        },
        dark: {
            '--primary': 'oklch(0.72 0.16 163)',
            '--primary-foreground': 'oklch(0.13 0.02 163)',
            '--ring': 'oklch(0.45 0.12 163)',
            '--sidebar-primary': 'oklch(0.72 0.16 163)',
            '--sidebar-primary-foreground': 'oklch(0.13 0.02 163)',
            '--chart-1': 'oklch(0.72 0.16 163)',
        },
    },
    violet: {
        label: 'Violet',
        dot: '#7c3aed',
        light: {
            '--primary': 'oklch(0.55 0.22 285)',
            '--primary-foreground': 'oklch(0.985 0 0)',
            '--ring': 'oklch(0.68 0.18 285)',
            '--sidebar-primary': 'oklch(0.55 0.22 285)',
            '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
            '--chart-1': 'oklch(0.55 0.22 285)',
        },
        dark: {
            '--primary': 'oklch(0.72 0.18 285)',
            '--primary-foreground': 'oklch(0.15 0.02 285)',
            '--ring': 'oklch(0.45 0.14 285)',
            '--sidebar-primary': 'oklch(0.72 0.18 285)',
            '--sidebar-primary-foreground': 'oklch(0.15 0.02 285)',
            '--chart-1': 'oklch(0.72 0.18 285)',
        },
    },
    amber: {
        label: 'Amber',
        dot: '#d97706',
        light: {
            '--primary': 'oklch(0.67 0.18 58)',
            '--primary-foreground': 'oklch(0.2 0.01 58)',
            '--ring': 'oklch(0.78 0.15 70)',
            '--sidebar-primary': 'oklch(0.67 0.18 58)',
            '--sidebar-primary-foreground': 'oklch(0.2 0.01 58)',
            '--chart-1': 'oklch(0.67 0.18 58)',
        },
        dark: {
            '--primary': 'oklch(0.83 0.19 84)',
            '--primary-foreground': 'oklch(0.15 0.01 58)',
            '--ring': 'oklch(0.55 0.14 70)',
            '--sidebar-primary': 'oklch(0.83 0.19 84)',
            '--sidebar-primary-foreground': 'oklch(0.15 0.01 58)',
            '--chart-1': 'oklch(0.83 0.19 84)',
        },
    },
    rose: {
        label: 'Rose',
        dot: '#e11d48',
        light: {
            '--primary': 'oklch(0.59 0.25 18)',
            '--primary-foreground': 'oklch(0.985 0 0)',
            '--ring': 'oklch(0.71 0.19 18)',
            '--sidebar-primary': 'oklch(0.59 0.25 18)',
            '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
            '--chart-1': 'oklch(0.59 0.25 18)',
        },
        dark: {
            '--primary': 'oklch(0.71 0.19 13)',
            '--primary-foreground': 'oklch(0.14 0.01 18)',
            '--ring': 'oklch(0.45 0.15 18)',
            '--sidebar-primary': 'oklch(0.71 0.19 13)',
            '--sidebar-primary-foreground': 'oklch(0.14 0.01 18)',
            '--chart-1': 'oklch(0.71 0.19 13)',
        },
    },
    slate: {
        label: 'Slate blue',
        dot: '#2563eb',
        light: {
            '--primary': 'oklch(0.55 0.24 263)',
            '--primary-foreground': 'oklch(0.985 0 0)',
            '--ring': 'oklch(0.68 0.18 263)',
            '--sidebar-primary': 'oklch(0.55 0.24 263)',
            '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
            '--chart-1': 'oklch(0.55 0.24 263)',
        },
        dark: {
            '--primary': 'oklch(0.71 0.16 255)',
            '--primary-foreground': 'oklch(0.13 0.01 255)',
            '--ring': 'oklch(0.45 0.13 263)',
            '--sidebar-primary': 'oklch(0.71 0.16 255)',
            '--sidebar-primary-foreground': 'oklch(0.13 0.01 255)',
            '--chart-1': 'oklch(0.71 0.16 255)',
        },
    },
};

const ACCENT_KEYS = Object.keys(ACCENTS);

const FONT_SIZES: Record<FontScalePref, string> = {
    s: '14px',
    m: '16px',
    l: '18px',
};

const RADII: Record<RadiusPref, string> = {
    s: '0.375rem',
    m: '0.625rem',
    l: '1rem',
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Relative luminance (0-1) for a #rrggbb color. */
function luminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const linear = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Build an accent var set from an arbitrary hex color, same shape as presets. */
function customAccentVars(hex: string): { light: VarSet; dark: VarSet } {
    // Dark text on light colors, light text on dark colors (readable in both modes).
    const fg = luminance(hex) > 0.4 ? 'oklch(0.205 0 0)' : 'oklch(0.985 0 0)';
    const make = (): VarSet => ({
        '--primary': hex,
        '--primary-foreground': fg,
        '--ring': hex,
        '--sidebar-primary': hex,
        '--sidebar-primary-foreground': fg,
        '--chart-1': hex,
    });

    return { light: make(), dark: make() };
}

const SIDEBAR_COOKIE = 'sidebar_state';

const listeners = new Set<() => void>();
let current: Preferences = { ...DEFAULT_PREFERENCES };

function notify() {
    listeners.forEach((listener) => {
        try {
            listener();
        } catch {
            // ignore listener errors
        }
    });
}

function readLocal(): Partial<Preferences> {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const raw = window.localStorage.getItem('preferences');

        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw) as Partial<Preferences>;

        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function writeLocal(prefs: Preferences) {
    try {
        window.localStorage.setItem('preferences', JSON.stringify(prefs));
    } catch {
        // storage unavailable (private mode quota etc.) — session-only
    }
}

function isDark(): boolean {
    if (typeof document === 'undefined') {
        return false;
    }

    return document.documentElement.classList.contains('dark');
}

function setVars(vars: VarSet) {
    const root = document.documentElement;

    for (const [name, value] of Object.entries(vars)) {
        root.style.setProperty(name, value);
    }
}

function clearVars(vars: VarSet) {
    const root = document.documentElement;

    for (const name of Object.keys(vars)) {
        root.style.removeProperty(name);
    }
}

function allAccentVars(): VarSet {
    const merged: VarSet = {};

    for (const name of ACCENT_KEYS) {
        Object.assign(
            merged,
            ACCENTS[name as AccentName].light,
            ACCENTS[name as AccentName].dark,
        );
    }

    return merged;
}

function applyAccent(accent: AccentName, customHex: string | null) {
    if (typeof document === 'undefined') {
        return;
    }

    clearVars(allAccentVars());

    if (accent === 'custom' && customHex && HEX_RE.test(customHex)) {
        const vars = customAccentVars(customHex);
        setVars(isDark() ? vars.dark : vars.light);
    } else {
        const def = ACCENTS[accent] ?? ACCENTS.default;
        setVars(isDark() ? def.dark : def.light);
    }

    const meta = document.querySelector('meta[name="theme-color"]');

    if (meta) {
        meta.setAttribute(
            'content',
            isDark() ? '#09090b' : '#ffffff',
        );
    }
}

/** Re-apply accent vars after a light/dark switch (mode-specific sets). */
export function reapplyAccentForMode() {
    applyAccent(current.accent, current.customAccent);
}

function applyLayout(prefs: Preferences) {
    if (typeof document === 'undefined') {
        return;
    }

    if (prefs.sidebar !== 'remember') {
        document.cookie = `${SIDEBAR_COOKIE}=${prefs.sidebar === 'expanded' ? 'true' : 'false'};path=/;max-age=${60 * 60 * 24 * 7}`;
    }

    document.documentElement.dataset.density = prefs.density;
    document.documentElement.dataset.motion = prefs.reduceMotion
        ? 'reduce'
        : '';
    document.documentElement.style.setProperty(
        '--radius',
        RADII[prefs.radius] ?? RADII.m,
    );
    document.documentElement.style.fontSize =
        FONT_SIZES[prefs.fontScale] ?? FONT_SIZES.m;
}

export function applyPreferences(prefs: Preferences) {
    current = { ...DEFAULT_PREFERENCES, ...prefs };
    applyAccent(current.accent, current.customAccent);
    applyLayout(current);
    notify();
}

function sanitize(input: unknown): Preferences {
    const base = { ...DEFAULT_PREFERENCES };

    if (!input || typeof input !== 'object') {
        return base;
    }

    const p = input as Partial<Preferences>;

    return {
        accent: ACCENT_KEYS.includes(p.accent ?? '')
            ? (p.accent as AccentName)
            : base.accent,
        customAccent:
            typeof p.customAccent === 'string' &&
            HEX_RE.test(p.customAccent)
                ? p.customAccent
                : null,
        radius: ['s', 'm', 'l'].includes(p.radius ?? '')
            ? (p.radius as Preferences['radius'])
            : base.radius,
        reduceMotion:
            typeof p.reduceMotion === 'boolean'
                ? p.reduceMotion
                : base.reduceMotion,
        sidebar: ['expanded', 'collapsed', 'remember'].includes(
            p.sidebar ?? '',
        )
            ? (p.sidebar as Preferences['sidebar'])
            : base.sidebar,
        density: ['comfortable', 'compact'].includes(p.density ?? '')
            ? (p.density as Preferences['density'])
            : base.density,
        fontScale: ['s', 'm', 'l'].includes(p.fontScale ?? '')
            ? (p.fontScale as Preferences['fontScale'])
            : base.fontScale,
        widgets: Array.isArray(p.widgets) ? p.widgets : [],
    };
}

/** Pre-paint boot: apply last-known (device-local) prefs instantly. */
export function initializePreferences() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    applyPreferences({ ...DEFAULT_PREFERENCES, ...readLocal() });

    // Accent sets are mode-specific; re-apply whenever light/dark flips,
    // wherever the toggle lives (sidebar, settings, login header).
    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.attributeName === 'class') {
                reapplyAccentForMode();
            }
        }
    }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });
}

/**
 * Merge server prefs (shared page prop, per account) over local state.
 * Server wins on conflicts; result is written back locally.
 */
export function syncServerPreferences(server: unknown) {
    const merged = sanitize({
        ...readLocal(),
        ...(typeof server === 'object' && server !== null ? server : {}),
    });

    // Only touch the DOM/listeners when something actually changed.
    if (JSON.stringify(merged) !== JSON.stringify(current)) {
        writeLocal(merged);
        applyPreferences(merged);
    }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persist(prefs: Preferences, authenticated: boolean) {
    writeLocal(prefs);

    if (!authenticated) {
        return;
    }

    if (saveTimer) {
        clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(() => {
        fetch('/settings/preferences', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(prefs),
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                // Close the loop: server is now source of truth.
                if (data && typeof data === 'object' && 'preferences' in data) {
                    syncServerPreferences(
                        (data as { preferences: unknown }).preferences,
                    );
                }
            })
            .catch(() => {
                // offline/expired session: local copy already applied
            });
    }, 600);
}

export function usePreferences(authenticated = true) {
    const prefs = useSyncExternalStore(
        (callback) => {
            listeners.add(callback);

            return () => {
                listeners.delete(callback);
            };
        },
        () => current,
        () => DEFAULT_PREFERENCES,
    );

    function updatePreferences(patch: Partial<Preferences>) {
        const next = sanitize({ ...current, ...patch });
        writeLocal(next);
        applyPreferences(next);
        persist(next, authenticated);
    }

    return { preferences: prefs, updatePreferences } as const;
}

/** Widget order/visibility helpers shared by dashboard + settings UI. */
export function resolveWidgets(
    sectionKey: string,
    blockIds: string[],
    prefs: Preferences,
): string[] {
    const saved = prefs.widgets.find((w) => w.section === sectionKey);
    const hidden = new Set(saved?.hidden ?? []);
    const visible = blockIds.filter((id) => !hidden.has(id));
    const order = (saved?.order ?? []).filter((id) => visible.includes(id));
    const unordered = visible.filter((id) => !order.includes(id));

    // Unknown/future ids always render (appended), so new features never vanish.
    return [...order, ...unordered];
}
