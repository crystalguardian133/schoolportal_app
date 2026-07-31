import { Head } from '@inertiajs/react';
import LoginForm from '@/components/login-form';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Sign in - School portal" />

            <LoginForm status={status} canResetPassword={canResetPassword} />
        </>
    );
}

Login.layout = {
    title: 'Welcome back to the school portal',
    description: 'Choose your portal type and sign in to continue.',
};
