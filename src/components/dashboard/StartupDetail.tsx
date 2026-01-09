import { motion, AnimatePresence } from "framer-motion"
import type { Startup } from "../../data/mockData"
import { X, GraduationCap, Briefcase, UserMinus, Maximize2, Minimize2, Minus, Sparkles } from "lucide-react"
import { Button } from "../ui/button"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getConnectionStatus, disconnectConnection, sendConnectionRequest, getGlobalConfig, getUserSetting, type ConnectionStatus } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { Lock, BarChart3 } from "lucide-react"
import { generateValuationInsights } from "../../lib/ai"

export type PanelSize = 'default' | 'full' | 'minimized'

interface StartupDetailProps {
    startup: Startup | null
    onClose: () => void
    onDisconnect?: () => void
    onResize?: (size: PanelSize) => void
    currentSize?: PanelSize
    triggerUpdate?: { startupId: string; timestamp: number } | null
    onConnectionChange?: (startupId: string) => void
}

export function StartupDetail({ startup, onClose, onDisconnect, onResize, currentSize = 'default', triggerUpdate, onConnectionChange }: StartupDetailProps) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null)
    const [isDisconnecting, setIsDisconnecting] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
    const [imgError, setImgError] = useState(false)
    const [valuationInsights, setValuationInsights] = useState<string | null>(null)
    const [isGeneratingValuation, setIsGeneratingValuation] = useState(false)

    useEffect(() => {
        if (!user || !startup?.id) return

        setShowDisconnectConfirm(false) // Reset on startup change
        setImgError(false) // Reset image error state

        async function checkStatus() {
            const status = await getConnectionStatus(user!.id, startup!.id)
            setConnStatus(status)
        }
        checkStatus()
    }, [user, startup?.id, triggerUpdate, startup?.logo])

    const canView = subscriptionManager.canViewProfile() || connStatus?.status === 'accepted'

    useEffect(() => {
        if (startup?.id && canView) {
            subscriptionManager.trackView()
        }
    }, [startup?.id, canView])

    const handleConnect = async () => {
        if (!user || !startup) return
        setIsConnecting(true)
        try {
            await sendConnectionRequest(user.id, startup.id)
            setConnStatus({ status: 'pending', isIncoming: false })
            onConnectionChange?.(startup.id)
            toast("Connection request sent", "success")
        } catch (error) {
            console.error(error)
            toast("Failed to send request", "error")
        } finally {
            setIsConnecting(false)
        }
    }

    const handleDisconnect = async () => {
        if (!user || !startup) return

        setIsDisconnecting(true)
        try {
            await disconnectConnection(user.id, startup.id)
            setConnStatus(null)
            toast("Connection removed", "info")
            onDisconnect?.()
            onConnectionChange?.(startup.id)
            onClose()
        } catch (error) {
            console.error(error)
            toast("Failed to disconnect", "error")
        } finally {
            setIsDisconnecting(false)
        }
    }

    const handleGenerateValuation = async () => {
        setIsGeneratingValuation(true)
        try {
            let apiKey = import.meta.env.VITE_GROQ_API_KEY
            if (!apiKey) apiKey = await getGlobalConfig('ai_api_key') || ''
            if (!apiKey && user) apiKey = await getUserSetting(user.id, 'ai_api_key') || ''

            if (!apiKey) {
                toast("AI features not configured.", "error")
                return
            }

            const insights = await generateValuationInsights(startup, apiKey)
            setValuationInsights(insights)
            toast("Valuation insights generated", "success")
        } catch (error) {
            console.error(error)
            toast("Generation failed", "error")
        } finally {
            setIsGeneratingValuation(false)
        }
    }

    if (!startup) {
        return (
            <div className="hidden lg:flex h-full items-center justify-center text-gray-400 p-8 text-center border-l border-gray-200">
                <div>
                    <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                        <Briefcase className="h-8 w-8 text-gray-400" />
                    </div>
                    <p>Select a startup to view details</p>
                </div>
            </div>
        )
    }

    // Determine if we are on a large screen (panel mode) or small screen (modal mode)
    // For simplicity, we can reuse this component. Ideally, the parent controls the rendering mode.
    // However, to keep it clean, let's export the inner content as a separate component or just handle it here.
    // Given the request, let's treat the 'panel' usage by checking if it's being rendered inside the new layout.
    // But since this is a shared component, let's allow it to adapt or be clean.

    // Better approach: New Prop `isPanel`?
    // Let's assume the parent handles the layout. We just need to ensure this component RENDERS the content.
    // The previous implementation had fixed position and modal logic.
    // We will separate the Content from the Modal Wrapper.

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="flex-none px-6 pt-6 pb-4 border-b border-gray-50">
                <div className="flex items-start justify-between mt-2">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden text-2xl font-bold text-gray-500">
                            {imgError || !(startup.logo?.startsWith('http') || startup.logo?.startsWith('/')) ? (
                                <div>
                                    {(!startup.logo?.startsWith('http') && !startup.logo?.startsWith('/')) ? startup.logo : (startup.name?.charAt(0).toUpperCase() || '?')}
                                </div>
                            ) : (
                                <img
                                    src={startup.logo}
                                    alt={startup.name}
                                    className="h-full w-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{startup.name}</h2>
                            <span className="text-sm text-gray-500">{startup.metrics.stage} • {startup.metrics.valuation}</span>
                        </div>
                    </div>
                    {/* Show close button only if onClose is meaningful/provided for mobile or specific flows */}
                    {/* In panel mode, we might not want a close button, or maybe we do to deselect. */}
                    {/* Let's keep it but styling might be different. */}
                    <div className="flex items-center gap-1">
                        {onResize && (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => onResize('minimized')} className="rounded-full hover:bg-gray-100 hidden lg:flex">
                                    <Minus className="h-4 w-4" />
                                </Button>
                                {currentSize === 'full' ? (
                                    <Button variant="ghost" size="icon" onClick={() => onResize('default')} className="rounded-full hover:bg-gray-100 hidden lg:flex">
                                        <Minimize2 className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="icon" onClick={() => onResize('full')} className="rounded-full hover:bg-gray-100 hidden lg:flex">
                                        <Maximize2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </>
                        )}
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100 lg:hidden">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Founder Section */}
                <section>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="bg-black text-white h-6 w-6 rounded-full flex items-center justify-center text-xs">F</span>
                        Founder
                    </h3>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50">
                        <img src={startup.founder.avatar} alt={startup.founder.name} className="h-16 w-16 rounded-full object-cover" />
                        <div>
                            <h4 className="font-bold">{startup.founder.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{startup.founder.bio}</p>
                            <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3" /> {startup.founder.education}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" /> {startup.founder.workHistory}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Metrics */}
                <section>
                    <h3 className="text-lg font-bold mb-4">Key Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm text-center">
                            <p className="text-sm text-gray-500">Traction</p>
                            <p className="text-xl font-bold text-green-600">{startup.metrics.traction}</p>
                        </div>
                        <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm text-center">
                            <p className="text-sm text-gray-500">Valuation</p>
                            <p className="text-xl font-bold">{startup.metrics.valuation}</p>
                        </div>
                    </div>

                    {/* AI Valuation Insights Add-on */}
                    <div className="mt-6">
                        {!valuationInsights ? (
                            <Button
                                variant="outline"
                                onClick={handleGenerateValuation}
                                disabled={isGeneratingValuation}
                                className="w-full rounded-2xl border-dashed border-2 hover:bg-gray-50 h-14"
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                {isGeneratingValuation ? "Analyzing Market Data..." : "Get AI Valuation Insights"}
                                {!subscriptionManager.hasFeature('Valuation') && (
                                    <span className="ml-2 text-[10px] bg-black text-white px-2 py-0.5 rounded-full">UPGRADE</span>
                                )}
                            </Button>
                        ) : (
                            <div className="p-6 rounded-2xl bg-gray-900 text-white animate-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-2 mb-3 text-gray-400">
                                    <Sparkles className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Market Valuation Analysis</span>
                                </div>
                                <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-line leading-relaxed">
                                    {valuationInsights}
                                </div>
                                <p className="mt-4 text-[10px] text-gray-500 italic">
                                    * This is an AI-generated estimate based on provided metrics and typical sector multiples.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Professional Investor Summary (AI Generated) */}
                {startup.summaryStatus === 'final' && startup.aiSummary && (
                    <section className="bg-amber-50/30 -mx-6 px-6 py-8 border-y border-amber-100/50 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-amber-600" />
                            <h3 className="text-lg font-bold text-amber-900">Professional Investor Summary</h3>
                        </div>

                        <div className={`prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-line font-medium ${!subscriptionManager.hasFeature('Advanced AI') ? 'blur-sm select-none' : ''}`}>
                            {startup.aiSummary}
                        </div>

                        {!subscriptionManager.hasFeature('Advanced AI') && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] p-6 text-center">
                                <Lock className="h-8 w-8 text-amber-600 mb-2" />
                                <p className="text-sm font-bold text-amber-900">Growth Tier Required</p>
                                <p className="text-xs text-amber-700 mt-1">Upgrade to unlock full AI-generated insights.</p>
                                <Button variant="outline" size="sm" className="mt-4 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => navigate('/dashboard/pricing')}>
                                    View Plans
                                </Button>
                            </div>
                        )}

                        {subscriptionManager.hasFeature('Advanced AI') && (
                            <p className="mt-4 text-[10px] text-amber-600/60 font-medium uppercase tracking-widest">
                                Generated from structured founder inputs • Verified by Kasb.AI
                            </p>
                        )}
                    </section>
                )}

                {/* Problem & Description */}
                <section>
                    <h3 className="text-lg font-bold mb-2">Problem We're Solving</h3>
                    <p className="text-gray-600 leading-relaxed">
                        {startup.problemSolving}
                    </p>
                </section>

                {startup.description && (
                    <section>
                        <h3 className="text-lg font-bold mb-2">About the Solution</h3>
                        <p className="text-gray-600 leading-relaxed">
                            {startup.description}
                        </p>
                    </section>
                )}

                {startup.history && (
                    <section>
                        <h3 className="text-lg font-bold mb-2">History</h3>
                        <p className="text-gray-600 leading-relaxed">
                            {startup.history}
                        </p>
                    </section>
                )}
            </div>

            {/* Upgrade Overlay for restricted profiles */}
            {!canView && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                    <div className="h-20 w-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-6">
                        <Lock className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Profile Locked</h3>
                    <p className="text-gray-500 max-w-xs mb-8">
                        You've reached your monthly profile view limit. Upgrade your plan to discover more opportunities.
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
            <div className="flex-none p-6 border-t border-gray-100 bg-white">
                {connStatus?.status === 'accepted' ? (
                    showDisconnectConfirm ? (
                        <div className="flex gap-3 animate-in fade-in zoom-in-95 duration-200">
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => setShowDisconnectConfirm(false)}
                                className="flex-1 rounded-2xl h-12 text-base border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={handleDisconnect}
                                disabled={isDisconnecting}
                                className="flex-1 rounded-2xl h-12 text-base bg-red-50 border-2 border-red-500 text-red-600 hover:bg-red-100"
                            >
                                {isDisconnecting ? "Disconnecting..." : "Confirm"}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setShowDisconnectConfirm(true)}
                            disabled={isDisconnecting}
                            className="w-full rounded-2xl h-12 text-base border-2 border-red-200 text-red-600 hover:bg-red-50"
                        >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Disconnect
                        </Button>
                    )
                ) : connStatus?.status === 'pending' ? (
                    <Button size="lg" disabled className="w-full rounded-2xl h-12 text-base bg-gray-100 text-gray-400">
                        Request Pending
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="w-full rounded-2xl h-12 text-base"
                    >
                        {isConnecting ? "Sending Request..." : "Connect with Founder"}
                    </Button>
                )}
            </div>
        </div>
    )
}

// Wrapper for Modal behavior if needed (legacy support or mobile specifics)
export function StartupDetailModal(props: StartupDetailProps) {
    return (
        <AnimatePresence>
            {props.startup && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={props.onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 h-[85vh] rounded-t-[2.5rem] bg-white shadow-2xl overflow-hidden flex flex-col lg:hidden"
                    >
                        <div className="relative flex-none px-6 pt-6 pb-4 border-b border-gray-50">
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-gray-200" />
                            {/* Re-use Header logic or simplify */}
                            <div className="flex justify-end">
                                <Button variant="ghost" size="icon" onClick={props.onClose} className="rounded-full hover:bg-gray-100">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        <StartupDetail {...props} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
