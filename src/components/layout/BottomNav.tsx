import { Home, MessageSquare, User, Sparkles, Shield, History, FileText } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"
import { motion } from "framer-motion"
import { useAuth } from "../../context/AuthContext"

export function BottomNav() {
    const location = useLocation()
    const path = location.pathname
    const { role } = useAuth()

    // Determine if user is on startup or investor dashboard
    const isStartupDashboard = path.includes('/dashboard/startup')
    const dashboardHome = isStartupDashboard ? '/dashboard/startup' : '/dashboard/investor'
    const messagesRoute = isStartupDashboard ? '/dashboard/startup/messages' : '/dashboard/investor/messages'
    const profileRoute = isStartupDashboard ? '/dashboard/startup/profile' : '/dashboard/investor/profile'
    const historyRoute = isStartupDashboard ? '/dashboard/startup/history' : '/dashboard/investor/history'

    const navItems = [
        { icon: Home, label: "Feed", href: dashboardHome },
        { icon: History, label: "Saved", href: historyRoute },
        { icon: MessageSquare, label: "Inbox", href: messagesRoute },
        ...(isStartupDashboard ? [
            { icon: Sparkles, label: "Founder GPT", href: '/dashboard/startup/foundergpt' },
            { icon: FileText, label: "Cheat Sheet", href: '/dashboard/startup/cheatsheet' }
        ] : [
            { icon: Sparkles, label: "Kasb AI", href: '/dashboard/investor/cheatsheet' }
        ]),
        { icon: User, label: "Profile", href: profileRoute },
        ...(role === 'admin' ? [{ icon: Shield, label: "Admin", href: "/admin-portal-v3x8z1" }] : []),
    ]

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-100 bg-white px-4 pb-6 pt-4 safe-area-bottom md:hidden">
            <div className="max-w-md mx-auto relative">
                <div className="flex items-center">
                    {navItems.map((item) => {
                        const isActive = path === item.href
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "relative flex flex-1 flex-col items-center gap-1 transition-colors py-1",
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
                                <span className="text-[10px] font-medium leading-none text-center">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
