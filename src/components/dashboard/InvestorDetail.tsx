import { motion, AnimatePresence } from "framer-motion"
import type { Investor } from "../../data/mockData"
import { X, Briefcase, TrendingUp, UserMinus } from "lucide-react"
import { Button } from "../ui/button"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getConnectionStatus, disconnectConnection, type ConnectionStatus } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { Lock } from "lucide-react"

interface InvestorDetailProps {
    investor: Investor | null
    onClose: () => void
    onDisconnect?: () => void
}

export function InvestorDetail({ investor, onClose, onDisconnect }: InvestorDetailProps) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null)
    const [isDisconnecting, setIsDisconnecting] = useState(false)

    useEffect(() => {
        if (!user || !investor?.id) return

        async function checkStatus() {
            const status = await getConnectionStatus(user!.id, investor!.id)
            setConnStatus(status)
        }
        checkStatus()
    }, [user, investor?.id])

    const canView = subscriptionManager.canViewProfile(investor?.id) || connStatus?.status === 'accepted'

    useEffect(() => {
        if (investor?.id && canView) {
            subscriptionManager.trackView(investor.id)
        }
    }, [investor?.id, canView])

    const handleDisconnect = async () => {
        if (!user || !investor) return

        setIsDisconnecting(true)
        try {
            await disconnectConnection(user.id, investor.id)
            setConnStatus(null)
            toast("Connection removed", "info")
            onDisconnect?.()
            onClose()
        } catch (error) {
            console.error(error)
            toast("Failed to disconnect", "error")
        } finally {
            setIsDisconnecting(false)
        }
    }
    return (
        <AnimatePresence>
            {investor && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 h-[85vh] rounded-t-[2.5rem] bg-white shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header / Drag Handle */}
                        <div className="relative flex-none px-6 pt-6 pb-4 border-b border-gray-50">
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-gray-200" />
                            <div className="flex items-start justify-between mt-2">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-full bg-gray-50 overflow-hidden font-bold text-gray-500 ring-1 ring-gray-100 shadow-sm text-2xl">
                                        {(investor.avatar?.startsWith('http') || investor.avatar?.startsWith('/')) ? (
                                            <img
                                                src={investor.avatar}
                                                alt={investor.name}
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                    const parent = target.parentElement
                                                    if (parent) {
                                                        parent.innerText = investor.name?.charAt(0).toUpperCase() || '?'
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <span>{investor.avatar || (investor.name?.charAt(0).toUpperCase() || '?')}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{investor.name}</h2>
                                        <span className="text-sm text-gray-500">{investor.investments} Portfolio Companies</span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">
                            {/* Bio Section */}
                            <section>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="bg-black text-white h-6 w-6 rounded-full flex items-center justify-center text-xs">i</span>
                                    About
                                </h3>
                                <div className="p-4 rounded-2xl bg-gray-50">
                                    <p className="text-gray-600 leading-relaxed">{investor.bio}</p>
                                </div>
                            </section>

                            {/* Investment Metrics */}
                            <section>
                                <h3 className="text-lg font-bold mb-4">Investment Profile</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm text-center">
                                        <p className="text-sm text-gray-500">Available Funds</p>
                                        <p className="text-xl font-bold text-green-600">{investor.fundsAvailable}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm text-center">
                                        <p className="text-sm text-gray-500">Portfolio Size</p>
                                        <p className="text-xl font-bold">{investor.investments} Companies</p>
                                    </div>
                                </div>
                            </section>

                            {/* Expertise */}
                            <section>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Areas of Expertise
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {investor.expertise.map((area, idx) => (
                                        <span
                                            key={idx}
                                            className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium"
                                        >
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            </section>

                            {/* Investment History Placeholder */}
                            <section>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" />
                                    Recent Investments
                                </h3>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold">Portfolio Company {i}</div>
                                                    <div className="text-sm text-gray-500">Series A • 2024</div>
                                                </div>
                                                <div className="text-sm font-medium text-green-600">Active</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Upgrade Overlay for restricted profiles */}
                        {!canView && (
                            <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                                <div className="h-20 w-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-6">
                                    <Lock className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Investor Profile Locked</h3>
                                <p className="text-gray-500 max-w-xs mb-8">
                                    Unlock premium investor profiles and direct contact features with a professional plan.
                                </p>
                                <div className="flex flex-col gap-3 w-full max-w-xs">
                                    <Button size="lg" className="rounded-2xl h-12 text-base font-bold shadow-lg shadow-black/5" onClick={() => navigate('/dashboard/pricing')}>
                                        View Plans
                                    </Button>
                                    <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-black hover:bg-transparent font-medium">
                                        Maybe later
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Sticky Action Footer */}
                        <div className="flex-none p-6 border-t border-gray-100 bg-white safe-area-bottom">
                            {connStatus?.status === 'accepted' ? (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handleDisconnect}
                                    disabled={isDisconnecting}
                                    className="w-full rounded-2xl h-12 text-base border-2 border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                                </Button>
                            ) : (
                                <Button size="lg" className="w-full rounded-2xl h-12 text-base">
                                    Connect with Investor
                                </Button>
                            )}
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
