import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle2, Sparkles, AlertCircle, ExternalLink, Pause, Play, Plus, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { LiquidRedirectBar } from './LiquidRedirectBar';
import { getQuestionsForVC } from '../../lib/vcQuestionsMap';
import { answerAutoFillQuestion } from '../../lib/ai';

interface AutoFillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProceed: (url: string) => void;
    targetUrl: string;
}

export function AutoFillModal({ isOpen, onClose, onProceed, targetUrl }: AutoFillModalProps) {
    const { user, role } = useAuth();
    const { toast } = useToast();
    const [profileData, setProfileData] = useState<Record<string, string | null>>({});
    const [loading, setLoading] = useState(true);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState(3000); // 3 seconds in ms

    // AI Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [aiResult, setAiResult] = useState<{ answer: string; notes: string | null } | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Extract hostname nicely
    const websiteName = React.useMemo(() => {
        try {
            return new URL(targetUrl).hostname.replace('www.', '');
        } catch {
            return targetUrl;
        }
    }, [targetUrl]);

    useEffect(() => {
        if (!isOpen || !user || role !== 'startup') return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('startups')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                if (data) {
                    // Extract relevant fields using website-specific questions map
                    const mappedData = getQuestionsForVC(websiteName, {
                        name: data.name,
                        founder_name: data.founder_name,
                        industry: data.industry,
                        stage: data.stage,
                        traction: data.traction,
                        valuation: data.valuation,
                        elevator_pitch: data.problem_solving, // problem_solving is used as elevator pitch in our db
                        description: data.description,
                        website_url: data.website || '',
                        linkedin_url: data.linkedin_url || ''
                    });
                    setProfileData(mappedData as Record<string, string | null>);
                }
            } catch (err) {
                console.error("Failed to fetch startup data for autofill", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, user, role]);

    useEffect(() => {
        if (!isOpen || isPaused) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 50) {
                    clearInterval(interval);
                    handleProceed();
                    setIsPaused(true);
                    return 0;
                }
                return prev - 50;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [isOpen, isPaused]);

    useEffect(() => {
        if (isOpen) {
            setTimeLeft(3000);
            setIsPaused(false);
        }
    }, [isOpen]);

    const handleCopy = (key: string, value: string) => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopiedField(key);
        setIsPaused(true); // Automatically pause if they start copying!
        toast("Copied! Timer paused.", "success");
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleProceed = () => {
        onProceed(targetUrl);
    };

    const handleSearchSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || Object.keys(profileData).length === 0) return;

        setIsSearching(true);
        setAiResult(null);
        setIsPaused(true); // Pause timer while interacting with AI

        try {
            const apiKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
            const result = await answerAutoFillQuestion(searchQuery, profileData, apiKey);
            setAiResult(result);
        } catch (error) {
            console.error("AI Search failed", error);
            toast("Failed to get AI answer. Please try again.", "error");
        } finally {
            setIsSearching(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex bg-[#000000] text-white overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-64 border-r border-white/10 hidden md:flex flex-col p-4">
                    <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl border-white/20 hover:bg-white/10 text-white font-bold mb-6 bg-transparent">
                        <Plus className="h-4 w-4" />
                        New Auto-Fill
                    </Button>
                    <div className="flex-1 overflow-y-auto">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">History</p>
                        {/* Placeholder history items to match requested UI */}
                        <div className="space-y-1">
                            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 truncate transition-colors">
                                Application Fill
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 truncate transition-colors">
                                Investor Form
                            </button>
                        </div>
                    </div>
                </div>

                {/* Center Main Page */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-black">
                    {/* Top Timer Bar */}
                    <div className="w-full h-1 bg-white/5 shrink-0">
                        <motion.div
                            className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                            style={{ width: `${(timeLeft / 3000) * 100}%` }}
                        />
                    </div>

                    <div className="flex-1 flex flex-col overflow-y-auto p-6 sm:p-12 custom-scrollbar relative">
                        {/* Header Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                <Sparkles className="h-5 w-5" /> Auto-Fill Vault
                            </h1>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsPaused(!isPaused)}
                                    disabled={timeLeft === 0}
                                    className="rounded-full h-10 px-6 border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent text-xs font-bold tracking-widest uppercase disabled:opacity-50"
                                >
                                    {timeLeft === 0 ? "Redirected" : isPaused ? "Resume" : "Pause"}
                                </Button>
                                <Button
                                    onClick={handleProceed}
                                    className="rounded-full h-10 px-6 bg-white text-black hover:bg-gray-200 text-xs font-bold tracking-widest uppercase"
                                >
                                    {timeLeft === 0 ? "Open Again" : "Skip"} <ExternalLink className="h-3.5 w-3.5 ml-2" />
                                </Button>
                            </div>
                        </div>

                        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col items-center">
                            {/* Logo Box */}
                            <div className="w-16 h-16 flex items-center justify-center mb-8">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
                                    <rect x="4" y="8" width="16" height="12" rx="3" />
                                    <line x1="1" y1="14" x2="4" y2="14" />
                                    <line x1="20" y1="14" x2="23" y2="14" />
                                    <path d="M9 12v3" strokeWidth="2.5" />
                                    <path d="M15 12v3" strokeWidth="2.5" />
                                    <path d="M10 8V4h4" />
                                </svg>
                            </div>

                            {/* Search Bar */}
                            <div className="w-full max-w-2xl mb-8">
                                <form onSubmit={handleSearchSubmit} className="relative w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <input 
                                        type="text"
                                        placeholder="Ask any application question. AI will answer using your profile."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-white placeholder:text-gray-400 focus:outline-none focus:border-white/30 transition-colors focus:bg-white/10 shadow-inner text-sm sm:text-base"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={isSearching || !searchQuery.trim()}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {isSearching ? <div className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full" /> : <Sparkles className="h-4 w-4 text-white" />}
                                    </button>
                                </form>
                            </div>

                            {/* AI Answer Display */}
                            {aiResult && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full max-w-2xl mb-8 space-y-4"
                                >
                                    <div className="w-full p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-100 relative group">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 rounded-full bg-indigo-500/20">
                                                <Sparkles className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-bold text-indigo-300 mb-1">AI Answer</h3>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiResult.answer}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopy('AI Answer', aiResult.answer)}
                                                className="h-8 px-3 rounded-full bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 text-[10px] font-bold uppercase transition-all"
                                            >
                                                {copiedField === 'AI Answer' ? "Copied" : "Copy"}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {aiResult.notes && (
                                        <div className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 flex gap-3 items-start">
                                            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                            <div className="text-sm leading-relaxed">
                                                <span className="font-bold text-amber-400 mb-1 block">Notes & Instructions</span>
                                                {aiResult.notes}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Data Grid */}
                            <div className="w-full pb-20">
                                {loading ? (
                                    <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-white/20 border-t-white rounded-full" /></div>
                                ) : Object.keys(profileData).length === 0 ? (
                                    <p className="text-center text-gray-500">No profile data found.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(profileData).map(([key, value]) => {
                                            const displayValue = value || 'Not provided in profile';
                                            const hasValue = !!value;
                                            return (
                                                <div key={key} className="group relative flex flex-col p-5 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{key}</p>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={!hasValue}
                                                            onClick={() => handleCopy(key, value || '')}
                                                            className="h-8 px-4 rounded-full bg-white/10 hover:bg-white hover:text-black text-white text-[10px] font-bold uppercase transition-all disabled:opacity-30 disabled:hover:bg-white/10 disabled:hover:text-white"
                                                        >
                                                            {copiedField === key ? "Copied" : "Copy"}
                                                        </Button>
                                                    </div>
                                                    <p className={`text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all ${hasValue ? 'text-gray-200' : 'text-gray-600 italic'}`}>
                                                        {displayValue}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        variant="ghost" 
                        className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 hover:text-white text-gray-400 transition-colors z-50"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Right Sidebar (Blank) */}
                <div className="w-64 border-l border-white/10 hidden xl:block bg-[#000000]">
                    {/* Blank as requested */}
                </div>
            </div>
        </AnimatePresence>
    );
}
