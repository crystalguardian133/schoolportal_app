import { Check } from 'lucide-react';
import {
    ACCENTS,
    usePreferences
    
} from '@/hooks/use-preferences';
import type {AccentName} from '@/hooks/use-preferences';
import { cn } from '@/lib/utils';

const ORDER: AccentName[] = [
    'default',
    'emerald',
    'violet',
    'amber',
    'rose',
    'slate',
    'custom',
];

/** Accent theme swatches + custom color picker. Instant-apply; per account. */
export function AccentSwatches() {
    const { preferences, updatePreferences } = usePreferences();

    return (
        <div className="space-y-3">
            <div
                role="radiogroup"
                aria-label="Accent theme"
                className="flex flex-wrap gap-3"
            >
                {ORDER.map((name) => {
                    const def = ACCENTS[name];
                    const active = preferences.accent === name;

                    return (
                        <button
                            key={name}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            title={def.label}
                            onClick={() => updatePreferences({ accent: name })}
                            className={cn(
                                'group flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-colors',
                                active
                                    ? 'border-primary ring-2 ring-ring/30'
                                    : 'border-sidebar-border/70 hover:border-primary/50',
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className="flex size-8 items-center justify-center rounded-full"
                                style={{ background: def.dot }}
                            >
                                {active && (
                                    <Check className="size-4 text-white drop-shadow" />
                                )}
                            </span>
                            <span className="text-xs font-medium">
                                {def.label}
                            </span>
                        </button>
                    );
                })}
            </div>
            {preferences.accent === 'custom' && (
                <label className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-medium">Custom color</span>
                    <input
                        type="color"
                        value={
                            preferences.customAccent ?? '#7c3aed'
                        }
                        onChange={(e) =>
                            updatePreferences({
                                accent: 'custom',
                                customAccent: e.target.value,
                            })
                        }
                        className="h-9 w-14 cursor-pointer rounded-lg border border-sidebar-border/70 bg-background p-1"
                    />
                    <span className="text-xs text-muted-foreground">
                        Text on top switches black/white automatically for
                        readability.
                    </span>
                </label>
            )}
        </div>
    );
}
