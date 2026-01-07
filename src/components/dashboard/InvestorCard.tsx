import type { Investor } from "../../data/mockData"
import { Card, CardContent } from "../ui/card"
import { cn } from "../../lib/utils"
import { MessageSquare, BookmarkPlus, UserPlus, Clock, CheckCircle, X } from "lucide-react"
import { Button } from "../ui/button"
import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { getConnectionStatus, sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest, type ConnectionStatus } from "../../lib/supabase"

interface InvestorCardProps {
    investor: Investor
    isSelected?: boolean
    isSaved?: boolean
    onMessageClick?: (investor: Investor) => void
    onToggleSave?: (investor: Investor) => void
    onClick?: () => void
}

export function InvestorCard({ investor, isSelected, isSaved = false, onMessageClick, onToggleSave, onClick }: InvestorCardProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

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
        } catch (error) {
            console.error(error)
            toast("Failed to send request", "error")
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
        } catch (error) {
            console.error(error)
            toast("Failed to accept", "error")
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
        } catch (error) {
            console.error(error)
            toast("Failed to decline", "error")
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

    return (
        <Card onClick={onClick} className={cn(
            "group h-full flex flex-col relative hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all cursor-pointer duration-500 overflow-hidden border border-black shadow-sm",
            isSelected ? "ring-2 ring-black bg-white shadow-xl" : "bg-white/50 backdrop-blur-sm"
        )}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-start gap-4">
                    <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-full bg-gray-50 overflow-hidden font-bold text-gray-500 ring-1 ring-gray-100 shadow-sm transition-transform duration-500 group-hover:scale-110">
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
                            <span className="text-2xl">{investor.avatar || (investor.name?.charAt(0).toUpperCase() || '?')}</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-soft-black tracking-tight group-hover:text-gray-600 transition-colors uppercase">{investor.name}</h3>
                            <span className="text-[10px] font-black bg-green-50 text-green-700 px-2 py-1 rounded-lg border border-green-100 uppercase tracking-tighter">
                                {investor.fundsAvailable}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-gray-400 mt-1 line-clamp-1 italic">"{investor.bio}"</p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {investor.expertise.slice(0, 3).map(skill => (
                                <span key={skill} className="text-[10px] font-bold bg-gray-50 text-gray-400 px-2 py-0.5 rounded-lg border border-gray-100 uppercase tracking-tighter">
                                    {skill}
                                </span>
                            ))}
                        </div>
                        <div className="mt-5 flex items-center justify-between">
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
                </div>
            </CardContent>
        </Card>
    )
}
