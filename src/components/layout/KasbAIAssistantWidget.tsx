import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Home, Minus, Loader2, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { chatWithAIStream } from '../../lib/ai';
import { useAuth } from '../../context/AuthContext';
import { useStartupProfile } from '../../hooks/useStartupProfile';
import { buildFounderContext } from '../../lib/founderContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function KasbAIAssistantWidget() {
    const { user } = useAuth();
    const { startup: founderProfile } = useStartupProfile();
    const founderContext = useMemo(() => buildFounderContext(founderProfile), [founderProfile]);
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [draggedPos, setDraggedPos] = useState({ x: 0, y: 0 });
    const scrollRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Initial position loading
    useEffect(() => {
        const storedPos = localStorage.getItem('kasb_assistant_pos');
        if (storedPos) {
            try {
                setDraggedPos(JSON.parse(storedPos));
            } catch (e) {
                console.error("Failed to parse stored position", e);
            }
        }
    }, []);

    // Hide in messages tab if it exists
    const isMessagesTab = location.pathname.endsWith('/messages');
    
    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Persistent history loading
    useEffect(() => {
        if (!user) return;
        const stored = localStorage.getItem(`kasb_assistant_widget_${user.id}`);
        if (stored) {
            try {
                setMessages(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, [user]);

    if (isMessagesTab) return null;

    const handleSendMessage = async (customQuery?: string) => {
        const text = customQuery || query;
        if (!text.trim() || !user || isLoading) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setQuery('');
        setIsLoading(true);

        const apiKey = import.meta.env.VITE_KASB_ASSISTANT_API_KEY || import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('groq_api_key') || '';
        
        try {
            let currentAiContent = "";
            
            // Add placeholder for AI response
            setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

            await chatWithAIStream(
                text,
                newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
                apiKey,
                (chunk) => {
                    currentAiContent += chunk;
                    setMessages(prev => {
                        const updated = [...prev];
                        if (updated.length > 0) {
                            updated[updated.length - 1] = { 
                                ...updated[updated.length - 1], 
                                content: currentAiContent 
                            };
                        }
                        return updated;
                    });
                },
                undefined,
                founderContext || undefined
            );

            // Save to localStorage after completion
            setMessages(prev => {
                localStorage.setItem(`kasb_assistant_widget_${user.id}`, JSON.stringify(prev));
                return prev;
            });
        } catch (error) {
            console.error("Assistant error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = () => {
        if (window.confirm("Do you want to clear your help history?")) {
            setMessages([]);
            if (user) {
                localStorage.removeItem(`kasb_assistant_widget_${user.id}`);
            }
        }
    };

    return (
        <div className="z-[9999]">
            {/* Floating Toggle Button - only shows when closed */}
            <AnimatePresence mode="wait">
                {!isOpen && (
                    <motion.button
                        ref={buttonRef}
                        key="assistant-trigger"
                        drag
                        dragMomentum={false}
                        dragConstraints={{ 
                            left: -window.innerWidth + 80, 
                            right: 20, 
                            top: -window.innerHeight + 100, 
                            bottom: 20 
                        }}
                        onDragEnd={(_, info) => {
                            const newPos = { 
                                x: draggedPos.x + info.offset.x, 
                                y: draggedPos.y + info.offset.y 
                            };
                            setDraggedPos(newPos);
                            localStorage.setItem('kasb_assistant_pos', JSON.stringify(newPos));
                        }}
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ 
                            scale: 1, 
                            opacity: 1, 
                            y: 0,
                            x: draggedPos.x,
                            transition: { type: "spring", stiffness: 260, damping: 20 }
                        }}
                        style={{ 
                            x: draggedPos.x, 
                            y: draggedPos.y 
                        }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            setIsOpen(true);
                        }}
                        className={cn(
                            "fixed bottom-28 md:bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center z-[1000] border-2 border-white/10 bg-black text-white backdrop-blur-md transition-shadow duration-300 overflow-hidden touch-none",
                            "hover:shadow-indigo-500/20"
                        )}
                        title="Kasb AI Assistant"
                    >
                        <img 
                            src="/floating-bot.jpg" 
                            alt="Kasb Bot" 
                            className="h-full w-full object-cover pointer-events-none" 
                        />
                        <div className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* AI Assistant Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="assistant-panel"
                        initial={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1, 
                            x: 0
                        }}
                        exit={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
                        className={cn(
                            "fixed right-6 w-[320px] sm:w-[350px] h-[480px] bg-white border border-gray-100 rounded-3xl shadow-2xl z-[9999] overflow-hidden flex flex-col transition-all",
                            "bottom-24 md:bottom-6"
                        )}
                    >
                        {/* Header */}
                        <div className="p-4 bg-black text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-transparent flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden border border-gray-100/10">
                                    <img src="/floating-bot.jpg" alt="Kasb Assistant" className="h-full w-full object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-sm font-black uppercase tracking-widest leading-none">Kasb Assistant</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Ready to help</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {messages.length > 0 && (
                                    <button 
                                        onClick={clearHistory}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                                        title="Clear history"
                                    >
                                        <Home className="h-4 w-4" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div 
                            className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/50 space-y-6" 
                            ref={scrollRef}
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-4">
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="h-20 w-20 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center ring-1 ring-gray-100"
                                    >
                                        <img src="/floating-bot.jpg" alt="Kasb Assistant" className="h-full w-full object-cover rounded-[2.5rem]" />
                                    </motion.div>
                                    <div>
                                        <h4 className="text-xl font-black text-gray-900 leading-tight">Welcome to Kasb.AI</h4>
                                        <p className="text-xs text-gray-500 font-medium px-4 mt-2">I know everything about Kasb.AI — ask me about any feature, plan, or how to get started!</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 w-full">
                                        {[
                                            "What is Piranha Tank?",
                                            "How does Founder GPT work?",
                                            "Tell me about Kasb Studio",
                                            "What subscription plans exist?",
                                            "Who built Kasb.AI?"
                                        ].map((suggestion, i) => (
                                            <motion.button
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 * i }}
                                                key={suggestion}
                                                onClick={() => handleSendMessage(suggestion)}
                                                className="p-4 text-[10px] font-black uppercase tracking-widest text-left bg-white border border-gray-100 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all text-gray-600 hover:text-indigo-600 active:scale-95 group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    {suggestion}
                                                    <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={i} 
                                        className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
                                    >
                                        <div className={cn(
                                            "max-w-[90%] p-4 rounded-2xl text-xs sm:text-sm shadow-sm",
                                            msg.role === 'user' 
                                                ? "bg-black text-white rounded-tr-sm font-medium" 
                                                : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm font-medium leading-relaxed"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-3 shadow-sm">
                                        <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Typing...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                            <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-[1.25rem] p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all duration-300">
                                <div className="pl-3 pr-2">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input 
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="ask me about your Kasb.AI"
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm h-10 px-0 outline-none font-medium placeholder:text-gray-400"
                                />
                                <button 
                                    onClick={() => handleSendMessage()}
                                    disabled={!query.trim() || isLoading}
                                    className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                        query.trim() && !isLoading 
                                            ? "bg-black text-white hover:bg-gray-800 translate-x-0 opacity-100" 
                                            : "bg-gray-100 text-gray-300 translate-x-2 opacity-0"
                                    )}
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-3">Powered by Kasb Intelligence</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
