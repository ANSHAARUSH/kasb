import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { subscriptionManager, TIER_LIMITS } from "../../lib/subscriptionManager"
import { Eye, Users, Zap } from "lucide-react"
import { cn } from "../../lib/utils"

export function UsageTracker() {
    const [usage, setUsage] = useState(subscriptionManager.getUsage())
    const tier = subscriptionManager.getTier()
    const limits = TIER_LIMITS[tier]

    useEffect(() => {
        // Simple polling to keep usage in sync if changed elsewhere
        const interval = setInterval(() => {
            setUsage(subscriptionManager.getUsage())
        }, 2000)
        return () => clearInterval(interval)
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

    return (
        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 mx-4 mb-4">
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
        </div>
    )
}
