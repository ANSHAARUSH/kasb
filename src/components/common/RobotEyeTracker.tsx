import { useState, useEffect, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

export function RobotEyeTracker({ src, className = "" }: { src: string, className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // We use framer-motion springs for smooth following
    const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
    const xSpring = useSpring(0, springConfig);
    const ySpring = useSpring(0, springConfig);

    useEffect(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate bounded offsets for the eyes
        const maxOffset = 15; // Max pixels the eyes can move
        
        let deltaX = mousePos.x - centerX;
        let deltaY = mousePos.y - centerY;
        
        // Normalize delta to screen dimensions roughly
        const percentX = Math.max(-1, Math.min(1, deltaX / (window.innerWidth / 2)));
        const percentY = Math.max(-1, Math.min(1, deltaY / (window.innerHeight / 2)));

        xSpring.set(percentX * maxOffset);
        ySpring.set(percentY * maxOffset);
    }, [mousePos, xSpring, ySpring]);

    // Head tilt effect removed as per user request to keep the body static

    return (
        <div 
            ref={containerRef}
            className={`relative inline-block ${className}`}
        >
            <div className="w-full h-full relative flex items-center justify-center">
                {/* Base static robot image (body remains static) */}
                <img 
                    src={src} 
                    alt="Robot Mascot" 
                    className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                />

                {/* 
                  Cover up the original baked-in eyes. 
                  The screen is roughly in the center. We use a blurred dark ellipse
                  to hide the yellow eyes while blending with the screen's dark background.
                */}
                <div 
                    className="absolute z-10 rounded-full bg-[#181818] blur-[6px]"
                    style={{
                        width: '32%',
                        height: '24%',
                        top: '41%',
                        left: '34%',
                    }}
                />

                {/* Animated CSS eyes over the cover */}
                <motion.div
                    style={{ 
                        x: xSpring,
                        y: ySpring,
                        width: '32%',
                        height: '24%',
                        top: '41%',
                        left: '34%',
                    }}
                    className="absolute z-20 flex gap-[15%] items-center justify-center pointer-events-none"
                >
                    <div className="w-[14%] h-[60%] rounded-full bg-[#fffae6] shadow-[0_0_12px_3px_rgba(251,191,36,0.7),inset_0_0_4px_rgba(255,255,255,1)]" />
                    <div className="w-[14%] h-[60%] rounded-full bg-[#fffae6] shadow-[0_0_12px_3px_rgba(251,191,36,0.7),inset_0_0_4px_rgba(255,255,255,1)]" />
                </motion.div>
            </div>
        </div>
    );
}
