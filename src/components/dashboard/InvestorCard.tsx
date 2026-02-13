import type { Investor } from "../../data/mockData"
import { Card, CardContent } from "../ui/card"
import { cn } from "../../lib/utils"
import { MessageSquare, BookmarkPlus, UserPlus, Clock, CheckCircle } from "lucide-react"
import { Button } from "../ui/button"
import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { getConnectionStatus, sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest, closeDeal, type ConnectionStatus } from "../../lib/supabase"
import { Avatar } from "../ui/Avatar"
import { PlanBadge } from "../ui/PlanBadge"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { useNavigate } from "react-router-dom"

interface InvestorCardProps {
    investor: Investor
    isSelected?: boolean
    isSaved?: boolean
    onMessageClick?: (investor: Investor) => void
    onToggleSave?: (investor: Investor) => void
    onClick?: () => void
    onDoubleClick?: () => void
    showImpactPoints?: boolean
}

export function InvestorCard({ investor, isSelected, isSaved = false, onMessageClick, onToggleSave, onClick, onDoubleClick, showImpactPoints }: InvestorCardProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
    const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isClosingDeal, setIsClosingDeal] = useState(false)

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

        if (!subscriptionManager.canContact(investor.id)) {
            toast("Connection limit reached or plan doesn't include direct contact. Upgrade to connect!", "error")
            navigate('/dashboard/pricing')
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
        e.stopPropagation()
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
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />

            <CardContent className="p-4 flex-1 flex flex-col gap-3">
                {/* Top Row: Avatar, Name, Badge */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                            <Avatar
                                src={investor.avatar}
                                name={investor.name}
                                fallbackClassName="text-xl text-gray-500"
                            />
                        </div>
                        <h3 className="text-lg font-black text-soft-black tracking-tighter truncate uppercase" title={investor.name}>
                            {investor.name}
                        </h3>
                    </div>
                    <PlanBadge tier={investor.tier} className="shrink-0" />
                </div>

                {/* Middle Row: Bio */}
                <div className="flex-1 flex items-center py-1">
                    <p className="text-xs text-gray-500 font-medium leading-tight text-center w-full px-2 italic line-clamp-2">
                        "{investor.bio}"
                    </p>
                </div>

                {/* Bottom Row: Completion % and CTAs */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-black/5">
                    <div className="flex items-center gap-3">
                        {investor.completionPercentage !== undefined && (
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center shadow-sm">
                                    <span className="text-[10px] font-black text-emerald-600">
                                        {investor.completionPercentage}%
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                                    Profile
                                </span>
                            </div>
                        )}
                        {showImpactPoints && investor.impactPoints !== undefined && investor.impactPoints > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center shadow-sm">
                                    <span className="text-[10px] font-black text-indigo-600">
                                        {investor.impactPoints}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                                    Impact
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {onToggleSave && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleToggleSave}
                                className={cn(
                                    "rounded-xl h-9 w-9 p-0 border-2 transition-all duration-300 shadow-sm",
                                    "bg-white text-black border-black/10 hover:bg-black hover:text-white hover:border-black"
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
                                className="rounded-xl h-9 px-4 text-xs font-bold border-2 hover:bg-black hover:text-white transition-all shadow-sm"
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
                                className="rounded-xl h-9 px-6 text-xs font-bold bg-black text-white hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95"
                            >
                                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                {isConnecting ? "..." : "Connect"}
                            </Button>
                        )}

                        {connStatus?.status === 'pending' && connStatus.isIncoming && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    disabled={isProcessing}
                                    onClick={handleAccept}
                                    className="rounded-xl h-9 px-4 bg-emerald-500 text-white hover:bg-emerald-600 transition-all hover:shadow-lg active:scale-95 text-xs font-bold"
                                >
                                    Accept
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={isProcessing}
                                    onClick={handleDecline}
                                    variant="outline"
                                    className="rounded-xl h-9 px-4 border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all active:scale-95 text-xs font-bold"
                                >
                                    Decline
                                </Button>
                            </div>
                        )}

                        {connStatus?.status === 'pending' && !connStatus.isIncoming && (
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-400 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest">
                                <Clock className="h-3.5 w-3.5" />
                                Pending
                            </div>
                        )}

                        {connStatus?.status === 'accepted' && !connStatus.dealClosed && (
                            <Button
                                size="sm"
                                disabled={isClosingDeal}
                                onClick={handleCloseDeal}
                                className="rounded-xl h-9 px-4 bg-green-500 text-white hover:bg-green-600 transition-all hover:shadow-lg active:scale-95 text-xs font-bold"
                            >
                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                Close Deal
                            </Button>
                        )}
                    </div>
                </div>


                {/* Expertise (Subtle) */}
                <div className="flex flex-wrap gap-1.5 mt-auto">
                    {investor.expertise.slice(0, 3).map(skill => (
                        <span key={skill} className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">
                            #{skill}
                        </span>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
