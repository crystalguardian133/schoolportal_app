import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-11 items-center justify-center rounded-md bg-transparent group-data-[collapsible=icon]:size-8">
                <AppLogoIcon className="size-11 group-data-[collapsible=icon]:size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    DNHS School Portal
                </span>
            </div>
        </>
    );
}
