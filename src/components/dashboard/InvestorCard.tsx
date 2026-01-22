import type { Investor } from "../../data/mockData"
import { Card, CardContent } from "../ui/card"
import { cn } from "../../lib/utils"
import { MessageSquare, BookmarkPlus, UserPlus, Clock, CheckCircle, X, Sparkles, Info } from "lucide-react"
import { Button } from "../ui/button"
import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { getConnectionStatus, sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest, closeDeal, disconnectConnection, type ConnectionStatus } from "../../lib/supabase"
import { Avatar } from "../ui/Avatar"

interface InvestorCardProps {
    investor: Investor
    isSelected?: boolean
    isSaved?: boolean
    onMessageClick?: (investor: Investor) => void
    onToggleSave?: (investor: Investor) => void
    onClick?: () => void
    onDoubleClick?: () => void
    isRecommended?: boolean
    aiRecommendation?: {
        score: number
        explanation: string
        highlights: string[]
    }
    isFirstInRow?: boolean
    isLastInRow?: boolean
    showPercentage?: boolean
}

export function InvestorCard({ investor, isSelected, isSaved = false, onMessageClick, onToggleSave, onClick, onDoubleClick, isRecommended, aiRecommendation, isFirstInRow, isLastInRow, showPercentage }: InvestorCardProps) {
    const { user } = useAuth()
    const { toast } = useToast()
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
        if (!user || !investor.id) return

        async function checkStatus() {
            const status = await getConnectionStatus(user!.id, investor.id)
            setConnStatus(status)
        }
        checkStatus()
    }, [user, investor.id])

    const handleConnect = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user) {
            toast("Please login to connect", "error")
            return
        }

        setIsConnecting(true)
        try {
            await sendConnectionRequest(user.id, investor.id)
            const newStatus = await getConnectionStatus(user.id, investor.id)
            setConnStatus(newStatus)
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
            const newStatus = await getConnectionStatus(user!.id, investor.id)
            setConnStatus(newStatus)
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
            toast("Connection declined", "info")
        } catch (error: any) {
            console.error(error)
            toast(`Failed to decline: ${error.message || 'Unknown error'}`, "error")
        } finally {
            setIsProcessing(false)
        }
    }
    const handleMessageClick = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card click event
        onMessageClick?.(investor)
    }

    const handleToggleSave = (e: React.MouseEvent) => {
        e.stopPropagation()
        onToggleSave?.(investor)
    }

    const handleCloseDeal = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!connStatus?.connectionId) return

        setIsClosingDeal(true)
        try {
            await closeDeal(connStatus.connectionId)
            const newStatus = await getConnectionStatus(user!.id, investor.id)
            setConnStatus(newStatus)
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
            await disconnectConnection(user.id, investor.id)
            setConnStatus(null)
            toast("Connection removed", "info")
        } catch (error) {
            console.error(error)
            toast("Failed to disconnect", "error")
        } finally {
            setIsDisconnecting(false)
        }
    }

    return (
        <Card onClick={onClick} onDoubleClick={onDoubleClick} className={cn(
            "group h-full flex flex-col relative hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:border-black transition-all cursor-pointer duration-300 shadow-sm touch-manipulation",
            isSelected ? "border-[3px] border-black bg-white shadow-xl" : "border-2 border-black/5 bg-white/50 backdrop-blur-sm"
        )}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />

            <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-start gap-4 min-w-0">
                    <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-full bg-gray-50 overflow-hidden ring-1 ring-gray-100 shadow-sm transition-transform duration-500 group-hover:scale-110">
                        <Avatar
                            src={investor.avatar}
                            name={investor.name}
                            fallbackClassName="text-2xl text-gray-500"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <h3 className="text-xl font-bold text-soft-black tracking-tight group-hover:text-gray-600 transition-colors uppercase truncate" title={investor.name}>{investor.name}</h3>
                                {isRecommended && aiRecommendation && (
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black text-white border border-emerald-500 uppercase tracking-tighter shadow-lg shadow-emerald-200 group/tooltip relative flex-shrink-0 animate-pulse">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        {showPercentage ? `${aiRecommendation.score}% Match` : "Match"}
                                        <div className="relative inline-block ml-1 ai-tooltip-container">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setShowAiTooltip(!showAiTooltip)
                                                }}
                                                className="flex items-center justify-center hover:bg-emerald-100 rounded-full p-0.5 transition-colors"
                                            >
                                                <Info className="w-3 h-3" />
                                            </button>
                                            {showAiTooltip && (
                                                <div className={cn(
                                                    "absolute bottom-full mb-3 w-72 p-4 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-emerald-100 z-[100] normal-case tracking-normal font-normal text-xs animate-in fade-in slide-in-from-bottom-2 md:w-80",
                                                    isFirstInRow ? "left-0 translate-x-0" :
                                                        isLastInRow ? "right-0 translate-x-0 left-auto" :
                                                            "left-1/2 -translate-x-1/2",
                                                    "max-w-[85vw] sm:max-w-none"
                                                )}>
                                                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-50">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                                            </div>
                                                            <span className="font-bold text-emerald-900">AI Match: {aiRecommendation.score}%</span>
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
                                                            <span key={idx} className="px-2 py-0.5 bg-emerald-50/50 text-emerald-600 rounded-lg text-[9px] font-bold border border-emerald-100/50">
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
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                <span className="text-[10px] font-black bg-green-50 text-green-700 px-2 py-1 rounded-lg border border-green-100 uppercase tracking-tighter">
                                    {investor.fundsAvailable}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-gray-400 mt-1 line-clamp-1 italic">
                            "{investor.bio}"
                            {investor.last_active_at && (
                                <span className="ml-2 inline-flex items-center gap-1 not-italic font-bold text-[10px] text-emerald-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active {(() => {
                                        const diff = Date.now() - new Date(investor.last_active_at).getTime()
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

                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {investor.expertise.slice(0, 3).map(skill => (
                                <span key={skill} className="text-[10px] font-bold bg-gray-50 text-gray-400 px-2 py-0.5 rounded-lg border border-gray-100 uppercase tracking-tighter">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest">
                            {investor.investments} Deals Closed
                        </span>
                        <div className="flex gap-2">
                            {onToggleSave && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleToggleSave}
                                    className={cn(
                                        "rounded-full h-9 w-9 p-0 transition-all duration-300",
                                        isSaved
                                            ? "bg-green-50 text-green-600 shadow-inner"
                                            : "bg-white border border-gray-100 text-gray-300 hover:text-green-600 hover:border-green-100"
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
                                    className="rounded-full h-9 px-4 text-xs font-bold border-2 hover:bg-black hover:text-white transition-all shadow-sm"
                                >
                                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                                    Message
                                </Button>
                            )}
                            {!connStatus && user?.id !== investor.id && (
                                <Button
                                    size="sm"
                                    disabled={isConnecting}
                                    onClick={handleConnect}
                                    className="rounded-full h-9 px-4 text-xs font-bold bg-black text-white hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95"
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
                                        className="rounded-full h-9 w-9 p-0 bg-emerald-500 text-white hover:bg-emerald-600 transition-all hover:shadow-lg active:scale-95"
                                        title="Accept connection"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={isProcessing}
                                        onClick={handleDecline}
                                        variant="outline"
                                        className="rounded-full h-9 w-9 p-0 border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all active:scale-95"
                                        title="Decline connection"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                            {connStatus?.status === 'pending' && !connStatus.isIncoming && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-400 rounded-full border border-gray-100 text-[9px] font-black uppercase tracking-widest">
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
            </CardContent>
        </Card>
    )
}
