import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Menu, Plus, History, X, Search, Send, MessageSquare, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../../components/ui/button"

const QUOTES = [
    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { text: "Vision without execution is hallucination.", author: "Thomas Edison" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "The only thing worse than starting something and failing... is not starting something.", author: "Seth Godin" },
    { text: "Ideas are easy. Implementation is hard.", author: "Guy Kawasaki" }
]

export function FounderGPT() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isOpenPersonality, setIsOpenPersonality] = useState(false)
    const [query, setQuery] = useState("")
    const [quote, setQuote] = useState(QUOTES[0])
    const [personality, setPersonality] = useState("Professional")

    useEffect(() => {
        // Randomize quote on mount
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
    }, [])

    const personalities = [
        { id: "Professional", label: "Professional", icon: "💼" },
        { id: "Casual", label: "Casual", icon: "☕" },
        { id: "Mentor", label: "Mentor", icon: "🎓" },
        { id: "Analytical", label: "Analytical", icon: "📊" },
        { id: "Visionary", label: "Visionary", icon: "🚀" },
    ]

    const pastChats = [
        { id: 1, title: "Market Analysis for SaaS", date: "2 hours ago" },
        { id: 2, title: "Pitch Deck Feedback", date: "Yesterday" },
        { id: 3, title: "Go-to-market Strategy", date: "Mar 20" },
    ]

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
                                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-[1.5rem] shadow-2xl z-[60] overflow-hidden p-2"
                                        >
                                            {personalities.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => {
                                                        setPersonality(p.id)
                                                        setIsOpenPersonality(false)
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                                                        personality === p.id 
                                                            ? "bg-black text-white" 
                                                            : "text-gray-600 hover:bg-gray-50"
                                                    )}
                                                >
                                                    <span className="text-lg">{p.icon}</span>
                                                    {p.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <Button 
                                className="w-full justify-start gap-3 h-12 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 text-gray-900 shadow-sm transition-all active:scale-95 mb-8"
                                onClick={() => {
                                    setQuery("")
                                    setIsSidebarOpen(false)
                                }}
                            >
                                <Plus className="h-4 w-4 text-black" />
                                <span className="font-bold text-sm">New Chat</span>
                            </Button>

                            <div className="flex-1 overflow-y-auto space-y-6">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2 flex items-center gap-2">
                                        <History className="h-3 w-3" />
                                        Yesterday
                                    </h3>
                                    <div className="space-y-1">
                                        {pastChats.map(chat => (
                                            <button 
                                                key={chat.id}
                                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                                            >
                                                <MessageSquare className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 shrink-0" />
                                                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 truncate">{chat.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Pro Tip</p>
                                    <p className="text-xs text-indigo-900/70 leading-relaxed font-medium">
                                        Ask me about your TAM, potential competitors, or pitch deck improvements.
                                    </p>
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
                </div>
                <div className="w-10" /> {/* Spacer */}
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full pb-20">
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
                        className="relative w-full max-w-2xl mx-auto group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-gray-500/5 rounded-[2.5rem] blur-xl group-focus-within:opacity-100 opacity-0 transition-opacity duration-700" />
                        <div className="relative flex items-center bg-white border-2 border-gray-100 rounded-[2rem] p-2 shadow-2xl shadow-gray-200/30 group-focus-within:border-black group-focus-within:ring-4 group-focus-within:ring-black/5 transition-all duration-300">
                            <div className="pl-4 pr-3">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                            </div>
                            <input 
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="What's on your mind today?"
                                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 font-medium placeholder:text-gray-400 h-12 text-lg outline-none"
                            />
                            <button 
                                className={cn(
                                    "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300",
                                    query ? "bg-black text-white scale-100 shadow-lg hover:bg-gray-800" : "bg-gray-50 text-gray-300 scale-90"
                                )}
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                        
                        {/* Quick Suggestions */}
                        <div className="flex flex-wrap justify-center gap-2 mt-6">
                            {["Analyze Market", "Pitch Feedback", "Growth Hacks"].map(tag => (
                                <button key={tag} className="px-5 py-2 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95 shadow-sm">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </main>

            {/* Bottom Floating Stats (Optional Premium Feel) */}
            <footer className="p-6 text-center">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">
                    Powered by Kasb intelligence
                </p>
            </footer>
        </div>
    )
}
