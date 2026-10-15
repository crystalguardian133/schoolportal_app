import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Camera, ShieldCheck, User } from 'lucide-react';
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
    const [nameBreakdown, setNameBreakdown] = useState(() =>
        parseNameBreakdown(auth.user.name),
    );
    const avatarPreviewUrlRef = useRef<string | null>(null);
    const currentCoverUrl = (auth.user.cover_image as string | null)
        ? `/assets/${auth.user.cover_image}`
        : null;
    const [coverPreview, setCoverPreview] = useState<string | null>(
        currentCoverUrl,
    );
    const [isDraggingCover, setIsDraggingCover] = useState(false);
    const coverPreviewUrlRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            if (avatarPreviewUrlRef.current) {
                URL.revokeObjectURL(avatarPreviewUrlRef.current);
            }

            if (coverPreviewUrlRef.current) {
                URL.revokeObjectURL(coverPreviewUrlRef.current);
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

    function handleCoverChange(file: File | null) {
        if (coverPreviewUrlRef.current) {
            URL.revokeObjectURL(coverPreviewUrlRef.current);
            coverPreviewUrlRef.current = null;
        }

        if (!file) {
            setCoverPreview(currentCoverUrl);

            return;
        }

        const url = URL.createObjectURL(file);
        coverPreviewUrlRef.current = url;
        setCoverPreview(url);
    }

    const displayName = composeName(
        nameBreakdown.first,
        nameBreakdown.middle,
        nameBreakdown.last,
    );
    const emailVerified =
        !mustVerifyEmail || auth.user.email_verified_at !== null;

    return (
        <>
            <Head title="My Profile" />

            <h1 className="sr-only">My Profile</h1>

            <div className="flex h-full flex-1 flex-col gap-5 overflow-x-auto p-3 sm:p-4">
                {/* Identity hero */}
                <div className="overflow-hidden rounded-3xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingCover(true);
                        }}
                        onDragLeave={() => setIsDraggingCover(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingCover(false);
                            handleCoverChange(
                                e.dataTransfer.files?.[0] ?? null,
                            );
                        }}
                        className={`relative h-36 overflow-hidden sm:h-44 ${
                            coverPreview
                                ? ''
                                : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 dark:from-indigo-950 dark:via-violet-950 dark:to-fuchsia-950'
                        } ${isDraggingCover ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
                    >
                        {coverPreview ? (
                            <img
                                src={coverPreview}
                                alt="Profile banner"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <>
                                <div
                                    aria-hidden="true"
                                    className="absolute -top-10 -right-10 size-44 rounded-full bg-white/15"
                                />
                                <div
                                    aria-hidden="true"
                                    className="absolute -bottom-14 right-32 size-36 rounded-full bg-white/10"
                                />
                                <div
                                    aria-hidden="true"
                                    className="absolute top-4 left-1/3 size-16 rounded-full bg-white/10"
                                />
                            </>
                        )}
                        <label
                            htmlFor="cover_image"
                            className="absolute right-3 bottom-3 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white shadow-md backdrop-blur transition hover:bg-black/75"
                        >
                            <Camera className="size-4" />
                            <span className="sr-only">
                                Change banner image
                            </span>
                        </label>
                    </div>
                    <div className="flex flex-wrap items-end gap-4 px-5 pb-5 sm:px-6">
                        <div className="relative -mt-10 shrink-0 sm:-mt-12">
                            <div className="flex size-20 items-center justify-center overflow-hidden rounded-3xl bg-indigo-100 text-indigo-600 ring-4 ring-white sm:size-24 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-sidebar">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Profile preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="size-8" />
                                )}
                            </div>
                            <label
                                htmlFor="avatar"
                                className="absolute -right-1 -bottom-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
                            >
                                <Camera className="size-3.5" />
                                <span className="sr-only">Change photo</span>
                            </label>
                        </div>
                        <div className="min-w-0 flex-1 pb-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                                    {displayName || auth.user.name}
                                </h2>
                                <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    {formatRole(auth.user.role)}
                                </span>
                                {emailVerified ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        <ShieldCheck className="size-3" />
                                        Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                        Unverified
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                {auth.user.email}
                            </p>
                        </div>
                    </div>
                </div>

                <Form
                    {...ProfileController.update.form()}
                    encType="multipart/form-data"
                    options={{
                        preserveScroll: true,
                    }}
                    className="grid items-start gap-5"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Hidden file inputs; triggered by the camera
                                badges on the avatar (hero) and banner. */}
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
                            <Input
                                id="cover_image"
                                name="cover_image"
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    handleCoverChange(
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                                className="sr-only"
                            />
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
                                                Saved as:{' '}
                                                <span className="font-medium text-foreground">
                                                    {displayName || '—'}
                                                </span>
                                            </span>
                                        </div>

                                        <div className="grid gap-2 sm:grid-cols-3">
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
                                            value={displayName}
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
