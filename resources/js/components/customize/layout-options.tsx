import { usePreferences } from '@/hooks/use-preferences';
import { cn } from '@/lib/utils';

function Segmented<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">{label}</span>
            <div
                role="radiogroup"
                aria-label={label}
                className="inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800"
            >
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={value === option.value}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'rounded-md px-3.5 py-1.5 text-sm transition-colors',
                            value === option.value
                                ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

/** Sidebar, density, font size, roundness, motion. Instant, per-account. */
export function LayoutOptions() {
    const { preferences, updatePreferences } = usePreferences();

    return (
        <div className="space-y-4">
            <Segmented
                label="Sidebar default"
                value={preferences.sidebar}
                onChange={(sidebar) => updatePreferences({ sidebar })}
                options={[
                    { value: 'expanded', label: 'Expanded' },
                    { value: 'collapsed', label: 'Collapsed' },
                    { value: 'remember', label: 'Remember last' },
                ]}
            />
            <Segmented
                label="Density"
                value={preferences.density}
                onChange={(density) => updatePreferences({ density })}
                options={[
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'compact', label: 'Compact' },
                ]}
            />
            <Segmented
                label="Font size"
                value={preferences.fontScale}
                onChange={(fontScale) => updatePreferences({ fontScale })}
                options={[
                    { value: 's', label: 'Small' },
                    { value: 'm', label: 'Medium' },
                    { value: 'l', label: 'Large' },
                ]}
            />
            <Segmented
                label="Corner roundness"
                value={preferences.radius}
                onChange={(radius) => updatePreferences({ radius })}
                options={[
                    { value: 's', label: 'Sharp' },
                    { value: 'm', label: 'Medium' },
                    { value: 'l', label: 'Round' },
                    { value: 'xl', label: 'Extra' },
                ]}
            />
            <Segmented
                label="Content width"
                value={preferences.contentWidth}
                onChange={(contentWidth) => updatePreferences({ contentWidth })}
                options={[
                    { value: 'narrow', label: 'Narrow' },
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'wide', label: 'Wide' },
                    { value: 'full', label: 'Full' },
                ]}
            />
            <Segmented
                label="Border style"
                value={preferences.borderStyle}
                onChange={(borderStyle) => updatePreferences({ borderStyle })}
                options={[
                    { value: 'subtle', label: 'Subtle' },
                    { value: 'default', label: 'Default' },
                    { value: 'strong', label: 'Strong' },
                ]}
            />
            <Segmented
                label="Surface style"
                value={preferences.surfaceStyle}
                onChange={(surfaceStyle) => updatePreferences({ surfaceStyle })}
                options={[
                    { value: 'plain', label: 'Plain' },
                    { value: 'elevated', label: 'Elevated' },
                    { value: 'glass', label: 'Glass' },
                ]}
            />
            <Segmented
                label="Shadows"
                value={preferences.shadowIntensity}
                onChange={(shadowIntensity) =>
                    updatePreferences({ shadowIntensity })
                }
                options={[
                    { value: 'none', label: 'None' },
                    { value: 'subtle', label: 'Subtle' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'strong', label: 'Strong' },
                ]}
            />
            <Segmented
                label="Focus ring"
                value={preferences.focusStyle}
                onChange={(focusStyle) => updatePreferences({ focusStyle })}
                options={[
                    { value: 'default', label: 'Default' },
                    { value: 'brand', label: 'Brand' },
                    { value: 'none', label: 'None' },
                ]}
            />
            <Segmented
                label="UI style"
                value={preferences.uiStyle}
                onChange={(uiStyle) => updatePreferences({ uiStyle })}
                options={[
                    { value: 'default', label: 'Default' },
                    { value: 'minimal', label: 'Minimal' },
                    { value: 'modern', label: 'Modern' },
                ]}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium">Backdrop blur</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.blur}
                    onClick={() =>
                        updatePreferences({
                            blur: !preferences.blur,
                        })
                    }
                    className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
                        preferences.blur
                            ? 'border-primary bg-primary'
                            : 'border-sidebar-border/70 bg-muted',
                    )}
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'absolute left-0.5 size-5 rounded-full bg-white shadow transition-transform',
                            preferences.blur
                                ? 'translate-x-5'
                                : 'translate-x-0',
                        )}
                    />
                </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium">Reduce motion</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.reduceMotion}
                    onClick={() =>
                        updatePreferences({
                            reduceMotion: !preferences.reduceMotion,
                        })
                    }
                    className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
                        preferences.reduceMotion
                            ? 'border-primary bg-primary'
                            : 'border-sidebar-border/70 bg-muted',
                    )}
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'absolute left-0.5 size-5 rounded-full bg-white shadow transition-transform',
                            preferences.reduceMotion
                                ? 'translate-x-5'
                                : 'translate-x-0',
                        )}
                    />
                </button>
            </div>
            <p className="text-xs text-muted-foreground">
                Sidebar takes effect on next load; everything else applies
                instantly.
            </p>
        </div>
    );
}
