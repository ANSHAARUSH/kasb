import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Menu, Plus, History, X, Search, Send, MessageSquare, ChevronDown, Loader2, User, Bot, Flame, Trash2, RefreshCw, ArrowUp } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../../components/ui/button"
import { chatWithPersonality } from "../../lib/ai"
import { useAuth } from "../../context/AuthContext"
import { getUserChatSessions, getChatMessages, createChatSession, saveChatMessage, deleteChatSession, type ChatSession } from "../../lib/aiHistory"
import { useNavigate } from "react-router-dom"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { MobileViewSwitcher } from "../../components/chat/MobileViewSwitcher"

const QUOTES = [
    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { text: "Vision without execution is hallucination.", author: "Thomas Edison" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "The only thing worse than starting something and failing... is not starting something.", author: "Seth Godin" },
    { text: "Ideas are easy. Implementation is hard.", author: "Guy Kawasaki" }
]

interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: string
    mentorId?: string
    originalPrompt?: string
}

export default function FounderGPT() {
    const navigate = useNavigate()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isOpenPersonality, setIsOpenPersonality] = useState(false)
    const [query, setQuery] = useState("")
    const [quote, setQuote] = useState(QUOTES[0])
    const [personality, setPersonality] = useState(() => {
        return sessionStorage.getItem('foundergpt_personality') || "Melon Tusk";
    })
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = sessionStorage.getItem('foundergpt_messages');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    })
    const [isLoading, setIsLoading] = useState(false)
    const [brutalMode, setBrutalMode] = useState(false)
    const [hasManuallySelectedMentor, setHasManuallySelectedMentor] = useState(false)
    const [isSwitching, setIsSwitching] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
        return sessionStorage.getItem('foundergpt_sessionId') || null;
    })
    const { user } = useAuth()

    // Persist chat state to sessionStorage so it survives tab switches
    useEffect(() => {
        sessionStorage.setItem('foundergpt_messages', JSON.stringify(messages));
    }, [messages])

    useEffect(() => {
        if (currentSessionId) {
            sessionStorage.setItem('foundergpt_sessionId', currentSessionId);
        } else {
            sessionStorage.removeItem('foundergpt_sessionId');
        }
    }, [currentSessionId])

    useEffect(() => {
        sessionStorage.setItem('foundergpt_personality', personality);
    }, [personality])

    useEffect(() => {
        if (user) {
            getUserChatSessions(user.id).then(setSessions)
        }
    }, [user])

    const loadSession = async (sessionId: string) => {
        setCurrentSessionId(sessionId)
        setIsSidebarOpen(false)
        const sessionInfo = sessions.find(s => s.id === sessionId)
        if (sessionInfo) {
            setPersonality(sessionInfo.personality_id)
        }
        const msgs = await getChatMessages(sessionId)
        setMessages(msgs.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.created_at
        })))
    }

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation()
        const success = await deleteChatSession(sessionId)
        if (success) {
            setSessions(prev => prev.filter(s => s.id !== sessionId))
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null)
                setMessages([])
                setQuery("")
            }
        }
    }

    useEffect(() => {
        // Randomize quote on mount
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
    }, [])

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Get the correct API key based on selected personality
    const getApiKeyForPersonality = (selectedPersonality: string) => {
        if (selectedPersonality === "Melon Tusk") {
            return import.meta.env.VITE_ELON_MUSK_API_KEY;
        }
        if (selectedPersonality === "Steven Dobs") {
            return import.meta.env.VITE_STEVEN_DOBS_API_KEY;
        }
        if (selectedPersonality === "Marek Zane") {
            return import.meta.env.VITE_MAREK_ZANE_API_KEY;
        }
        if (selectedPersonality === "Will Grates") {
            return import.meta.env.VITE_WILL_GRATES_API_KEY;
        }
        // Fallback to the default API key
        return import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    }
    // Keyword expertise map for each mentor
    const MENTOR_KEYWORDS: Record<string, string[]> = {
        "Steven Dobs": [
            "design", "ui", "ux", "user experience", "user interface", "prototype",
            "wireframe", "branding", "brand", "logo", "aesthetic", "visual",
            "simplicity", "minimalist", "product design", "creative", "typography",
            "color", "layout", "mockup", "figma", "landing page", "website design",
            "app design", "mobile design", "look and feel", "beautiful", "elegant"
        ],
        "Will Grates": [
            "build", "code", "software", "platform", "architecture", "system",
            "database", "api", "backend", "frontend", "infrastructure", "cloud",
            "devops", "tech stack", "programming", "developer", "engineering",
            "saas", "tool", "automate", "automation", "integrate", "integration",
            "data", "analytics", "machine learning", "algorithm", "security",
            "server", "deploy", "long-term", "sustainable", "microsoft", "windows"
        ],
        "Marek Zane": [
            "scale", "scaling", "growth", "user acquisition", "viral", "network effect",
            "distribution", "social media", "marketing", "ads", "advertising",
            "engagement", "retention", "community", "audience", "followers",
            "influencer", "content", "seo", "campaign", "funnel", "conversion",
            "traction", "users", "reach", "facebook", "instagram", "meta",
            "grow", "expand", "market share", "go to market", "gtm"
        ],
        "Melon Tusk": [
            "first principles", "innovation", "disrupt", "rocket", "space",
            "manufacturing", "hardware", "physics", "engineering", "tesla",
            "electric", "battery", "energy", "ambitious", "impossible",
            "moonshot", "pivot", "startup", "venture", "fundraise", "funding",
            "investor", "pitch", "valuation", "equity", "strategy", "vision",
            "idea", "business model", "revenue", "profit", "lean", "mvp",
            "competition", "market", "opportunity", "problem", "solution"
        ]
    };

    // Returns mentors ranked by relevance (highest score first)
    const getRankedMentors = (prompt: string): string[] => {
        const text = prompt.toLowerCase();
        const scores: Record<string, number> = {
            "Melon Tusk": 0,
            "Steven Dobs": 0,
            "Marek Zane": 0,
            "Will Grates": 0
        };

        for (const [mentor, keywords] of Object.entries(MENTOR_KEYWORDS)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    scores[mentor] += 1;
                }
            }
        }

        return Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .map(([name]) => name);
    };

    // Auto-select the best AI mentor based on prompt keywords
    const autoSelectMentor = (prompt: string): string => {
        const ranked = getRankedMentors(prompt);
        return ranked[0];
    };

    const handleSwitchMentor = async (targetMentor: string, originalPrompt: string) => {
        if (isLoading || isSwitching || !user) return;

        setIsSwitching(true);
        setPersonality(targetMentor);

        // Remove the last AI response
        setMessages(prev => {
            const lastAiIndex = [...prev].reverse().findIndex(m => m.role === "assistant");
            if (lastAiIndex === -1) return prev;
            const actualIndex = prev.length - 1 - lastAiIndex;
            return prev.slice(0, actualIndex);
        });

        setIsLoading(true);

        try {
            const apiKey = getApiKeyForPersonality(targetMentor);
            if (!apiKey) {
                const errorMsg: ChatMessage = {
                    id: `ai-err-${Date.now()}`,
                    role: "assistant",
                    content: `⚠️ API key not configured for ${targetMentor}.`,
                    timestamp: new Date().toISOString(),
                    mentorId: targetMentor,
                    originalPrompt
                };
                setMessages(prev => [...prev, errorMsg]);
                setIsLoading(false);
                setIsSwitching(false);
                return;
            }

            // Build history excluding the removed last AI message
            const currentMessages = messages.filter((_, i) => {
                const lastAiIndex = [...messages].reverse().findIndex(m => m.role === "assistant");
                return lastAiIndex === -1 || i !== messages.length - 1 - lastAiIndex;
            });
            const history = currentMessages.slice(0, -1).map(m => ({
                role: m.role,
                content: m.content
            }));

            const responseText = await chatWithPersonality(
                originalPrompt,
                history,
                apiKey,
                targetMentor,
                undefined,
                brutalMode
            );

            if (currentSessionId) {
                await saveChatMessage(currentSessionId, "assistant", responseText);
                getUserChatSessions(user.id).then(setSessions);
            }

            const aiMessage: ChatMessage = {
                id: `ai-switch-${Date.now()}`,
                role: "assistant",
                content: responseText,
                timestamp: new Date().toISOString(),
                mentorId: targetMentor,
                originalPrompt
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            console.error("Switch mentor error:", err);
            const errorMsg: ChatMessage = {
                id: `ai-err-${Date.now()}`,
                role: "assistant",
                content: "Something went wrong while switching mentors. Please try again.",
                timestamp: new Date().toISOString(),
                mentorId: targetMentor,
                originalPrompt
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            setIsSwitching(false);
        }
    };

    const handleSendMessage = async () => {
        if (!query.trim() || isLoading || !user) return

        const userText = query.trim()
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: userText,
            timestamp: new Date().toISOString()
        }
        
        setMessages(prev => [...prev, userMessage])
        setQuery("")
        setIsLoading(true)

        let sessionId = currentSessionId
        let activeMentor = personality;

        try {
            // Auto-select mentor for new chats if user hasn't manually picked one
            if (!sessionId && !hasManuallySelectedMentor) {
                activeMentor = autoSelectMentor(userText);
                setPersonality(activeMentor);
            }

            if (!sessionId) {
                const session = await createChatSession(user.id, activeMentor, userText)
                if (session) {
                    sessionId = session.id
                    setCurrentSessionId(sessionId)
                    setSessions(prev => [session, ...prev])
                }
            }

            if (sessionId) {
                await saveChatMessage(sessionId, "user", userText)
            }

            const apiKey = getApiKeyForPersonality(activeMentor)
            
            if (!apiKey) {
                const errorMsg: ChatMessage = {
                    id: `ai-err-${Date.now()}`,
                    role: "assistant",
                    content: "⚠️ API key not configured. Please add your API key to the environment variables.",
                    timestamp: new Date().toISOString()
                }
                setMessages(prev => [...prev, errorMsg])
                setIsLoading(false)
                return
            }

            const history = messages.map(m => ({
                role: m.role,
                content: m.content
            }))

            const responseText = await chatWithPersonality(
                userText,
                history,
                apiKey,
                activeMentor,
                undefined,
                brutalMode
            )

            if (sessionId) {
                await saveChatMessage(sessionId, "assistant", responseText)
                
                // Refresh sessions array so the updated_at timestamp jumps this chat to the top
                getUserChatSessions(user.id).then(setSessions)
            }

            const aiMessage: ChatMessage = {
                id: `ai-${Date.now()}`,
                role: "assistant",
                content: responseText,
                timestamp: new Date().toISOString(),
                mentorId: activeMentor,
                originalPrompt: userText
            }
            setMessages(prev => [...prev, aiMessage])
        } catch (err) {
            console.error("Founder GPT chat error:", err)
            const errorMsg: ChatMessage = {
                id: `ai-err-${Date.now()}`,
                role: "assistant",
                content: "Something went wrong. Please try again.",
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleNewChat = () => {
        setCurrentSessionId(null)
        setMessages([])
        setQuery("")
        setIsSidebarOpen(false)
        setHasManuallySelectedMentor(false)
        // Clear saved state so it starts fresh
        sessionStorage.removeItem('foundergpt_messages');
        sessionStorage.removeItem('foundergpt_sessionId');
        sessionStorage.removeItem('foundergpt_personality');
    }

    const personalities = [
        { id: "Melon Tusk", label: "Melon Tusk", icon: "🚀", bio: "For first principles, physics, and aggressive engineering" },
        { id: "Steven Dobs", label: "Steven Dobs", icon: "", bio: "For product design, UX, and obsessive simplicity" },
        { id: "Marek Zane", label: "Marek Zane", icon: "👤", bio: "For scaling, network effects, and distribution" },
        { id: "Will Grates", label: "Will Grates", icon: "💻", bio: "For structural logic, platforms, and long-term impact" },
        { id: "Custom Chatbot", label: "Request a Custom Chatbot", icon: "🪄", bio: "Fundraise Pro exclusive feature" },
    ]

    const hasMessages = messages.length > 0

    return (
        <div className="relative min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] md:-mt-6 bg-white overflow-hidden flex flex-col transition-all duration-500">
            {/* Sidebar Drawer */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-80 bg-white border-r border-gray-100 z-50 p-6 flex flex-col shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-xl bg-black flex items-center justify-center">
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="font-black text-xl tracking-tight text-gray-900">Founder GPT</span>
                                </div>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="h-5 w-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Personality Selector */}
                            <div className="mb-6 space-y-2 relative">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 leading-none">Personality</label>
                                <button
                                    onClick={() => setIsOpenPersonality(!isOpenPersonality)}
                                    className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-sm font-bold text-gray-900 hover:bg-gray-100 transition-all active:scale-[0.98]"
                                >
                                    <span className="flex items-center gap-2">
                                        {personalities.find(p => p.id === personality)?.icon} {personality}
                                    </span>
                                    <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-300", isOpenPersonality && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {isOpenPersonality && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-[1.5rem] shadow-2xl z-[60] overflow-y-auto overflow-x-hidden max-h-[300px] p-2"
                                        >
                                            {personalities.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => {
                                                        if (p.id === "Custom Chatbot") {
                                                            if (subscriptionManager.getTier() === "fundraise_pro") {
                                                                navigate("/dashboard/custom-chatbot")
                                                            } else {
                                                                navigate("/dashboard/pricing")
                                                            }
                                                            return;
                                                        }
                                                        setPersonality(p.id)
                                                        setHasManuallySelectedMentor(true)
                                                        setIsOpenPersonality(false)
                                                    }}
                                                    className={cn(
                                                        "w-full flex flex-col items-start gap-1 px-4 py-3 rounded-xl transition-all",
                                                        personality === p.id 
                                                            ? "bg-black text-white" 
                                                            : "text-gray-600 hover:bg-gray-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 font-bold text-sm">
                                                        <span className="text-lg">{p.icon}</span>
                                                        <span>{p.label}</span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs font-normal text-left line-clamp-1", 
                                                        personality === p.id ? "text-gray-300" : "text-gray-400"
                                                    )}>
                                                        {p.bio}
                                                    </span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <Button 
                                className="w-full justify-start gap-3 h-12 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 text-gray-900 shadow-sm transition-all active:scale-95 mb-8"
                                onClick={handleNewChat}
                            >
                                <Plus className="h-4 w-4 text-black" />
                                <span className="font-bold text-sm">New Chat</span>
                            </Button>

                            <div className="flex-1 overflow-y-auto space-y-6">
                                {/* Unified Mobile View Switcher */}
                                <MobileViewSwitcher currentView="foundergpt" />

                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2 flex items-center gap-2">
                                        <History className="h-3 w-3" />
                                        Your History
                                    </h3>
                                    <div className="space-y-1">
                                        {sessions.map(chat => (
                                            <button 
                                                key={chat.id}
                                                onClick={() => loadSession(chat.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group text-left",
                                                    currentSessionId === chat.id 
                                                        ? "bg-indigo-50 text-indigo-900" 
                                                        : "hover:bg-gray-50"
                                                )}
                                            >
                                                <MessageSquare className={cn(
                                                    "h-4 w-4 shrink-0 transition-colors",
                                                    currentSessionId === chat.id 
                                                        ? "text-indigo-600" 
                                                        : "text-gray-400 group-hover:text-indigo-600"
                                                )} />
                                                <span className={cn(
                                                    "text-sm font-medium truncate flex-1",
                                                    currentSessionId === chat.id
                                                        ? "text-indigo-900"
                                                        : "text-gray-600 group-hover:text-gray-900"
                                                )}>{chat.title}</span>
                                                <button 
                                                    onClick={(e) => handleDeleteSession(e, chat.id)}
                                                    className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1.5 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500 transition-colors" />
                                                </button>
                                            </button>
                                        ))}
                                        {sessions.length === 0 && (
                                            <div className="px-3 py-4 text-xs font-medium text-gray-400 text-center border border-dashed border-gray-200 rounded-xl">
                                                No past chats found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>


                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="flex items-center justify-between p-4 sm:p-6 sticky top-0 bg-white/80 backdrop-blur-md z-30">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all active:scale-90"
                >
                    <Menu className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Founder GPT Beta</span>
                    {hasMessages && (
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full ml-1">
                            {personalities.find(p => p.id === personality)?.icon} {personality}
                        </span>
                    )}
                </div>
                <div className="w-10" /> {/* Spacer */}
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col px-6 max-w-4xl mx-auto w-full pb-4">
                {!hasMessages ? (
                    /* Welcome Screen */
                    <div className="flex-1 flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ 
                                duration: 0.8, 
                                ease: [0.16, 1, 0.3, 1],
                                staggerChildren: 0.2
                            }}
                            className="w-full space-y-12 text-center"
                        >
                            {/* Welcome Icon / Logo */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                                className="h-20 w-20 flex items-center justify-center mx-auto mb-4"
                            >
                                <img 
                                    src={`${import.meta.env.BASE_URL}logo.jpg`} 
                                    alt="Kasb.AI Logo" 
                                    className="h-full w-full object-contain rounded-2xl shadow-xl shadow-gray-100" 
                                />
                            </motion.div>

                            {/* Quote Section */}
                            <div className="space-y-4 px-4">
                                <motion.h2 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900 leading-[1.1] max-w-2xl mx-auto"
                                >
                                    "{quote.text}"
                                </motion.h2>
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-sm font-black uppercase tracking-[0.2em] text-indigo-500/60"
                                >
                                    — {quote.author}
                                </motion.p>
                            </div>

                            {/* Search Bar */}
                            <motion.div 
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, type: "spring", damping: 20 }}
                                className="relative w-full max-w-xl mx-auto group"
                            >
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-gray-500/5 rounded-full blur-xl group-focus-within:opacity-100 opacity-0 transition-opacity duration-700 pointer-events-none" />
                                <div className="relative flex items-center bg-white border-2 border-gray-100 rounded-full p-1.5 shadow-2xl shadow-gray-200/30 group-focus-within:border-black group-focus-within:ring-4 group-focus-within:ring-black/5 transition-all duration-300">
                                    <div className="pl-4 pr-2">
                                        <Search className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
                                    </div>
                                    <input 
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="What's on your mind today?"
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 font-medium placeholder:text-gray-400 h-10 text-base outline-none"
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!query.trim() || isLoading}
                                        className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                                            query.trim() ? "bg-black text-white scale-100 shadow-lg hover:bg-gray-800" : "bg-gray-50 text-gray-300 scale-90"
                                        )}
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                                
                                {/* Brutal Mode Toggle */}
                                <div className="flex items-center justify-center gap-3 mt-6">
                                    <button
                                        onClick={() => setBrutalMode(!brutalMode)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 border shadow-sm",
                                            brutalMode
                                                ? "bg-red-500 text-white border-red-400 shadow-red-200/50 shadow-md"
                                                : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100 hover:text-gray-600"
                                        )}
                                    >
                                        <Flame className={cn("h-3.5 w-3.5 transition-all", brutalMode && "animate-pulse")} />
                                        Brutal Mode {brutalMode ? "On" : "Off"}
                                    </button>
                                </div>

                                {/* Quick Suggestions */}
                                <div className="flex flex-wrap justify-center gap-2 mt-4">
                                    {["Analyze Market", "Pitch Feedback", "Growth Hacks"].map(tag => (
                                        <button 
                                            key={tag} 
                                            onClick={() => setQuery(tag)}
                                            className="px-5 py-2 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                ) : (
                    /* Chat View */
                    <>
                        <div className="flex-1 overflow-y-auto space-y-6 py-4 custom-scrollbar">
                            <AnimatePresence initial={false}>
                                {messages.map((msg, msgIndex) => {
                                    const isLastAiMessage = msg.role === "assistant" && msgIndex === messages.length - 1;
                                    const mentorIcon = personalities.find(p => p.id === msg.mentorId)?.icon || "🤖";

                                    // Get alternative mentors (exclude current mentor)
                                    const alternativeMentors = msg.originalPrompt
                                        ? getRankedMentors(msg.originalPrompt).filter(m => m !== msg.mentorId)
                                        : [];

                                    return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col"
                                    >
                                        <div className={cn(
                                            "flex gap-3",
                                            msg.role === "user" ? "justify-end" : "justify-start"
                                        )}>
                                            {msg.role === "assistant" && (
                                                <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center shrink-0 mt-1" title={msg.mentorId || personality}>
                                                    <Bot className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                            <div className="flex flex-col max-w-[80%]">
                                                {msg.role === "assistant" && msg.mentorId && (
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">
                                                        {mentorIcon} {msg.mentorId}
                                                    </span>
                                                )}
                                                <div
                                                    className={cn(
                                                        "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                                                        msg.role === "user"
                                                            ? "bg-black text-white rounded-br-md"
                                                            : "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-md"
                                                    )}
                                                >
                                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                                </div>

                                                {/* Switch AI Mentor Button — only on the last AI response */}
                                                {isLastAiMessage && !isLoading && !isSwitching && msg.originalPrompt && alternativeMentors.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.3 }}
                                                        className="mt-3 ml-1"
                                                    >
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                            <RefreshCw className="h-3 w-3" />
                                                            Try another perspective
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {alternativeMentors.map((mentorName) => {
                                                                const mentorInfo = personalities.find(p => p.id === mentorName);
                                                                if (!mentorInfo) return null;
                                                                return (
                                                                    <button
                                                                        key={mentorName}
                                                                        onClick={() => handleSwitchMentor(mentorName, msg.originalPrompt!)}
                                                                        className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-black hover:shadow-md text-xs font-bold text-gray-600 hover:text-black transition-all duration-200 active:scale-95"
                                                                    >
                                                                        <span className="text-base">{mentorInfo.icon}</span>
                                                                        <span className="hidden sm:inline">{mentorInfo.label}</span>
                                                                        <span className="sm:hidden">{mentorInfo.label.split(' ')[0]}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                            {msg.role === "user" && (
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                                                    <User className="h-4 w-4 text-indigo-600" />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {/* Loading indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3 justify-start"
                                >
                                    <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center shrink-0 mt-1">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                                        <span className="text-sm text-gray-400 font-medium">
                                            {personality} is thinking...
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input Bar */}
                        <div className="sticky bottom-0 bg-white pt-4 pb-2">
                            <div className="relative w-full max-w-2xl mx-auto">
                                <div className="relative flex items-center bg-white border-2 border-gray-100 rounded-full p-1.5 shadow-lg group focus-within:border-black focus-within:ring-4 focus-within:ring-black/5 transition-all duration-300">
                                    <input 
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask a follow-up..."
                                        disabled={isLoading}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 font-medium placeholder:text-gray-400 h-10 text-base outline-none pl-4"
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!query.trim() || isLoading}
                                        className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                                            query.trim() && !isLoading ? "bg-black text-white scale-100 shadow-lg hover:bg-gray-800" : "bg-gray-50 text-gray-300 scale-90"
                                        )}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {/* Brutal mode toggle in chat */}
                                <div className="flex items-center justify-center gap-3 mt-4">
                                    <button
                                        onClick={() => setBrutalMode(!brutalMode)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 border",
                                            brutalMode
                                                ? "bg-red-500 text-white border-red-400 shadow-sm shadow-red-200/50"
                                                : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                                        )}
                                    >
                                        <Flame className={cn("h-3 w-3", brutalMode && "animate-pulse")} />
                                        Brutal {brutalMode ? "On" : "Off"}
                                    </button>

                                    <button
                                        onClick={scrollToTop}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 border bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100 hover:text-black"
                                    >
                                        <ArrowUp className="h-3 w-3" />
                                        Top
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Bottom Floating Stats (Optional Premium Feel) */}
            {!hasMessages && (
                <footer className="p-6 text-center">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">
                        Powered by Kasb intelligence
                    </p>
                </footer>
            )}
        </div>
    )
}
