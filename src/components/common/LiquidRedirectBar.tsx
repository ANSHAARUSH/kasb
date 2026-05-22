import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface LiquidRedirectBarProps {
    targetUrl: string | null;
    onComplete: () => void;
}

export function LiquidRedirectBar({ targetUrl, onComplete }: LiquidRedirectBarProps) {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (!targetUrl) {
            setCountdown(5);
            return;
        }

        const interval = setInterval(() => {
            setCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);

        const timer = setTimeout(() => {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
            onComplete();
        }, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [targetUrl, onComplete]);

    return (
        <AnimatePresence>
            {targetUrl && (
                <div className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="text-white text-center flex flex-col items-center justify-center max-w-md px-6"
                    >
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.1, 1],
                            }}
                            transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-8"
                        >
                            <ExternalLink className="w-10 h-10 text-white" />
                        </motion.div>

                        <h2 className="text-4xl font-black uppercase tracking-tight mb-4">Redirecting</h2>
                        <p className="text-gray-400 text-lg mb-12">
                            Taking you to the website in {countdown} seconds...
                        </p>
                        
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="h-full bg-white rounded-full"
                            />
                        </div>
                        
                        <button 
                            onClick={() => {
                                window.open(targetUrl, '_blank', 'noopener,noreferrer');
                                onComplete();
                            }}
                            className="mt-12 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Click here if you are not redirected
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
