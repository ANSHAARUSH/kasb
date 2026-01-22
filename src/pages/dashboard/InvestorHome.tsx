import { useState, useEffect, useMemo } from "react"
import { type Startup } from "../../data/mockData"
import { StartupCard } from "../../components/dashboard/StartupCard"
import { SearchInput } from "../../components/dashboard/SearchInput"
import { StartupDetail, type PanelSize } from "../../components/dashboard/StartupDetail"
// import { supabase } from "../../lib/supabase"

// import { useAuth } from "../../context/AuthContext"
// import { useToast } from "../../hooks/useToast"

import { Filter, SlidersHorizontal, X, FileText, Sparkles } from "lucide-react"
import { Button } from "../../components/ui/button"
import { FilterPanel, type FilterState } from "../../components/dashboard/FilterPanel"
import { useChat } from "../../hooks/useChat"
import { useDebounce } from "../../hooks/useDebounce"
import { useSearchParams, Link } from "react-router-dom"
import { useSavedEntities } from "../../hooks/useSavedEntities"
import { parseRevenue, cn } from "../../lib/utils"
import { useStartups } from "../../hooks/useStartups"
import { useInvestorProfile } from "../../hooks/useInvestorProfile"
import { useImpactPointsTracker } from "../../hooks/useImpactPointsTracker"
import { subscriptionManager } from "../../lib/subscriptionManager"
import type { Investor } from "../../data/mockData"
import { useRecommendations } from "../../hooks/useRecommendations"

