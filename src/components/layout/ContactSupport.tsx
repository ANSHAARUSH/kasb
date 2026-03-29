import { useState, useRef, useEffect } from "react";
import { Headphones, Mail, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ContactSupport() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-white group"
                title="Contact Support"
            >
                <Headphones className="h-6 w-6 group-hover:scale-110 transition-transform" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 z-50 p-4"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Headphones className="h-6 w-6 text-indigo-600" />
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Need Help?</h3>
                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                    Our support team is here for you. Drop us a line anytime!
                                </p>
                            </div>

                            <div className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-semibold text-gray-700">kasbai2025@gmail.com</span>
                            </div>

                            <a
                                href="mailto:kasbai2025@gmail.com?subject=Kasb Support Request"
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors active:scale-95"
                            >
                                Write Email <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
