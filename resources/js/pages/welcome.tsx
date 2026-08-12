import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
import { register } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-4xl lg:flex-row">
                        <div className="flex-1 rounded-br-lg rounded-bl-lg bg-white p-6 pb-12 text-[13px] leading-[20px] shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-tl-lg lg:rounded-br-none lg:p-20 dark:bg-[#161615] dark:text-[#EDEDEC] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]">
                            <h1 className="mb-2 text-2xl font-bold text-[#1b1b18] dark:text-white">
                                Dulag National High School
                            </h1>
                            <p className="mb-6 text-[#706f6c] dark:text-[#A1A09A]">
                                DepEd Division of Leyte • Dulag, Leyte
                            </p>
                            <p className="mb-4 text-[#444] dark:text-[#CCC]">
                                Welcome to the official student portal of Dulag National High School. Access your academic records, track your progress, and stay updated with school announcements.
                            </p>
                            <ul className="mb-6 flex flex-col space-y-3 mt-4">
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 text-sky-600">▪</div>
                                    <div>
                                        <strong className="block text-sm">Enrollment & Registration</strong>
                                        <span className="text-[#706f6c] dark:text-[#A1A09A]">Seamless online enrollment for new and returning students.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 text-sky-600">▪</div>
                                    <div>
                                        <strong className="block text-sm">Grades & Academics</strong>
                                        <span className="text-[#706f6c] dark:text-[#A1A09A]">View your report cards and subject grades in real-time.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 text-sky-600">▪</div>
                                    <div>
                                        <strong className="block text-sm">Attendance Tracking</strong>
                                        <span className="text-[#706f6c] dark:text-[#A1A09A]">Monitor your daily attendance and school presence easily.</span>
                                    </div>
                                </li>
                            </ul>
                            <ul className="flex gap-3 text-sm leading-normal">
                                <li>
                                    <Link
                                        href={login()}
                                        className="inline-block rounded-sm border border-black bg-sky-600 px-5 py-2 text-sm leading-normal text-white font-medium hover:border-sky-700 hover:bg-sky-700 transition-colors dark:border-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600"
                                    >
                                        Log in to Portal
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className="relative -mb-px aspect-[335/364] w-full shrink-0 overflow-hidden rounded-t-lg bg-[#fff2f2] lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-[438px] lg:rounded-t-none lg:rounded-r-lg dark:bg-[#1D1D1D]">
                            <div className="absolute inset-0 flex items-center justify-center bg-sky-50 dark:bg-sky-950/20">
                                <div className="text-center p-8">
                                    <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 mb-6 dark:bg-sky-900/50">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-sky-900 dark:text-sky-100">
                                        Empowering Education
                                    </h2>
                                    <p className="mt-4 text-sm text-sky-700/80 dark:text-sky-300/80 max-w-xs mx-auto">
                                        Bringing digital solutions to Dulag National High School for a better learning experience.
                                    </p>
                                </div>
                            </div>
                            <div className="absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-t-none lg:rounded-r-lg dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]"></div>
                        </div>
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
