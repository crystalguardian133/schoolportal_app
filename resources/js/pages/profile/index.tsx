import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Camera, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
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

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const currentAvatarUrl = auth.user.profile_picture
        ? `/assets/${auth.user.profile_picture}`
        : null;
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        currentAvatarUrl,
    );
    const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
    const [nameBreakdown, setNameBreakdown] = useState(() =>
        parseNameBreakdown(auth.user.name),
    );
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
            <Head title="My Profile" />

            <h1 className="sr-only">My Profile</h1>

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-3 sm:gap-6 sm:p-4">
                <header className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0">
                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-indigo-600 ring-2 ring-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-900/60">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Profile preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-7 w-7" />
                                )}
                            </div>

                            <label
                                htmlFor="avatar"
                                className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700"
                            >
                                <Camera className="h-3.5 w-3.5" />
                                <span className="sr-only">Change photo</span>
                            </label>
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                                    {auth.user.name}
                                </h1>
                                <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    {formatRole(auth.user.role)}
                                </span>
                            </div>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                {auth.user.email}
                            </p>
                        </div>
                    </div>
                </header>

                <Form
                    {...ProfileController.update.form()}
                    encType="multipart/form-data"
                    options={{
                        preserveScroll: true,
                    }}
                    className="grid gap-6 lg:grid-cols-2"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                                <h2 className="text-base font-semibold text-foreground">
                                    Account details
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Keep your name and email current so
                                    notifications reach the right account.
                                </p>

                                <div className="mt-6 space-y-5">
                                    <div className="grid gap-2">
                                        <div className="flex items-end justify-between gap-3">
                                            <Label>Full name breakdown</Label>
                                            <span className="text-xs text-muted-foreground">
                                                Saved as one display name
                                            </span>
                                        </div>

                                        <div className="grid gap-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="first_name">
                                                    First name
                                                </Label>
                                                <Input
                                                    id="first_name"
                                                    name="first_name"
                                                    value={nameBreakdown.first}
                                                    onChange={(e) =>
                                                        setNameBreakdown(
                                                            (current) => ({
                                                                ...current,
                                                                first: e.target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                    placeholder="First name"
                                                    autoComplete="given-name"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="middle_name">
                                                    Middle name
                                                </Label>
                                                <Input
                                                    id="middle_name"
                                                    name="middle_name"
                                                    value={nameBreakdown.middle}
                                                    onChange={(e) =>
                                                        setNameBreakdown(
                                                            (current) => ({
                                                                ...current,
                                                                middle: e.target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                    placeholder="Middle name"
                                                    autoComplete="additional-name"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="last_name">
                                                    Last name
                                                </Label>
                                                <Input
                                                    id="last_name"
                                                    name="last_name"
                                                    value={nameBreakdown.last}
                                                    onChange={(e) =>
                                                        setNameBreakdown(
                                                            (current) => ({
                                                                ...current,
                                                                last: e.target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                    placeholder="Last name"
                                                    autoComplete="family-name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <Input
                                            type="hidden"
                                            name="name"
                                            value={composeName(
                                                nameBreakdown.first,
                                                nameBreakdown.middle,
                                                nameBreakdown.last,
                                            )}
                                        />

                                        <InputError
                                            className="mt-1"
                                            message={errors.name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">
                                            Email address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            defaultValue={auth.user.email}
                                            required
                                            autoComplete="username"
                                            placeholder="Email address"
                                        />
                                        <InputError
                                            className="mt-1"
                                            message={errors.email}
                                        />
                                    </div>

                                    {mustVerifyEmail &&
                                        auth.user.email_verified_at === null && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                                                <p>
                                                    Your email address is
                                                    unverified.{' '}
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
                                                    <p className="mt-1 font-medium text-green-700 dark:text-green-300">
                                                        A new verification link
                                                        has been sent.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                    <div className="flex justify-end">
                                        <Button
                                            disabled={processing}
                                            data-test="update-profile-button"
                                        >
                                            Save changes
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                                <h2 className="text-base font-semibold text-foreground">
                                    Profile photo
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Recommended: square image, up to 2MB.
                                </p>

                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDraggingAvatar(true);
                                    }}
                                    onDragLeave={() =>
                                        setIsDraggingAvatar(false)
                                    }
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDraggingAvatar(false);
                                        handleAvatarChange(
                                            e.dataTransfer.files?.[0] ?? null,
                                        );
                                    }}
                                    className={`mt-4 rounded-2xl border-2 border-dashed p-5 transition ${isDraggingAvatar ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/20' : 'border-border bg-background/80'}`}
                                >
                                    <div className="flex flex-wrap items-center gap-5">
                                        <div className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/20">
                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt="Preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                                    No photo
                                                </div>
                                            )}
                                        </div>

                                        <div className="mx-auto max-w-xs space-y-2 text-center text-sm text-muted-foreground">
                                            <p>
                                                Drag a new image here or browse
                                                your files.
                                            </p>

                                            <label
                                                htmlFor="avatar"
                                                className="inline-flex cursor-pointer items-center rounded-md border border-sidebar-border/70 px-3 py-2 text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                            >
                                                <Camera className="mr-1.5 h-4 w-4" />
                                                Browse files
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <Input
                                    id="avatar"
                                    name="avatar"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        handleAvatarChange(
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="sr-only"
                                />
                            </div>
                        </>
                    )}
                </Form>

                <DeleteUser />
            </div>
        </>
    );
}

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

function formatRole(role?: string | null) {
    if (!role) {
        return 'My Profile';
    }

    return role
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'My Profile',
            href: edit(),
        },
    ],
};