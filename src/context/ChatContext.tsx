import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { type Message, type ChatUser } from '../types'
import { ChatContext } from '../hooks/useChat'

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

    // Load recent chats (users you have talked to)
    const fetchRecentChats = useCallback(async () => {
        if (!user) return

        const { data, error } = await supabase
            .from('messages')
            .select('sender_id, receiver_id')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching chats", error)
            return
        }

        const uniqueUserIds = new Set<string>()
        data?.forEach(msg => {
            if (msg.sender_id !== user.id) uniqueUserIds.add(msg.sender_id)
            if (msg.receiver_id !== user.id) uniqueUserIds.add(msg.receiver_id)
        })

        const ids = Array.from(uniqueUserIds)
        if (ids.length === 0) {
            setRecentChats([])
            return
        }

        const { data: sData } = await supabase.from('startups').select('id, name, logo').in('id', ids)
        const { data: iData } = await supabase.from('investors').select('id, name, avatar').in('id', ids)
        const { data: aData } = await supabase.from('admins').select('id').in('id', ids)

        const adminIds = new Set(aData?.map(a => a.id) || [])
        const chatUsers: ChatUser[] = []

        // Handle Admins first for priority branding
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

        setRecentChats((prev) => {
            // Only update if data changed (naive check)
            if (JSON.stringify(prev) === JSON.stringify(chatUsers)) return prev
            return chatUsers
        })
    }, [user])

    // Subscribe to realtime messages
    useEffect(() => {
        if (!user) return

        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                },
                (payload) => {
                    const newMessage = payload.new as Message

                    // If chat is open with this sender, append message
                    if (activeUser && newMessage.sender_id === activeUser.id) {
                        setMessages((prev) => [...prev, newMessage])
                    } else {
                        toast(`New message from someone!`, "info")
                    }

                    // Refresh recent chats to bubble up
                    void fetchRecentChats()
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [user, activeUser, toast, fetchRecentChats])

    useEffect(() => {
        if (user) {
            // Using a minor delay or tick to avoid synchronous cascading render warning in some strict linters
            const timer = setTimeout(() => {
                void fetchRecentChats()
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [user, fetchRecentChats])

    // Load messages when active user changes
    useEffect(() => {
        if (!user || !activeUser) return

        const fetchMessages = async () => {
            setLoading(true)
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

        // Optimistic update
        const tempMsg: Message = {
            id: 'temp-' + Date.now(),
            sender_id: user.id,
            receiver_id: activeUser.id,
            content,
            created_at: new Date().toISOString(),
            is_read: false
        }
        setMessages(prev => [...prev, tempMsg])

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
    }, [user, activeUser, toast])

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
