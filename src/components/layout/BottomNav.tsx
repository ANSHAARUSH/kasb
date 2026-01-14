import { Home, History, MessageSquare, User, FileText, BarChart3 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"
import { motion } from "framer-motion"

export function BottomNav() {
    const location = useLocation()
    const path = location.pathname

    // Determine if user is on startup or investor dashboard
    const isStartupDashboard = path.includes('/dashboard/startup')
    const dashboardHome = isStartupDashboard ? '/dashboard/startup' : '/dashboard/investor'
    const historyRoute = isStartupDashboard ? '/dashboard/startup/history' : '/dashboard/investor/history'
    const messagesRoute = isStartupDashboard ? '/dashboard/startup/messages' : '/dashboard/investor/messages'
    const cheatSheetRoute = isStartupDashboard ? '/dashboard/startup/cheatsheet' : '/dashboard/investor/cheatsheet'
    const profileRoute = isStartupDashboard ? '/dashboard/startup/profile' : '/dashboard/investor/profile'
    const analyticsRoute = '/dashboard/startup/analytics'

    const navItems = [
        { icon: Home, label: "Home", href: dashboardHome },
        { icon: History, label: "History", href: historyRoute },
        { icon: MessageSquare, label: "Chat", href: messagesRoute },
        { icon: FileText, label: "Cheat", href: cheatSheetRoute },
        ...(isStartupDashboard ? [{ icon: BarChart3, label: "Data", href: analyticsRoute }] : []),
        { icon: User, label: "Profile", href: profileRoute },
    ]

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-100 bg-white px-6 pb-6 pt-4 safe-area-bottom md:hidden">
            <div className="flex items-center justify-between relative">
                {navItems.map((item) => {
                    const isActive = path === item.href
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "relative flex flex-col items-center gap-1 transition-colors px-4 py-1",
                                isActive ? "text-black" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="navTab"
                                    className="absolute inset-0 rounded-2xl bg-gray-50 -z-10"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <item.icon className={cn("h-6 w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium leading-none">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
