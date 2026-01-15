import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { type Message, type ChatUser } from '../types'
import { ChatContext } from '../hooks/useChat'
import { chatWithAI } from '../lib/ai'

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [activeUser, setActiveUser] = useState<ChatUser | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [recentChats, setRecentChats] = useState<ChatUser[]>([])
    const [loading, setLoading] = useState(false)

    // Clear state on logout
    useEffect(() => {
        if (!user) {
            setRecentChats([])
            setMessages([])
            setActiveUser(null)
            setIsOpen(false)
        }
    }, [user])
    const fetchRecentChats = useCallback(async () => {
        if (!user) return

        const { data, error } = await supabase
            .from('messages')
            .select('sender_id, receiver_id')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false })

        // ... error handling ...

        const uniqueUserIds = new Set<string>()
        data?.forEach(msg => {
            if (msg.sender_id !== user.id) uniqueUserIds.add(msg.sender_id)
            if (msg.receiver_id !== user.id) uniqueUserIds.add(msg.receiver_id)
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

            const adminIds = new Set(aData?.map(a => a.id) || [])

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
                    chatUsers.push({ id: s.id, name: s.name, avatar: s.logo || '🚀', role: 'startup' })
                }
            })
            iData?.forEach((i: { id: string, name: string, avatar: string }) => {
                if (!adminIds.has(i.id)) {
                    chatUsers.push({ id: i.id, name: i.name, avatar: i.avatar || '👤', role: 'investor' })
                }
            })
        }

        // Always prepend Kasb AI Bot
        const aiBot: ChatUser = {
            id: 'kasb-ai-bot',
            name: 'Kasb AI',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KasbAI',
            role: 'investor' // Use investor role for admin-like styling
        }

        setRecentChats([aiBot, ...chatUsers])
    }, [user])

    // Initialize recent chats when user logs in
    useEffect(() => {
        if (user) {
            fetchRecentChats()
        }
    }, [user, fetchRecentChats])

    // Subscribe to realtime messages to refresh chat list
    useEffect(() => {
        if (!user) return

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
    }, [user, fetchRecentChats])

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
    }, [])

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
