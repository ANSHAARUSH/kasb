import { useState, useEffect } from "react"
import { StartupCard } from "../../components/dashboard/StartupCard"
import { StartupComparisonView } from "../../components/dashboard/StartupComparisonView"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { supabase, getUserSetting, getGlobalConfig, getClosedDeals } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import type { Startup } from "../../data/mockData"
import type { StartupDB } from "../../types"
import { compareStartups, type ComparisonResult } from "../../lib/ai"
import { Button } from "../../components/ui/button"
import { Sparkles, Lock } from "lucide-react"
import { subscriptionManager } from "../../lib/subscriptionManager"

export function HistoryPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<'history' | 'future'>('future')
    const [futureStartups, setFutureStartups] = useState<Startup[]>([])
    const [historyStartups, setHistoryStartups] = useState<Startup[]>([])
    const [loading, setLoading] = useState(false)

    // Comparison State
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isComparing, setIsComparing] = useState(false)
    const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)

    useEffect(() => {
        if (!user || activeTab !== 'future') return

        const fetchFuturePlans = async () => {
            setLoading(true)
            // Join future_plans with startups
            const { data, error } = await supabase
                .from('future_plans')
                .select(`
                    startup:startups (*)
                `)
                .eq('investor_id', user.id)

            if (data) {
                const mapped = (data as unknown as { startup: StartupDB }[]).map((item) => {
                    const s = item.startup
                    return {
                        id: s.id,
                        name: s.name,
                        logo: s.logo || '🚀',
                        problemSolving: s.problem_solving,
                        description: s.description,
                        history: s.history || '',
                        metrics: {
                            valuation: s.valuation || '',
                            stage: s.stage || '',
                            traction: s.traction || ''
                        },
                        founder: {
                            name: s.founder_name || 'Founder',
                            avatar: s.founder_avatar || '',
                            bio: s.founder_bio || '',
                            education: s.founder_education || '',
                            workHistory: s.founder_work_history || ''
                        },
                        tags: s.tags || [],
                        emailVerified: s.email_verified,
                        showInFeed: s.show_in_feed,
                        industry: s.industry
                    } as Startup
                })
                setFutureStartups(mapped)
            }
            if (error) console.error("Error fetching plans:", error)
            setLoading(false)
        }

        fetchFuturePlans()
    }, [user, activeTab])

    useEffect(() => {
        if (!user || activeTab !== 'history') return

        const fetchClosedDeals = async () => {
            setLoading(true)
            try {
                const closedDealIds = await getClosedDeals(user.id)

                if (closedDealIds.length === 0) {
                    setHistoryStartups([])
                    setLoading(false)
                    return
                }

                // Fetch startup data for closed deals
                const { data, error } = await supabase
                    .from('startups')
                    .select('*')
                    .in('id', closedDealIds)

                if (data) {
                    const mapped = data.map((s: StartupDB) => ({
                        id: s.id,
                        name: s.name,
                        logo: s.logo || '🚀',
                        problemSolving: s.problem_solving,
                        description: s.description,
                        history: s.history || '',
                        metrics: {
                            valuation: s.valuation || '',
                            stage: s.stage || '',
                            traction: s.traction || ''
                        },
                        founder: {
                            name: s.founder_name || 'Founder',
                            avatar: s.founder_avatar || '',
                            bio: s.founder_bio || '',
                            education: s.founder_education || '',
                            workHistory: s.founder_work_history || ''
                        },
                        tags: s.tags || [],
                        emailVerified: s.email_verified,
                        showInFeed: s.show_in_feed,
                        industry: s.industry
                    } as Startup))
                    setHistoryStartups(mapped)
                }
                if (error) console.error("Error fetching closed deals:", error)
            } catch (err) {
                console.error("Error:", err)
            }
            setLoading(false)
        }

        fetchClosedDeals()
    }, [user, activeTab])

    const displayedStartups = activeTab === 'history' ? historyStartups : futureStartups

    const handleSelect = (id: string) => {
        // Selection allowed in both tabs


        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(s => s !== id))
        } else {
            if (selectedIds.length < 2) {
                setSelectedIds([...selectedIds, id])
            } else {
                setSelectedIds([selectedIds[1], id])
            }
        }
    }

    const handleRemove = async (startup: Startup) => {
        if (!user) return

        try {
            const { error } = await supabase
                .from('future_plans')
                .delete()
                .eq('investor_id', user.id)
                .eq('startup_id', startup.id)

            if (error) throw error

            setFutureStartups(prev => prev.filter(s => s.id !== startup.id))
            setSelectedIds(prev => prev.filter(id => id !== startup.id)) // Clear selection if removed
            toast("Removed from Future Plans", "info")
        } catch (err: unknown) {
            console.error("Error removing:", err)
            const message = err instanceof Error ? err.message : "Failed to remove. Please try again.";
            toast(message, "error")
        }
    }

    const handleCompare = async () => {
        if (!subscriptionManager.hasPaidPlan()) {
            toast("Access to AI Comparison requires a Growth or Investor Pro plan.", "error")
            return
        }

        if (selectedIds.length !== 2) {
            if (selectedIds.length === 0) toast("Please select 2 startups to compare first.", "info")
            return
        }

        // Check limits
        if (!subscriptionManager.canCompare(selectedIds[0], selectedIds[1])) {
            toast("You have reached your AI comparison limit for this month. Please upgrade your plan for more comparisons.", "error")
            return
        }

        const s1 = displayedStartups.find(s => s.id === selectedIds[0])
        const s2 = displayedStartups.find(s => s.id === selectedIds[1])

        if (!s1 || !s2) {
            toast("Error: Could not find startup data.", "error")
            return
        }

        setIsComparing(true)

        try {
            // Priority: Env -> DB Global -> DB User
            const envKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
            let apiKey = (envKey && !envKey.includes('your_') && !envKey.includes('here')) ? envKey : '';

            if (!apiKey) {
                const globalKey = await getGlobalConfig('ai_api_key')
                if (globalKey) apiKey = globalKey
            }

            if (!apiKey && user) {
                const storedKey = await getUserSetting(user.id, 'ai_api_key')
                if (storedKey) apiKey = storedKey
            }

            if (!apiKey) {
                toast("AI features are not setup. Please contact the administrator.", "error")
                return
            }

            const baseUrl = import.meta.env.VITE_OPENAI_BASE_URL
            const result = await compareStartups(s1, s2, apiKey, baseUrl)

            // Track successful comparison
            subscriptionManager.trackCompare(s1.id, s2.id)

            setComparisonResult(result)

        } catch (error: unknown) {
            console.error("Comparison Error:", error)
            const message = error instanceof Error ? error.message : "Comparison failed";
            toast(`Comparison failed: ${message}`, "error")
        } finally {
            setIsComparing(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 relative min-h-[50vh]">
            {/* Toggle Switch */}
            <div className="mx-auto flex w-full max-w-xs items-center justify-center rounded-full bg-gray-100 p-1">
                {(['history', 'future'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab)
                            setSelectedIds([]) // Clear selection on tab switch
                        }}
                        className={cn(
                            "relative flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors z-10",
                            activeTab === tab ? "text-black" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 rounded-full bg-white shadow-sm -z-10"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        {tab === 'history' ? 'History' : 'Future Plans'}
                    </button>
                ))}
            </div>

            {/* Hint for comparison */}
            {activeTab === 'future' && futureStartups.length >= 2 && selectedIds.length < 2 && (
                <div className="text-center text-sm text-gray-500 animate-in fade-in slide-in-from-top-1">
                    Select 2 startups to compare with AI
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 md:grid-cols-2 pb-24"
                >
                    {loading && <div className="col-span-full text-center text-gray-400">Loading...</div>}

                    {!loading && displayedStartups.map(startup => (
                        <StartupCard
                            key={startup.id}
                            startup={startup}
                            isSelected={selectedIds.includes(startup.id)}
                            isSaved={true}
                            onClick={() => handleSelect(startup.id)}
                            onDoubleClick={() => { }}
                            onToggleSave={handleRemove}
                        />
                    ))}

                    {!loading && displayedStartups.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            {activeTab === 'history'
                                ? "No viewing history yet."
                                : "No future plans added yet. Add them from the Home feed!"
                            }
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Compare Button */}
            <AnimatePresence>
                {selectedIds.length === 2 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
                    >
                        <Button
                            size="lg"
                            className="rounded-full shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-bold group"
                            onClick={handleCompare}
                            disabled={isComparing}
                        >
                            {!subscriptionManager.hasPaidPlan() ? (
                                <span className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 transition-transform group-hover:rotate-12" /> Unlock AI Compare
                                </span>
                            ) : isComparing ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="animate-spin h-5 w-5" /> Analyzing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" /> Compare with AI
                                </span>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Comparison View Modal */}
            <AnimatePresence>
                {comparisonResult && (
                    <StartupComparisonView
                        startup1={futureStartups.find(s => s.id === selectedIds[0])!}
                        startup2={futureStartups.find(s => s.id === selectedIds[1])!}
                        result={comparisonResult}
                        onClose={() => setComparisonResult(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

