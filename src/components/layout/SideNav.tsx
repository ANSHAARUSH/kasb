import { Home, History, MessageSquare, FileText, User, LogOut } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"
import { motion } from "framer-motion"
import { useAuth } from "../../context/AuthContext"
import { UsageTracker } from "../dashboard/UsageTracker"

export function SideNav() {
    const location = useLocation()
    const path = location.pathname
    const { role, signOut } = useAuth()

    // Determine routes based on role
    const isStartupDashboard = role === 'startup'
    const dashboardHome = isStartupDashboard ? '/dashboard/startup' : '/dashboard/investor'
    const historyRoute = isStartupDashboard ? '/dashboard/startup/history' : '/dashboard/investor/history'
    const messagesRoute = isStartupDashboard ? '/dashboard/startup/messages' : '/dashboard/investor/messages'
    const cheatSheetRoute = isStartupDashboard ? '/dashboard/startup/cheatsheet' : '/dashboard/investor/cheatsheet'
    const profileRoute = isStartupDashboard ? '/dashboard/startup/profile' : '/dashboard/investor/profile'

    const navItems = [
        { icon: Home, label: "Feed", href: dashboardHome },
        { icon: History, label: "History", href: historyRoute },
        { icon: MessageSquare, label: "Messages", href: messagesRoute },
        { icon: FileText, label: "Cheat Sheet", href: cheatSheetRoute },
        { icon: User, label: "Profile", href: profileRoute },
    ]

    return (
        <aside className="fixed left-0 top-0 z-50 hidden h-full w-64 flex-col border-r border-gray-100 bg-white md:flex">
            <div className="flex h-20 items-center px-6 border-b border-gray-50">
                <Link to="/" className="flex items-center gap-2.5">
                    <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Logo" className="h-8 w-auto rounded-md" />
                    <span className="text-xl font-bold tracking-tight text-black">Kasb.AI</span>
                </Link>
            </div>

            <nav className="flex-1 space-y-2 p-4 pt-8">
                {navItems.map((item) => {
                    const isActive = path === item.href
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300",
                                isActive
                                    ? "bg-black text-white shadow-lg shadow-gray-200"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-black"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-black")} />
                            <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="sideNavIndicator"
                                    className="absolute left-0 h-6 w-1 rounded-r-full bg-white opacity-20"
                                />
                            )}
                        </Link>
                    )
                })}
            </nav>

            <UsageTracker />

            <div className="p-4 border-t border-gray-50">
                <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 group"
                >
                    <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                    <span className="text-sm font-semibold">Sign Out</span>
                </button>
            </div>
        </aside>
    )
}
