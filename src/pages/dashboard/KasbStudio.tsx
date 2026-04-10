import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Menu, 
  History, 
  X, 
  Search, 
  Send, 
  Loader2, 
  Code, 
  Copy, 
  Check, 
  Trash2, 
  ArrowUp, 
  ChevronDown,
  FileText,
  Zap
} from "lucide-react";
import { cn } from "../../lib/utils";
import { askKasbStudio } from "../../lib/services/studioAiService";
import { getUserChatSessions, createChatSession, saveChatMessage, getChatMessages, deleteChatSession, type ChatSession } from "../../lib/aiHistory";
import { useAuth } from "../../context/AuthContext";
import { reviewPitchDeck } from "../../lib/ai";
import { CheckCircle2, AlertCircle, Paperclip } from "lucide-react";

import { MobileViewSwitcher } from "../../components/chat/MobileViewSwitcher";
import { StudioToolLogo, TOOL_DOMAINS } from "../../components/studio/StudioToolLogo";

const PLACEHOLDERS = [
    "Build an MVP for my new SaaS idea...",
    "Draft a high-converting cold email for VCs...",
    "Create a pitch deck outline for a Seed round...",
    "Write ad copy for our new product launch...",
    "Design a premium UI mockup for a fintech dashboard...",
    "Generate a sales leads workflow...",
    "Outline a comprehensive market research report...",
    "Script a 60-second explainer video..."
];

const REVIEW_PLACEHOLDERS = [
    "Review my pitch deck and give me a score...",
    "Analyze this cold email for VC outreach...",
    "What are the biggest risks in this deck?",
    "Review my valuation logic...",
    "Is this problem statement compelling enough?",
    "Check for inconsistencies in our projections..."
];

