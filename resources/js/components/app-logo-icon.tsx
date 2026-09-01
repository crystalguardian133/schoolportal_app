import type { HTMLAttributes } from 'react';
import dnhs128 from '../../assets/app_icon/dnhs_hd_128.webp';
import dnhs256 from '../../assets/app_icon/dnhs_hd_256.webp';
import dnhs64 from '../../assets/app_icon/dnhs_hd_64.webp';

const LOGO_SRCSET = `${dnhs64} 64w, ${dnhs128} 128w, ${dnhs256} 256w`;

export default function AppLogoIcon({
    sizes = '3.5rem',
    ...props
}: HTMLAttributes<HTMLImageElement> & { sizes?: string }) {
    return <img src={dnhs256} srcSet={LOGO_SRCSET} sizes={sizes} alt="DNHS" {...props} />;
}