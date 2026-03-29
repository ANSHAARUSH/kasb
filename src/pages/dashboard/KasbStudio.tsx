import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Menu, History, X, Search, Send, Loader2, Wrench, Code, Copy, Check, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { askKasbStudio } from "../../lib/services/studioAiService";
import { getUserChatSessions, createChatSession, saveChatMessage, getChatMessages, deleteChatSession, type ChatSession } from "../../lib/aiHistory";
import { useAuth } from "../../context/AuthContext";

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

const TOOL_DOMAINS: Record<string, string> = {
    "lovable": "lovable.dev",
    "base44": "base44.com",
    "replit": "replit.com",
    "bolt": "bolt.new",
    "gamma": "gamma.app",
    "canva": "canva.com",
    "anthropic": "anthropic.com",
    "copy.ai": "copy.ai",
    "jasper": "jasper.ai",
    "google": "google.com",
    "chatgpt": "openai.com",
    "vercel": "vercel.com",
    "v0": "vercel.com",
    "vercel v0": "vercel.com",
    "figma": "figma.com",
    "perplexity": "perplexity.ai",
    "perplexity ai": "perplexity.ai",
    "synthesia": "synthesia.io",
    "runway": "runwayml.com",
    "notion": "notion.so",
    "apollo.io": "apollo.io",
    "hubspot": "hubspot.com"
};

function ToolLogo({ toolName }: { toolName: string }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => { setFailed(false); }, [toolName]);

    const raw = toolName.toLowerCase();
    let domain = null;
    let fallbackAlt = "Tool";

    for (const [key, d] of Object.entries(TOOL_DOMAINS)) {
        if (raw.includes(key)) {
            domain = d;
            fallbackAlt = key;
            break;
        }
    }
    
    if (!domain || failed) {
        return (
            <div className="h-12 w-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Wrench className="h-6 w-6 text-indigo-400" />
            </div>
        );
    }
    
    return (
        <div className="h-12 w-12 rounded-lg bg-white border border-gray-800 flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-lg">
            <img 
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                alt={fallbackAlt}
                className="w-full h-full object-contain"
                onError={() => setFailed(true)}
            />
        </div>
    );
}