function ScorecardResult({ scorecard, theme }: { scorecard: any, theme: any }) {
    const categories = [
        { key: 'market_opportunity', label: 'Market Opportunity', color: 'bg-blue-500' },
        { key: 'product_solution', label: 'Product & Solution', color: 'bg-purple-500' },
        { key: 'business_model', label: 'Business Model', color: 'bg-green-500' },
        { key: 'team', label: 'Team & Execution', color: 'bg-orange-500' },
        { key: 'financials', label: 'Financials & Ask', color: 'bg-pink-500' },
    ];

    return (
        <div className="space-y-6 w-full max-w-2xl mx-auto py-8 px-4">
            <div className={cn("p-8 rounded-3xl border shadow-2xl relative overflow-hidden", theme.card)}>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter mb-1">Investor Scorecard</h2>
                            <p className={cn("text-xs font-bold uppercase tracking-widest", theme.textSubtle)}>AI-Driven Analysis</p>
                        </div>
                        <div className="h-16 w-16 rounded-2xl bg-black flex items-center justify-center text-white border border-white/20 shadow-xl">
                            <span className="text-2xl font-black">{scorecard.total_score}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {categories.map((cat) => (
                            <div key={cat.key} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase tracking-wider">{cat.label}</span>
                                    <span className="text-sm font-black">{scorecard.scores[cat.key]}/20</span>
                                </div>
                                <div className="h-2 w-full bg-gray-200/50 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(scorecard.scores[cat.key] / 20) * 100}%` }}
                                        className={cn("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]", cat.color)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 p-5 rounded-2xl bg-black/5 border border-black/5">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <Zap className="h-3 w-3 text-orange-500" />
                            Verdict
                        </h4>
                        <p className="text-sm font-medium leading-relaxed italic">"{scorecard.verdict}"</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn("p-6 rounded-2xl border", theme.card, "bg-green-50/50 border-green-100")}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Strengths
                    </h4>
                    <ul className="space-y-3">
                        {scorecard.strengths.slice(0, 3).map((s: string, i: number) => (
                            <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2">
                                <span className="text-green-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className={cn("p-6 rounded-2xl border", theme.card, "bg-red-50/50 border-red-100")}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-4 flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        Risks
                    </h4>
                    <ul className="space-y-3">
                        {scorecard.risks.slice(0, 3).map((r: string, i: number) => (
                            <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2">
                                <span className="text-red-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                                {r}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function KasbStudio() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    // New State for Mode and Files
    const [mode, setMode] = useState<'studio' | 'review'>('studio');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const topRef = useRef<HTMLDivElement>(null);

    const [placeholder, setPlaceholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);

    useEffect(() => {
        const arr = mode === 'review' ? REVIEW_PLACEHOLDERS : PLACEHOLDERS;
        setPlaceholder(arr[Math.floor(Math.random() * arr.length)]);
    }, [mode]);

    // Theme Orchestration
    const isReview = mode === 'review';
    const theme = {
        bg: isReview ? "bg-[#f8f9fa]" : "bg-[#030303]",
        text: isReview ? "text-gray-900" : "text-white",
        textMuted: isReview ? "text-gray-500" : "text-gray-400",
        textSubtle: isReview ? "text-gray-400 font-medium" : "text-gray-600 font-bold",
        border: isReview ? "border-gray-200" : "border-gray-800",
        card: isReview ? "bg-white border-gray-200 shadow-sm" : "bg-white/5 border-gray-800",
        input: isReview ? "bg-white border-gray-200 focus:border-black shadow-sm" : "bg-white/5 border-gray-800 focus:border-white/20",
        sidebarBg: isReview ? "bg-white" : "bg-[#030303]/95 backdrop-blur-2xl",
        sidebarBorder: isReview ? "border-gray-200" : "border-gray-800",
        overlayBg: isReview ? "bg-black/5" : "bg-black/60",
        activeSession: isReview ? "bg-black text-white border-black" : "bg-white/10 text-white border-white/20",
        sessionHover: isReview ? "hover:bg-gray-100" : "hover:bg-white/5",
        shutterTrack: isReview ? "bg-gray-200" : "bg-white/10",
        shutterThumb: isReview ? "bg-white shadow-md text-black" : "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]",
        shutterTextActive: isReview ? "text-gray-900" : "text-white",
        shutterTextInactive: isReview ? "text-gray-500" : "text-gray-400",
        aiBubble: isReview ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10",
        userBubble: isReview ? "bg-gray-900 text-white" : "bg-white text-black",
        accent: isReview ? "bg-black" : "bg-white",
        accentText: isReview ? "text-white" : "text-black",
        emptyStateIcon: isReview ? "bg-gray-100 border-gray-200" : "bg-white/5 border-gray-800"
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const handleMouseMove = (e: MouseEvent) => {
            if (isSidebarOpen) {
                setIsHeaderVisible(true);
                return;
            }

            // Show if near top (Increase sensitivity to 200px for better UX)
            if (e.clientY < 200) {
                setIsHeaderVisible(true);
                clearTimeout(timeout);
            } else {
                // If the pointer is anywhere else, wait 2 seconds before hiding
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    setIsHeaderVisible(false);
                }, 2000);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);

        // Auto collapse after quick setup delay
        timeout = setTimeout(() => {
            if (!isSidebarOpen) setIsHeaderVisible(false);
        }, 1500);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            clearTimeout(timeout);
        };
    }, [isSidebarOpen]);

    // State management for Kasb Studio AI History
    const { user } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // Initial load logic: fetch sessions
    useEffect(() => {
        if (user) {
            getUserChatSessions(user.id, "kasb_studio").then((data) => {
                setSessions(data);
            });
        }
    }, [user]);

    const loadSession = async (sessionId: string) => {
        setCurrentSessionId(sessionId);
        setIsSidebarOpen(false);
        setIsLoading(true);
        setError(null);
        try {
            const msgs = await getChatMessages(sessionId);
            setMessages(msgs);
        } catch (e) {
            console.error("Failed to load session:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        const success = await deleteChatSession(sessionId);
        if (success) {
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
                setMessages([]);
                setQuery("");
            }
        }
    };

    const handleReview = async (file: File) => {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!apiKey) {
            setError("Missing API Key for review. Please add VITE_GROQ_API_KEY.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const userMsgId = `user-${Date.now()}`;
            setMessages([{ id: userMsgId, role: 'user', content: `Analyze pitch deck: ${file.name}`, created_at: new Date().toISOString() }]);
            
            const result = await reviewPitchDeck(file, apiKey);
            
            let finalContent: string;
            if (typeof result === 'string') {
                finalContent = result;
            } else {
                finalContent = JSON.stringify({ type: 'scorecard', ...result });
            }
            
            const assistantMsg = { 
                id: `ai-${Date.now()}`, 
                role: 'assistant', 
                content: finalContent, 
                created_at: new Date().toISOString() 
            };
            setMessages(prev => [...prev, assistantMsg]);
            
            // Clear file
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            
        } catch (err: any) {
            console.error("Review Error:", err);
            setError(err.message || "Pitch deck analysis failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (mode === 'review' && selectedFile && !query.trim()) {
            handleReview(selectedFile);
            return;
        }

        if (!query.trim() || isLoading) return;

        // Exclusively use Groq/Kasb keys for Studio architecture; remove Gemini fallback to avoid 404s
        const apiKey = import.meta.env.VITE_KASB_STUDIO_API_KEY || import.meta.env.VITE_GROQ_API_KEY;

        if (!apiKey) {
            setError("Missing Kasb Studio API Key. Please add VITE_KASB_STUDIO_API_KEY (Groq) to your hosting dashboard.");
            return;
        }

        const userText = query.trim();
        setIsLoading(true);
        setError(null);

        try {
            
            // Pass previous Context if it exists so the AI can refine it
            const prevContext = messages.length > 0 ? (() => {
                const lastAsst = [...messages].reverse().find(m => m.role === 'assistant');
                if (lastAsst) {
                    try {
                        const parsed = JSON.parse(lastAsst.content);
                        return { tool: parsed.tool || parsed.suggestedTool, blueprint: parsed.prompt || parsed.generatedPrompt };
                    } catch(e) {}
                }
                return undefined;
            })() : undefined;
            
            let sessionId = currentSessionId;
            if (!sessionId && user) {
                const session = await createChatSession(user.id, "Kasb Studio", userText);
                if (session) {
                    sessionId = session.id;
                    setCurrentSessionId(sessionId);
                    // Add to session list optimistically
                    setSessions(prev => [session, ...prev]);
                }
            }

            const tempUserId = `user-${Date.now()}`;
            setMessages(prev => [...prev, { id: tempUserId, role: 'user', content: userText, created_at: new Date().toISOString(), session_id: sessionId || '' }]);

            if (sessionId) {
                await saveChatMessage(sessionId, 'user', userText);
            }

            const aiResponse = await askKasbStudio(userText, apiKey, prevContext);
            
            const newResult = {
                tool: aiResponse.suggestedTool,
                prompt: aiResponse.generatedPrompt,
                reasoning: aiResponse.reasoning
            };

            const assistantMsg = { id: `ai-${Date.now()}`, role: 'assistant', content: JSON.stringify(newResult), created_at: new Date().toISOString(), session_id: sessionId || '' };
            setMessages(prev => [...prev, assistantMsg]);

            if (sessionId) {
                // Ensure db stays perfectly in sync with what was just rendered
                await saveChatMessage(sessionId, 'assistant', JSON.stringify(newResult));
            }

            // Clear input on successful generation
            setQuery("");
            
        } catch (err: any) {
             console.error("Kasb Studio Error:", err);
             setError(err.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setQuery("");
        setError(null);
        setCurrentSessionId(null);
        setIsSidebarOpen(false);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // Refresh placeholder based on current mode
        const list = mode === 'review' ? REVIEW_PLACEHOLDERS : PLACEHOLDERS;
        setPlaceholder(list[Math.floor(Math.random() * list.length)]);
    };

    return (
        <div className={cn("relative min-h-[calc(100vh-4rem)] md:-mt-6 -mb-24 md:-mb-6 pb-0 overflow-hidden flex flex-col transition-all duration-500", theme.bg, theme.text)}>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept=".pdf,.pptx,.ppt,.docx,.doc,.txt"
            />
            


            <div ref={topRef} className="absolute top-0 left-0 w-full h-px pointer-events-none" />
            {/* Sidebar Drawer */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-white/5 backdrop-blur-sm z-40"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-80 bg-[#141414] border-r border-gray-800 z-50 p-6 flex flex-col shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center">
                                        <Sparkles className="h-5 w-5 text-black" />
                                    </div>
                                    <span className="font-black text-xl tracking-tight text-white">{isReview ? 'Kasb Review' : 'Kasb Studio'}</span>
                                </div>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                                    <X className="h-5 w-5 text-gray-400" />
                                </button>
                            </div>

                            <button 
                                className="w-full justify-center gap-3 h-12 rounded-xl bg-white hover:bg-gray-200 text-black shadow-sm transition-all active:scale-95 mb-8 flex items-center"
                                onClick={handleNewChat}
                            >
                                <span className="font-bold text-sm">New Creation</span>
                            </button>

                            <div className="flex-1 overflow-y-auto space-y-6">
                                {/* Unified Mobile View Switcher */}
                                <MobileViewSwitcher currentView="studio" />

                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 px-2 flex items-center gap-2">
                                        <History className="h-3 w-3" />
                                        Creation History
                                    </h3>
                                    <div className="space-y-1">
                                        {sessions.length === 0 && (
                                            <div className="px-3 py-4 text-xs font-medium text-gray-600 text-center border border-dashed border-gray-800 rounded-xl">
                                                No past items found
                                            </div>
                                        )}
                                        {sessions.map((session) => (
                                            <div 
                                                key={session.id}
                                                onClick={() => loadSession(session.id)}
                                                className={cn(
                                                    "w-full group px-3 py-2.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between",
                                                    currentSessionId === session.id
                                                        ? "bg-white/10 border-white/20 text-white shadow-sm"
                                                        : "bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200"
                                                )}
                                            >
                                                <div className="flex flex-col gap-0.5 min-w-0 pr-2 overflow-hidden">
                                                    <span className="font-bold text-sm tracking-tight truncate max-w-full block">
                                                        {session.title}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block">
                                                        {new Date(session.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-transform text-gray-500 hover:text-red-400 flex-shrink-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Header - Auto Hiding Wrapper */}
            <div className="sticky top-0 z-50 pointer-events-none w-full h-0">
                {/* Invisible Top Sensor for Mouse Triggering (Fixes mid-chat visibility) */}
                <div 
                    className="fixed top-0 left-0 right-0 h-8 z-[60] pointer-events-auto cursor-ns-resize" 
                    onMouseEnter={() => setIsHeaderVisible(true)}
                    onMouseMove={() => setIsHeaderVisible(true)}
                />

                <motion.div 
                    initial={{ y: 0 }}
                    animate={{ y: isHeaderVisible || isSidebarOpen || isToolsOpen ? 0 : "-100%" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-0 left-0 right-0 z-50 pointer-events-auto"
                    onMouseEnter={() => setIsHeaderVisible(true)}
                >
                    <header className={cn("flex flex-col relative backdrop-blur-md border-b shadow-md", isReview ? "bg-white/80 border-gray-200" : "bg-black/80 border-gray-900")}>
                        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3 z-10 relative">
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className={cn("h-8 w-8 flex items-center justify-center rounded-lg transition-all active:scale-90", isReview ? "bg-gray-100 border border-gray-200 hover:bg-gray-200" : "bg-gray-900 border border-gray-800 hover:bg-gray-800")}
                            >
                                <Menu className="h-4 w-4 text-gray-400" />
                            </button>
                            
                            {/* Header Toggle */}
                            <div className={cn(
                                "flex items-center p-1 rounded-full border transition-all duration-300",
                                theme.shutterTrack,
                                theme.border
                            )}>
                                <button 
                                    onClick={() => setMode('studio')}
                                    className={cn(
                                        "px-4 py-1 sm:px-5 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                                        mode === 'studio' ? theme.shutterThumb : theme.shutterTextInactive
                                    )}
                                >
                                    Studio
                                </button>
                                <button 
                                    onClick={() => setMode('review')}
                                    className={cn(
                                        "px-4 py-1 sm:px-5 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                                        mode === 'review' ? theme.shutterThumb : theme.shutterTextInactive
                                    )}
                                >
                                    Review
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isToolsOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-gray-900 bg-[#0a0a0a] relative z-0"
                                >
                                    <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto w-full">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
                                            {Object.entries(TOOL_DOMAINS).map(([name, domain]) => (
                                                <a 
                                                    key={name}
                                                    href={`https://${domain}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                                                >
                                                    <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center overflow-hidden p-1.5 shadow-lg group-hover:scale-110 transition-transform">
                                                        <img 
                                                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                                                            alt={name}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-gray-200 capitalize">{name}</p>
                                                        <p className="text-[9px] text-gray-500 font-mono mt-1">{domain}</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </header>

                    {/* Pull-down tab */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max pointer-events-auto">
                        <button 
                            onClick={() => setIsToolsOpen(!isToolsOpen)}
                            className="h-6 px-6 bg-black/80 backdrop-blur-md border border-t-0 border-gray-900 rounded-b-xl flex items-center justify-center text-gray-500 hover:text-white transition-colors cursor-pointer group shadow-md"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                                    {isToolsOpen ? 'Close AI Tools' : 'Supported AI Tools'}
                                </span>
                                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isToolsOpen && "rotate-180")} />
                            </div>
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col px-6 max-w-4xl mx-auto w-full pb-8">
                {!messages.length && !isLoading && !error ? (
                    // Initial State
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full space-y-12 text-center"
                        >
                            <div className="space-y-4 px-4">
                                <motion.h1 
                                    className={cn("text-5xl sm:text-7xl font-black tracking-tighter bg-clip-text text-transparent", isReview ? "bg-gradient-to-br from-gray-900 to-gray-700" : "bg-gradient-to-br from-white via-white to-gray-500")}
                                >
                                    {isReview ? 'Review' : 'Kasb Studio'}
                                </motion.h1>
                                <p className={cn("text-xs sm:text-sm font-bold uppercase tracking-[0.25em]", isReview ? "text-gray-400" : "text-gray-500")}>
                                    {isReview ? 'Review. Refine. Perfect.' : 'Imagine it. We sketch the blueprint.'}
                                </p>
                            </div>

                            {/* Rectangular Search Bar */}
                            <motion.div 
                                className="relative w-full max-w-2xl mx-auto group"
                            >
                                <div className={cn("absolute -inset-1 rounded-md blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none", isReview ? "bg-gray-200" : "bg-gradient-to-r from-indigo-500/20 to-purple-500/20")} />
                                <div className={cn("relative flex items-center border rounded-xl p-1 shadow-xl transition-all duration-300 overflow-hidden shrink", isReview ? "bg-white border-gray-200 shadow-sm" : "bg-[#161616] border-gray-800 shadow-2xl group-focus-within:border-gray-500 group-focus-within:ring-2 group-focus-within:ring-white/10")}>
                                    <div className="pl-3 sm:pl-4 pr-1 sm:pr-3 shrink-0">
                                        <Search className={cn("h-5 w-5 transition-colors", isReview ? "text-gray-400 group-focus-within:text-gray-600" : "text-gray-500 group-focus-within:text-white")} />
                                    </div>
                                    <input 
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={placeholder}
                                        className={cn("flex-1 min-w-0 bg-transparent border-none focus:ring-0 font-medium h-12 text-sm sm:text-base outline-none", isReview ? "text-gray-900 placeholder:text-gray-400" : "text-white placeholder:text-gray-600")}
                                    />
                                    {isReview && (
                                        <button 
                                            onClick={triggerFileUpload}
                                            className="px-3 text-gray-400 hover:text-gray-600 transition-colors h-12 flex items-center justify-center border-r border-gray-100 mr-1"
                                        >
                                            <Paperclip className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!query.trim() && !(isReview && selectedFile)}
                                        className={cn(
                                            "h-12 w-12 rounded-lg flex items-center justify-center transition-all duration-300 ml-1",
                                            isReview 
                                                ? (query.trim() || selectedFile ? "bg-gray-100 text-gray-900 hover:bg-gray-200 opacity-100 scale-100" : "bg-gray-50 text-gray-300 opacity-80 scale-95")
                                                : (query.trim() ? "bg-white text-black scale-100 opacity-100 hover:bg-gray-200" : "bg-gray-900 text-gray-600 scale-95 opacity-50")
                                        )}
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium mt-6 uppercase tracking-widest text-center">Kasb AI is AI can make mistake</p>
                            </motion.div>
                        </motion.div>
                    </div>
                ) : (
                    // Chat View State
                    <div className="flex-1 flex flex-col pt-8 animate-in fade-in duration-700 max-w-4xl mx-auto w-full relative">
                        <div 
                            ref={scrollContainerRef}
                            className="flex-1 overflow-y-auto px-2 md:px-6 w-full space-y-12 pb-28 scroll-smooth custom-scrollbar"
                        >
                             {messages.map((msg) => {
                                 if (msg.role === 'user') {
                                     return (
                                        <div key={msg.id} className="flex justify-end w-full">
                                            <div className={cn("px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] font-medium shadow-md text-sm leading-relaxed", theme.userBubble)}>
                                                {msg.content}
                                            </div>
                                        </div>
                                     );
                                 } else {
                                     let parsed;
                                     try { 
                                         parsed = JSON.parse(msg.content); 
                                     } catch(e) { 
                                         parsed = { tool: "Error", prompt: msg.content }; 
                                     }
                                     
                                     if (parsed.type === 'scorecard') {
                                         return <ScorecardResult key={msg.id} scorecard={parsed} theme={theme} />;
                                     }
                                     
                                     return (
                                        <div key={msg.id} className="w-full max-w-3xl mx-auto space-y-6">
                                            {/* Tool Suggestion Card */}
                                            <div className="space-y-3">
                                                <div className={cn("p-5 border rounded-xl flex items-start gap-4 shadow-xl", theme.aiBubble)}>
                                                    <StudioToolLogo toolName={parsed.tool || parsed.suggestedTool || "Tool"} />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h3 className={cn("text-[10px] font-black uppercase tracking-widest", isReview ? 'text-gray-900' : 'text-indigo-400')}>Recommended Tech Stack</h3>
                                                        </div>
                                                        <p className={cn("text-lg font-bold mb-2", theme.text)}>{parsed.tool || parsed.suggestedTool}</p>
                                                        {parsed.reasoning && (
                                                            <p className={cn("text-sm leading-relaxed border-l-2 border-indigo-500/30 pl-3", theme.textMuted)}>
                                                                {parsed.reasoning}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className={cn("px-5 text-[9px] uppercase tracking-[0.2em] font-medium opacity-60", theme.textSubtle)}>
                                                    * Kasb.AI is independent and not sponsored by these tools.
                                                </p>
                                            </div>

                                            {/* Generated Prompt/Architecture */}
                                            <div className={cn("p-5 border rounded-xl shadow-xl", theme.aiBubble)}>
                                                <div className={cn("flex items-center justify-between mb-4 pb-4 border-b", isReview ? 'border-gray-200' : 'border-gray-800/50')}>
                                                    <div className="flex items-center gap-2">
                                                        <Code className="h-4 w-4 text-indigo-500" />
                                                        <h3 className={cn("text-xs font-bold uppercase tracking-wider", theme.text)}>Implementation Blueprint</h3>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            if (parsed.prompt || parsed.generatedPrompt) {
                                                                navigator.clipboard.writeText(parsed.prompt || parsed.generatedPrompt);
                                                                setIsCopied(true);
                                                                setTimeout(() => setIsCopied(false), 2000);
                                                            }
                                                        }}
                                                        className={cn("px-2 py-1 rounded transition-all flex items-center gap-1.5 group", isReview ? 'hover:bg-gray-100' : 'hover:bg-white/5')}
                                                    >
                                                        {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-500 group-hover:text-white transition-colors" />}
                                                        <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">
                                                            {isCopied ? "Copied" : "Copy"}
                                                        </span>
                                                    </button>
                                                </div>
                                                <div className={cn("prose max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap", isReview ? 'prose-gray' : 'prose-invert', theme.textMuted)}>
                                                    {parsed.prompt || parsed.generatedPrompt}
                                                </div>
                                            </div>
                                        </div>
                                     );
                                 }
                             })}

                             {isLoading && (
                                <div className="flex justify-start w-full max-w-3xl mx-auto">
                                    <div className={cn("flex items-center gap-3 border px-5 py-3 rounded-2xl rounded-tl-sm", theme.aiBubble)}>
                                        <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                                        <span className={cn("text-[10px] font-bold tracking-widest uppercase", theme.textMuted)}>Processing Request...</span>
                                    </div>
                                </div>
                             )}
                             
                             <div ref={messagesEndRef} className="h-10 w-full" />
                        </div>



                        {/* Follow Up Search Bar & Error Display */}
                        <div className={cn("absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t pointer-events-none", isReview ? 'from-gray-50 via-gray-50 to-transparent' : 'from-[#141414] via-[#141414] to-transparent')}>
                            <div className="relative w-full max-w-3xl mx-auto pointer-events-auto flex flex-col gap-4">
                                {error && (
                                    <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-xs text-center animate-in slide-in-from-bottom-2">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <div className={cn("text-[9px] font-black uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5", theme.textSubtle)}>
                                        <Sparkles className="h-3 w-3 text-indigo-400" />
                                        Refine Architecture
                                    </div>

                                    {selectedFile && (
                                        <div className={cn("mb-3 flex items-center gap-2 p-2 rounded-lg border scale-in-center overflow-hidden", theme.card)}>
                                            <div className="h-8 w-8 rounded bg-indigo-500/20 flex items-center justify-center shrink-0">
                                                <FileText className="h-4 w-4 text-indigo-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold truncate">{selectedFile.name}</p>
                                                <p className="text-[9px] text-gray-500 uppercase tracking-widest">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button onClick={removeFile} className="p-1 hover:bg-red-500/10 rounded-full text-gray-500 hover:text-red-400">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}

                                    <div className={cn("relative flex items-center border rounded-lg p-1 shadow-2xl group transition-all duration-300 overflow-hidden shrink", theme.input)}>
                                        <input 
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            disabled={isLoading}
                                            placeholder="E.g., Make it include user authentication..."
                                            className={cn("flex-1 min-w-0 bg-transparent border-none focus:ring-0 font-medium h-10 text-sm sm:text-base outline-none pl-2 sm:pl-3", isReview ? 'text-black placeholder:text-gray-400' : 'text-white placeholder:text-gray-600')}
                                        />

                                        {isReview && (
                                            <button 
                                                onClick={triggerFileUpload}
                                                disabled={isLoading}
                                                className={cn(
                                                    "h-10 w-10 rounded-md flex items-center justify-center transition-all duration-300 mr-2",
                                                    selectedFile ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                                )}
                                                title="Attach Pitch Deck"
                                            >
                                                <Paperclip className="h-5 w-5" />
                                            </button>
                                        )}

                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={(!query.trim() && !selectedFile) || isLoading}
                                            className={cn(
                                                "h-10 w-10 rounded-md flex items-center justify-center transition-all duration-300",
                                                (query.trim() || selectedFile) && !isLoading ? "bg-black text-white hover:bg-gray-800" : "bg-gray-800 text-gray-600"
                                            )}
                                        >
                                             {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : <Send className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className={cn("text-center text-[10px] mt-2 font-medium", theme.textSubtle)}>Kasb. AI is AI can Make Mistake</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Scroll to Top Button — always visible when chat has messages */}
            <AnimatePresence>
                {messages.length > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={scrollToTop}
                        className={cn(
                            "fixed bottom-28 right-6 h-12 w-12 rounded-full shadow-2xl flex items-center justify-center transition-all z-[999] border backdrop-blur-md", 
                            isReview 
                                ? 'bg-black/90 text-white border-white/20 hover:bg-black' 
                                : 'bg-indigo-600/90 text-white border-white/20 hover:bg-indigo-600'
                        )}
                        title="Scroll to top"
                    >
                        <ArrowUp className="h-5 w-5" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

