import { useState, useEffect, useRef } from "react"
import { Bell, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase, acceptConnectionRequest, declineConnectionRequest } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "../ui/button"
import { useToast } from "../../hooks/useToast"

interface NotificationMessage {
    id: string
    sender_id: string
    content: string
    created_at: string
    sender_name?: string
    is_read: boolean
}

interface ConnectionRequest {
    id: string
    sender_id: string
    sender_name: string
    sender_avatar?: string
    created_at: string
}

export function NotificationBell() {
    const { user, role } = useAuth()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [unreadCount, setUnreadCount] = useState(0)
    const [recentMessages, setRecentMessages] = useState<NotificationMessage[]>([])
    const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!user) return

        const fetchUnread = async () => {
            // 1. Get total unread count for badge
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', user.id)
                .is('is_deleted', false)
                .eq('is_read', false)

            setUnreadCount(count || 0)

            // 2. Get recent messages (read or unread) for dropdown
            const { data: recent, error } = await supabase
                .from('messages')
                .select('*')
                .eq('receiver_id', user.id)
                .is('is_deleted', false)
                .order('created_at', { ascending: false })
                .limit(5)

            if (!error && recent) {
                // Fetch sender names for the dropdown
                const senderIds = recent.map(m => m.sender_id)
                if (senderIds.length > 0) {
                    const { data: startups } = await supabase.from('startups').select('id, name').in('id', senderIds)
                    const { data: investors } = await supabase.from('investors').select('id, name').in('id', senderIds)
                    const { data: admins } = await supabase.from('admins').select('id').in('id', senderIds)

                    const profileMap = new Map()
                    startups?.forEach(s => profileMap.set(s.id, s.name))
                    investors?.forEach(i => profileMap.set(i.id, i.name))
                    admins?.forEach(a => profileMap.set(a.id, 'Kasb.AI'))

                    setRecentMessages(recent.map(m => ({
                        ...m,
                        sender_name: profileMap.get(m.sender_id) || 'Unknown User'
                    })))
                } else {
                    setRecentMessages([])
                }
            }
        }

        const fetchConnections = async () => {
            const { data, error } = await supabase
                .from('connections')
                .select('*')
                .eq('receiver_id', user.id)
                .eq('status', 'pending')

            if (!error && data) {
                const senderIds = data.map(c => c.sender_id)
                if (senderIds.length > 0) {
                    const { data: startups } = await supabase.from('startups').select('id, name, logo').in('id', senderIds)
                    const { data: investors } = await supabase.from('investors').select('id, name, avatar').in('id', senderIds)

                    const profileMap = new Map()
                    startups?.forEach(s => profileMap.set(s.id, { name: s.name, avatar: s.logo }))
                    investors?.forEach(i => profileMap.set(i.id, { name: i.name, avatar: i.avatar }))

                    setConnectionRequests(data.map(c => ({
                        id: c.id,
                        sender_id: c.sender_id,
                        sender_name: profileMap.get(c.sender_id)?.name || 'Someone',
                        sender_avatar: profileMap.get(c.sender_id)?.avatar,
                        created_at: c.created_at
                    })))
                } else {
                    setConnectionRequests([])
                }
            }
        }

        fetchUnread()
        fetchConnections()

        // Subscribe to new messages
        const channel = supabase
            .channel('unread_notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    fetchUnread()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'connections',
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    fetchConnections()
                }
            )
            .subscribe()

        // Handle clicks outside to close dropdown
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            supabase.removeChannel(channel)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [user])

    // Mark messages as read when dropdown opens
    useEffect(() => {
        if (isOpen && recentMessages.some(m => !m.is_read)) {
            const unreadIds = recentMessages.filter(m => !m.is_read).map(m => m.id)

            if (unreadIds.length > 0) {
                // Optimistic update
                setRecentMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, is_read: true } : m))
                setUnreadCount(prev => Math.max(0, prev - unreadIds.length))

                // DB Update
                void supabase.from('messages').update({ is_read: true }).in('id', unreadIds)
            }
        }
    }, [isOpen, recentMessages])

    const handleMessageClick = (msg?: NotificationMessage) => {
        setIsOpen(false)
        // Optionally mark as read if needed
        if (msg) {
            void supabase.from('messages').update({ is_read: true }).eq('id', msg.id)
        }
        const path = role === 'investor' ? '/dashboard/investor/messages' : '/dashboard/startup/messages'
        navigate(path)
    }

    const handleConnectionResponse = async (id: string, status: 'accepted' | 'rejected') => {
        try {
            if (status === 'accepted') {
                await acceptConnectionRequest(id)
                toast("Connection accepted!", "success")
            } else {
                await declineConnectionRequest(id)
                toast("Connection declined", "info")
            }
            setConnectionRequests(prev => prev.filter(c => c.id !== id))
        } catch (error: any) {
            console.error('Error handling connection response:', error)
            toast(`Failed to ${status}: ${error.message || 'Unknown error'}`, "error")
            // Still filter it out if it was a 404 or something that means it's gone anyway
            if (error.code === 'PGRST116' || error.status === 404) {
                setConnectionRequests(prev => prev.filter(c => c.id !== id))
            }
        }
    }

    const totalNotifications = unreadCount + connectionRequests.length

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-white group"
            >
                <Bell className="h-6 w-6 group-hover:scale-110 transition-transform" />
                {totalNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black ring-2 ring-black/20">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 z-50"
                    >
                        <div className="bg-gray-50 px-4 py-3 border-b">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Recent Messages
                            </h3>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {/* Connection Requests */}
                            {connectionRequests.length > 0 && (
                                <div className="bg-blue-50/50 p-2">
                                    <span className="text-[10px] font-black uppercase text-blue-600 px-2 mb-2 block tracking-widest">Connection Requests</span>
                                    <div className="space-y-1">
                                        {connectionRequests.map(req => (
                                            <div key={req.id} className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs overflow-hidden">
                                                        {req.sender_avatar ? <img src={req.sender_avatar} alt="" /> : '👤'}
                                                    </div>
                                                    <span className="text-xs font-bold">{req.sender_name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleConnectionResponse(req.id, 'accepted')}
                                                        className="flex-1 bg-black text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-gray-800 transition-colors uppercase tracking-wider"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleConnectionResponse(req.id, 'rejected')}
                                                        className="flex-1 bg-gray-100 text-gray-600 text-[10px] font-bold py-1.5 rounded-lg hover:bg-gray-200 transition-colors uppercase tracking-wider"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!user ? (
                                <div className="p-8 text-center">
                                    <div className="bg-gray-50 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                        <MessageSquare className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm text-gray-900 font-bold mb-1">Sign in to see messages</p>
                                    <p className="text-xs text-gray-500 mb-4">Connect with others to start receiving notifications.</p>
                                    <Button asChild size="sm" className="rounded-full bg-black text-white hover:bg-gray-800">
                                        <Link to="/login">Sign In</Link>
                                    </Button>
                                </div>
                            ) : recentMessages.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    <span className="text-[10px] font-black uppercase text-gray-400 px-4 py-2 block tracking-widest border-b">Messages</span>
                                    {recentMessages.map((msg) => (
                                        <button
                                            key={msg.id}
                                            onClick={() => handleMessageClick(msg)}
                                            className="w-full p-4 flex gap-3 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                {msg.sender_name?.[0] || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-bold text-gray-900 truncate">
                                                        {msg.sender_name}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-medium">
                                                        {new Date(msg.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                                    {msg.content}
                                                </p>
                                            </div>
                                            {!msg.is_read && (
                                                <div className="h-2 w-2 rounded-full bg-black mt-2 shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                    <Link
                                        to={role === 'investor' ? '/dashboard/investor/messages' : '/dashboard/startup/messages'}
                                        className="block p-3 text-center text-xs font-bold text-gray-500 hover:text-black transition-colors"
                                    >
                                        View All Messages
                                    </Link>
                                </div>
                            ) : (
                                !connectionRequests.length && (
                                    <div className="p-8 text-center">
                                        <div className="bg-gray-50 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                            <Bell className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">No new notifications</p>
                                    </div>
                                )
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
