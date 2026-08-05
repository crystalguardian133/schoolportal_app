import { Head } from '@inertiajs/react';
import LoginForm from '@/components/login-form';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Sign in - DNHS School Portal" />

            <LoginForm status={status} canResetPassword={canResetPassword} />
        </>
    );
}

Login.layout = {
    title: 'Sign in to DNHS School Portal',
    description: 'Please enter your credentials to access the school portal.',
};
