import { useState, useEffect, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { X, Send, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../lib/utils"

interface AdminChatModalProps {
    isOpen: boolean
    onClose: () => void
    targetUser: {
        id: string
        name: string
        avatar: string
        role: 'startup' | 'investor'
    } | null
}

interface Message {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
    is_read: boolean
}

export function AdminChatModal({ isOpen, onClose, targetUser }: AdminChatModalProps) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Fetch messages when modal opens
    useEffect(() => {
        if (!isOpen || !user || !targetUser) return

        const fetchMessages = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true })

            if (error) console.error("Error fetching messages:", error)
            if (data) setMessages(data)
            setLoading(false)
        }

        fetchMessages()

        // Subscribe to realtime updates
        const channel = supabase
            .channel(`admin_chat_${targetUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${targetUser.id}`,
                },
                (payload) => {
                    if (payload.new && (payload.new as Message).receiver_id === user.id) {
                        setMessages(prev => [...prev, payload.new as Message])
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isOpen, user, targetUser])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen])

    const handleSend = async () => {
        if (!newMessage.trim() || !user || !targetUser || sending) return

        setSending(true)
        const content = newMessage.trim()
        setNewMessage("")

        // Optimistic update
        const tempMsg: Message = {
            id: 'temp-' + Date.now(),
            sender_id: user.id,
            receiver_id: targetUser.id,
            content,
            created_at: new Date().toISOString(),
            is_read: false
        }
        setMessages(prev => [...prev, tempMsg])

        const { error } = await supabase
            .from('messages')
            .insert([{
                sender_id: user.id,
                receiver_id: targetUser.id,
                content
            }])

        if (error) {
            console.error("Error sending message:", error)
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
        }

        setSending(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()
        
        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <AnimatePresence>
            {isOpen && targetUser && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        style={{ maxHeight: '80vh' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden ring-1 ring-gray-200">
                                    {targetUser.avatar.startsWith('http') || targetUser.avatar.startsWith('/') ? (
                                        <img src={targetUser.avatar} alt={targetUser.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-lg">{targetUser.avatar || '👤'}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-black">{targetUser.name}</h3>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        targetUser.role === 'startup' ? "text-emerald-500" : "text-indigo-500"
                                    )}>
                                        {targetUser.role}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px] max-h-[50vh] custom-scrollbar">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-pulse text-gray-400 text-sm">Loading messages...</div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div className="p-4 bg-gray-50 rounded-2xl mb-4">
                                        <MessageSquare className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-400">No messages yet</p>
                                    <p className="text-xs text-gray-300 mt-1">Send a message to {targetUser.name}</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isAdmin = msg.sender_id === user?.id
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex",
                                                isAdmin ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div className={cn(
                                                "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
                                                isAdmin
                                                    ? "bg-black text-white rounded-br-md"
                                                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                                            )}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <p className={cn(
                                                    "text-[10px] mt-1",
                                                    isAdmin ? "text-gray-400" : "text-gray-400"
                                                )}>
                                                    {formatTime(msg.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                            <div className="flex items-center gap-3">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`Message ${targetUser.name}...`}
                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 transition-all placeholder:text-gray-300"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!newMessage.trim() || sending}
                                    className={cn(
                                        "p-3 rounded-xl transition-all duration-200",
                                        newMessage.trim()
                                            ? "bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10"
                                            : "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    )}
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-300 mt-2 text-center">
                                Messages are sent as <span className="font-bold">Kasb.AI</span> admin
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