export function KasbStudio() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);

    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Initial load logic: fetch sessions, and if none selected, auto-load the most recent one
    useEffect(() => {
        if (user) {
            getUserChatSessions(user.id, "kasb_studio").then((data) => {
                setSessions(data);
                if (data.length > 0 && !currentSessionId) {
                    loadSession(data[0].id);
                }
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

    const handleSendMessage = async () => {
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
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-4rem)] md:-mt-6 -mb-24 md:-mb-6 pb-24 md:pb-6 bg-[#141414] text-white overflow-hidden flex flex-col transition-all duration-500">
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
                                    <span className="font-black text-xl tracking-tight text-white">Kasb Studio</span>
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

                <motion.header 
                    initial={{ y: 0 }}
                    animate={{ y: isHeaderVisible || isSidebarOpen ? 0 : "-100%" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3 bg-black/80 backdrop-blur-md border-b border-gray-900 pointer-events-auto shadow-md"
                    onMouseEnter={() => setIsHeaderVisible(true)}
                >
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-all active:scale-90"
                    >
                        <Menu className="h-4 w-4 text-gray-400" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Studio Beta</span>
                    </div>
                    <div className="w-8" /> {/* Spacer */}
                </motion.header>
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
                                    className="text-3xl sm:text-5xl font-black tracking-tighter bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent"
                                >
                                    Kasb Studio
                                </motion.h1>
                                <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
                                    Imagine it. We sketch the blueprint.
                                </p>
                            </div>

                            {/* Rectangular Search Bar */}
                            <motion.div 
                                className="relative w-full max-w-xl mx-auto group"
                            >
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-md blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                <div className="relative flex items-center bg-[#161616] border border-gray-800 rounded-lg p-1.5 shadow-2xl group-focus-within:border-gray-500 group-focus-within:ring-2 group-focus-within:ring-white/10 transition-all duration-300">
                                    <div className="pl-3 pr-2">
                                        <Search className="h-4 w-4 text-gray-500 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input 
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={placeholder}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-white font-medium placeholder:text-gray-600 h-10 text-base outline-none"
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!query.trim()}
                                        className={cn(
                                            "h-10 w-10 rounded-md flex items-center justify-center transition-all duration-300 ml-2",
                                            query.trim() ? "bg-white text-black scale-100 opacity-100 hover:bg-gray-200" : "bg-gray-900 text-gray-600 scale-95 opacity-50"
                                        )}
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                ) : (
                    // Chat View State
                    <div className="flex-1 flex flex-col pt-8 animate-in fade-in duration-700 max-w-4xl mx-auto w-full relative">
                        <div className="flex-1 overflow-y-auto px-2 md:px-6 w-full space-y-12 pb-40 scroll-smooth">
                             {messages.map((msg) => {
                                 if (msg.role === 'user') {
                                     return (
                                        <div key={msg.id} className="flex justify-end w-full">
                                            <div className="bg-indigo-600 border border-indigo-500 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] font-medium shadow-md text-sm leading-relaxed">
                                                {msg.content}
                                            </div>
                                        </div>
                                     );
                                 } else {
                                     let parsed;
                                     try { parsed = JSON.parse(msg.content); } catch(e) { parsed = { tool: "Error", prompt: msg.content }; }
                                     
                                     return (
                                        <div key={msg.id} className="w-full max-w-3xl mx-auto space-y-6">
                                            {/* Tool Suggestion Card */}
                                            <div className="space-y-3">
                                                <div className="p-5 bg-[#0a0a0a] border border-gray-800 rounded-xl flex items-start gap-4 shadow-xl">
                                                    <ToolLogo toolName={parsed.tool || parsed.suggestedTool || "Tool"} />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Recommended Tech Stack</h3>
                                                        </div>
                                                        <p className="text-lg font-bold text-white mb-2">{parsed.tool || parsed.suggestedTool}</p>
                                                        {parsed.reasoning && (
                                                            <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-indigo-500/30 pl-3">
                                                                {parsed.reasoning}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="px-5 text-[9px] text-gray-600 uppercase tracking-[0.2em] font-medium opacity-60">
                                                    * Kasb.AI is independent and not sponsored by these tools.
                                                </p>
                                            </div>

                                            {/* Generated Prompt/Architecture */}
                                            <div className="p-5 bg-[#000000] border border-gray-800 rounded-xl shadow-xl">
                                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800/50">
                                                    <div className="flex items-center gap-2">
                                                        <Code className="h-4 w-4 text-indigo-500" />
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Implementation Blueprint</h3>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            if (parsed.prompt || parsed.generatedPrompt) {
                                                                navigator.clipboard.writeText(parsed.prompt || parsed.generatedPrompt);
                                                                setIsCopied(true);
                                                                setTimeout(() => setIsCopied(false), 2000);
                                                            }
                                                        }}
                                                        className="px-2 py-1 hover:bg-white/5 border border-transparent hover:border-gray-700 rounded transition-all flex items-center gap-1.5 group"
                                                    >
                                                        {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-500 group-hover:text-white transition-colors" />}
                                                        <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">
                                                            {isCopied ? "Copied" : "Copy"}
                                                        </span>
                                                    </button>
                                                </div>
                                                <div className="prose prose-invert max-w-none text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                                                    {parsed.prompt || parsed.generatedPrompt}
                                                </div>
                                            </div>
                                        </div>
                                     );
                                 }
                             })}

                             {isLoading && (
                                <div className="flex justify-start w-full max-w-3xl mx-auto">
                                    <div className="flex items-center gap-3 bg-[#0a0a0a] border border-gray-800 px-5 py-3 rounded-2xl rounded-tl-sm">
                                        <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                                        <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Processing Request...</span>
                                    </div>
                                </div>
                             )}
                             
                             <div ref={messagesEndRef} className="h-10 w-full" />
                        </div>

                        {/* Follow Up Search Bar & Error Display */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-[#141414] via-[#141414] to-transparent pointer-events-none">
                            <div className="relative w-full max-w-3xl mx-auto pointer-events-auto flex flex-col gap-4">
                                {error && (
                                    <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-xs text-center animate-in slide-in-from-bottom-2">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1 flex items-center gap-1.5">
                                        <Sparkles className="h-3 w-3 text-indigo-400" />
                                        Refine Architecture
                                    </div>
                                <div className="relative flex items-center bg-[#111] border border-gray-700 rounded-lg p-1.5 shadow-2xl group focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-white/10 transition-all duration-300">
                                    <input 
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={isLoading}
                                        placeholder="E.g., Make it include user authentication..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-white font-medium placeholder:text-gray-600 h-10 text-sm sm:text-base outline-none pl-3"
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!query.trim() || isLoading}
                                        className={cn(
                                            "h-10 w-10 rounded-md flex items-center justify-center transition-all duration-300",
                                            query.trim() && !isLoading ? "bg-white text-black hover:bg-gray-200" : "bg-gray-800 text-gray-600"
                                        )}
                                    >
                                         {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : <Send className="h-4 w-4" />}
                                    </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

