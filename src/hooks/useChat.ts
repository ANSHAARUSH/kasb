import * as React from "react"
import { type Message, type ChatUser } from '../types'

export interface ChatContextType {
    isOpen: boolean
    activeUser: ChatUser | null
    toggleChat: () => void
    openChat: (user: ChatUser | null) => void
    closeChat: () => void
    sendMessage: (content: string) => Promise<void>
    messages: Message[]
    recentChats: ChatUser[]
    loading: boolean
}

export const ChatContext = React.createContext<ChatContextType | undefined>(undefined)

export const useChat = () => {
    const context = React.useContext(ChatContext)
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider')
    }
    return context
}
