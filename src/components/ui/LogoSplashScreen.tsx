import { motion } from 'framer-motion';

interface LogoSplashScreenProps {
    onComplete: () => void;
}

export function LogoSplashScreen({ onComplete }: LogoSplashScreenProps) {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            onAnimationComplete={onComplete}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black overflow-hidden"
        >
            {/* Background ambient glow */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.4, 0.2], scale: [0.8, 1.2, 1] }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none"
            />

            <div className="relative flex flex-col items-center">
                {/* Logo Animation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                        duration: 0.8, 
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.1
                    }}
                    className="relative"
                >
                    <div className="absolute -inset-10 bg-white/10 blur-[60px] rounded-full animate-pulse" />
                    <video 
                        src={`${import.meta.env.BASE_URL}logo.mp4`}
                        autoPlay
                        muted
                        playsInline
                        className="h-32 w-32 md:h-44 md:w-44 rounded-3xl object-cover relative z-10 shadow-2xl"
                    />
                </motion.div>

                {/* Text Animation */}
                <div className="mt-8 text-center space-y-2 overflow-hidden">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                        className="text-white text-2xl md:text-3xl font-black uppercase tracking-[0.2em] italic"
                    >
                        Kasb.AI
                    </motion.h1>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.6, delay: 0.8, ease: "easeInOut" }}
                        className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ duration: 0.6, delay: 1.0 }}
                        className="text-white text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em]"
                    >
                        Building Future of Fundraising
                    </motion.p>
                </div>
            </div>

            {/* Bottom Accent */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="absolute bottom-12 flex items-center gap-3 text-white/20"
            >
                <div className="h-[1px] w-8 bg-current" />
                <span className="text-[8px] font-black uppercase tracking-widest">Premium Intelligence</span>
                <div className="h-[1px] w-8 bg-current" />
            </motion.div>
        </motion.div>
    );
}
