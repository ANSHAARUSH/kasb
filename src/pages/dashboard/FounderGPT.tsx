import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Menu, Plus, History, X, Search, Send, MessageSquare, ChevronDown, ChevronLeft, ChevronRight, Loader2, User, Bot, Flame, Trash2, RefreshCw, ArrowUp, Home, FileText, Trophy, Fish, UserCircle, Mic, Skull, Share2 } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../../components/ui/button"
import { chatWithPersonality } from "../../lib/ai"
import { useAuth } from "../../context/AuthContext"
import { getUserChatSessions, getChatMessages, createChatSession, saveChatMessage, deleteChatSession, type ChatSession } from "../../lib/aiHistory"
import { useNavigate } from "react-router-dom"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { MobileViewSwitcher } from "../../components/chat/MobileViewSwitcher"
import { ModeSwitcher } from "../../components/chat/ModeSwitcher"

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
    const [gptMessages, setGptMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = sessionStorage.getItem('foundergpt_messages');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    })
    const [ptMessages, setPtMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [brutalMode, setBrutalMode] = useState(false)
    const [hasManuallySelectedMentor, setHasManuallySelectedMentor] = useState(false)
    const [isSwitching, setIsSwitching] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [activeMode, setActiveMode] = useState<'foundergpt' | 'piranhatank'>('foundergpt')
    const [ptTab, setPtTab] = useState<'home' | 'pitches' | 'ranks' | 'sharks' | 'profile' | 'choose_sharks' | 'chat'>('home')
    const [selectedSharks, setSelectedSharks] = useState<string[]>([])

    // Mode-aware aliases
    const isPiranha = activeMode === 'piranhatank';
    const messages = isPiranha ? ptMessages : gptMessages;
    const setMessages = isPiranha ? setPtMessages : setGptMessages;
    
    // New Features States
    const [isListening, setIsListening] = useState(false)
    const [allowInterruption, setAllowInterruption] = useState(false)
    const [harshMode, setHarshMode] = useState(false)
    const recognitionRef = useRef<any>(null)


    // Theme Orchestration
    const theme = {
        bg: isPiranha ? "bg-[#0a0a0a]" : "bg-[#000000]",
        text: isPiranha ? "text-gray-100" : "text-white",
        textMuted: isPiranha ? "text-gray-400" : "text-gray-400",
        headerBg: isPiranha ? "bg-[#0a0a0a]/80" : "bg-black/80",
        card: isPiranha ? "bg-[#111] border-red-900/30" : "bg-[#0a0a0a] border-white/10",
        input: isPiranha ? "bg-[#111] border-red-900/30 focus-within:border-red-500" : "bg-[#0a0a0a] border-white/10 focus-within:border-white",
        aiBubble: isPiranha ? "bg-[#161616] border border-red-900/20 text-gray-200" : "bg-[#111] border border-white/5 text-gray-300",
        userBubble: isPiranha ? "bg-[#8B0000] text-white" : "bg-white text-black",
        accent: isPiranha ? "bg-[#DC143C]" : "bg-white",
        accentText: isPiranha ? "text-[#DC143C]" : "text-white",
        sidebarBg: isPiranha ? "bg-[#0a0a0a]" : "bg-[#000000]",
        sidebarText: isPiranha ? "text-gray-100" : "text-white",
        sidebarBorder: isPiranha ? "border-red-900/30" : "border-white/10"
    };

    const ribbonItems = [
        { id: "home", icon: Home, label: "Home" },
        { id: "pitches", icon: FileText, label: "Pitches" },
        { id: "ranks", icon: Trophy, label: "Ranks" },
        { id: "sharks", icon: Fish, label: "Piranhas" },
        { id: "profile", icon: UserCircle, label: "Profile" },
    ];

    const ptSharks = [
        { id: 'notam', name: 'NoTAM King', icon: '📊', subtext: "No market size? You're out bro 📉", titleColor: 'text-[#FF0000]', iconBg: 'bg-[#3E0000]' },
        { id: 'boat', name: 'BoAt Daddy', icon: '🛥️', subtext: "What's your margin, king? 💰", titleColor: 'text-yellow-400', iconBg: 'bg-yellow-900/30' },
        { id: 'push', name: 'Product Push', icon: '🔍', subtext: "Does the customer actually care? 🤨", titleColor: 'text-green-500', iconBg: 'bg-green-900/30' },
    ];

    const scrollToTop = () => {
        // Collect all potential scrollable area candidates
        const elements = [
            document.documentElement,
            document.body,
            document.getElementById('root'),
            document.querySelector('.min-w-0\\.md\\:pl-64'),
            document.querySelector('main'),
            scrollContainerRef.current
        ].filter(Boolean) as Element[];

        // Find the one container that is actually scrolled down the most
        const scrolledElement = elements.reduce((maxEl, el) => {
            return el && el.scrollTop > (maxEl ? maxEl.scrollTop : 0) ? el : maxEl;
        }, elements[0]);

        if (scrolledElement && scrolledElement.scrollTop > 0) {
            scrolledElement.scrollTo({ top: 0, behavior: "smooth" });
        } else if (window.scrollY > 0) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            // Absolute fallback instantly
            window.scrollTo(0, 0);
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        }
    };

    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
        return sessionStorage.getItem('foundergpt_sessionId') || null;
    })
    const { user } = useAuth()

    const piranhaSessions = sessions.filter(s => 
        s.personality_id === 'Piranha Panel' || ptSharks.some(shark => shark.name === s.personality_id)
    );

    const getRelativeTimeString = (dateString: string) => {
        const elapsed = Date.now() - new Date(dateString).getTime();
        const minutes = Math.floor(elapsed / (1000 * 60));
        if (minutes < 60) return `${Math.max(1, minutes)} mins ago`;
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        if (hours < 24) return `${hours} hrs ago`;
        const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
        if (days === 1) return `Yesterday`;
        return `${days} days ago`;
    };

    // Persist chat state to sessionStorage so it survives tab switches
    useEffect(() => {
        sessionStorage.setItem('foundergpt_messages', JSON.stringify(gptMessages));
    }, [gptMessages])

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

    const handleSendMessage = async (textOverride?: string | React.MouseEvent) => {
        const textToUse = typeof textOverride === 'string' ? textOverride : query.trim();
        if (!textToUse || isLoading || !user) return

        const userText = textToUse;
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: userText,
            timestamp: new Date().toISOString()
        }
        
        setMessages(prev => [...prev, userMessage])
        setQuery("")
        if (isListening) toggleListening()
        setIsLoading(true)

        let sessionId = currentSessionId
        let activeMentor = personality;

        if (isPiranha) {
            if (selectedSharks.length === 1) {
                activeMentor = ptSharks.find(s => s.id === selectedSharks[0])?.name || "Piranha Panel";
            } else {
                activeMentor = "Piranha Panel";
            }
        }

        try {
            // Auto-select mentor for new chats if user hasn't manually picked one (GPT only)
            if (!isPiranha && !sessionId && !hasManuallySelectedMentor) {
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
            if (isPiranha && ptTab === 'home') setPtTab('home') // maintain if home, else if chat it stays
        }
    }

    // Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition()
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setQuery(prev => prev + (prev ? " " : "") + transcript + " ");
                };
                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsListening(false);
                };
                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
    }, [])

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error(e);
            }
        }
    }

    const handleNewChat = () => {
        if (isPiranha) {
            setPtMessages([])
            setQuery("")
            setIsSidebarOpen(false)
            if (ptTab === 'chat') setPtTab('home')
        } else {
            setCurrentSessionId(null)
            setGptMessages([])
            setQuery("")
            setIsSidebarOpen(false)
            setHasManuallySelectedMentor(false)
            sessionStorage.removeItem('foundergpt_messages');
            sessionStorage.removeItem('foundergpt_sessionId');
            sessionStorage.removeItem('foundergpt_personality');
        }
    }

    const personalities = [
        { id: "Melon Tusk", label: "Melon Tusk", icon: "🚀", bio: "For first principles, physics, and aggressive engineering" },
        { id: "Steven Dobs", label: "Steven Dobs", icon: "", bio: "For product design, UX, and obsessive simplicity" },
        { id: "Marek Zane", label: "Marek Zane", icon: "👤", bio: "For scaling, network effects, and distribution" },
        { id: "Will Grates", label: "Will Grates", icon: "💻", bio: "For structural logic, platforms, and long-term impact" },
        { id: "Custom Chatbot", label: "Request a Custom Chatbot", icon: "🪄", bio: "Fundraise Pro exclusive feature" },
    ]

    const hasMessages = messages.length > 0

    // Filter sessions by mode
    const displayedSessions = isPiranha ? [] : sessions;

    return (
        <div className={cn("relative min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] md:-mt-6 overflow-hidden flex transition-all duration-500", theme.bg)}>


            <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
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
                            className={cn("fixed top-0 left-0 bottom-0 w-80 border-r z-50 p-6 flex flex-col shadow-2xl", theme.sidebarBg, theme.sidebarBorder)}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", isPiranha ? "bg-[#DC143C]" : "bg-black")}>
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <span className={cn("font-black text-xl tracking-tight", theme.sidebarText)}>Founder GPT</span>
                                </div>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100/10 rounded-full transition-colors">
                                    <X className={cn("h-5 w-5", theme.textMuted)} />
                                </button>
                            </div>

                            {/* Personality Selector */}
                            {!isPiranha && (
                                <div className="mb-6 space-y-2 relative">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 leading-none">Personality</label>
                                    <button
                                        onClick={() => setIsOpenPersonality(!isOpenPersonality)}
                                        className={cn("w-full h-12 px-4 rounded-2xl border flex items-center justify-between text-sm font-bold transition-all active:scale-[0.98]", theme.input, theme.sidebarText)}
                                    >
                                        <span className="flex items-center gap-2">
                                            {personalities.find(p => p.id === personality)?.icon} {personality}
                                        </span>
                                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpenPersonality && "rotate-180", theme.textMuted)} />
                                    </button>

                                    <AnimatePresence>
                                        {isOpenPersonality && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                className={cn("absolute top-full left-0 right-0 mt-2 border rounded-[1.5rem] shadow-2xl z-[60] overflow-y-auto overflow-x-hidden max-h-[300px] p-2", theme.sidebarBg, theme.sidebarBorder)}
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
                                                                ? "bg-white text-black" 
                                                                : "text-gray-400 hover:bg-white/5"
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
                            )}

                            <Button 
                                className={cn(
                                    "w-full justify-start gap-3 h-12 rounded-2xl shadow-sm transition-all active:scale-95 mb-8",
                                    isPiranha 
                                        ? "bg-[#1A1A1A] border border-red-900/30 hover:bg-[#222] text-white" 
                                        : "bg-[#111] border border-white/10 hover:bg-white/5 text-white"
                                )}
                                onClick={handleNewChat}
                            >
                                <Plus className={cn("h-4 w-4", isPiranha ? "text-[#FF0000]" : "text-black")} />
                                <span className="font-bold text-sm">New Chat</span>
                            </Button>

                            <div className="flex-1 overflow-y-auto space-y-6">
                                {/* Mode Switcher (GPT vs Tank) */}
                                <ModeSwitcher 
                                    activeMode={activeMode} 
                                    onModeChange={(mode) => {
                                        setActiveMode(mode);
                                        setIsSidebarOpen(false);
                                    }} 
                                />

                                {/* Unified Mobile View Switcher */}
                                <MobileViewSwitcher currentView="foundergpt" />

                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2 flex items-center gap-2">
                                        <History className="h-3 w-3" />
                                        Your History
                                    </h3>
                                    <div className="space-y-1">
                                        {displayedSessions.map(chat => (
                                            <button 
                                                key={chat.id}
                                                onClick={() => loadSession(chat.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group text-left",
                                                    currentSessionId === chat.id 
                                                        ? "bg-white/10 text-white" 
                                                        : "hover:bg-white/5"
                                                )}
                                            >
                                                <MessageSquare className={cn(
                                                    "h-4 w-4 shrink-0 transition-colors",
                                                    currentSessionId === chat.id 
                                                        ? "text-white" 
                                                        : "text-gray-500 group-hover:text-white"
                                                )} />
                                                <span className={cn(
                                                    "text-sm font-medium truncate flex-1",
                                                    currentSessionId === chat.id
                                                        ? "text-white"
                                                        : "text-gray-400 group-hover:text-white"
                                                )}>{chat.title}</span>
                                                <button 
                                                    onClick={(e) => handleDeleteSession(e, chat.id)}
                                                    className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1.5 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500 transition-colors" />
                                                </button>
                                            </button>
                                        ))}
                                        {displayedSessions.length === 0 && (
                                            <div className="px-3 py-4 text-xs font-medium text-gray-500 text-center border border-dashed border-white/10 rounded-xl">
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
            <header className={cn("relative flex items-center justify-between p-4 sm:p-6 sticky top-0 backdrop-blur-md z-30 transition-all duration-500", theme.headerBg)}>
                <div className="flex items-center gap-4 relative z-10">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className={cn("h-10 w-10 flex items-center justify-center rounded-xl border shadow-sm hover:shadow-md transition-all active:scale-90", theme.card)}
                    >
                        <Menu className={cn("h-5 w-5", theme.textMuted)} />
                    </button>
                </div>
                
                {/* Centered Title */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    {isPiranha ? null : (
                        <>
                            <Sparkles className={cn("h-4 w-4", theme.accentText)} />
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", theme.textMuted)}>Founder GPT Beta</span>
                            {hasMessages && (
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 pointer-events-auto", "text-indigo-500 bg-indigo-50")}>
                                    {personalities.find(p => p.id === personality)?.icon} {personality}
                                </span>
                            )}
                        </>
                    )}
                </div>
                                <div className="hidden md:flex flex-col items-end gap-1 relative z-10">
                    <ModeSwitcher 
                        activeMode={activeMode} 
                        onModeChange={setActiveMode} 
                        isHeader={true} 
                    />
                </div>
                <div className="md:hidden flex flex-col items-end gap-1 relative z-10">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300",
                        isPiranha ? "bg-[#111] border-red-900/40 shadow-red-900/10" : "bg-white border-gray-100"
                    )}>
                        <div className={cn("h-2 w-2 rounded-full", isPiranha ? "bg-red-500 animate-pulse" : "bg-green-500")} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", isPiranha ? "text-red-500" : "text-gray-500")}>
                            {isPiranha ? "Tank Active" : "Online"}
                        </span>
                    </div>
                </div>

                {/* Piranha Tank Desktop Navigation Bar */}
                {isPiranha && (
                    <div className="hidden sm:flex items-center justify-center gap-2 mt-4 border-b border-red-900/20 pb-4">
                        {ribbonItems.map((item) => {
                            const isActive = ptTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setPtTab(item.id as any)}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border",
                                        isActive 
                                            ? "bg-[#8B0000] text-white border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.3)]" 
                                            : "bg-[#111] text-gray-500 border-[#222] hover:bg-white/5 hover:text-gray-300"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </header>

            {/* Piranha Tank Vertical Left Ribbon (Desktop Only) */}
            {isPiranha && (
                <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-24 bg-[#0a0a0a] border-r border-red-900/30 flex-col items-center py-12 gap-10 z-30 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                    {/* Vertical "TANK" Text Header */}
                    <div className="flex flex-col items-center gap-1 mb-8">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/50 [writing-mode:vertical-lr] rotate-180">TANK</span>
                        <div className="h-10 w-1 flex items-center justify-center">
                            <div className="w-px h-full bg-gradient-to-b from-red-500/0 via-red-500/50 to-red-500/0" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 w-full">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-3 rounded-2xl text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90 mb-4"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {ribbonItems.map((item) => {
                            const isActive = ptTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setPtTab(item.id as any)}
                                    className={cn(
                                        "group relative flex flex-col items-center justify-center gap-2 w-full py-4 transition-all duration-500",
                                        isActive ? "text-white" : "text-gray-600 hover:text-red-400"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div 
                                            layoutId="ptVerticalTabIndicator"
                                            className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#DC143C] via-[#8B0000] to-[#DC143C] shadow-[0_0_15px_rgba(220,20,60,0.8)]" 
                                        />
                                    )}
                                    <div className={cn(
                                        "p-3 rounded-2xl transition-all duration-300",
                                        isActive ? "bg-red-500/20 shadow-[0_0_15px_rgba(220,20,60,0.2)]" : "group-hover:bg-red-900/10"
                                    )}>
                                        <item.icon className={cn("h-6 w-6 transition-transform duration-500 group-hover:scale-110", isActive ? "text-[#DC143C]" : "text-gray-600")} />
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest transition-colors duration-300",
                                        isActive ? "text-white" : "text-gray-600"
                                    )}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col px-6 max-w-4xl mx-auto w-full pb-4 relative z-10 transition-all duration-500",
                isPiranha && "md:ml-24"
            )}>
                {/* Mobile Bottom Navigation Bar for Piranha Tank */}
                {isPiranha && (
                    <div className="sm:hidden fixed bottom-6 left-6 right-6 z-[100] bg-black/80 backdrop-blur-xl border border-red-900/30 rounded-3xl p-2 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(255,0,0,0.1)]">
                        {ribbonItems.map((item) => {
                            const isActive = ptTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setPtTab(item.id as any)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 p-3 rounded-2xl transition-all active:scale-90 flex-1",
                                        isActive ? "text-red-500 bg-red-500/10" : "text-gray-500"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-red-500" : "text-gray-500")} />
                                    <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
                {isPiranha && (ptTab === 'choose_sharks' || ptTab === 'sharks') ? (
                    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full pt-8">
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={() => setPtTab('home')} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95">
                                <ChevronLeft className="h-6 w-6 text-white" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-white uppercase italic tracking-wide">Choose Your Piranhas</h1>
                                <p className="text-gray-400 font-medium">Select who roasts you</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-24">
                            {ptSharks.map(shark => {
                                const isSelected = selectedSharks.includes(shark.id);
                                return (
                                    <div 
                                        key={shark.id}
                                        onClick={() => {
                                            setSelectedSharks(prev => 
                                                prev.includes(shark.id) ? prev.filter(id => id !== shark.id) : [...prev, shark.id]
                                            );
                                        }}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-3xl border-2 transition-all cursor-pointer active:scale-[0.98]",
                                            isSelected ? "border-[#FF0000] bg-[#FF0000]/5" : "border-[#1F1F1F] bg-[#111] hover:border-[#333]"
                                        )}
                                    >
                                        <div className={cn("h-14 w-14 rounded-full flex items-center justify-center text-2xl shrink-0 border border-white/5", shark.iconBg)}>
                                            {shark.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={cn("text-xl font-black", shark.titleColor)}>{shark.name}</h3>
                                            <p className="text-gray-400 text-sm font-medium">{shark.subtext}</p>
                                        </div>
                                        <div className="pr-4">
                                            <div className={cn(
                                                "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                isSelected ? "border-[#FF0000] bg-[#FF0000]" : "border-gray-600 bg-transparent"
                                            )}>
                                                {isSelected && <div className="h-2 w-2 bg-white rounded-full" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Bottom floating button area */}
                        <div className="sticky bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent z-50 flex justify-center -mx-6 mt-auto">
                            <button
                                disabled={selectedSharks.length === 0}
                                onClick={() => {
                                    setPtTab('chat');
                                    const sharksNames = ptSharks.filter(s => selectedSharks.includes(s.id)).map(s => s.name).join(', ');
                                    const pitchContext = `[Pitch session initiated. Targeting Piranhas: ${sharksNames}]`;
                                    handleSendMessage(pitchContext);
                                }}
                                className={cn(
                                    "w-full max-w-2xl py-5 rounded-2xl font-black uppercase text-lg tracking-widest transition-all flex items-center justify-center gap-3",
                                    selectedSharks.length === 0 
                                        ? "bg-[#1F1F1F] text-gray-500 cursor-not-allowed" 
                                        : "bg-[#FF0000] text-white hover:bg-red-600 shadow-[0_0_40px_rgba(255,0,0,0.4)] active:scale-[0.98]"
                                )}
                            >
                                {selectedSharks.length === 0 && "Select at least one piranha"}
                                {selectedSharks.length === 1 && "Pitch to 1 Piranha"}
                                {selectedSharks.length === 2 && "Pitch to 2 Piranhas"}
                                {selectedSharks.length === 3 && (
                                    <>
                                        <Flame className="h-5 w-5 animate-pulse" />
                                        Start Full Tank Mode
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : isPiranha && ptTab === 'pitches' ? (
                    <div className="flex-1 overflow-y-auto space-y-6 py-4 custom-scrollbar">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-3xl mx-auto mt-6 px-4"
                        >
                            <div className="flex items-start justify-between mb-8 gap-4">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-1">My Pitches</h1>
                                    <p className="text-gray-500 font-medium">Your pitch history in the tank</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'Piranha Tank on Kasb.AI',
                                                text: 'I am pitching my startup to AI Piranhas! Try it on Kasb.AI',
                                                url: window.location.origin
                                            }).catch(console.error);
                                        } else {
                                            navigator.clipboard.writeText('I am pitching my startup to AI Piranhas! Try it on Kasb.AI ' + window.location.origin);
                                            alert("Link copied to clipboard!");
                                        }
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#2A0A0A] hover:bg-[#3D0A0A] text-[#FF4444] hover:text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,0,0,0.1)] hover:shadow-[0_0_25px_rgba(255,0,0,0.2)] border border-red-900/30 shrink-0 mt-1"
                                >
                                    <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span>Share</span>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {piranhaSessions.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-red-900/20 rounded-3xl">
                                        <Fish className="h-12 w-12 text-red-900/40 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No pitches yet. Jump into the tank to start!</p>
                                    </div>
                                ) : (
                                    piranhaSessions.map((pitch, idx) => (
                                        <motion.div 
                                            key={pitch.id} 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => {
                                                loadSession(pitch.id);
                                                setPtTab('chat');
                                            }}
                                            className="bg-[#111] border border-[#222] rounded-3xl p-5 sm:p-6 hover:border-gray-700 transition-all cursor-pointer group flex flex-col gap-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                                                    <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border bg-[#2a0808] text-[#FF0000] border-[#FF0000]/20">
                                                        <FileText className="h-6 w-6" strokeWidth={2.5} />
                                                    </div>
                                                    <div className="min-w-0 pr-4">
                                                        <h3 className="text-white font-extrabold text-lg sm:text-xl mb-0.5 group-hover:text-red-500 transition-colors truncate">{pitch.title}</h3>
                                                        <p className="text-gray-500 text-sm font-medium mb-1.5">{getRelativeTimeString(pitch.created_at)}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-gray-500 text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
                                                                <Fish className="h-3 w-3" />
                                                                {pitch.personality_id}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 sm:gap-8 shrink-0">
                                                    <div className="text-center hidden sm:block">
                                                        <div className="text-3xl font-black leading-none text-white/20">--</div>
                                                        <div className="text-gray-500 text-xs font-bold mt-1 tracking-wider uppercase">Score</div>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-gray-300 transition-colors" strokeWidth={3} />
                                                </div>
                                            </div>
                                            
                                            <div className="pt-3 border-t border-white/5">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (navigator.share) {
                                                            navigator.share({
                                                                title: 'My Piranha Tank Roast',
                                                                text: `I just pitched "${pitch.title}" and got roasted by the Piranhas! Try it on Kasb.AI`,
                                                                url: window.location.origin
                                                            }).catch(console.error);
                                                        } else {
                                                            navigator.clipboard.writeText(`I just pitched "${pitch.title}" and got roasted by the Piranhas! Try it on Kasb.AI`);
                                                            alert("Link copied to clipboard!");
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2A0A0A] hover:bg-[#3D0A0A] text-[#FF4444] hover:text-white font-extrabold text-xs sm:text-[13px] uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,0,0,0.1)] hover:shadow-[0_0_25px_rgba(255,0,0,0.2)] border border-red-900/30"
                                                >
                                                    <Share2 className="h-4 w-4" />
                                                    Share with your friend how you got roasted by Piranhas
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                ) : isPiranha && ptTab !== 'home' && ptTab !== 'chat' && ptTab !== 'choose_sharks' && ptTab !== 'sharks' && ptTab !== 'pitches' ? (
                    <div className="flex-1 flex items-center justify-center flex-col gap-6 text-center">
                        <Fish className="h-16 w-16 text-[#8B0000] opacity-30" />
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em]">{ptTab} View</h2>
                            <p className="text-gray-500 mt-2 font-medium">Coming soon to the Piranha Tank...</p>
                        </div>
                    </div>
                ) : !hasMessages && !(isPiranha && ptTab === 'chat') ? (
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
                            <>
                                {/* Welcome Icon / Logo */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                                    className={cn(
                                        "h-20 w-20 flex items-center justify-center mx-auto mb-4 rounded-2xl shadow-2xl overflow-hidden relative transition-all duration-700", 
                                        isPiranha 
                                            ? "bg-[#FF0000] shadow-red-900/40" 
                                            : "bg-white shadow-[0_0_60px_rgba(255,255,255,0.4),0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_0_80px_rgba(255,255,255,0.6)] scale-105"
                                    )}
                                >
                                    {isPiranha ? (
                                        <img 
                                            src={`${import.meta.env.BASE_URL}logo.jpg`} 
                                            alt="Kasb.AI Logo" 
                                            className="h-full w-full object-cover mix-blend-multiply brightness-75 contrast-125" 
                                        />
                                    ) : (
                                        <img 
                                            src={`${import.meta.env.BASE_URL}logo.jpg`} 
                                            alt="Kasb.AI Logo" 
                                            className="h-full w-full object-contain" 
                                        />
                                    )}
                                </motion.div>

                                {/* Quote Section */}
                                <div className="space-y-4 px-4">
                                    <motion.h2 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className={cn("text-2xl sm:text-4xl font-extrabold tracking-tight leading-[1.1] max-w-2xl mx-auto", theme.text)}
                                    >
                                        "{quote.text}"
                                    </motion.h2>
                                    <motion.p 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className={cn("text-sm font-black uppercase tracking-[0.2em] opacity-60", theme.accentText)}
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
                                    <div className={cn(
                                        "absolute -inset-4 rounded-full blur-[40px] group-focus-within:opacity-100 opacity-0 transition-all duration-1000 pointer-events-none", 
                                        isPiranha ? "bg-[#FF0000]/30" : "bg-white/20"
                                    )} />
                                    <div className={cn(
                                        "relative flex items-center border-2 rounded-full p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden shrink", 
                                        theme.input, 
                                        !isPiranha && "group-focus-within:shadow-[0_0_50px_rgba(255,255,255,0.2)] group-focus-within:border-white/40",
                                        isPiranha && harshMode && "border-red-900/50 shadow-red-900/40"
                                    )}>
                                        <div className="pl-3 sm:pl-4 pr-1 sm:pr-2 shrink-0">
                                            <Search className={cn("h-4 w-4 transition-colors", theme.textMuted)} />
                                        </div>
                                        <input 
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={isPiranha ? "Warning: Piranhas don't care about your feeling" : "Describe your startup idea..."}
                                            className={cn("flex-1 min-w-0 bg-transparent border-none focus:ring-0 font-medium h-10 text-sm sm:text-base outline-none", theme.text, "placeholder:text-gray-600 placeholder:font-bold italic")}
                                        />
                                        
                                        {/* Microphone Button */}
                                        <button 
                                            onClick={toggleListening}
                                            title="Speak your pitch"
                                            className={cn(
                                                "h-10 w-10 mr-1 rounded-full flex items-center justify-center transition-all duration-300",
                                                isListening ? "text-red-500 bg-red-500/20 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.5)]" : isPiranha ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-black"
                                            )}
                                        >
                                            <Mic className="h-5 w-5" />
                                        </button>

                                        <button 
                                            onClick={() => handleSendMessage()}
                                            disabled={!query.trim() || isLoading}
                                            className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                                                query.trim() ? cn("text-white scale-100 shadow-lg", isPiranha ? "bg-[#FF0000] hover:bg-[#B22222]" : "bg-black hover:bg-gray-800") : cn("scale-90", isPiranha ? "bg-white/5 text-gray-600" : "bg-gray-50 text-gray-300")
                                            )}
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    {/* Advanced Toggles Row */}
                                    <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                                        {!isPiranha ? (
                                            <button
                                                onClick={() => setBrutalMode(!brutalMode)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 border",
                                                    brutalMode
                                                        ? "bg-red-500 text-white border-red-400 shadow-sm shadow-red-200/50"
                                                        : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                                                )}
                                            >
                                                <Flame className={cn("h-3 w-3 text-orange-500", brutalMode && "animate-pulse")} />
                                                Brutal {brutalMode ? "On" : "Off"}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setHarshMode(!harshMode)}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 border cursor-pointer active:scale-95 shadow-xl",
                                                        harshMode
                                                            ? "bg-[#6A0404] text-white border-red-500 shadow-red-900/40"
                                                            : "bg-[#111] text-gray-500 border-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <Skull className={cn("h-3.5 w-3.5", harshMode ? "text-red-400 animate-pulse" : "text-gray-600")} />
                                                    Harsh Mode {harshMode ? "ON" : "OFF"}
                                                </button>
                                                <button
                                                    onClick={() => setAllowInterruption(!allowInterruption)}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 border cursor-pointer active:scale-95 shadow-xl",
                                                        allowInterruption
                                                            ? "bg-[#DC143C] text-white border-red-500 shadow-red-900/40"
                                                            : "bg-[#111] text-gray-500 border-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <MessageSquare className={cn("h-3.5 w-3.5", allowInterruption ? "text-white" : "text-gray-600")} />
                                                    Interrupt {allowInterruption ? "ON" : "OFF"}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <p className={cn("text-[10px] font-black uppercase tracking-[0.4em] mt-8 text-center", isPiranha ? "text-red-900/60" : "text-gray-300")}>KASB AI IS AI CAN MAKE MISTAKE</p>

                                    {/* Quick Suggestions - hidden in Piranha mode */}
                                    {!isPiranha && (
                                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                                            {["Analyze Market", "Pitch Feedback", "Growth Hacks"].map(tag => (
                                                <button 
                                                    key={tag} 
                                                    onClick={() => setQuery(tag)}
                                                    className="px-5 py-2 rounded-full bg-[#111] border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:border-white/20 hover:text-white transition-all active:scale-95 shadow-sm"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </>
                        </motion.div>
                    </div>
                ) : (
                    /* Chat View */
                    <>
                        <div 
                            ref={scrollContainerRef}
                            className="flex-1 overflow-y-auto space-y-6 py-4 custom-scrollbar"
                        >
                            <AnimatePresence initial={false}>
                                {messages.map((msg, msgIndex) => {
                                    const isLastAiMessage = msg.role === "assistant" && msgIndex === messages.length - 1;
                                    const mentorIcon = isPiranha ? "🐟" : (personalities.find(p => p.id === msg.mentorId)?.icon || "🤖");

                                    // Get alternative mentors (exclude current mentor) — GPT only
                                    const alternativeMentors = isPiranha ? [] : (msg.originalPrompt
                                        ? getRankedMentors(msg.originalPrompt).filter(m => m !== msg.mentorId)
                                        : []);

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
                                                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1", isPiranha ? "bg-[#DC143C]" : "bg-black")} title={msg.mentorId || personality}>
                                                    <Bot className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                            <div className="flex flex-col max-w-[80%]">
                                                {msg.role === "assistant" && (isPiranha || msg.mentorId) && (
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-1 ml-1", theme.textMuted)}>
                                                        {isPiranha ? `🐟 ${selectedSharks.length > 1 ? 'Piranha Panel' : (ptSharks.find(s => s.id === selectedSharks[0])?.name || 'Piranha')}` : `${mentorIcon} ${msg.mentorId}`}
                                                    </span>
                                                )}
                                                <div
                                                    className={cn(
                                                        "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                                                        msg.role === "user"
                                                            ? cn("rounded-br-sm", theme.userBubble)
                                                            : cn("rounded-bl-sm", theme.aiBubble)
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
                                                                        className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111] border border-white/10 hover:border-white/30 hover:shadow-md text-xs font-bold text-gray-400 hover:text-white transition-all duration-200 active:scale-95"
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
                                                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1", isPiranha ? "bg-[#8B0000]" : "bg-white")}>
                                                    <User className={cn("h-4 w-4", isPiranha ? "text-white" : "text-black")} />
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
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1", isPiranha ? "bg-[#DC143C]" : "bg-black")}>
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <div className={cn("rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2", isPiranha ? "bg-[#161616] border border-red-900/20" : "bg-gray-50 border border-gray-100")}>
                                        <Loader2 className={cn("h-4 w-4 animate-spin", isPiranha ? "text-gray-500" : "text-gray-400")} />
                                        <span className={cn("text-sm font-medium", isPiranha ? "text-gray-400" : "text-gray-400")}>
                                            {isPiranha ? "The Piranhas are thinking..." : `${personality} is thinking...`}
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        {/* Chat Input Bar */}
                        <div className={cn("sticky bottom-0 pt-4 pb-2 transition-all", theme.bg)}>
                            <div className="relative w-full max-w-2xl mx-auto">
                                <div className={cn("relative flex items-center border-2 rounded-full p-1.5 shadow-lg group transition-all duration-300 overflow-hidden shrink", theme.input)}>
                                    <input 
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isPiranha ? "Warning: Piranhas don't care about your feeling" : "Ask a follow-up..."}
                                        disabled={isLoading}
                                        className={cn("flex-1 min-w-0 bg-transparent border-none focus:ring-0 font-medium h-10 text-sm sm:text-base outline-none pl-3 sm:pl-4", theme.text, "placeholder:text-gray-600 placeholder:font-bold italic")}
                                    />
                                    
                                    {/* Microphone Button */}
                                    <button 
                                        onClick={toggleListening}
                                        title="Speak your pitch"
                                        className={cn(
                                            "h-10 w-10 mr-1 rounded-full flex items-center justify-center transition-all duration-300",
                                            isListening ? "text-red-500 bg-red-500/20 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.5)]" : isPiranha ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-black"
                                        )}
                                    >
                                        <Mic className="h-5 w-5" />
                                    </button>

                                    <button 
                                        onClick={() => handleSendMessage()}
                                        disabled={!query.trim() || isLoading}
                                        className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                                            query.trim() && !isLoading ? cn("text-white scale-100 shadow-lg", isPiranha ? "bg-[#DC143C] hover:bg-[#B22222]" : "bg-black hover:bg-gray-800") : cn("scale-90", isPiranha ? "bg-white/5 text-gray-600" : "bg-gray-50 text-gray-300")
                                        )}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {/* Advanced Toggles Row */}
                                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                                    {!isPiranha ? (
                                        <button
                                            onClick={() => setBrutalMode(!brutalMode)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 border",
                                                brutalMode
                                                    ? "bg-red-500 text-white border-red-400 shadow-sm shadow-red-200/50"
                                                    : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                                            )}
                                        >
                                            <Flame className={cn("h-3 w-3 text-orange-500", brutalMode && "animate-pulse")} />
                                            Brutal {brutalMode ? "On" : "Off"}
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setHarshMode(!harshMode)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 border cursor-pointer active:scale-95 shadow-xl",
                                                    harshMode
                                                        ? "bg-[#6A0404] text-white border-red-500 shadow-red-900/40"
                                                        : "bg-[#111] text-gray-500 border-white/5 hover:border-white/10"
                                                )}
                                            >
                                                <Skull className={cn("h-3.5 w-3.5", harshMode ? "text-red-400 animate-pulse" : "text-gray-600")} />
                                                Harsh Mode {harshMode ? "ON" : "OFF"}
                                            </button>
                                            <button
                                                onClick={() => setAllowInterruption(!allowInterruption)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 border cursor-pointer active:scale-95 shadow-xl",
                                                    allowInterruption
                                                        ? "bg-[#DC143C] text-white border-red-500 shadow-red-900/40"
                                                        : "bg-[#111] text-gray-500 border-white/5 hover:border-white/10"
                                                )}
                                            >
                                                <MessageSquare className={cn("h-3.5 w-3.5", allowInterruption ? "text-white" : "text-gray-600")} />
                                                Interrupt {allowInterruption ? "ON" : "OFF"}
                                            </button>
                                        </>
                                    )}
                                </div>
                                <p className={cn("text-center text-[10px] font-black uppercase tracking-[0.4em] mt-3", isPiranha ? "text-red-900/60" : "text-gray-300")}>KASB AI IS AI CAN MAKE MISTAKE</p>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {!hasMessages && (
                <footer className="p-6 text-center">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">
                        Powered by Kasb intelligence
                    </p>
                </footer>
            )}

            <AnimatePresence>
                {hasMessages && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={scrollToTop}
                        className={cn("fixed bottom-28 right-6 h-12 w-12 rounded-full shadow-2xl flex items-center justify-center transition-all z-[999] border backdrop-blur-md", isPiranha ? "bg-[#DC143C]/90 text-white border-white/10 hover:bg-[#DC143C]" : "bg-black/90 text-white border-white/20 hover:bg-black")}
                        title="Scroll to top"
                    >
                        <ArrowUp className="h-5 w-5" />
                    </motion.button>
                )}
            </AnimatePresence>
            </div>
        </div>
    )
}
