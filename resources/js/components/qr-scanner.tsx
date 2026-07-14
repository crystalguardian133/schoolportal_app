import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type Props = {
    onScan: (decodedText: string) => void;
    enabled: boolean;
};

const SCANNER_ID = 'qr-scanner-region';

export function QrScanner({ onScan, enabled }: Props) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const startedRef = useRef(false);

    useEffect(() => {
        if (!enabled) {
            if (scannerRef.current && startedRef.current) {
                startedRef.current = false;
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear().catch(() => {});
                }).catch(() => {
                    scannerRef.current?.clear().catch(() => {});
                });
            }
            return;
        }

        const el = document.getElementById(SCANNER_ID);
        if (!el) return;

        const scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;

        scanner.start(
            { facingMode: 'environment' },
            {
                fps: 10,
                qrbox: { width: 150, height: 150 },
                aspectRatio: 1.0,
            },
            (decodedText) => {
                onScan(decodedText);
            },
            () => {},
        ).then(() => {
            startedRef.current = true;
        }).catch(() => {});

        return () => {
            startedRef.current = false;
            if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear().catch(() => {});
                }).catch(() => {
                    scannerRef.current?.clear().catch(() => {});
                });
            }
        };
    }, [enabled, onScan]);

    return (
        <div
            className={`overflow-hidden rounded-xl border border-border ${enabled ? '' : 'hidden'}`}
        >
            <div id={SCANNER_ID} className="min-h-[180px]" />
        </div>
    );
}
