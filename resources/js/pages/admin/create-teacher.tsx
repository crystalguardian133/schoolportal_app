import { Head, router } from '@inertiajs/react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    sections: { uuid: string; name: string; grade_level: string | null }[];
    roles: { id: string; name: string }[];
};

export default function CreateTeacher({ sections, roles }: Props) {
    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        is_adviser: false,
        adviser_section: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(
            new CustomEvent('local-toast', { detail: { message, type } }),
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        router.post(
            '/admin/create-teacher',
            {
                first_name: form.first_name,
                middle_name: form.middle_name,
                last_name: form.last_name,
                email: form.email,
                password: form.password,
                password_confirmation: form.password_confirmation,
                role: form.role || null,
                is_adviser: form.is_adviser,
                adviser_section: form.adviser_section || null,
            },
            {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    showToast('Teacher account created successfully.', 'success');
                    setForm({
                        first_name: '',
                        middle_name: '',
                        last_name: '',
                        email: '',
                        password: '',
                        password_confirmation: '',
                        role: '',
                        is_adviser: false,
                        adviser_section: '',
                    });
                },
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];
                    showToast(
                        (firstError as string) || 'Unable to create teacher.',
                        'error',
                    );
                },
            },
        );
    }

    return (
        <>
            <Head title="Create Teacher" />
            <PortalPageShell
                title="Create Teacher"
                description="Create a new teacher account. Roles are optional and can be assigned later."
            >
                <div className="mx-auto max-w-2xl">
                    <form
                        onSubmit={submit}
                        className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar"
                    >
                        <div className="mb-5 flex items-center gap-3">
                            <UserPlus className="size-5 text-sky-600" />
                            <h2 className="text-lg font-semibold">
                                Teacher Account
                            </h2>
                        </div>

                        <div className="grid gap-4">
                            <div>
                                <Label className="text-xs">Name</Label>
                                <div className="mt-1 grid gap-2 sm:grid-cols-3">
                                    <Input
                                        placeholder="First"
                                        value={form.first_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                first_name: e.target.value,
                                            })
                                        }
                                    />
                                    <Input
                                        placeholder="Middle"
                                        value={form.middle_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                middle_name: e.target.value,
                                            })
                                        }
                                    />
                                    <Input
                                        placeholder="Last"
                                        value={form.last_name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                last_name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs">Email</Label>
                                <Input
                                    type="email"
                                    className="mt-1"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label className="text-xs">
                                    Role{' '}
                                    <span className="text-muted-foreground">
                                        (optional)
                                    </span>
                                </Label>
                                <select
                                    value={form.role}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            role: e.target.value,
                                        })
                                    }
                                    className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                                >
                                    <option value="">No role</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.name}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    No role is assigned by default. You can
                                    assign one now or later.
                                </p>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm text-foreground dark:text-sidebar-foreground">
                                    <input
                                        type="checkbox"
                                        checked={form.is_adviser}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                is_adviser: e.target.checked,
                                                adviser_section: e.target
                                                    .checked
                                                    ? form.adviser_section
                                                    : '',
                                            })
                                        }
                                    />
                                    <span>Is adviser</span>
                                </label>

                                {form.is_adviser && (
                                    <div className="mt-2">
                                        <Label className="text-xs">
                                            Adviser section
                                        </Label>
                                        <select
                                            value={form.adviser_section}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    adviser_section:
                                                        e.target.value,
                                                })
                                            }
                                            className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                                        >
                                            <option value="">
                                                Select section
                                            </option>
                                            {sections.map((section) => (
                                                <option
                                                    key={section.uuid}
                                                    value={section.name}
                                                >
                                                    {section.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label className="text-xs">Password</Label>
                                <div className="relative mt-1">
                                    <Input
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={form.password}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                password: e.target.value,
                                            })
                                        }
                                    />
                                    <div
                                        className="absolute top-2 right-2 cursor-pointer text-muted-foreground"
                                        onClick={() =>
                                            setShowPassword((s) => !s)
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs">
                                    Confirm Password
                                </Label>
                                <div className="relative mt-1">
                                    <Input
                                        type={
                                            showConfirmPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={form.password_confirmation}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                password_confirmation:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                    <div
                                        className="absolute top-2 right-2 cursor-pointer text-muted-foreground"
                                        onClick={() =>
                                            setShowConfirmPassword((s) => !s)
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 text-right">
                                <Button
                                    type="submit"
                                    disabled={
                                        submitting ||
                                        !form.last_name ||
                                        !form.email ||
                                        !form.password ||
                                        !form.password_confirmation
                                    }
                                >
                                    {submitting
                                        ? 'Creating…'
                                        : 'Create Teacher'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </PortalPageShell>
        </>
    );
}
