import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { Search, Send, ArrowLeft, MessageSquare, MoreVertical, Trash2, Pencil, X, Check } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { Avatar } from "../../components/ui/Avatar"
import { Link } from "react-router-dom"
import { useToast } from "../../hooks/useToast"
import { chatWithAIStream, refineMessage } from "../../lib/ai"
import { Wand2 } from "lucide-react"

interface Message {
    id: string
    created_at: string
    sender_id: string
    receiver_id: string
    content: string
    is_read: boolean
    is_deleted?: boolean
    last_edited_at?: string
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
    const { toast } = useToast()
    const [selectedChat, setSelectedChat] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null)
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState("")
    const [isRefining, setIsRefining] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Click outside to close menu
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuMessageId(null)
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const handleReportMessage = async (msg: Message) => {
        if (!user) return
        try {
            const { error } = await supabase.from('reports').insert({
                reporter_id: user.id,
                reported_message_id: msg.id,
                conversation_partner_id: msg.sender_id === user.id ? msg.receiver_id : msg.sender_id,
                reason: 'User reported message',
                status: 'pending'
            })
            if (error) throw error
            toast("Report submitted successfully", "success")
        } catch (err) {
            console.error(err)
            toast("Failed to submit report", "error")
        }
    }

    const handleDeleteMessage = async (msgId: string) => {
        // Optimistic update
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m))

        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_deleted: true })
                .eq('id', msgId)

            if (error) throw error
        } catch (err) {
            console.error(err)
            toast("Failed to delete message", "error")
            // Revert optimistic? Complicated without deep cloning state, usually fine to verify on refresh
        }
    }

    const handleSaveEdit = async (msgId: string) => {
        if (!editContent.trim()) return

        // Optimistic update
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editContent, last_edited_at: new Date().toISOString() } : m))
        setEditingMessageId(null)

        try {
            const { error } = await supabase
                .from('messages')
                .update({
                    content: editContent,
                    last_edited_at: new Date().toISOString()
                })
                .eq('id', msgId)

            if (error) throw error
        } catch (err) {
            console.error(err)
            toast("Failed to update message", "error")
        }
    }

    // Process raw messages into conversations list
    const processConversations = useCallback(async (msgs: Message[]) => {
        if (!user) return

        const conversationMap = new Map<string, Message>()

        msgs.forEach(msg => {
            if (msg.is_deleted) return
            const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
            conversationMap.set(otherId, msg) // Keeps the latest one because we sorted by time
        })

        const otherIds = Array.from(conversationMap.keys())

        // Filter out the AI bot (it's not in the database)
        const realUserIds = otherIds.filter(id => id !== 'kasb-ai-bot')

        if (realUserIds.length === 0) {
            // Only AI bot, no need to query database
            const aiBot: Conversation = {
                userId: 'kasb-ai-bot',
                name: 'Kasb AI',
                avatar: `${import.meta.env.BASE_URL}premium-robot.png`,
                lastMessage: 'AI Assistant',
                time: '',
                unread: 0
            }
            setConversations([aiBot])
            return
        }

        // Fetch details
        const { data: startupData } = await supabase.from('startups').select('id, name, founder_name, logo').in('id', realUserIds)
        const { data: investorData } = await supabase.from('investors').select('id, name, avatar').in('id', realUserIds)
        const { data: adminData } = await supabase.from('admins').select('id').in('id', realUserIds)

        const adminIds = new Set(adminData?.map(a => a.id) || [])

        // Fetch connection status for these users
        const { data: connectionData } = await supabase
            .from('connections')
            .select('*')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .eq('status', 'accepted')

        const acceptedIds = new Set(connectionData?.map(c => c.sender_id === user.id ? c.receiver_id : c.sender_id))

        const profiles = [
            ...(startupData || []).map(s => ({ id: s.id, name: s.name || s.founder_name, avatar: s.logo })),
            ...(investorData || []).map(i => ({ id: i.id, name: i.name, avatar: i.avatar })),
            ...Array.from(adminIds).map(id => ({ id, name: 'Kasb.AI', avatar: `${import.meta.env.BASE_URL}logo.jpg` }))
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

        // Always prepend Kasb AI Bot
        const aiBot: Conversation = {
            userId: 'kasb-ai-bot',
            name: 'Kasb AI',
            avatar: `${import.meta.env.BASE_URL}premium-robot.png`,
            lastMessage: 'AI Assistant',
            time: '',
            unread: 0
        }

        setConversations([aiBot, ...formatted])
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

    // Track previous state for smart scrolling
    const prevActiveLen = useRef(0)
    const prevChat = useRef<string | null>(null)

    const activeMessages = messages.filter(m =>
        ((m.sender_id === user?.id && m.receiver_id === selectedChat) ||
            (m.sender_id === selectedChat && m.receiver_id === user?.id)) &&
        !m.is_deleted
    )

    // Scroll to bottom logic
    useEffect(() => {
        if (!scrollRef.current) return

        const shouldScroll =
            selectedChat !== prevChat.current ||
            activeMessages.length > prevActiveLen.current

        if (shouldScroll) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }

        prevActiveLen.current = activeMessages.length
        prevChat.current = selectedChat
    }, [activeMessages.length, selectedChat])

    // Effect to update conversations when messages change (e.g. real-time)
    useEffect(() => {
        if (messages.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            processConversations(messages)
        }
    }, [messages, processConversations]) // Added processConversations to dependencies

    // Load AI chat history from localStorage when selecting AI bot
    useEffect(() => {
        if (!user || selectedChat !== 'kasb-ai-bot') return

        const stored = localStorage.getItem(`kasb_ai_chat_${user.id}`)
        if (stored) {
            const aiHistory = JSON.parse(stored) as Message[]
            setMessages(prev => {
                // Remove any existing AI messages and add stored ones
                const nonAI = prev.filter(m =>
                    m.sender_id !== 'kasb-ai-bot' && m.receiver_id !== 'kasb-ai-bot'
                )
                return [...nonAI, ...aiHistory]
            })
        } else {
            // Show welcome message
            const welcomeMsg: Message = {
                id: 'welcome-ai',
                sender_id: 'kasb-ai-bot',
                receiver_id: user.id,
                content: "Hello! I am Kasb AI, your assistant. How can I help you today?",
                created_at: new Date().toISOString(),
                is_read: true
            }
            setMessages(prev => {
                const nonAI = prev.filter(m =>
                    m.sender_id !== 'kasb-ai-bot' && m.receiver_id !== 'kasb-ai-bot'
                )
                return [...nonAI, welcomeMsg]
            })
        }
    }, [user, selectedChat])


    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !selectedChat) return

        console.log("handleSendMessage called. Selected chat:", selectedChat)

        // Optimistic update
        const tempMsg: Message = {
            id: 'temp-' + Date.now(),
            created_at: new Date().toISOString(),
            sender_id: user.id,
            receiver_id: selectedChat,
            content: newMessage,
            is_read: false
        }
        setMessages(prev => [...prev, tempMsg])
        setNewMessage("")

        // Handle AI Bot
        if (selectedChat === 'kasb-ai-bot') {
            console.log("Sending to AI bot...")
            const currentHistory = [...messages.filter(m =>
                (m.sender_id === user.id && m.receiver_id === 'kasb-ai-bot') ||
                (m.sender_id === 'kasb-ai-bot' && m.receiver_id === user.id)
            ), tempMsg]
            localStorage.setItem(`kasb_ai_chat_${user.id}`, JSON.stringify(currentHistory))

            try {
                const historyForAI = currentHistory.map(m => ({
                    role: m.sender_id === user.id ? 'user' : 'assistant',
                    content: m.content
                })) as { role: 'user' | 'assistant', content: string }[]

                const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('groq_api_key') || ''
                console.log("API Key present:", !!apiKey)

                if (!apiKey) {
                    const errorMsg: Message = {
                        id: 'ai-err-' + Date.now(),
                        sender_id: 'kasb-ai-bot',
                        receiver_id: user.id,
                        content: "I'm sorry, my AI brain is not configured. Please check Admin Settings.",
                        created_at: new Date().toISOString(),
                        is_read: true
                    }
                    setMessages(prev => [...prev, errorMsg])
                    return
                }

                // Create placeholder AI message for streaming
                const aiMsgId = 'ai-' + Date.now();
                const placeholderMsg: Message = {
                    id: aiMsgId,
                    sender_id: 'kasb-ai-bot',
                    receiver_id: user.id,
                    content: "",
                    created_at: new Date().toISOString(),
                    is_read: true
                };
                setMessages(prev => [...prev, placeholderMsg]);

                console.log("Calling chatWithAIStream...");

                // Use streaming version
                await chatWithAIStream(
                    newMessage,
                    historyForAI,
                    apiKey,
                    (chunk) => {
                        // Update message content in real-time
                        setMessages(prev => prev.map(m =>
                            m.id === aiMsgId
                                ? { ...m, content: m.content + chunk }
                                : m
                        ));
                    }
                );

                console.log("AI stream completed");

                // Save to localStorage
                setMessages(prev => {
                    const aiHistory = prev.filter(m =>
                        (m.sender_id === user.id && m.receiver_id === 'kasb-ai-bot') ||
                        (m.sender_id === 'kasb-ai-bot' && m.receiver_id === user.id)
                    );
                    localStorage.setItem(`kasb_ai_chat_${user.id}`, JSON.stringify(aiHistory));
                    return prev;
                });
            } catch (err) {
                console.error("AI Error:", err);
                toast("AI failed to respond", "error");
            }
            return
        }

        // Regular message
        const msg = {
            sender_id: user.id,
            receiver_id: selectedChat,
            content: newMessage,
        }

        const { error } = await supabase.from('messages').insert([msg])
        if (error) {
            console.error('Error sending message:', error)
        }
    }

    const handleRefineMessage = async () => {
        if (!newMessage.trim()) return

        const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('groq_api_key') || ''
        if (!apiKey) {
            toast("API Key missing. Please check Admin Settings.", "error")
            return
        }

        setIsRefining(true)
        try {
            // Call AI to refine the message text
            const refined = await refineMessage(newMessage, apiKey)
            setNewMessage(refined)
            toast("Message refined!", "success")
        } catch (err) {
            console.error(err)
            toast("Failed to refine message", "error")
        } finally {
            setIsRefining(false)
        }
    }



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
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 bg-gray-50/50" ref={scrollRef}>
                            {activeMessages.map((msg, i) => {
                                const isMe = msg.sender_id === user?.id
                                const isEditing = editingMessageId === msg.id
                                const isMenuOpen = activeMenuMessageId === msg.id

                                // Check if editable (within 15 mins)
                                const canEdit = isMe && (new Date().getTime() - new Date(msg.created_at).getTime() < 15 * 60 * 1000)

                                return (
                                    <div key={msg.id || i} className={`group flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                        {!isMe && (
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setActiveMenuMessageId(isMenuOpen ? null : msg.id)
                                                    }}
                                                    className={`p-1 rounded-full hover:bg-gray-200 text-gray-400 ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                                {isMenuOpen && (
                                                    <div className="absolute left-0 bottom-8 z-10 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleReportMessage(msg)
                                                                setActiveMenuMessageId(null)
                                                            }}
                                                            className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 font-medium"
                                                        >
                                                            Report
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className={`relative max-w-[80%] ${isEditing ? 'w-full max-w-[90%]' : ''}`}>
                                            {isEditing ? (
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault()
                                                        handleSaveEdit(msg.id)
                                                    }}
                                                    className="flex gap-2 items-end"
                                                >
                                                    <Input
                                                        value={editContent}
                                                        onChange={e => setEditContent(e.target.value)}
                                                        className="min-w-[200px] bg-white"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-1 shrink-0">
                                                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingMessageId(null)} className="h-8 w-8 p-0 rounded-full text-red-500">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                        <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full text-green-600">
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div
                                                    className={`p-3 rounded-2xl text-sm ${msg.is_deleted
                                                        ? 'bg-gray-100 text-gray-400 italic border border-gray-200'
                                                        : isMe
                                                            ? 'bg-black text-white rounded-tr-sm'
                                                            : 'bg-white border border-gray-200 rounded-tl-sm shadow-sm'
                                                        }`}
                                                >
                                                    {msg.is_deleted ? (
                                                        <span className="flex items-center gap-2">
                                                            <Trash2 className="h-3 w-3" />
                                                            Message deleted
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {msg.content}
                                                            {msg.last_edited_at && (
                                                                <span className="text-[10px] opacity-50 block text-right mt-1">edited</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {isMe && !msg.is_deleted && !isEditing && (
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setActiveMenuMessageId(isMenuOpen ? null : msg.id)
                                                        // Pre-fill edit content if opening menu? No, only on 'Edit' click
                                                    }}
                                                    className={`p-1 rounded-full hover:bg-gray-200 text-gray-400 ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>

                                                {isMenuOpen && (
                                                    <div className="absolute right-0 bottom-8 z-10 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                        {canEdit && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setEditingMessageId(msg.id)
                                                                    setEditContent(msg.content)
                                                                    setActiveMenuMessageId(null)
                                                                }}
                                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2"
                                                            >
                                                                <Pencil className="h-3 w-3" /> Edit
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteMessage(msg.id)
                                                                setActiveMenuMessageId(null)
                                                            }}
                                                            className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 font-medium flex items-center gap-2"
                                                        >
                                                            <Trash2 className="h-3 w-3" /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0">
                            <form
                                className="flex gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    handleSendMessage()
                                }}
                            >
                                <div className="relative flex-1">
                                    <Input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full rounded-full bg-gray-50 border-0 focus:ring-black text-sm md:text-base h-10 pr-10"
                                        disabled={isRefining}
                                    />
                                    {newMessage.trim() && !isRefining && (
                                        <button
                                            type="button"
                                            onClick={handleRefineMessage}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                                            title="Refine with AI"
                                        >
                                            <Wand2 className="h-4 w-4" />
                                        </button>
                                    )}
                                    {isRefining && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <Button type="submit" size="icon" className="rounded-full h-10 w-10 shrink-0 bg-black text-white hover:bg-gray-800" disabled={isRefining}>
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
