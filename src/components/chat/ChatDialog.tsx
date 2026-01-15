import { useState, useEffect, useRef } from "react"
import { useChat } from "../../hooks/useChat"
import { useAuth } from "../../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, MessageCircle, ChevronLeft, LogIn } from "lucide-react"
import { Button } from "../ui/button"
import { Avatar } from "../ui/Avatar"
import { Link } from "react-router-dom"

export function ChatDialog() {
    const { user, loading: authLoading } = useAuth()
    const {
        isOpen,
        closeChat,
        activeUser,
        openChat,
        messages,
        sendMessage,
        recentChats,
        loading
    } = useChat()

    const [input, setInput] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, activeUser])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        await sendMessage(input)
        setInput("")
    }

    // if (!user) return null

    // Don't render anything if chat is not open
    if (!isOpen) return null

    return (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="pointer-events-auto mb-4 w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            {authLoading ? (
                                <div className="h-6 w-24 bg-gray-100 animate-pulse rounded" />
                            ) : !user ? (
                                <h3 className="font-bold text-lg">Sign In</h3>
                            ) : activeUser ? (
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => openChat(null)}>
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-100 shadow-sm">
                                            <Avatar
                                                src={activeUser.avatar}
                                                name={activeUser.name}
                                                fallbackClassName="text-xs text-gray-500"
                                            />
                                        </div>
                                        <div className="font-bold text-sm">{activeUser.name}</div>
                                    </div>
                                </div>
                            ) : (
                                <h3 className="font-bold text-lg">Messages</h3>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-200" onClick={closeChat}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden relative">
                            {authLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-pulse text-gray-300 text-sm">Verifying session...</div>
                                </div>
                            ) : !user ? (
                                // Guest Sign-in Prompt
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                        <MessageCircle className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in to chat</h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        Join Kasb.AI to start direct messages with investors or startups.
                                    </p>
                                    <Button asChild className="w-full rounded-full bg-black text-white hover:bg-gray-800 shadow-lg">
                                        <Link to="/login" onClick={closeChat}>
                                            <LogIn className="h-4 w-4 mr-2" />
                                            Sign In Now
                                        </Link>
                                    </Button>
                                    <p className="mt-4 text-xs text-gray-400">
                                        Don't have an account? <Link to="/signup" onClick={closeChat} className="text-black font-semibold hover:underline">Sign up</Link>
                                    </p>
                                </div>
                            ) : activeUser ? (
                                // Message Thread
                                <div className="absolute inset-0 flex flex-col">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                                        {loading && <div className="text-center text-xs text-gray-400">Loading history...</div>}
                                        {messages.length === 0 && !loading && (
                                            <div className="text-center text-gray-400 text-sm mt-10">
                                                Start a conversation with {activeUser.name}
                                            </div>
                                        )}
                                        {messages.filter(m => !m.is_deleted).map((msg) => {
                                            const isMe = msg.sender_id === user?.id
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe
                                                        ? 'bg-black text-white rounded-br-none'
                                                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                                        }`}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white flex gap-2">
                                        <input
                                            className="flex-1 bg-gray-50 border-0 rounded-full px-4 text-sm focus:ring-2 focus:ring-black outline-none"
                                            placeholder="Type a message..."
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                        />
                                        <Button type="submit" size="icon" className="rounded-full h-9 w-9 shrink-0">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </div>
                            ) : (
                                // Conversation List
                                <div className="absolute inset-0 overflow-y-auto p-2">
                                    {recentChats.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <MessageCircle className="h-12 w-12 mx-auto text-gray-200 mb-2" />
                                            <p className="text-sm">No messages yet.</p>
                                            <p className="text-xs mt-1">Visit a profile to start chatting.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {recentChats.map(chat => (
                                                <button
                                                    key={chat.id}
                                                    onClick={() => {
                                                        console.log("Clicked chat item in Dialog:", chat.name)
                                                        openChat(chat)
                                                    }}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                                                >
                                                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-100 shadow-sm">
                                                        <Avatar
                                                            src={chat.avatar}
                                                            name={chat.name}
                                                            fallbackClassName="text-lg text-gray-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-900">{chat.name}</div>
                                                        <div className="text-xs text-gray-500 capitalize">{chat.role}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
