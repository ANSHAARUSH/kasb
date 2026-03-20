import { useState, useEffect } from "react"
import { StartupCard } from "../../components/dashboard/StartupCard"
import { StartupDetail } from "../../components/dashboard/StartupDetail"
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
import { Sparkles, Lock, X } from "lucide-react"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { SearchInput } from "../../components/dashboard/SearchInput"
import { useDebounce } from "../../hooks/useDebounce"

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
    const [detailStartup, setDetailStartup] = useState<Startup | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

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

    const baseStartups = activeTab === 'history' ? historyStartups : futureStartups

    const filteredStartups = baseStartups.filter(startup => {
        const query = debouncedSearchQuery.toLowerCase()
        return (
            startup.name.toLowerCase().includes(query) ||
            startup.description?.toLowerCase().includes(query) ||
            startup.industry?.toLowerCase().includes(query) ||
            startup.tags?.some(t => t.toLowerCase().includes(query))
        )
    })

    const displayedStartups = filteredStartups

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
            // Priority: Groq -> Env -> DB Global -> DB User
            const envKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
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
        <div className="flex flex-col gap-6 relative min-h-[50vh] px-6 pt-6 md:px-0 md:pt-0">
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
                    className="flex flex-col gap-4 pb-24 max-w-2xl mx-auto px-4 w-full"
                >
                    {loading && <div className="text-center text-gray-400">Loading...</div>}

                    {!loading && displayedStartups.map(startup => (
                        <div
                            key={startup.id}
                            className="transform transition-all duration-200 hover:scale-[1.01]"
                        >
                            <StartupCard
                                startup={startup}
                                isSelected={selectedIds.includes(startup.id)}
                                isSaved={true}
                                onClick={() => handleSelect(startup.id)}
                                onDoubleClick={() => setDetailStartup(startup)}
                                onToggleSave={handleRemove}
                            />
                        </div>
                    ))}

                    {!loading && displayedStartups.length === 0 && (
                        <div className="py-12 text-center text-gray-500">
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
                        className="fixed bottom-44 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-xs sm:max-w-none sm:w-auto text-center"
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

            {/* Startup Detail Modal */}
            <AnimatePresence>
                {detailStartup && (
                    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setDetailStartup(null)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="absolute top-2 right-2 z-10 lg:hidden">
                                <Button variant="ghost" size="icon" onClick={() => setDetailStartup(null)} className="rounded-full bg-white/50 hover:bg-white">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <StartupDetail
                                    startup={detailStartup}
                                    onClose={() => setDetailStartup(null)}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Fixed Bottom Search Bar */}
            <div className="fixed bottom-24 left-0 right-0 z-40 px-4 md:left-64 transition-all duration-300 pointer-events-none">
                <div className="max-w-2xl mx-auto pointer-events-auto">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={`Search ${activeTab === 'history' ? 'history' : 'future plans'}...`}
                        className="w-full !relative !bottom-0 !px-0 !pb-0"
                    />
                </div>
            </div>
        </div>
    )
}

