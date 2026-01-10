import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { Search, Send, ArrowLeft, MessageSquare } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { Avatar } from "../../components/ui/Avatar"
import { Link } from "react-router-dom"

interface Message {
    id: string
    created_at: string
    sender_id: string
    receiver_id: string
    content: string
    is_read: boolean
}

interface Conversation {
    userId: string
    name: string
    avatar: string
    lastMessage: string
    time: string
    unread: number
}

export function MessagesPage() {
    const { user } = useAuth()
    const [selectedChat, setSelectedChat] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Process raw messages into conversations list
    const processConversations = useCallback(async (msgs: Message[]) => {
        if (!user) return

        const conversationMap = new Map<string, Message>()

        msgs.forEach(msg => {
            const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
            conversationMap.set(otherId, msg) // Keeps the latest one because we sorted by time
        })

        const otherIds = Array.from(conversationMap.keys())
        if (otherIds.length === 0) {
            setConversations([])
            return
        }

        // Fetch details
        const { data: startupData } = await supabase.from('startups').select('id, name, founder_name, logo').in('id', otherIds)
        const { data: investorData } = await supabase.from('investors').select('id, name, avatar').in('id', otherIds)

        // Fetch connection status for these users
        const { data: connectionData } = await supabase
            .from('connections')
            .select('*')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .eq('status', 'accepted')

        const acceptedIds = new Set(connectionData?.map(c => c.sender_id === user.id ? c.receiver_id : c.sender_id))

        const profiles = [
            ...(startupData || []).map(s => ({ id: s.id, name: s.name || s.founder_name, avatar: s.logo })),
            ...(investorData || []).map(i => ({ id: i.id, name: i.name, avatar: i.avatar }))
        ]

        const formatted: Conversation[] = otherIds
            .filter(id => acceptedIds.has(id)) // ONLY show accepted connections
            .map(id => {
                const lastMsg = conversationMap.get(id)!
                const profile = profiles.find(p => p.id === id)
                return {
                    userId: id,
                    name: profile?.name || 'Unknown User',
                    avatar: profile?.avatar || '',
                    lastMessage: lastMsg.content,
                    time: new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unread: 0 // logic for unread count can be added here
                }
            })

        setConversations(formatted)
    }, [user, setConversations]) // Added user and setConversations to dependencies

    // Fetch messages on mount
    useEffect(() => {
        if (!user) return

        const fetchMessages = async () => {
            const { data } = await supabase // Removed unused 'error'
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: true })

            if (data) {
                setMessages(data)
                processConversations(data)
            }
            setLoading(false)
        }

        fetchMessages()

        // Subscribe to real-time changes
        const channel = supabase
            .channel('messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    setMessages(prev => [...prev, newMsg])
                    // We should also re-process conversations effectively or just append
                    // For simplicity, re-fetching might be safer but less efficient. 
                    // Let's just append and re-process locally.
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, processConversations]) // Added processConversations to dependencies

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, selectedChat])

    // Effect to update conversations when messages change (e.g. real-time)
    useEffect(() => {
        if (messages.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            processConversations(messages)
        }
    }, [messages, processConversations]) // Added processConversations to dependencies


    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !selectedChat) return

        const msg = {
            sender_id: user.id,
            receiver_id: selectedChat,
            content: newMessage,
        }

        // Optimistic update
        const tempMsg: Message = {
            id: Math.random().toString(),
            created_at: new Date().toISOString(),
            sender_id: user.id,
            receiver_id: selectedChat,
            content: newMessage,
            is_read: false
        }
        setMessages(prev => [...prev, tempMsg])
        setNewMessage("")

        const { error } = await supabase.from('messages').insert([msg])
        if (error) {
            console.error('Error sending message:', error)
            // Revert optimistic update ideally
        }
    }

    const activeMessages = messages.filter(m =>
        (m.sender_id === user?.id && m.receiver_id === selectedChat) ||
        (m.sender_id === selectedChat && m.receiver_id === user?.id)
    )

    if (!user && !loading) {
        return (
            <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="bg-gray-50 p-6 rounded-full mb-6">
                    <MessageSquare className="h-12 w-12 text-gray-300" />
                </div>
                <h2 className="text-2xl font-bold text-soft-black mb-3">Sign in to send messages</h2>
                <p className="text-gray-500 max-w-md mb-8">
                    Connect with investors or startups and start a conversation today. You need an account to access the messaging features.
                </p>
                <div className="flex gap-4">
                    <Button asChild className="rounded-full px-8 bg-black text-white hover:bg-gray-800">
                        <Link to="/login">Sign In</Link>
                    </Button>
                    <Button variant="outline" asChild className="rounded-full px-8">
                        <Link to="/signup">Create Account</Link>
                    </Button>
                </div>
            </div>
        )
    }

    if (loading) {
        return <div className="h-[calc(100vh-140px)] flex items-center justify-center text-gray-500">Loading messaging session...</div>
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            {/* Contact List */}
            <div className={`w-full md:w-1/3 border-r border-gray-100 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input className="pl-9 bg-gray-50 border-transparent focus:bg-white" placeholder="Search chats..." />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? <div className="p-4 text-center text-gray-400">Loading chats...</div> :
                        conversations.length === 0 ? <div className="p-4 text-center font-bold text-gray-300">No conversations yet</div> :
                            conversations.map(chat => (
                                <div
                                    key={chat.userId}
                                    onClick={() => setSelectedChat(chat.userId)}
                                    className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedChat === chat.userId ? 'bg-gray-50' : ''}`}
                                >
                                    <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-full bg-gray-50 overflow-hidden ring-1 ring-gray-100 shadow-sm">
                                        <Avatar
                                            src={chat.avatar}
                                            name={chat.name}
                                            fallbackClassName="text-lg text-gray-500"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-semibold truncate">{chat.name}</h4>
                                            <span className="text-xs text-gray-400">{chat.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                                    </div>
                                    {chat.unread > 0 && (
                                        <span className="bg-black text-white text-xs h-5 w-5 flex items-center justify-center rounded-full">
                                            {chat.unread}
                                        </span>
                                    )}
                                </div>
                            ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col h-full max-h-full ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedChat(null)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-gray-50 overflow-hidden ring-1 ring-gray-100 shadow-sm">
                                    {(() => {
                                        const chat = conversations.find(c => c.userId === selectedChat);
                                        return (
                                            <Avatar
                                                src={chat?.avatar}
                                                name={chat?.name}
                                                fallbackClassName="text-base text-gray-500"
                                            />
                                        )
                                    })()}
                                </div>
                                <div>
                                    <h4 className="font-bold">{conversations.find(c => c.userId === selectedChat)?.name}</h4>
                                    <span className="text-xs text-green-500 font-medium">Online</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 bg-gray-50/50" ref={scrollRef}>
                            {activeMessages.map((msg, i) => {
                                const isMe = msg.sender_id === user?.id
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${isMe
                                            ? 'bg-black text-white rounded-tr-sm'
                                            : 'bg-white border border-gray-200 rounded-tl-sm shadow-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Input */}
                        <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0">
                            <form
                                className="flex gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    handleSendMessage()
                                }}
                            >
                                <Input
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 rounded-full bg-gray-50 border-0 focus:ring-black text-sm md:text-base h-10"
                                />
                                <Button type="submit" size="icon" className="rounded-full h-10 w-10 shrink-0 bg-black text-white hover:bg-gray-800">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center h-full">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <Send className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-600">Select a conversation</h3>
                        <p>Any previous chats will appear here.</p>
                        {/* 
                         TODO: Add a proper "Start New Chat" modal or button that lists all users using Admin functionality or similar.
                         For now, users can only reply or see existing chats if they have db data.
                        */}
                    </div>
                )}
            </div>
        </div>
    )
}
