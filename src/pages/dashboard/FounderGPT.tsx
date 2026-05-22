import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Menu, Plus, History, X, Search, Send, MessageSquare, ChevronDown, Loader2, Trash2, Flame, Mic, BookOpen, Bot, RefreshCw, User, ArrowUp } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../../components/ui/button"
import { chatWithPersonality } from "../../lib/ai"
import { useAuth } from "../../context/AuthContext"
import { getUserChatSessions, getChatMessages, createChatSession, saveChatMessage, deleteChatSession, type ChatSession } from "../../lib/aiHistory"
import { useNavigate } from "react-router-dom"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { MobileViewSwitcher } from "../../components/chat/MobileViewSwitcher"
import { supabase } from "../../lib/supabase"
import { buildStartupContextBlock } from "../../lib/startupContext"

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
        const [isLoading, setIsLoading] = useState(false)
    const [brutalMode, setBrutalMode] = useState(false)
    const [isSwitching, setIsSwitching] = useState(false)
    const [, setHasManuallySelectedMentor] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
            
    // Mode-aware aliases
    const messages = gptMessages;
    const setMessages = setGptMessages;
    
    // New Features States
    const [isListening, setIsListening] = useState(false)
            const [showPromo, setShowPromo] = useState(false)
    const recognitionRef = useRef<any>(null)

    // Startup context — auto-fetched on mount so mentors know the user's startup
    const [startupContext, setStartupContext] = useState<string>("")
    const [isContextLoaded, setIsContextLoaded] = useState(false)

        useEffect(() => {
        // Promotion logic: Show every 5th visit
        const visits = parseInt(localStorage.getItem('foundergpt_visits') || '0') + 1;
        localStorage.setItem('foundergpt_visits', visits.toString());
        if (visits % 5 === 0) {
            setShowPromo(true);
            setTimeout(() => setShowPromo(false), 5000);
        }
    }, []);

    // Theme Orchestration
        const theme = {
        bg: "bg-[#000000]",
        text: "text-white",
        textMuted: "text-gray-400",
        headerBg: "bg-black/80",
        card: "bg-[#0a0a0a] border-white/10",
        input: "bg-[#0a0a0a] border-white/10 focus-within:border-white",
        aiBubble: "bg-[#111] border border-white/5 text-gray-300",
        userBubble: "bg-white text-black",
        accent: "bg-white",
        accentText: "text-white",
        sidebarBg: "bg-[#000000]",
        sidebarText: "text-white",
        sidebarBorder: "border-white/10"
    };

    

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

    // Fetch startup profile and build context block for AI mentor pre-training
    useEffect(() => {
        if (!user) return
        supabase
            .from('startups')
            .select('name, founder_name, industry, stage, problem_solving, description, traction, valuation, city, state, founder_bio, ai_summary, questionnaire')
            .eq('id', user.id)
            .single()
            .then(({ data, error }) => {
                if (!error && data) {
                    const context = buildStartupContextBlock(data)
                    setStartupContext(context)
                }
                setIsContextLoaded(true)
            })
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
            "design", "ui", "ux", "user interface", "user experience", "visual", "aesthetic", 
            "minimalist", "minimal", "branding", "brand", "logo", "figma", "mockup", 
            "wireframe", "typography", "color", "layout", "creative", "simplicity", 
            "product design", "interface", "experience", "beautiful", "ios", "apple", "pixel"
        ],
        "Marek Zane": [
            "scale", "scaling", "growth", "growth hacking", "user acquisition", "viral", 
            "network effect", "distribution", "marketing", "social media", "ads", "facebook", 
            "meta", "engagement", "retention", "community", "traction", "reach", "marketing funnel",
            "campaign", "seo", "content strategy", "conversion", "metrics", "analytics"
        ],
        "Will Grates": [
            "build", "code", "software", "platform", "architecture", "system", "database", 
            "backend", "frontend", "infrastructure", "cloud", "saas", "api", "engineering", 
            "tech stack", "programming", "devops", "security", "encryption", "stable",
            "reliable", "windows", "long-term", "structure", "technical", "coding"
        ],
        "Melon Tusk": [
            "first principles", "disrupt", "rocket", "physics", "impossible", "moonshot", 
            "ambitious", "innovation", "startup", "venture", "fundraising", "pitch", 
            "valuation", "investor", "equity", "strategy", "vision", "tesla", "spacex",
            "engineering", "efficiency", "hardcore", "pivot", "mvp", "problem solving"
        ]
    };

    // Returns mentors ranked by relevance (highest score first)
    const getRankedMentors = (prompt: string): { name: string, score: number }[] => {
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
            .map(([name, score]) => ({ name, score }));
    };

    // Auto-select the best AI mentor based on prompt keywords
    const autoSelectMentor = (prompt: string, currentMentor: string): string => {
        const ranked = getRankedMentors(prompt);
        // Only switch if there's a clear match (score > 0)
        if (ranked[0].score > 0) {
            return ranked[0].name;
        }
        return currentMentor;
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
                brutalMode,
                startupContext || undefined
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



        try {
            // Dynamically auto-select the best mentor for each prompt (GPT only)
            const bestMentor = autoSelectMentor(userText, personality);
                if (bestMentor !== personality) {
                    console.log(`[FounderGPT] Switching mentor to ${bestMentor} based on prompt analysis`);
                    activeMentor = bestMentor;
                    setPersonality(bestMentor);
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
                brutalMode,
                startupContext || undefined
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
        setCurrentSessionId(null)
        setGptMessages([])
        setQuery("")
        setIsSidebarOpen(false)
        setHasManuallySelectedMentor(false)
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

    // Filter sessions by mode
    const displayedSessions = sessions;

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
                                    <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-black">
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <span className={cn("font-black text-xl tracking-tight", theme.sidebarText)}>Founder GPT</span>
                                </div>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100/10 rounded-full transition-colors">
                                    <X className={cn("h-5 w-5", theme.textMuted)} />
                                </button>
                            </div>

                            {/* Personality Selector */}
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

                            <Button 
                                className={cn(
                                    "w-full justify-start gap-3 h-12 rounded-2xl shadow-sm transition-all active:scale-95 mb-8",
                                    "bg-[#111] border border-white/10 hover:bg-white/5 text-white"
                                )}
                                onClick={handleNewChat}
                            >
                                <Plus className="h-4 w-4 text-white" />
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

            {/* Standalone Sidebar Trigger - Fixed Top Left */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className={cn(
                        "h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-xl sm:rounded-2xl border shadow-2xl backdrop-blur-xl transition-all active:scale-90",
                        "bg-black/80 border-white/10 text-white"
                    )}
                >
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            </div>

            {/* Floating Promo Message */}
            <AnimatePresence>
                {showPromo && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        className="fixed left-1/2 top-8 -translate-x-1/2 z-[100] w-[90%] max-w-md"
                    >
                        {/* Promo message content removed for brevity, same as original */}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className={cn(
                "flex-1 flex flex-col px-6 max-w-4xl mx-auto w-full pb-4 pt-12 relative z-10 transition-all duration-500",
                )}>

                {/* Piranha Tank Desktop Navigation Bar REMOVED FROM HERE */}
                
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
                            <>
                                {/* Welcome Icon / Logo */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                                    className={cn(
                                        "h-20 w-20 flex items-center justify-center mx-auto mb-4 rounded-2xl shadow-2xl overflow-hidden relative transition-all duration-700", 
                                        "bg-white shadow-[0_0_60px_rgba(255,255,255,0.4),0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_0_80px_rgba(255,255,255,0.6)] scale-105"
                                    )}
                                >
                                    <img 
                                            src={`${import.meta.env.BASE_URL}logo.webp`} 
                                            alt="Kasb.AI Logo" 
                                            className="h-full w-full object-contain" 
                                        />
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

                                {/* Mentor Context Badge — shown when mentor is pre-trained with startup data */}
                                <AnimatePresence>
                                    {isContextLoaded && startupContext && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: 0.7, duration: 0.5 }}
                                            className="flex items-center justify-center"
                                        >
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                                                <div className="relative flex items-center justify-center">
                                                    <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                                                    <div className="absolute h-4 w-4 bg-emerald-400/20 rounded-full animate-ping" />
                                                </div>
                                                <BookOpen className="h-3 w-3 text-emerald-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                                    Mentor trained on your startup
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Search Bar */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8, type: "spring", damping: 20 }}
                                    className="relative w-full max-w-xl mx-auto group"
                                >
                                    <div className={cn(
                                        "absolute -inset-4 rounded-full blur-[40px] group-focus-within:opacity-100 opacity-0 transition-all duration-1000 pointer-events-none", 
                                        "bg-white/20"
                                    )} />
                                    <div className={cn(
                                        "relative flex items-center border-2 rounded-full p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden shrink", 
                                        theme.input, 
                                        "group-focus-within:shadow-[0_0_50px_rgba(255,255,255,0.2)] group-focus-within:border-white/40"
                                    )}>
                                        <div className="pl-3 sm:pl-4 pr-1 sm:pr-2 shrink-0">
                                            <Search className={cn("h-4 w-4 transition-colors", theme.textMuted)} />
                                        </div>
                                        <input 
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Describe your startup idea..."
                                            className={cn("flex-1 min-w-0 bg-transparent border-none focus:ring-0 font-medium h-10 text-sm sm:text-base outline-none", theme.text, "placeholder:text-gray-400")}
                                        />
                                        
                                        {/* Microphone Button */}
                                        <button 
                                            onClick={toggleListening}
                                            title="Speak your pitch"
                                            className={cn(
                                                "h-10 w-10 mr-1 rounded-full flex items-center justify-center transition-all duration-300",
                                                isListening ? "text-red-500 bg-red-500/20 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.5)]" : "text-gray-400 hover:text-black"
                                            )}
                                        >
                                            <Mic className="h-5 w-5" />
                                        </button>

                                        <button 
                                            onClick={() => handleSendMessage()}
                                            disabled={!query.trim() || isLoading}
                                            className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                                                query.trim() ? cn("text-white scale-100 shadow-lg", "bg-black hover:bg-gray-800") : cn("scale-90", "bg-gray-50 text-gray-300")
                                            )}
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    {/* Advanced Toggles Row */}
                                    <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                                        
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
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-8 text-center text-gray-300">Kasb AI is AI can make mistake</p>

                                    {/* Quick Suggestions - hidden in Piranha mode */}
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
                                    const mentorIcon = personalities.find(p => p.id === msg.mentorId)?.icon || "🤖";

                                    // Get alternative mentors (exclude current mentor) — GPT only
                                    const alternativeMentors = msg.originalPrompt
                                        ? getRankedMentors(msg.originalPrompt).map(m => m.name).filter(m => m !== msg.mentorId)
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
                                                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-black" title={msg.mentorId || personality}>
                                                    <Bot className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                            <div className="flex flex-col max-w-[80%]">
                                                {msg.role === "assistant" && msg.mentorId && (
                                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-1 ml-1", theme.textMuted)}>
                                                        {`${mentorIcon} ${msg.mentorId}`}
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
                                                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-white">
                                                    <User className="h-4 w-4 text-black" />
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
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-black">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 bg-gray-50 border border-gray-100">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        <span className="text-sm font-medium text-gray-400">
                                            {`${personality} is thinking...`}
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
                                        placeholder="Ask a follow-up..."
                                        disabled={isLoading}
                                        className={cn("flex-1 min-w-0 bg-transparent border-none focus:ring-0 font-medium h-10 text-sm sm:text-base outline-none pl-3 sm:pl-4", theme.text, "placeholder:text-gray-400")}
                                    />
                                    
                                    {/* Microphone Button */}
                                    <button 
                                        onClick={toggleListening}
                                        title="Speak your pitch"
                                        className={cn(
                                            "h-10 w-10 mr-1 rounded-full flex items-center justify-center transition-all duration-300",
                                            isListening ? "text-red-500 bg-red-500/20 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.5)]" : "text-gray-400 hover:text-black"
                                        )}
                                    >
                                        <Mic className="h-5 w-5" />
                                    </button>

                                    <button 
                                        onClick={() => handleSendMessage()}
                                        disabled={!query.trim() || isLoading}
                                        className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                                            query.trim() && !isLoading ? cn("text-white scale-100 shadow-lg", "bg-black hover:bg-gray-800") : cn("scale-90", "bg-gray-50 text-gray-300")
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

                                </div>
                                <p className="text-center text-[9px] font-bold uppercase tracking-[0.2em] mt-3 text-gray-300">Kasb AI is AI can make mistake</p>
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
                        className="fixed bottom-28 right-6 h-12 w-12 rounded-full shadow-2xl flex items-center justify-center transition-all z-[999] border backdrop-blur-md bg-black/90 text-white border-white/20 hover:bg-black"
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
