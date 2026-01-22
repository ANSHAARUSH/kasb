import { useState, useEffect, useRef } from "react"
import { subscriptionManager, TIER_LIMITS } from "../../lib/subscriptionManager"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Eye, Users, Zap, X } from "lucide-react"

export function UsageIcon({ className, showLabel = false, placement = 'top', isMobile = false }: { className?: string, showLabel?: boolean, placement?: 'top' | 'right', isMobile?: boolean }) {
    const [showTooltip, setShowTooltip] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const usage = subscriptionManager.getUsage()
    const tier = subscriptionManager.getTier()
    const limits = TIER_LIMITS[tier] || { profileViews: Infinity, contacts: Infinity, compares: Infinity }

    const isUnlimited = limits.profileViews === Infinity
    const usagePercentage = isUnlimited ? 0 : (usage.profileViews / limits.profileViews) * 100

    useEffect(() => {
        if (!showTooltip) return
        const handleClickAway = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowTooltip(false)
            }
        }
        document.addEventListener('mousedown', handleClickAway)
        return () => document.removeEventListener('mousedown', handleClickAway)
    }, [showTooltip])

    const items = [
        { label: "Profile Views", icon: Eye, current: usage.profileViews, total: limits.profileViews, color: "bg-black" },
        { label: "Contacts", icon: Users, current: usage.contacts, total: limits.contacts, color: "bg-gray-400" },
        { label: "AI Comparisons", icon: Sparkles, current: usage.compares, total: limits.compares, color: "bg-indigo-500" }
    ]

    const handleIconClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setShowTooltip(!showTooltip)
    }

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                onClick={handleIconClick}
                className={cn(
                    "flex flex-col items-center gap-1 transition-colors group relative",
                    !showLabel && "p-2 rounded-full hover:bg-white/10 text-white",
                    showLabel && "text-gray-400 hover:text-black",
                    className
                )}
                title={`View Plan Usage (${tier.replace('_', ' ')})`}
            >
                <Zap
                    className={cn(
                        isMobile ? "h-6 w-6" : "h-5 w-5",
                        "transition-transform group-hover:scale-110",
                        !isUnlimited && usagePercentage > 90
                            ? "text-amber-500 fill-amber-500"
                            : (showTooltip ? "text-black fill-black" : "currentColor")
                    )}
                />
                {showLabel && <span className={cn("text-[10px] font-medium leading-none", showTooltip && !isMobile && "text-black")}>Usage</span>}
                {!showLabel && <span className="sr-only">Plan Usage</span>}
            </button>

            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={placement === 'top'
                            ? (isMobile ? { opacity: 0, y: -10, scale: 0.95 } : { opacity: 0, y: 10, scale: 0.95 })
                            : { opacity: 0, x: -10, scale: 0.95 }
                        }
                        animate={placement === 'top'
                            ? { opacity: 1, y: 0, scale: 1 }
                            : { opacity: 1, x: 0, scale: 1 }
                        }
                        exit={placement === 'top'
                            ? (isMobile ? { opacity: 0, y: -10, scale: 0.95 } : { opacity: 0, y: 10, scale: 0.95 })
                            : { opacity: 0, x: -10, scale: 0.95 }
                        }
                        className={cn(
                            "absolute p-4 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-indigo-100 z-[100] animate-in fade-in md:w-80 w-72",
                            placement === 'top' && !isMobile && "bottom-full mb-3 slide-in-from-bottom-2",
                            placement === 'top' && isMobile && "top-full mt-2 slide-in-from-top-2",
                            placement === 'top' && (showLabel ? "left-1/2 -translate-x-1/2" : "right-0"),
                            placement === 'right' && "left-full top-1/2 -translate-y-1/2 ml-4 slide-in-from-left-2"
                        )}
                    >
                        {/* Tooltip Header */}
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-indigo-50">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                                </div>
                                <span className="font-bold text-black text-sm uppercase tracking-tighter">{tier.replace('_', ' ')} Plan</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowTooltip(false)
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Tooltip Body */}
                        <div className="space-y-4">
                            {items.map((item) => {
                                const unlimited = item.total === Infinity
                                const pct = unlimited ? 0 : Math.min((item.current / item.total) * 100, 100)

                                return (
                                    <div key={item.label}>
                                        <div className="flex justify-between text-[11px] font-bold mb-1.5">
                                            <div className="flex items-center gap-1.5 text-black uppercase tracking-tighter">
                                                <item.icon className="h-3 w-3" />
                                                {item.label}
                                            </div>
                                            <span className="text-black">
                                                {item.current} / {unlimited ? "∞" : item.total}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: unlimited ? "100%" : `${pct}%` }}
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    unlimited ? "bg-gradient-to-r from-gray-400 to-black" : item.color
                                                )}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-50 bg-gray-50/50 -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                            <p className="text-[10px] text-black leading-tight font-medium">
                                Usage resets monthly. Upgrade to increase limits and unlock premium features.
                            </p>
                        </div>

                        {/* Arrow */}
                        <div className={cn(
                            "absolute border-8 border-transparent",
                            placement === 'top' && !isMobile && "top-full border-t-white",
                            placement === 'top' && isMobile && "bottom-full border-b-white",
                            placement === 'top' && (showLabel ? "left-1/2 -translate-x-1/2" : "right-4"),
                            placement === 'right' && "right-full top-1/2 -translate-y-1/2 border-r-white"
                        )} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
