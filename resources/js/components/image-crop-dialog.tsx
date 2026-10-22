import { Minus, Plus } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Props = {
    open: boolean;
    imageSrc: string | null;
    /** Target width / height ratio of the crop (e.g. 4 for a 4:1 banner). */
    aspect: number;
    /** Width in pixels of the exported image. Height is derived from aspect. */
    outputWidth?: number;
    onCancel: () => void;
    onConfirm: (file: File) => void;
};

type Size = { width: number; height: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function clamp01(value: number) {
    return Math.min(1, Math.max(0, value));
}

function clampOffset(value: number, frameSize: number, displaySize: number) {
    // The image must always fully cover the frame, so the offset lives in
    // [frameSize - displaySize, 0].
    const min = frameSize - displaySize;

    return Math.min(0, Math.max(min, value));
}

/**
 * Dependency-free "cover" cropper: the image is dragged/zoomed underneath a
 * fixed frame whose shape matches the banner. Whatever sits inside the frame
 * is exactly what gets exported, so "only the selected area shows".
 *
 * The parent should remount this (via `key`) whenever the source image
 * changes so state starts fresh.
 */
export function ImageCropDialog({
    open,
    imageSrc,
    aspect,
    outputWidth = 1600,
    onCancel,
    onConfirm,
}: Props) {
    const frameRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const dragRef = useRef<{
        pointerId: number;
        startX: number;
        startY: number;
        originX: number;
        originY: number;
    } | null>(null);

    const [natural, setNatural] = useState<Size | null>(null);
    const [frame, setFrame] = useState<Size>({ width: 0, height: 0 });
    const [zoom, setZoom] = useState(MIN_ZOOM);
    // Normalized point of the image that sits at the frame's center.
    const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
    const [exporting, setExporting] = useState(false);

    const measureFrame = useCallback((element: HTMLDivElement) => {
        // clientWidth/Height are layout dimensions, so they stay correct even
        // while the dialog's enter animation scales the content.
        const width = element.clientWidth;
        const height = element.clientHeight;

        setFrame((prev) =>
            prev.width === width && prev.height === height
                ? prev
                : { width, height },
        );
    }, []);

    // Attach the observer through a callback ref rather than an effect: Radix
    // mounts the dialog content one tick after `open` flips, so an effect tied
    // to `open` would run while the node is still null and never measure.
    const observerRef = useRef<ResizeObserver | null>(null);
    const setFrameNode = useCallback(
        (node: HTMLDivElement | null) => {
            if (frameRef.current === node) {
                return;
            }

            frameRef.current = node;
            observerRef.current?.disconnect();
            observerRef.current = null;

            if (!node) {
                return;
            }

            const observer = new ResizeObserver((entries) => {
                const entry = entries[0];

                if (entry) {
                    const { width, height } = entry.contentRect;

                    setFrame((prev) =>
                        prev.width === width && prev.height === height
                            ? prev
                            : { width, height },
                    );
                }
            });

            observer.observe(node);
            observerRef.current = observer;
            measureFrame(node);
        },
        [measureFrame],
    );

    const baseScale =
        natural && frame.width > 0 && frame.height > 0
            ? Math.max(
                  frame.width / natural.width,
                  frame.height / natural.height,
              )
            : 1;

    const scale = baseScale * zoom;
    const displayWidth = natural ? natural.width * scale : 0;
    const displayHeight = natural ? natural.height * scale : 0;

    const ready =
        !!natural && frame.width > 0 && frame.height > 0 && scale > 0;

    const offsetX =
        ready && displayWidth > 0
            ? clampOffset(
                  frame.width / 2 - center.x * displayWidth,
                  frame.width,
                  displayWidth,
              )
            : 0;
    const offsetY =
        ready && displayHeight > 0
            ? clampOffset(
                  frame.height / 2 - center.y * displayHeight,
                  frame.height,
                  displayHeight,
              )
            : 0;

    function handleImageLoad() {
        const img = imageRef.current;

        if (!img) {
            return;
        }

        setNatural({ width: img.naturalWidth, height: img.naturalHeight });

        if (frameRef.current) {
            measureFrame(frameRef.current);
        }
    }

    function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
        if (!ready) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: offsetX,
            originY: offsetY,
        };
    }

    function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
        const drag = dragRef.current;

        if (!drag || drag.pointerId !== event.pointerId || !ready) {
            return;
        }

        const nextX = clampOffset(
            drag.originX + (event.clientX - drag.startX),
            frame.width,
            displayWidth,
        );
        const nextY = clampOffset(
            drag.originY + (event.clientY - drag.startY),
            frame.height,
            displayHeight,
        );

        setCenter({
            x: clamp01((frame.width / 2 - nextX) / displayWidth),
            y: clamp01((frame.height / 2 - nextY) / displayHeight),
        });
    }

    function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
        if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = null;
        }
    }

    const setZoomAroundCenter = useCallback((next: number) => {
        // Center stays fixed, so a plain zoom update keeps the same focal point.
        setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)));
    }, []);

    async function handleConfirm() {
        const img = imageRef.current;

        if (!img || !ready) {
            return;
        }

        const sourceX = -offsetX / scale;
        const sourceY = -offsetY / scale;
        const sourceWidth = frame.width / scale;
        const sourceHeight = frame.height / scale;

        const outWidth = Math.round(outputWidth);
        // Derive from the frame that was actually shown rather than the
        // requested aspect: the preview has a minimum height, so on very wide
        // banners the real frame is taller than `aspect` and the export must
        // match what the user framed.
        const outHeight = Math.max(
            1,
            Math.round((outputWidth * frame.height) / frame.width),
        );

        const canvas = document.createElement('canvas');
        canvas.width = outWidth;
        canvas.height = outHeight;

        const context = canvas.getContext('2d');

        if (!context) {
            return;
        }

        setExporting(true);

        context.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            outWidth,
            outHeight,
        );

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', 0.9),
        );

        setExporting(false);

        if (!blob) {
            return;
        }

        onConfirm(
            new File([blob], 'cover.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now(),
            }),
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    onCancel();
                }
            }}
        >
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Crop banner</DialogTitle>
                    <DialogDescription>
                        Drag the image to position it and use the slider to
                        zoom. Only the framed area will appear on your banner.
                    </DialogDescription>
                </DialogHeader>

                <div
                    ref={setFrameNode}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={{ aspectRatio: String(aspect) }}
                    className="relative min-h-[180px] w-full cursor-grab touch-none overflow-hidden rounded-xl border border-sidebar-border/70 bg-black/90 select-none active:cursor-grabbing"
                >
                    {imageSrc && (
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Banner to crop"
                            draggable={false}
                            onLoad={handleImageLoad}
                            className={`absolute max-w-none select-none transition-opacity duration-150 ${
                                ready ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{
                                width: displayWidth || undefined,
                                height: displayHeight || undefined,
                                left: offsetX,
                                top: offsetY,
                            }}
                        />
                    )}
                    {/* Rule-of-thirds guides */}
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                        {Array.from({ length: 9 }).map((_, index) => (
                            <div key={index} className="border border-white/15" />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Minus className="size-4 shrink-0 text-muted-foreground" />
                    <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.01}
                        value={zoom}
                        onChange={(e) =>
                            setZoomAroundCenter(Number(e.target.value))
                        }
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-indigo-600"
                    />
                    <Plus className="size-4 shrink-0 text-muted-foreground" />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={exporting || !ready}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {exporting ? 'Applying…' : 'Apply crop'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
