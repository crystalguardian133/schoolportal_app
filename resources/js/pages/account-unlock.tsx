import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { LifeBuoy, LockKeyhole, MailCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    status: string | null;
};

/**
 * Public-only account unlock page: request a secure one-time unlock link.
 * Staff unlock accounts from the users directory (admin/users unlock action).
 */
export default function AccountUnlock() {
    const { props } = usePage();
    const { status } = props as unknown as Props;
    const flash: any = (props as any).flash || {};

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    function sendLink(e: React.FormEvent) {
        e.preventDefault();
        post('/account-unlock/request', {
            onSuccess: () => {
                reset();
            },
        });
    }

    const banner = status || flash.success;

    return (
        <>
            <Head title="Unlock Account - DNHS School Portal" />
            <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-black">
                <header className="border-b border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600/10">
                                <LockKeyhole className="size-4.5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm leading-tight font-semibold">
                                    DNHS School Portal
                                </p>
                                <p className="text-[11px] leading-tight text-slate-500">
                                    Account Unlock
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/login"
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
                        >
                            Back to sign in
                        </Link>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
                    {/* Page heading */}
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Unlock your account
                            </h1>
                            <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-neutral-400">
                                Was your account locked after too many failed
                                sign-in attempts? Request a secure unlock link
                                below.
                            </p>
                        </div>
                    </div>

                    {banner && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {banner}
                        </div>
                    )}

                    {/* Email link */}
                    <section className="mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                        <form onSubmit={sendLink} className="space-y-4 p-6">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-600/10">
                                <MailCheck className="size-5 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">
                                    Request an unlock link
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Enter the account&apos;s email and
                                    we&apos;ll send a secure one-time unlock
                                    link, valid for 30 minutes.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="unlock-email">
                                    Account email
                                </Label>
                                <Input
                                    id="unlock-email"
                                    type="email"
                                    required
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    placeholder="name@school.edu"
                                />
                                <InputError message={errors.email} />
                            </div>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full"
                            >
                                {processing && <Spinner />}
                                Send unlock link
                            </Button>
                        </form>
                    </section>

                    <p className="mt-8 flex items-start justify-center gap-1.5 px-4 text-center text-xs leading-relaxed text-slate-500">
                        <LifeBuoy className="mt-0.5 size-3.5 shrink-0" />
                        No email access? Use the &ldquo;Need help signing
                        in?&rdquo; link on the login page to contact support.
                    </p>
                </main>
            </div>
        </>
    );
}
