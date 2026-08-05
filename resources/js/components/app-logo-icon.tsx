import type { HTMLAttributes } from 'react';
import dnhsIcon from '../../assets/app_icon/dnhs_hd_256.webp';

export default function AppLogoIcon(props: HTMLAttributes<HTMLImageElement>) {
    return <img src={dnhsIcon} alt="DNHS" {...props} />;
}
