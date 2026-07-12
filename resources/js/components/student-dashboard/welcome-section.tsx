import { School2 } from 'lucide-react';

type WelcomeSectionProps = {
    firstName: string;
};

export function WelcomeSection({ firstName }: WelcomeSectionProps) {
    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Welcome back
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                        {firstName || 'Student'}
                    </h2>
                </div>
                <div className="rounded-full bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <School2 className="size-5" />
                </div>
            </div>
        </div>
    );
}
