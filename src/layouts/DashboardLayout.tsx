import { BottomNav } from "../components/layout/BottomNav"
import { SideNav } from "../components/layout/SideNav"
import { NotificationBell } from "../components/layout/NotificationBell"
import { UsageBell } from "../components/layout/UsageBell"
import { Mail } from "lucide-react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { subscriptionManager } from "../lib/subscriptionManager"
// import { KYCVerification } from "../components/dashboard/KYCVerification"
import { useEffect } from "react"

export function DashboardLayout() {
    const { user, role, /* kycStatus, */ loading } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (loading) return

        if (!user) {
            navigate('/login')
            return
        }

        // Redirect to onboarding if authenticated but no role
        if (!role) {
            navigate('/onboarding', { replace: true })
            return
        }

        // RBAC Redirection
        if (role === 'startup' && location.pathname.startsWith('/dashboard/investor')) {
            // Allow access to investor public profiles and cheatsheet
            const isPublicProfile = location.pathname.match(/^\/dashboard\/investor\/[a-f0-9-]+$/)
            const isCheatsheet = location.pathname.includes('/cheatsheet')

            if (!isPublicProfile && !isCheatsheet) {
                navigate('/dashboard/startup', { replace: true })
            }
        } else if (role === 'investor' && location.pathname.startsWith('/dashboard/startup')) {
            // Allow access to startup public profiles and cheatsheet (if implemented later)
            const isPublicProfile = location.pathname.match(/^\/dashboard\/startup\/[a-f0-9-]+$/)
            const isCheatsheet = location.pathname.includes('/cheatsheet')

            if (!isPublicProfile && !isCheatsheet) {
                navigate('/dashboard/investor', { replace: true })
            }
        }
    }, [user, role, loading, location.pathname, navigate])

    if (loading || (!user && location.pathname !== '/')) {
        return (
            <div className="min-h-screen bg-off-white">
                <header className="sticky top-0 z-10 flex items-center border-b border-white/10 bg-black px-6 py-4">
                    <div className="flex-1 flex justify-center">
                        <div className="flex items-center gap-2.5">
                            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Logo" className="h-7 w-auto rounded-md" />
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
                            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Logo" className="h-7 w-auto rounded-md" />
                            <span className="text-lg font-bold text-white tracking-tight">Kasb.AI</span>
                        </div>
                    </div>
                    <div className="flex-1 hidden md:block" /> {/* Spacer */}
                    <div className="flex-none flex items-center gap-2">
                        {subscriptionManager.hasPaidPlan() && (
                            <a
                                href="https://mail.google.com/mail/?view=cm&fs=1&to=kasbai2025@gmail.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-white/60 hover:text-white transition-colors"
                                title="Contact Support"
                            >
                                <Mail className="w-5 h-5" />
                            </a>
                        )}
                        <UsageBell className="md:hidden" />
                        <NotificationBell />
                    </div>
                </header>

                <main className="flex-1 px-4 md:py-6 pt-0 pb-24 md:pb-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Temporarily disabled KYC requirement */}
                        {/* kycStatus === 'verified' ? (
                            <Outlet />
                        ) : (
                            <KYCVerification />
                        ) */}
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <BottomNav />
            </div>
        </div>
    )
}
