import { useState, useEffect, useRef } from "react"
import { Zap, Eye, Users } from "lucide-react"
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

    const items = [
        {
            label: "Profile Views",
            icon: Eye,
            current: usage.profileViews,
            total: limits.profileViews,
            color: "bg-black"
        },
        {
            label: "Contacts",
            icon: Users,
            current: usage.contacts,
            total: limits.contacts,
            color: "bg-gray-400"
        }
    ]

    const profileViewsLeft = limits.profileViews === Infinity ? '∞' : Math.max(0, limits.profileViews - usage.profileViews)

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
                            Plan Usage
                        </div>

                        <div className="space-y-4">
                            {items.map((item) => {
                                const isUnlimited = item.total === Infinity
                                const percentage = isUnlimited ? 0 : Math.min((item.current / item.total) * 100, 100)

                                return (
                                    <div key={item.label}>
                                        <div className="flex justify-between text-[11px] font-bold mb-1.5">
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <item.icon className="h-3 w-3" />
                                                {item.label}
                                            </div>
                                            <span className="text-black">
                                                {item.current} / {isUnlimited ? "∞" : item.total}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: isUnlimited ? "100%" : `${percentage}%` }}
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    isUnlimited ? "bg-gradient-to-r from-gray-400 to-black" : item.color
                                                )}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center px-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Current Plan</span>
                            <span className="text-[10px] font-black uppercase text-black italic">{tier.replace('_', ' ')}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
