import { LayoutDashboard, Users, ShieldAlert, MessageSquare, Settings, LogOut, Flag } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"

export type AdminTab = 'overview' | 'users' | 'moderation' | 'messages' | 'reports' | 'settings'

interface AdminLayoutProps {
    children: React.ReactNode
    activeTab: AdminTab
    setActiveTab: (tab: AdminTab) => void
    onLogout?: () => void
}

export function AdminLayout({ children, activeTab, setActiveTab, onLogout }: AdminLayoutProps) {
    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'moderation', label: 'Moderation', icon: ShieldAlert },
        { id: 'reports', label: 'Reports', icon: Flag },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <span className="text-indigo-600">❖</span> Admin
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as AdminTab)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-black text-white shadow-lg shadow-black/10"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-black"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-black")} />
                                {item.label}
                            </button>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={onLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
