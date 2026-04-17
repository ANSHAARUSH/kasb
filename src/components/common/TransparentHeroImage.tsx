import React, { useEffect, useState } from 'react';

interface TransparentHeroImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    backgroundType?: 'light' | 'dark' | 'light-with-watermark';
}

/**
 * High-Definition Transparent Image Component.
 * Removes checkerboard/solid backgrounds with feathered edges for clarity.
 */
export const TransparentHeroImage: React.FC<TransparentHeroImageProps> = ({ 
    src, 
    className, 
    backgroundType = 'light',
    ...props 
}) => {
    const [processedSrc, setProcessedSrc] = useState<string | null>(null);

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Skip expensive canvas processing on mobile — just show raw image
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            setProcessedSrc(src);
            setIsLoaded(true);
            return;
        }

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src;

        img.onload = () => {
            // Cap DPR at 1.5 for performance on high-DPI screens
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            const canvas = document.createElement('canvas');
            // We scale the internal canvas for High-DPI sharpness
            canvas.width = img.naturalWidth * dpr;
            canvas.height = img.naturalHeight * dpr;
            
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
                setProcessedSrc(src);
                setIsLoaded(true);
                return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            const isBackground = (idx: number) => {
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                // Checkerboards are mostly grayscale. Max difference < 25 is a safe bet for background.
                const isGrayscale = Math.max(r, g, b) - Math.min(r, g, b) < 25;
                
                if (backgroundType === 'dark') {
                    // Optimized for dark backgrounds/checkerboards
                    return isGrayscale && r < 120;
                } else if (backgroundType === 'light-with-watermark') {
                    // Removes light checkerboard + dark watermarks/logos (Aggressive threshold)
                    return isGrayscale && (r > 165 || r < 100);
                } else {
                    // Optimized for light/white backgrounds (STRICT - safe for Hero)
                    return isGrayscale && r > 165;
                }
            };

            const visited = new Uint8Array(canvas.width * canvas.height);
            const stack: { x: number; y: number }[] = [];
            
            for (let x = 0; x < canvas.width; x++) {
                stack.push({ x, y: 0 });
                stack.push({ x, y: canvas.height - 1 });
            }
            for (let y = 0; y < canvas.height; y++) {
                stack.push({ x: 0, y });
                stack.push({ x: canvas.width - 1, y });
            }

            while (stack.length > 0) {
                const { x, y } = stack.pop()!;
                const pixelIndex = y * canvas.width + x;
                const dataIndex = pixelIndex * 4;

                if (visited[pixelIndex]) continue;
                visited[pixelIndex] = 1;

                if (isBackground(dataIndex)) {
                    data[dataIndex + 3] = 0;
                    if (x > 0) stack.push({ x: x - 1, y });
                    if (x < canvas.width - 1) stack.push({ x: x + 1, y });
                    if (y > 0) stack.push({ x, y: y - 1 });
                    if (y < canvas.height - 1) stack.push({ x, y: y + 1 });
                }
            }

            for (let y = 1; y < canvas.height - 1; y++) {
                for (let x = 1; x < canvas.width - 1; x++) {
                    const idx = (y * canvas.width + x) * 4;
                    if (data[idx + 3] !== 0) {
                        const neighbors = [
                            ((y - 1) * canvas.width + x) * 4 + 3,
                            ((y + 1) * canvas.width + x) * 4 + 3,
                            (y * canvas.width + (x - 1)) * 4 + 3,
                            (y * canvas.width + (x + 1)) * 4 + 3
                        ];
                        
                        let transparentNeighbors = 0;
                        for (const nAlpha of neighbors) {
                            if (data[nAlpha] === 0) transparentNeighbors++;
                        }
                        
                        if (transparentNeighbors > 0) {
                            data[idx + 3] = 255 - (transparentNeighbors * 50);
                        }
                    }
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            setProcessedSrc(canvas.toDataURL('image/png', 1.0));
            setIsLoaded(true);
        };

        img.onerror = () => {
            setProcessedSrc(src);
            setIsLoaded(true);
        };
    }, [src]);

    return (
        <img 
            src={processedSrc || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} 
            className={`${className} transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
            style={{ 
                ...props.style,
                imageRendering: 'auto',
                WebkitBackfaceVisibility: 'hidden',
                filter: isLoaded ? 'contrast(1.08) brightness(1.03) saturate(1.05)' : 'none',
                transform: 'translateZ(0)', // Force GPU acceleration
            }}
            {...props} 
        />
    );
};
