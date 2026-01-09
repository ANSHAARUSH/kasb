import { useState, useEffect, useRef } from "react"
import { Zap, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { subscriptionManager, TIER_LIMITS } from "../../lib/subscriptionManager"
import { cn } from "../../lib/utils"

export function UsageBell({ className }: { className?: string }) {
    const [usage, setUsage] = useState(subscriptionManager.getUsage())
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const tier = subscriptionManager.getTier()
    const limits = TIER_LIMITS[tier] || { profileViews: 0, contacts: 0 }

    useEffect(() => {
        const interval = setInterval(() => {
            setUsage(subscriptionManager.getUsage())
        }, 2000)

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            clearInterval(interval)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const profileViewsLeft = limits.profileViews === Infinity ? '∞' : Math.max(0, limits.profileViews - usage.profileViews)
    const contactsLeft = limits.contacts === Infinity ? '∞' : Math.max(0, limits.contacts - usage.contacts)

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-white group"
            >
                <Zap className={cn(
                    "h-6 w-6 transition-transform group-hover:scale-110",
                    (typeof profileViewsLeft === 'number' && profileViewsLeft <= 0) ? "text-amber-500 fill-amber-500" : "text-white"
                )} />
                {limits.profileViews !== Infinity && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black ring-2 ring-black/20">
                        {profileViewsLeft}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 z-50 p-4"
                    >
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                            <Zap className="h-3 w-3 fill-gray-400" />
                            Remaining Usage
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-[11px] font-bold mb-1">
                                    <span className="text-gray-500 uppercase tracking-tighter text-[9px]">Profile Views Left</span>
                                    <span className="text-black">{profileViewsLeft}</span>
                                </div>
                                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: limits.profileViews === Infinity ? '100%' : `${(Math.max(0, limits.profileViews - usage.profileViews) / limits.profileViews) * 100}%` }}
                                        className="h-full bg-black rounded-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-[11px] font-bold mb-1">
                                    <span className="text-gray-500 uppercase tracking-tighter text-[9px]">Contacts Left</span>
                                    <span className="text-black">{contactsLeft}</span>
                                </div>
                                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: limits.contacts === Infinity ? '100%' : `${(Math.max(0, limits.contacts - usage.contacts) / limits.contacts) * 100}%` }}
                                        className="h-full bg-gray-400 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase">
                                <Info className="h-2.5 w-2.5" />
                                Tier: {tier.replace('_', ' ')}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