export function InvestorHome() {
    // const { user } = useAuth()

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detailStartup, setDetailStartup] = useState<Startup | null>(null)
    const [panelSize, setPanelSize] = useState<PanelSize>('default')
    const { startups, loading: startupsLoading } = useStartups()
    // const [savedStartupIds, setSavedStartupIds] = useState<string[]>([]) // Replaced by hook
    const { savedIds: savedStartupIds, toggleSave: handleToggleSave, loading: savedLoading } = useSavedEntities({
        tableName: 'future_plans',
        userColumn: 'investor_id',
        targetColumn: 'startup_id'
    })
    const loading = startupsLoading || savedLoading
    const [searchQuery, setSearchQuery] = useState("")
    const [connectionUpdate, setConnectionUpdate] = useState<{ startupId: string; timestamp: number } | null>(null)
    const { investor } = useInvestorProfile()

    const handleConnectionChange = (startupId: string) => {
        setConnectionUpdate({ startupId, timestamp: Date.now() })
    }

    // Track impact points for notifications
    useImpactPointsTracker(investor ? {
        ...investor,
        fundsAvailable: investor.funds_available,
        investments: investor.investments_count,
        expertise: investor.expertise || []
    } as Investor : null)

    const debouncedSearchQuery = useDebounce(searchQuery, 300)
    const [searchParams, setSearchParams] = useSearchParams()

    // Filter State
    const [showFilters, setShowFilters] = useState(false)
    const { openChat } = useChat()

    const handleMessage = (startup: Startup) => {
        openChat({
            id: startup.id,
            name: startup.name,
            avatar: startup.logo || '🚀',
            role: 'startup'
        })
    }
    const [filters, setFilters] = useState<FilterState>({
        stages: [],
        industries: [],
        minRevenue: "0",
        states: [],
        cities: []
    })

    useEffect(() => {
        const industry = searchParams.get('industry')
        if (industry) {
            // Mapping Cheat Sheet titles to FilterPanel industry names if needed
            // For example "AI & SaaS" might map to both "AI" and "SaaS" or just be used as is
            const searchTerms = industry.split(/[&/]/).map(t => t.trim())
            setFilters(prev => ({
                ...prev,
                industries: searchTerms
            }))
            setShowFilters(true)

            // Clean up the URL after applying
            const newParams = new URLSearchParams(searchParams)
            newParams.delete('industry')
            setSearchParams(newParams, { replace: true })
        }
    }, [searchParams, setSearchParams])





    // handleToggleSave replaced by hook


    // Helper to parse revenue string (e.g., "$1M ARR" -> 1000000) - Moved to utils


    const [activeFeed, setActiveFeed] = useState<'discover' | 'high-impact'>('discover')

    // Check if user has paid plan for AI recommendations

    // AI Recommendations (silent - only logs errors) - Enabled for ALL users
    const recommendationProfile = useMemo(() => investor ? ({
        ...investor,
        fundsAvailable: investor.funds_available,
        investments: investor.investments_count,
        expertise: investor.expertise || []
    } as Investor) : null, [investor]);

    const { recommendations, loading: recommendationsLoading, error: recommendationsError } = useRecommendations({
        type: 'investor',
        currentProfile: recommendationProfile,
        availableEntities: startups
    })

    // Log recommendation errors silently
    useEffect(() => {
        if (recommendationsError) {
            console.log('AI recommendations unavailable:', recommendationsError)
        }
    }, [recommendationsError])

    // Filter logic remains the same
    const activeFilterCount =
        filters.stages.length +
        filters.industries.length +
        filters.states.length +
        filters.cities.length +
        (filters.minRevenue !== "0" ? 1 : 0)

    const filteredStartups = useMemo(() => startups.filter(startup => {
        const query = debouncedSearchQuery.toLowerCase()
        const matchesSearch = (
            startup.name.toLowerCase().includes(query) ||
            startup.problemSolving.toLowerCase().includes(query) ||
            startup.tags.some(tag => tag.toLowerCase().includes(query))
        )

        if (!matchesSearch) return false

        // Stage Filter
        if (filters.stages.length > 0) {
            if (!filters.stages.some(s => startup.metrics.stage.includes(s))) return false
        }

        // Industry Filter (using tags AND industry field)
        if (filters.industries.length > 0) {
            const hasIndustry = filters.industries.some(ind => {
                const searchInd = ind.toLowerCase()
                // Check industry field
                if (startup.industry && startup.industry.toLowerCase().includes(searchInd)) return true
                // Check tags
                return startup.tags.some(tag => tag.toLowerCase().includes(searchInd))
            })

            if (!hasIndustry) return false
        }

        // Revenue Filter
        if (filters.minRevenue !== "0") {
            const startupRevenue = parseRevenue(startup.metrics.traction)
            const minRevenue = parseInt(filters.minRevenue)
            if (startupRevenue < minRevenue) return false
        }

        // State Filter
        if (filters.states.length > 0) {
            if (!startup.state || !filters.states.includes(startup.state)) return false
        }

        // City Filter
        if (filters.cities.length > 0) {
            if (!startup.city || !filters.cities.includes(startup.city)) return false
        }

        return true
    }), [startups, debouncedSearchQuery, filters])

    // Create a map of AI recommendations for quick lookup
    const recommendationMap = useMemo(() => new Map(
        recommendations?.recommendations.map(rec => [
            rec.id,
            { score: rec.matchScore, explanation: rec.explanation, highlights: rec.keyHighlights }
        ]) || []
    ), [recommendations])

    const sortedStartups = useMemo(() => {
        return filteredStartups.map(startup => {
            const aiRec = recommendationMap.get(startup.id)
            return {
                ...startup,
                isRecommended: !!aiRec,
                aiRecommendation: aiRec
            }
        }).sort((a, b) => {
            // High Impact Sort
            if (activeFeed === 'high-impact') {
                const pointDiff = (b.impactPoints || 0) - (a.impactPoints || 0);
                if (pointDiff !== 0) return pointDiff;

                // Tie-breaker: Valuation
                const valA = parseRevenue(a.metrics.valuation);
                const valB = parseRevenue(b.metrics.valuation);
                return valB - valA;
            }

            // Default Sort (Discover) - AI recommended first
            if (a.isRecommended && !b.isRecommended) return -1;
            if (!a.isRecommended && b.isRecommended) return 1;

            // Then by AI match score
            if (a.aiRecommendation && b.aiRecommendation) {
                return b.aiRecommendation.score - a.aiRecommendation.score
            }

            return 0;
        });
    }, [filteredStartups, recommendationMap, activeFeed]);

    const displayStartups = sortedStartups

    // Preference check logic
    const hasPreferences = useMemo(() => {
        if (!investor) return true // Don't show CTA while loading
        const hasExpertise = (investor.expertise || []).length > 0
        const hasIndustryFocus = (investor.profile_details?.investment_preferences?.industry_focus || []).length > 0
        return hasExpertise || hasIndustryFocus
    }, [investor])

    const topRecommendations = useMemo(() => {
        return sortedStartups.filter(s => s.isRecommended).slice(0, 3)
    }, [sortedStartups])

    const otherStartups = useMemo(() => {
        return sortedStartups.filter(s => !topRecommendations.some(r => r.id === s.id))
    }, [sortedStartups, topRecommendations])

    // Only on mount or when list changes significantly, but ideally just defaulting to the first one for the view
    useEffect(() => {
        // Only auto-select on desktop (lg breakpoint is 1024px)
        if (!selectedId && filteredStartups.length > 0 && !detailStartup && window.innerWidth >= 1024) {
            setSelectedId(filteredStartups[0].id)
            // Removed auto-open of detail panel to avoid counting views on mount
        }
    }, [filteredStartups, selectedId, detailStartup])


    if (loading) {
        return (
            <div className="flex h-[calc(100vh-100px)] overflow-hidden">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="h-12 w-full skeleton mb-6" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[500px] w-full skeleton rounded-3xl" />
                    ))}
                </div>
                <div className="hidden lg:block w-[400px] border-l border-gray-100 p-6">
                    <div className="h-full w-full skeleton rounded-3xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row overflow-hidden">
            {/* Middle Panel: Feed */}
            <div className={`
                flex-col min-w-0 overflow-hidden bg-gray-50/50 transition-all duration-300 ease-in-out
                ${panelSize === 'full' ? 'hidden w-0' : 'flex-1 flex'}
            `}>
                {/* Filters Header (Minimized) */}
                <div className={cn("flex-none transition-all duration-300", showFilters ? "p-6 pb-2" : "p-0")}>
                    <FilterPanel
                        isOpen={showFilters}
                        filters={filters}
                        onFilterChange={setFilters}
                        onClose={() => setShowFilters(false)}
                    />
                </div>

                {/* Scrollable Feed List */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-20 custom-scrollbar">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h1 className="text-xl font-bold hidden sm:block">Discover Startups</h1>

                            {/* Tabs */}
                            <div className="flex p-1 bg-white border border-gray-200 rounded-xl self-start sm:self-auto">
                                <button
                                    onClick={() => setActiveFeed('discover')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                        activeFeed === 'discover' ? "bg-black text-white shadow-md" : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    Discover
                                </button>
                                <button
                                    onClick={() => setActiveFeed('high-impact')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                        activeFeed === 'high-impact' ? "bg-black text-white shadow-md" : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    High Impact
                                </button>

                            </div>

                            <div className="flex items-center gap-3 ml-auto sm:ml-0">
                                <Link to="/dashboard/investor/cheatsheet" className="md:hidden">
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 border-gray-200 text-gray-600">
                                        <FileText className="h-3.5 w-3.5" />
                                        <span className="text-xs">Cheat Sheet</span>
                                    </Button>
                                </Link>
                                <span className="text-sm text-gray-500">{displayStartups.length} matches</span>
                            </div>
                        </div>

                        {displayStartups.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-white">
                                <Filter className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No startups found</h3>
                                <p>Try adjusting your filters.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* For You Section (Only in Discover Feed) */}
                                {activeFeed === 'discover' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-indigo-50 rounded-lg">
                                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                                </div>
                                                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">For You</h2>
                                            </div>
                                            {!hasPreferences && (
                                                <Link to="/dashboard/investor/settings" className="text-xs font-bold text-indigo-600 hover:underline">
                                                    Refine AI Preferences
                                                </Link>
                                            )}
                                        </div>

                                        {recommendationsLoading ? (
                                            <div className="space-y-4 animate-pulse">
                                                {[1, 2].map(i => (
                                                    <div key={i} className="h-40 w-full bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50" />
                                                ))}
                                            </div>
                                        ) : recommendationsError ? (
                                            <div className="p-8 rounded-[2rem] border border-indigo-100 bg-white shadow-sm text-center relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/20 via-indigo-500 to-indigo-500/20" />
                                                <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                                                    <Sparkles className="w-6 h-6 text-indigo-400" />
                                                </div>
                                                <h3 className="text-sm font-bold text-indigo-950 mb-2">Analyzing Opportunities...</h3>
                                                <p className="text-xs text-indigo-600/80 leading-relaxed max-w-[240px] mx-auto">{recommendationsError}</p>
                                                <button
                                                    onClick={() => window.location.reload()}
                                                    className="mt-4 text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                                >
                                                    Retry Analysis
                                                </button>
                                            </div>
                                        ) : topRecommendations.length > 0 ? (
                                            <div className="space-y-4">
                                                {topRecommendations.map(startup => (
                                                    <div key={`rec-${startup.id}`} className="transform transition-all duration-200 hover:scale-[1.01]">
                                                        <StartupCard
                                                            startup={startup}
                                                            isSelected={selectedId === startup.id}
                                                            isSaved={savedStartupIds.includes(startup.id)}
                                                            onClick={() => setSelectedId(startup.id)}
                                                            onDoubleClick={() => {
                                                                subscriptionManager.trackView(startup.id)
                                                                setDetailStartup(startup)
                                                                setSelectedId(startup.id)
                                                                if (window.innerWidth >= 1024 && panelSize === 'minimized') setPanelSize('default')
                                                            }}
                                                            onToggleSave={() => handleToggleSave(startup.id, "Startup")}
                                                            onMessageClick={handleMessage}
                                                            isRecommended={true}
                                                            aiRecommendation={startup.aiRecommendation}
                                                            showPercentage={true}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : !hasPreferences ? (
                                            <Link
                                                to="/dashboard/investor/settings"
                                                className="block p-6 rounded-[2rem] border-2 border-dashed border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition-all text-center group"
                                            >
                                                <div className="mx-auto w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <SlidersHorizontal className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <h3 className="text-sm font-bold text-indigo-900 mb-1">Personalize Your Feed</h3>
                                                <p className="text-xs text-indigo-600/70">Tell us your investment thesis & interests to see AI-recommended startups here.</p>
                                            </Link>
                                        ) : (
                                            <div className="p-6 rounded-[2rem] border border-gray-100 bg-white text-center">
                                                <p className="text-xs text-gray-400 italic">No direct matches for your current thesis yet. Try exploring the feed!</p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 py-2">
                                            <div className="h-px bg-gray-100 flex-1" />
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Discover More</span>
                                            <div className="h-px bg-gray-100 flex-1" />
                                        </div>
                                    </div>
                                )}

                                {/* Main Feed List */}
                                <div className="space-y-6">
                                    {(activeFeed === 'discover' ? otherStartups : displayStartups).map(startup => (
                                        <div key={startup.id} className="transform transition-all duration-200 hover:scale-[1.01]">
                                            <StartupCard
                                                startup={startup}
                                                isSelected={selectedId === startup.id}
                                                isSaved={savedStartupIds.includes(startup.id)}
                                                onClick={() => {
                                                    setSelectedId(startup.id)
                                                }}
                                                onDoubleClick={() => {
                                                    subscriptionManager.trackView(startup.id)
                                                    setDetailStartup(startup)
                                                    setSelectedId(startup.id)

                                                    if (window.innerWidth >= 1024) {
                                                        if (panelSize === 'minimized') setPanelSize('default')
                                                    }
                                                }}
                                                onToggleSave={() => handleToggleSave(startup.id, "Startup")}
                                                onMessageClick={handleMessage}
                                                isRecommended={false}
                                                aiRecommendation={startup.aiRecommendation}
                                                showImpactPoints={activeFeed === 'high-impact'}
                                                isFirstInRow={true}
                                                isLastInRow={true}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bottom spacer */}
                        <div className="h-20" />
                    </div>
                </div>

                {/* Fixed Bottom Search & Filter Bar */}
                <div className={cn(
                    "fixed bottom-24 left-0 right-0 z-40 px-4 md:left-64 lg:right-auto transition-all duration-300 pointer-events-none",
                    panelSize === 'minimized'
                        ? "lg:w-[calc(100%-256px)]"
                        : "lg:w-[calc(100%-450px-256px)] xl:w-[calc(100%-500px-256px)]"
                )}>
                    <div className="max-w-md mx-auto flex items-center gap-2 pointer-events-auto">
                        <div className="flex-1">
                            <SearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search startups..."
                                className="w-full !relative !bottom-0 !px-0 !pb-0"
                            />
                        </div>
                        <Button
                            variant={showFilters || activeFilterCount > 0 ? "default" : "outline"}
                            className={cn(
                                "h-12 w-12 rounded-2xl shadow-xl border-gray-200 shrink-0 bg-white transition-all hover:scale-105 active:scale-95",
                                (showFilters || activeFilterCount > 0) && "bg-black text-white border-black"
                            )}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <div className="relative">
                                <SlidersHorizontal className="h-5 w-5" />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Panel: Details (Desktop) */}
            <div className={`
                hidden lg:block border-l border-gray-200 bg-white h-full relative z-10 shadow-xl overflow-hidden transition-all duration-300 ease-in-out
                ${panelSize === 'minimized' ? 'w-0 border-l-0 opacity-0 pointer-events-none' : ''}
                ${panelSize === 'full' ? 'flex-1 border-l-0' : (panelSize === 'minimized' ? '' : 'w-[450px] xl:w-[500px]')}
            `}>
                <StartupDetail
                    startup={detailStartup}
                    currentSize={panelSize}
                    onResize={(size) => {
                        if (size === 'minimized') {
                            // Option 1: Just hide panel
                            setPanelSize('minimized')
                            // Option 2: Deselect (matches "X" behavior mostly, but let's keep it as "minimized state" so we can restore?)
                            // User asked for "minimize". Usually that implies it goes somewhere or hides.
                            // If we deselect, we lose state of who was selected.
                            // Let's just set minimized state.
                        } else {
                            setPanelSize(size)
                        }
                    }}
                    onClose={() => {
                        setDetailStartup(null)
                        setSelectedId(null)
                        setPanelSize('default') // Reset size on close
                    }}
                    triggerUpdate={connectionUpdate}
                    onConnectionChange={handleConnectionChange}
                />
            </div>

            {/* Mobile Detail Modal (using the refactored StartupDetail or a wrapper) */}
            {/* Note: We need to handle mobile view. The user said "Just like facebook but only for desktop". 
                 So for mobile, we might probably default to the old behavior or just hide the right panel?
                 The user said "keep the feed which shows only 1 card at a and a panel at right".
                 Ideally for mobile we should probably use the Modal behavior if a card is clicked.
                 But let's stick to the request "only for desktop" for the 3-panel part.
                 We can render a Modal for mobile if detailStartup is present AND we are on mobile.
                 CSS media queries can handle the hiding of the right panel, but we need the Modal for mobile.
              */}
            <div className="lg:hidden">
                {/* We can use the StartupDetailModal wrapper we created (conceptually) or just inline render it conditionaly */}
                {detailStartup && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
                        {/* ... Using the component as a modal ... */}
                        {/* Since I didn't export StartupDetailModal in the previous step (I put it in comments/same file but maybe not exported properly if I wasn't careful? I just replaced the function).
                                 Wait, the previous tool call updated StartupDetail.tsx. check if StartupDetailModal is exported.
                                 I see I defined `StartupDetailModal` in the replacement content but did I declare `export`? 
                                 Wait, I should check the file content again or assume I did it right.
                                 Let's just use the StartupDetail with a mobile wrapper here to be safe and simple.
                             */}
                        {/* Actually, let's just leave the Mobile behavior as is (Modal) utilizing the same component but wrapped. */}
                        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailStartup(null)} />
                            <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                                <div className="absolute top-2 right-2 z-10">
                                    <Button variant="ghost" size="icon" onClick={() => setDetailStartup(null)} className="rounded-full bg-white/50 hover:bg-white">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <StartupDetail
                                        startup={detailStartup}
                                        onClose={() => setDetailStartup(null)}
                                        triggerUpdate={connectionUpdate}
                                        onConnectionChange={handleConnectionChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

