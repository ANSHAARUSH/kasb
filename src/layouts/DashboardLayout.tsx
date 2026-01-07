import { BottomNav } from "../components/layout/BottomNav"
import { SideNav } from "../components/layout/SideNav"
import { NotificationBell } from "../components/layout/NotificationBell"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useEffect } from "react"

export function DashboardLayout() {
    const { user, role, loading } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (loading) return

        if (!user) {
            navigate('/login')
            return
        }

        // RBAC Redirection
        if (role === 'startup' && location.pathname.startsWith('/dashboard/investor')) {
            navigate('/dashboard/startup', { replace: true })
        } else if (role === 'investor' && location.pathname.startsWith('/dashboard/startup')) {
            navigate('/dashboard/investor', { replace: true })
        }
    }, [user, role, loading, location.pathname, navigate])

    if (loading || (!user && location.pathname !== '/')) {
        return (
            <div className="min-h-screen bg-off-white">
                <header className="sticky top-0 z-10 flex items-center border-b border-white/10 bg-black px-6 py-4">
                    <div className="flex-1 flex justify-center">
                        <div className="flex items-center gap-2.5">
                            <img src="/logo.jpg" alt="Logo" className="h-7 w-auto rounded-md" />
                            <span className="text-lg font-bold text-white tracking-tight">Kasb.AI</span>
                        </div>
                    </div>
                </header>
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="animate-pulse text-gray-400 font-medium">Loading session...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-off-white flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <SideNav />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 md:pl-64">
                {/* Mobile Header */}
                <header className="sticky top-0 z-40 flex items-center bg-black border-b border-white/10 px-6 py-4">
                    <div className="flex-1 md:hidden">
                        <div className="flex items-center gap-2.5">
                            <img src="/logo.jpg" alt="Logo" className="h-7 w-auto rounded-md" />
                            <span className="text-lg font-bold text-white tracking-tight">Kasb.AI</span>
                        </div>
                    </div>
                    <div className="flex-1 hidden md:block" /> {/* Spacer */}
                    <div className="flex-none">
                        <NotificationBell />
                    </div>
                </header>

                <main className="flex-1 px-4 py-6 pb-24 md:pb-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <BottomNav />
            </div>
        </div>
    )
}
