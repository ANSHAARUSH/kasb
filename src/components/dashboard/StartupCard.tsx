import type { Startup } from "../../data/mockData"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { BookmarkPlus, ShieldCheck, MessageSquare, UserPlus, Clock, CheckCircle, X, Sparkles, TrendingUp, Info } from "lucide-react"
import { cn } from "../../lib/utils"
import { useState, useEffect } from "react"
import { getConnectionStatus, sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest, closeDeal, disconnectConnection, type ConnectionStatus } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { Avatar } from "../ui/Avatar"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { useNavigate } from "react-router-dom"

interface StartupCardProps {
    startup: Startup
    onClick: () => void
    onDoubleClick: () => void
    isSelected: boolean
    action?: React.ReactNode
    isSaved?: boolean
    onToggleSave?: (startup: Startup) => void
    onMessageClick?: (startup: Startup) => void
    triggerUpdate?: { startupId: string; timestamp: number } | null
    onConnectionChange?: (startupId: string) => void
    isRecommended?: boolean
    aiRecommendation?: {
        score: number
        explanation: string
        highlights: string[]
    }
    showImpactPoints?: boolean
    isFirstInRow?: boolean
    isLastInRow?: boolean
    showPercentage?: boolean
}

export function StartupCard({ startup, onClick, onDoubleClick, isSelected, isSaved = false, onToggleSave, onMessageClick, triggerUpdate, onConnectionChange, isRecommended, aiRecommendation, showImpactPoints, isFirstInRow, isLastInRow, showPercentage }: StartupCardProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
    const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isClosingDeal, setIsClosingDeal] = useState(false)
    const [isDisconnecting, setIsDisconnecting] = useState(false)
    const [showAiTooltip, setShowAiTooltip] = useState(false)

    useEffect(() => {
        if (!showAiTooltip) return

        const handleClickAway = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('.ai-tooltip-container')) {
                setShowAiTooltip(false)
            }
        }

        document.addEventListener('mousedown', handleClickAway)
        return () => document.removeEventListener('mousedown', handleClickAway)
    }, [showAiTooltip])

    useEffect(() => {
        if (!user || !startup.id) return

        async function checkStatus() {
            const status = await getConnectionStatus(user!.id, startup.id)
            setConnStatus(status)
        }
        checkStatus()
    }, [user, startup.id, triggerUpdate])

    const handleConnect = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user) {
            toast("Please login to connect", "error")
            return
        }

        if (!subscriptionManager.canContact()) {
            toast("Connection limit reached. Upgrade to connect with more startups!", "error")
            navigate('/dashboard/pricing')
            return
        }

        setIsConnecting(true)
        try {
            await sendConnectionRequest(user.id, startup.id)
            subscriptionManager.trackContact(startup.id)
            const newStatus = await getConnectionStatus(user.id, startup.id)
            setConnStatus(newStatus)
            onConnectionChange?.(startup.id)
            toast("Connection request sent!", "success")
        } catch (error: any) {
            console.error(error)
            toast(`Failed to connect: ${error.message || 'Unknown error'}`, "error")
        } finally {
            setIsConnecting(false)
        }
    }

    const handleAccept = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!connStatus?.connectionId) return

        setIsProcessing(true)
        try {
            await acceptConnectionRequest(connStatus.connectionId)
            const newStatus = await getConnectionStatus(user!.id, startup.id)
            setConnStatus(newStatus)
            onConnectionChange?.(startup.id)
            toast("Connection accepted!", "success")
        } catch (error: any) {
            console.error(error)
            toast(`Failed to accept: ${error.message || 'Unknown error'}`, "error")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDecline = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!connStatus?.connectionId) return

        setIsProcessing(true)
        try {
            await declineConnectionRequest(connStatus.connectionId)
            setConnStatus(null)
            onConnectionChange?.(startup.id)
            toast("Connection declined", "info")
        } catch (error: any) {
            console.error(error)
            toast(`Failed to decline: ${error.message || 'Unknown error'}`, "error")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleToggleSave = (e: React.MouseEvent) => {
        e.stopPropagation()
        onToggleSave?.(startup)
    }

    const handleMessageClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onMessageClick?.(startup)
    }

    const handleCloseDeal = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!connStatus?.connectionId) return

        setIsClosingDeal(true)
        try {
            await closeDeal(connStatus.connectionId)
            const newStatus = await getConnectionStatus(user!.id, startup.id)
            setConnStatus(newStatus)
            onConnectionChange?.(startup.id)
            toast("Deal marked as closed!", "success")
        } catch (error) {
            console.error(error)
            toast("Failed to close deal", "error")
        } finally {
            setIsClosingDeal(false)
        }
    }

    const handleDisconnect = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user) return

        setIsDisconnecting(true)
        try {
            await disconnectConnection(user.id, startup.id)
            setConnStatus(null)
            onConnectionChange?.(startup.id)
            toast("Connection removed", "info")
        } catch (error) {
            console.error(error)
            toast("Failed to disconnect", "error")
        } finally {
            setIsDisconnecting(false)
        }
    }

    return (
        <Card
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            className={cn(
                "group flex flex-col relative cursor-pointer transition-all duration-300 shadow-sm h-auto sm:h-full touch-manipulation",
                "hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:border-black",
                isSelected ? 'border-[3px] border-black bg-white shadow-xl' : 'border-2 border-black/5 bg-white/50 backdrop-blur-sm'
            )}
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />

            <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                <Avatar
                                    src={startup.logo}
                                    name={startup.name}
                                    fallbackClassName="text-3xl text-gray-500"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-xl font-bold text-soft-black tracking-tight group-hover:text-gray-600 transition-colors uppercase truncate" title={startup.name}>{startup.name}</h3>
                                    {startup.verificationLevel === 'trusted' && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600 border border-amber-100 uppercase tracking-tighter shadow-sm flex-shrink-0">
                                            <ShieldCheck className="w-2.5 h-2.5" />
                                            Verified
                                        </span>
                                    )}
                                    {isRecommended && aiRecommendation && (
                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-black text-white border border-indigo-500 uppercase tracking-tighter shadow-lg shadow-indigo-200 group/tooltip relative flex-shrink-0">
                                            <Sparkles className="w-2.5 h-2.5" />
                                            {showPercentage ? `${aiRecommendation.score}% Match` : "Match"}
                                            <div className="relative inline-block ml-1 ai-tooltip-container">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        const rect = e.currentTarget.getBoundingClientRect()
                                                        const spaceOnRight = window.innerWidth - rect.right
                                                        const spaceOnLeft = rect.left

                                                        // Determine best alignment
                                                        let align: 'left' | 'center' | 'right' = 'center'
                                                        if (spaceOnRight < 150) align = 'right'
                                                        else if (spaceOnLeft < 150) align = 'left'

                                                        // Store alignment in a temporary data attribute or state if needed, 
                                                        // but for simplicity we'll use a robust center-bias with safe max-width.
                                                        setShowAiTooltip(!showAiTooltip)
                                                    }}
                                                    className="flex items-center justify-center hover:bg-indigo-100 rounded-full p-0.5 transition-colors"
                                                >
                                                    <Info className="w-3 h-3" />
                                                </button>
                                                {showAiTooltip && (
                                                    <div className={cn(
                                                        "absolute bottom-full mb-3 w-72 p-4 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-indigo-100 z-[100] normal-case tracking-normal font-normal text-xs animate-in fade-in slide-in-from-bottom-2 md:w-80",
                                                        // Smart alignment logic
                                                        isFirstInRow ? "left-0 translate-x-0" :
                                                            isLastInRow ? "right-0 translate-x-0 left-auto" :
                                                                "left-1/2 -translate-x-1/2",
                                                        "max-w-[85vw] sm:max-w-none"
                                                    )}>
                                                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-indigo-50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                                                </div>
                                                                <span className="font-bold text-indigo-900">AI Match: {aiRecommendation.score}%</span>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setShowAiTooltip(false)
                                                                }}
                                                                className="text-gray-400 hover:text-gray-600 p-1"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <p className="text-gray-600 leading-relaxed mb-3">
                                                            {aiRecommendation.explanation}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5 mb-1">
                                                            {aiRecommendation.highlights.map((highlight, idx) => (
                                                                <span key={idx} className="px-2 py-0.5 bg-indigo-50/50 text-indigo-600 rounded-lg text-[9px] font-bold border border-indigo-100/50">
                                                                    • {highlight}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className={cn(
                                                            "absolute top-full border-8 border-transparent border-t-white",
                                                            isFirstInRow ? "left-4 translate-x-0" :
                                                                isLastInRow ? "right-4 translate-x-0 left-auto" :
                                                                    "left-1/2 -translate-x-1/2"
                                                        )} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {showImpactPoints && startup.impactPoints !== undefined && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-600 border border-orange-100 uppercase tracking-tighter shadow-sm">
                                            <TrendingUp className="w-2.5 h-2.5" />
                                            {startup.impactPoints} pts
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-widest">
                                    {startup.founder.name}
                                    {startup.last_active_at && (
                                        <span className="ml-2 inline-flex items-center gap-1 normal-case tracking-normal font-bold text-[10px] text-emerald-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active {(() => {
                                                const diff = Date.now() - new Date(startup.last_active_at).getTime()
                                                const minutes = Math.floor(diff / 60000)
                                                if (minutes < 5) return 'now'
                                                if (minutes < 60) return `${minutes}m ago`
                                                const hours = Math.floor(minutes / 60)
                                                if (hours < 24) return `${hours}h ago`
                                                return `${Math.floor(hours / 24)}d ago`
                                            })()}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-3 sm:gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-4 border-t sm:border-t-0 border-gray-100/50 sm:border-transparent shrink-0">
                            <div className="flex flex-wrap sm:justify-end gap-1.5 w-full sm:w-auto">
                                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 border border-indigo-100 uppercase">
                                    {startup.industry}
                                </span>
                                <span className="rounded-lg bg-black/5 px-2.5 py-1 text-[10px] font-bold text-black border border-black/5">
                                    {startup.metrics.valuation}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold bg-gray-50 rounded-lg px-2.5 py-1 border border-gray-100 uppercase">
                                    {startup.metrics.stage}
                                </span>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-hide" onClick={e => e.stopPropagation()}>
                                {onToggleSave && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleToggleSave}
                                        className={cn(
                                            "rounded-full h-9 w-9 p-0 transition-all duration-300 shrink-0",
                                            isSaved
                                                ? "bg-indigo-50 text-indigo-600 shadow-inner"
                                                : "bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100"
                                        )}
                                    >
                                        <BookmarkPlus className={cn("h-4 w-4", isSaved && "fill-current")} />
                                    </Button>
                                )}

                                {onMessageClick && connStatus?.status === 'accepted' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleMessageClick}
                                        className="rounded-full h-9 px-4 text-xs font-bold border-2 hover:bg-black hover:text-white transition-all shadow-sm shrink-0"
                                    >
                                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                                        Message
                                    </Button>
                                )}

                                {!connStatus && user?.id !== startup.id && (
                                    <Button
                                        size="sm"
                                        disabled={isConnecting}
                                        onClick={handleConnect}
                                        className="rounded-full h-9 px-4 text-xs font-bold bg-black text-white hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95 shrink-0"
                                    >
                                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                        {isConnecting ? "..." : "Connect"}
                                    </Button>
                                )}

                                {connStatus?.status === 'pending' && connStatus.isIncoming && (
                                    <>
                                        <Button
                                            size="sm"
                                            disabled={isProcessing}
                                            onClick={handleAccept}
                                            className="rounded-full h-9 w-9 p-0 bg-emerald-500 text-white hover:bg-emerald-600 transition-all hover:shadow-lg active:scale-95 shrink-0"
                                            title="Accept connection"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={isProcessing}
                                            onClick={handleDecline}
                                            variant="outline"
                                            className="rounded-full h-9 w-9 p-0 border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all active:scale-95 shrink-0"
                                            title="Decline connection"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}

                                {connStatus?.status === 'pending' && !connStatus.isIncoming && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-400 rounded-full border border-gray-100 text-[9px] font-black uppercase tracking-widest shrink-0">
                                        <Clock className="h-3 w-3" />
                                        Wait
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {connStatus?.status === 'accepted' && !connStatus.dealClosed && (
                        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                            <span className="text-xs font-bold text-amber-900">Deal closed?</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    disabled={isClosingDeal}
                                    onClick={handleCloseDeal}
                                    className="rounded-full h-8 w-8 p-0 bg-green-500 text-white hover:bg-green-600 transition-all hover:shadow-lg active:scale-95"
                                    title="Mark deal as closed"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={isDisconnecting}
                                    onClick={handleDisconnect}
                                    variant="ghost"
                                    className="rounded-full h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                                    title="Disconnect"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-5 text-sm text-gray-500 italic font-medium leading-relaxed mb-4 sm:line-clamp-2">
                    "{startup.problemSolving}"
                </p>

                <div className="flex flex-wrap gap-1.5">
                    {startup.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="inline-flex items-center rounded-lg bg-indigo-50/30 px-2 py-0.5 text-[10px] font-bold text-indigo-700/70 border border-indigo-100/20 uppercase tracking-tighter">
                            #{tag}
                        </span>
                    ))}
                    {startup.tags.length > 3 && (
                        <span className="text-[10px] font-bold text-gray-300">+{startup.tags.length - 3} more</span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
