import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { AccentSwatches } from '@/components/customize/accent-swatches';
import { LayoutOptions } from '@/components/customize/layout-options';
import { WidgetToggles } from '@/components/customize/widget-toggles';
import Heading from '@/components/heading';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Appearance settings"
                    description="Update the appearance settings for your account"
                />
                <AppearanceTabs />

                <section className="space-y-3 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <Heading
                        variant="small"
                        title="Accent theme"
                        description="Recolors buttons, highlights, charts, and the sidebar across light and dark mode. Applies instantly and syncs to your account."
                    />
                    <AccentSwatches />
                </section>

                <section className="space-y-3 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <Heading
                        variant="small"
                        title="Layout"
                        description="Sidebar behavior, table density, and text size."
                    />
                    <LayoutOptions />
                </section>

                <section className="space-y-3 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <Heading
                        variant="small"
                        title="Dashboard widgets"
                        description="Show, hide, and reorder the blocks on your dashboard."
                    />
                    <WidgetToggles />
                </section>
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
