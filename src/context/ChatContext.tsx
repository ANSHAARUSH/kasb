import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { type Message, type ChatUser } from '../types'
import { ChatContext } from '../hooks/useChat'
// Lazy-loaded to avoid pulling the entire AI SDK into the main bundle
let _chatWithAI: typeof import('../lib/ai').chatWithAI | null = null;
async function getChatWithAI() {
    if (!_chatWithAI) {
        const mod = await import('../lib/ai');
        _chatWithAI = mod.chatWithAI;
    }
    return _chatWithAI;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [activeUser, setActiveUser] = useState<ChatUser | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [recentChats, setRecentChats] = useState<ChatUser[]>([])
    const [loading, setLoading] = useState(false)

    const [prevUserId, setPrevUserId] = useState(user?.id)

    if (user?.id !== prevUserId) {
        setPrevUserId(user?.id)
        if (!user) {
            setRecentChats([])
            setMessages([])
            setActiveUser(null)
            setIsOpen(false)
        }
    }
    const fetchRecentChats = useCallback(async () => {
        if (!user) return

        const { data } = await supabase
            .from('messages')
            .select('sender_id, receiver_id, created_at, is_read')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false })

        // ... error handling ...

        const uniqueUserIds = new Set<string>()
        const unreadCounts: Record<string, number> = {}
        const lastMessageTimes: Record<string, string> = {}

        data?.forEach((msg: any) => {
            const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            uniqueUserIds.add(otherId)

            if (!lastMessageTimes[otherId]) {
                lastMessageTimes[otherId] = msg.created_at
            }

            if (msg.receiver_id === user.id && !msg.is_read) {
                unreadCounts[otherId] = (unreadCounts[otherId] || 0) + 1
            }
        })

        const ids = Array.from(uniqueUserIds)

        // Fetch real users
        let chatUsers: ChatUser[] = []
        if (ids.length > 0) {
            const { data: sData } = await supabase.from('startups').select('id, name, logo').in('id', ids)
            const { data: iData } = await supabase.from('investors').select('id, name, avatar').in('id', ids)

            // Try to fetch admins, but don't fail if it errors
            let aData = null
            try {
                const result = await supabase.from('admins').select('id').in('id', ids)
                aData = result.data
            } catch (err) {
                console.warn("Could not fetch admin data:", err)
            }

            const adminIds = new Set<string>((aData?.map((a: any) => a.id) || []) as string[])

            // Handle Admins first
            adminIds.forEach(id => {
                chatUsers.push({
                    id,
                    name: 'Kasb.AI',
                    avatar: `${import.meta.env.BASE_URL}logo.jpg`,
                    role: 'investor'
                })
            })

            sData?.forEach((s: { id: string, name: string, logo: string }) => {
                if (!adminIds.has(s.id)) {
                    chatUsers.push({ id: s.id, name: s.name, avatar: s.logo || '🚀', role: 'startup', unreadCount: unreadCounts[s.id] || 0, lastMessageTime: lastMessageTimes[s.id] })
                }
            })
            iData?.forEach((i: { id: string, name: string, avatar: string }) => {
                if (!adminIds.has(i.id)) {
                    chatUsers.push({ id: i.id, name: i.name, avatar: i.avatar || '👤', role: 'investor', unreadCount: unreadCounts[i.id] || 0, lastMessageTime: lastMessageTimes[i.id] })
                }
            })
        }

        // Always prepend Kasb AI Bot
        const aiBot: ChatUser = {
            id: 'kasb-ai-bot',
            name: 'Kasb AI',
            avatar: `${import.meta.env.BASE_URL}kasb-assistant-avatar.webp`,
            role: 'investor', // Use investor role for admin-like styling
            lastMessageTime: new Date().toISOString() // Keep on top
        }

        // Sort rest of the users by last message time
        chatUsers.sort((a, b) => {
            const timeA = new Date(a.lastMessageTime || 0).getTime()
            const timeB = new Date(b.lastMessageTime || 0).getTime()
            return timeB - timeA
        })

        setRecentChats([aiBot, ...chatUsers])
    }, [user])

    // Initialize recent chats only when chat dialog is first opened
    useEffect(() => {
        if (user && isOpen) {
            fetchRecentChats()
        }
    }, [user, isOpen, fetchRecentChats])

    // Subscribe to realtime messages only when chat has been opened
    useEffect(() => {
        if (!user || !isOpen) return

        const channel = supabase
            .channel('chat_updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${user.id}`,
                },
                () => {
                    fetchRecentChats()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    fetchRecentChats()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, isOpen, fetchRecentChats])

    // Load messages when active user changes
    useEffect(() => {
        if (!user || !activeUser) return

        const fetchMessages = async () => {
            setLoading(true)

            // Handle AI Bot
            if (activeUser.id === 'kasb-ai-bot') {
                const stored = localStorage.getItem(`kasb_ai_chat_${user.id}`)
                if (stored) {
                    setMessages(JSON.parse(stored))
                } else {
                    // Welcome message
                    setMessages([{
                        id: 'welcome-ai',
                        sender_id: 'kasb-ai-bot',
                        receiver_id: user.id,
                        content: "Hello! I am Kasb AI. How can I help you today?",
                        created_at: new Date().toISOString(),
                        is_read: true
                    }])
                }
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeUser.id}),and(sender_id.eq.${activeUser.id},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true })

            if (error) console.error("Error fetching messages:", error)
            if (data) setMessages(data)
            setLoading(false)
        }

        void fetchMessages()
    }, [user, activeUser])


    const openChat = useCallback((chatUser: ChatUser | null) => {
        console.log("Opening chat with:", chatUser?.id, chatUser?.name)
        setMessages([])
        setActiveUser(chatUser)
        setIsOpen(true)

        // Mark messages as read
        if (chatUser && user && chatUser.id !== 'kasb-ai-bot') {
            supabase
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', chatUser.id)
                .eq('receiver_id', user.id)
                .eq('is_read', false)
                .then(({ error }) => {
                    if (!error) {
                        fetchRecentChats() // Refresh to update unread counts
                    }
                })
        }
    }, [user, fetchRecentChats])

    const closeChat = useCallback(() => {
        setMessages([])
        setIsOpen(false)
        setActiveUser(null)
    }, [])

    const toggleChat = useCallback(() => setIsOpen(prev => !prev), [])

    const sendMessage = useCallback(async (content: string) => {
        if (!user || !activeUser || !content.trim()) return

        // 1. Optimistic Update
        const tempMsg: Message = {
            id: 'temp-' + Date.now(),
            sender_id: user.id,
            receiver_id: activeUser.id,
            content,
            created_at: new Date().toISOString(),
            is_read: false
        }
        setMessages(prev => [...prev, tempMsg])

        // 2. Handle AI Bot
        if (activeUser.id === 'kasb-ai-bot') {
            // Save user message to local storage
            const currentHistory = [...messages, tempMsg]
            localStorage.setItem(`kasb_ai_chat_${user.id}`, JSON.stringify(currentHistory))

            // Trigger AI Response
            try {
                console.log("Sending message to AI...", content)
                // simple history for AI context
                const historyForAI = currentHistory.map(m => ({
                    role: m.sender_id === user.id ? 'user' : 'assistant',
                    content: m.content
                })) as { role: 'user' | 'assistant', content: string }[]

                // Try getting key from all sources
                const envKey = import.meta.env.VITE_GROQ_API_KEY
                const localKey = localStorage.getItem('groq_api_key')
                const apiKey = envKey || localKey || ''

                console.log(`Keys check - Env: ${!!envKey}, Local: ${!!localKey}, Final: ${!!apiKey}`)

                if (!apiKey) {
                    console.warn("No API key found in ChatContext!")
                    const errorMsg: Message = {
                        id: 'ai-err-' + Date.now(),
                        sender_id: 'kasb-ai-bot',
                        receiver_id: user.id,
                        content: "I'm sorry, I am not connected to my brain (API Key missing).",
                        created_at: new Date().toISOString(),
                        is_read: true
                    }
                    setMessages(prev => [...prev, errorMsg])
                    return
                }

                console.log("Calling chatWithAI...")
                const chatWithAI = await getChatWithAI()
                const responseText = await chatWithAI(content, historyForAI, apiKey)
                console.log("chatWithAI returned:", responseText ? responseText.substring(0, 20) + "..." : "EMPTY/NULL")

                const aiMsg: Message = {
                    id: 'ai-' + Date.now(),
                    sender_id: 'kasb-ai-bot',
                    receiver_id: user.id,
                    content: responseText,
                    created_at: new Date().toISOString(),
                    is_read: true
                }

                setMessages(prev => {
                    const newState = [...prev, aiMsg]
                    localStorage.setItem(`kasb_ai_chat_${user.id}`, JSON.stringify(newState))
                    console.log("Updated messages state with AI response")
                    return newState
                })

            } catch (err) {
                console.error("CRITICAL AI CONTEXT ERROR:", err)
            }
            return
        }

        // 3. Handle Regular Message
        const { error } = await supabase
            .from('messages')
            .insert([{
                sender_id: user.id,
                receiver_id: activeUser.id,
                content
            }])

        if (error) {
            toast("Failed to send message", "error")
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
        }
    }, [user, activeUser, toast, messages])

    return (
        <ChatContext.Provider value={{
            isOpen,
            activeUser,
            toggleChat,
            openChat,
            closeChat,
            sendMessage,
            messages,
            recentChats,
            loading
        }}>
            {children}
        </ChatContext.Provider>
    )
}
