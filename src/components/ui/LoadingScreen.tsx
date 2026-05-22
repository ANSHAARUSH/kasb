import React from 'react';

/**
 * LoadingScreen component displays a fullscreen video animation of the logo.
 * Designed to replace standard text-based loading indicators for a premium feel.
 */
export function LoadingScreen() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[9999]">
            <div className="relative">
                {/* Subtle glow effect behind the logo for extra premium feel */}
                <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full" />

                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="relative w-48 h-48 md:w-64 md:h-64 object-contain"
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <source src="/logo.mp4" type="video/mp4" />
                    {/* Fallback content in case video isn't supported or fails to load */}
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-t-2 border-white/20 border-solid rounded-full animate-spin mb-4" />
                        <div className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-light">
                            Loading
                        </div>
                    </div>
                </video>
            </div>
        </div>
    );
}
