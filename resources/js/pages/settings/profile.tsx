import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

function parseNameBreakdown(fullName: string) {
    const parts = (fullName || '').split(',');
    let first = '';
    let middle = '';
    let last = '';

    if (parts.length >= 1) {
        last = parts[0].trim();
    }

    if (parts.length >= 2) {
        const rest = parts[1].trim().split(' ');
        first = rest[0] || '';
        middle = rest[1] || '';
    }

    return { first, middle, last };
}

function composeName(first?: string, middle?: string, last?: string) {
    const f = (first || '').trim();
    const m = (middle || '').trim();
    const l = (last || '').trim();

    const mid = m ? ' ' + m.charAt(0).toUpperCase() : '';

    if (l) {
        return (l + (f ? ', ' + f + mid : '')).trim();
    }

    return (f + (mid ? ' ' + mid : '')).trim();
}

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const currentAvatarUrl = auth.user.profile_picture ? `/assets/${auth.user.profile_picture}` : null;
    const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
    const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
    const [nameBreakdown, setNameBreakdown] = useState(() => parseNameBreakdown(auth.user.name));
    const avatarPreviewUrlRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            if (avatarPreviewUrlRef.current) {
                URL.revokeObjectURL(avatarPreviewUrlRef.current);
            }
        };
    }, []);

    function handleAvatarChange(file: File | null) {
        if (avatarPreviewUrlRef.current) {
            URL.revokeObjectURL(avatarPreviewUrlRef.current);
            avatarPreviewUrlRef.current = null;
        }

        if (!file) {
            setAvatarPreview(currentAvatarUrl);

            return;
        }

        const url = URL.createObjectURL(file);
        avatarPreviewUrlRef.current = url;
        setAvatarPreview(url);
    }

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    encType="multipart/form-data"
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <div className="rounded-3xl border border-sidebar-border/70 bg-white p-8 shadow-sm dark:border-sidebar-border dark:bg-sidebar space-y-10">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">Account details</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Keep your name and email current so notifications reach the right account.
                                </p>
                            </div>

                            <div className="space-y-6">
                                    <div className="grid gap-3">
                                        <div className="flex items-end justify-between gap-3">
                                            <Label>Full name breakdown</Label>
                                            <span className="text-xs text-muted-foreground">This is saved as one display name</span>
                                        </div>

                                        <div className="grid gap-2 sm:grid-cols-3">
                                            <div className="grid gap-2">
                                                <Label htmlFor="first_name">First name</Label>
                                                <Input
                                                    id="first_name"
                                                    name="first_name"
                                                    value={nameBreakdown.first}
                                                    onChange={(e) => setNameBreakdown((current) => ({ ...current, first: e.target.value }))}
                                                    placeholder="First name"
                                                    autoComplete="given-name"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="middle_name">Middle name</Label>
                                                <Input
                                                    id="middle_name"
                                                    name="middle_name"
                                                    value={nameBreakdown.middle}
                                                    onChange={(e) => setNameBreakdown((current) => ({ ...current, middle: e.target.value }))}
                                                    placeholder="Middle name"
                                                    autoComplete="additional-name"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="last_name">Last name</Label>
                                                <Input
                                                    id="last_name"
                                                    name="last_name"
                                                    value={nameBreakdown.last}
                                                    onChange={(e) => setNameBreakdown((current) => ({ ...current, last: e.target.value }))}
                                                    placeholder="Last name"
                                                    autoComplete="family-name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <Input type="hidden" name="name" value={composeName(nameBreakdown.first, nameBreakdown.middle, nameBreakdown.last)} />

                                        <InputError className="mt-1" message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email address</Label>

                                        <Input
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.email}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="Email address"
                                        />

                                        <InputError
                                            className="mt-2"
                                            message={errors.email}
                                        />
                                    </div>

                                    {mustVerifyEmail &&
                                        auth.user.email_verified_at === null && (
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                                                <p>
                                                    Your email address is unverified.{' '}
                                                    <Link
                                                        href={send()}
                                                        as="button"
                                                        className="font-medium underline decoration-current underline-offset-4"
                                                    >
                                                        Re-send verification
                                                    </Link>
                                                </p>

                                                {status ===
                                                    'verification-link-sent' && (
                                                    <div className="mt-2 font-medium text-green-700 dark:text-green-300">
                                                        A new verification link has been sent.
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            disabled={processing}
                                            data-test="update-profile-button"
                                        >
                                            Save changes
                                        </Button>
                                    </div>
                                </div>

                                <div className="border-t border-sidebar-border/70 pt-8 space-y-6">
                                    <h2 className="text-base font-semibold text-foreground">Profile photo</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Drag a new image here or choose a file below.
                                    </p>

                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDraggingAvatar(true);
                                        }}
                                        onDragLeave={() => setIsDraggingAvatar(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDraggingAvatar(false);
                                            handleAvatarChange(e.dataTransfer.files?.[0] ?? null);
                                        }}
                                        className={`grid gap-5 rounded-3xl border-2 border-dashed p-6 transition ${isDraggingAvatar ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/20' : 'border-border bg-background/80'}`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="h-40 w-40 shrink-0 overflow-hidden rounded-3xl border border-border bg-muted/20 shadow-sm">
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                                        No photo
                                                    </div>
                                                )}
                                            </div>

                                            <div className="max-w-sm space-y-2 text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground">Recommended: square image, up to 2MB.</p>
                                                <p>The new photo will replace the current one after you save changes.</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="avatar">Choose image</Label>
                                            <Input
                                                id="avatar"
                                                type="file"
                                                name="avatar"
                                                accept="image/*"
                                                onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
                                                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-sm file:font-medium file:text-background hover:file:opacity-90"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
