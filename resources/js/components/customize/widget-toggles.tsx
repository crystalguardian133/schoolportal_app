import { usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { WIDGET_GROUPS } from '@/components/customize/dashboard-blocks';
import { resolveWidgets, usePreferences } from '@/hooks/use-preferences';
import { cn } from '@/lib/utils';

/**
 * Dashboard widget visibility + ordering, grouped per dashboard section.
 * Only sections the user is permitted to see are listed (keys come from the
 * server via DashboardSections, mirroring the dashboard itself).
 */
export function WidgetToggles() {
    const { props } = usePage<{ dashboardSections?: string[] }>();
    const allowed = new Set(props.dashboardSections ?? []);
    const groups = WIDGET_GROUPS.filter((group) => allowed.has(group.key));
    const { preferences, updatePreferences } = usePreferences();

    function entryFor(sectionKey: string) {
        return (
            preferences.widgets.find((w) => w.section === sectionKey) ?? {
                section: sectionKey,
                hidden: [],
                order: [],
            }
        );
    }

    function saveEntry(sectionKey: string, hidden: string[], order: string[]) {
        const rest = preferences.widgets.filter(
            (w) => w.section !== sectionKey,
        );
        updatePreferences({
            widgets: [...rest, { section: sectionKey, hidden, order }],
        });
    }

    function toggleHidden(sectionKey: string, blockId: string) {
        const entry = entryFor(sectionKey);
        const hidden = new Set(entry.hidden ?? []);

        if (hidden.has(blockId)) {
            hidden.delete(blockId);
        } else {
            hidden.add(blockId);
        }

        saveEntry(sectionKey, [...hidden], entry.order ?? []);
    }

    function move(sectionKey: string, blockId: string, delta: -1 | 1) {
        const group = WIDGET_GROUPS.find((g) => g.key === sectionKey);

        if (!group) {
            return;
        }

        const entry = entryFor(sectionKey);
        const current = resolveWidgets(
            sectionKey,
            group.blocks.map((b) => b.id),
            preferences,
        );
        const index = current.indexOf(blockId);
        const next = index + delta;

        if (index < 0 || next < 0 || next >= current.length) {
            return;
        }

        const reordered = [...current];
        [reordered[index], reordered[next]] = [
            reordered[next],
            reordered[index],
        ];
        saveEntry(sectionKey, entry.hidden ?? [], reordered);
    }

    return (
        <div className="space-y-3">
            {groups.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No dashboard sections are available for your account yet.
                </p>
            )}
            {groups.map((group) => {
                const ids = group.blocks.map((b) => b.id);
                const order = resolveWidgets(group.key, ids, preferences);
                const entry = entryFor(group.key);
                const hidden = new Set(entry.hidden ?? []);
                const byId = new Map(group.blocks.map((b) => [b.id, b]));
                // Visible first in live order, hidden at the bottom.
                const rows = [
                    ...order,
                    ...ids.filter((id) => hidden.has(id)),
                ];

                return (
                    <details
                        key={group.key}
                        className="overflow-hidden rounded-xl border border-sidebar-border/70"
                    >
                        <summary className="cursor-pointer px-3 py-2 text-sm font-medium hover:bg-sidebar-accent/40">
                            {group.label}
                        </summary>
                        <ul className="space-y-1 px-3 pb-3">
                            {rows.map((blockId) => {
                                const block = byId.get(blockId);

                                if (!block) {
                                    return null;
                                }

                                const isHidden = hidden.has(block.id);
                                const index = order.indexOf(block.id);

                                return (
                                    <li
                                        key={block.id}
                                        className={cn(
                                            'flex items-center gap-2 rounded-lg px-2 py-1.5',
                                            isHidden && 'opacity-55',
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleHidden(
                                                    group.key,
                                                    block.id,
                                                )
                                            }
                                            aria-label={
                                                isHidden
                                                    ? `Show ${block.label}`
                                                    : `Hide ${block.label}`
                                            }
                                            className="rounded-md p-1 hover:bg-sidebar-accent"
                                        >
                                            {isHidden ? (
                                                <EyeOff className="size-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="size-4 text-muted-foreground" />
                                            )}
                                        </button>
                                        <span className="flex-1 text-sm">
                                            {block.label}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={index <= 0}
                                            onClick={() =>
                                                move(group.key, block.id, -1)
                                            }
                                            aria-label={`Move ${block.label} up`}
                                            className="rounded-md p-1 hover:bg-sidebar-accent disabled:opacity-30"
                                        >
                                            <ChevronUp className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={
                                                index < 0 ||
                                                index >= order.length - 1
                                            }
                                            onClick={() =>
                                                move(group.key, block.id, 1)
                                            }
                                            aria-label={`Move ${block.label} down`}
                                            className="rounded-md p-1 hover:bg-sidebar-accent disabled:opacity-30"
                                        >
                                            <ChevronDown className="size-4" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </details>
                );
            })}
            <p className="text-xs text-muted-foreground">
                Changes apply instantly and sync to your account. New dashboard
                blocks always appear until you hide them.
            </p>
        </div>
    );
}
