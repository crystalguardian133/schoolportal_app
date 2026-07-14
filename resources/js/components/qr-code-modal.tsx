import { QRCodeSVG } from 'qrcode.react';
import { X, Download } from 'lucide-react';
import { useRef } from 'react';

type Props = {
    open: boolean;
    onClose: () => void;
    studentName: string;
    lrn: string | null;
    qrToken: string;
};

export function QrCodeModal({ open, onClose, studentName, lrn, qrToken }: Props) {
    const svgRef = useRef<HTMLDivElement>(null);

    if (!open) return null;

    function downloadQR() {
        const svgEl = svgRef.current?.querySelector('svg');
        if (!svgEl) return;

        const svgData = new XMLSerializer().serializeToString(svgEl);
        const canvas = document.createElement('canvas');
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
            const a = document.createElement('a');
            a.download = `qr-code-${studentName.replace(/\s+/g, '-').toLowerCase()}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-sidebar"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">My QR Code</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="mt-5 text-center">
                    <p className="text-base font-medium">{studentName}</p>
                    {lrn && <p className="mt-0.5 text-sm text-muted-foreground">LRN: {lrn}</p>}
                </div>

                <div className="mt-6 flex justify-center">
                    <div
                        ref={svgRef}
                        className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-background"
                    >
                        <QRCodeSVG value={qrToken} size={240} />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={downloadQR}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                    <Download className="size-4" />
                    Download QR Code
                </button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                    Show this to your teacher when they scan for attendance.
                </p>
            </div>
        </div>
    );
}
