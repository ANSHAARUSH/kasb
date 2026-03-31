import { useState, useEffect, useMemo } from "react"
import { type Investor } from "../../data/mockData"
import { InvestorCard } from "../../components/dashboard/InvestorCard"
import { useChat } from "../../hooks/useChat"
import { useSavedEntities } from "../../hooks/useSavedEntities"
import { useInvestors } from "../../hooks/useInvestors"
import { useStartupProfile } from "../../hooks/useStartupProfile"
import { useImpactPointsTracker } from "../../hooks/useImpactPointsTracker"
import { SearchInput } from "../../components/dashboard/SearchInput"
import { useDebounce } from "../../hooks/useDebounce"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { type Startup } from "../../data/mockData"
import { Filter, BarChart3, Lock, ChevronUp } from "lucide-react"
import { InvestorDetail, type PanelSize, InvestorDetailModal } from "../../components/dashboard/InvestorDetail"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"

import { InvestorFilterPanel, type InvestorFilterState } from "../../components/dashboard/InvestorFilterPanel"
import { parseRevenue } from "../../lib/utils"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { isProfileComplete } from "../../lib/questionnaire"

export default function StartupHome() {
    // ... hooks ...

    const [filters, setFilters] = useState<InvestorFilterState>({
        types: [],
        industries: [],
        minFunds: "0",
        states: [],
        cities: []
    })
    const [showFilters, setShowFilters] = useState(false)
    const [activeFeed] = useState<'discover' | 'top-investors'>('discover')

    // ... existing hooks ...
    // Note: I need to preserve existing hooks. I will just inject imports and state.
    // Instead of replacing whole file, I will carefully target sections.

    // Let's rewrite the component start to include new state
    const { openChat } = useChat()
    const { investors, loading: investorsLoading } = useInvestors()
    const { savedIds: savedInvestorIds, toggleSave: handleToggleSave, loading: savedLoading } = useSavedEntities({
        tableName: 'saved_investors',
        userColumn: 'startup_id',
        targetColumn: 'investor_id'
    })
    const loading = investorsLoading || savedLoading

    const [searchQuery, setSearchQuery] = useState("")
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)
    const { startup: profileStartup } = useStartupProfile() // Used for impact tracker

    // Panel State
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detailInvestor, setDetailInvestor] = useState<Investor | null>(null)
    const [panelSize, setPanelSize] = useState<PanelSize>('default')
    const [lastTap, setLastTap] = useState<{ id: string; time: number } | null>(null)

    const selectedInvestor = useMemo(() => 
        investors.find(i => i.id === selectedId) || null,
    [investors, selectedId])

    useEffect(() => {
        if (!detailInvestor) {
            setIsSummaryExpanded(false)
        }
    }, [detailInvestor])

    // Track impact points for notifications
    const trackerEntity = useMemo(() => profileStartup ? ({
        ...profileStartup,
        problemSolving: profileStartup.problem_solving,
        metrics: {
            valuation: profileStartup.valuation,
            stage: profileStartup.stage,
            traction: profileStartup.traction
        },
        founder: {
            name: profileStartup.founder_name,
            avatar: profileStartup.founder_avatar,
            bio: profileStartup.founder_bio,
            education: '',
            workHistory: ''
        },
        tags: profileStartup.tags || [],
        emailVerified: profileStartup.email_verified || false,
        showInFeed: profileStartup.show_in_feed || false
    } as Startup) : null, [profileStartup])

    useImpactPointsTracker(trackerEntity)

    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    const baseFilteredInvestors = useMemo(() => investors.filter(investor => {
        // 1. Text Search
        const query = debouncedSearchQuery.toLowerCase()
        const matchesSearch = (
            investor.name.toLowerCase().includes(query) ||
            investor.bio.toLowerCase().includes(query) ||
            investor.expertise.some(e => e.toLowerCase().includes(query))
        )
        if (!matchesSearch) return false

        // 2. Type Filter (using bio/title proxy)
        if (filters.types.length > 0) {
            const typeText = (investor.title + " " + investor.bio).toLowerCase()
            const matchesType = filters.types.some(t => {
                if (t === "Angel Investor") return typeText.includes("angel");
                if (t === "Venture Capital") return typeText.includes("vc") || typeText.includes("venture");
                if (t === "Syndicate") return typeText.includes("syndicate");
                if (t === "Family Office") return typeText.includes("family office");
                return false;
            })
            if (!matchesType) return false
        }

        // 3. Industry Filter
        if (filters.industries.length > 0) {
            const matchesIndustry = investor.expertise.some(exp =>
                filters.industries.some(f => exp.toLowerCase().includes(f.toLowerCase()))
            )
            if (!matchesIndustry) return false
        }

        // 4. Funds Filter
        if (filters.minFunds !== "0") {
            const funds = parseRevenue(investor.fundsAvailable)
            if (funds < parseInt(filters.minFunds)) return false
        }

        // 5. State Filter
        if (filters.states.length > 0) {
            if (!investor.state || !filters.states.includes(investor.state)) return false
        }

        // 6. City Filter
        if (filters.cities.length > 0) {
            if (!investor.city || !filters.cities.includes(investor.city)) return false
        }

        return true
    }), [investors, debouncedSearchQuery, filters])

    const sortedInvestors = useMemo(() => {
        let base = [...baseFilteredInvestors]
        const tier = subscriptionManager.getTier()

        if (activeFeed === 'top-investors') {
            base.sort((a, b) => (b.investments || 0) - (a.investments || 0))
        } else if (tier === 'discovery') {
            // Randomized feed for free plan
            base.sort(() => Math.random() - 0.5)
        }

        return base
    }, [baseFilteredInvestors, activeFeed])

    const filteredInvestors = sortedInvestors

    const handleMessageClick = (investor: Investor) => {
        openChat({
            id: investor.id,
            name: investor.name,
            avatar: investor.avatar,
            role: 'investor'
        })
    }

    // Auto-select first item on desktop
    useEffect(() => {
        if (!selectedId && filteredInvestors.length > 0 && !detailInvestor && window.innerWidth >= 1024) {
            setSelectedId(filteredInvestors[0].id)
        }
    }, [filteredInvestors, selectedId, detailInvestor])


    if (loading) {
        return (
            <div className="flex h-[calc(100vh-100px)] overflow-hidden">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="h-10 w-48 skeleton mb-6" />
                    <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[300px] w-full skeleton" />
                        ))}
                    </div>
                </div>
                <div className="hidden lg:block w-[450px] border-l border-gray-100 p-6">
                    <div className="h-full w-full skeleton rounded-3xl" />
                </div>
            </div>
        )
    }

    // ... render ... 
    return (
        <div className="h-[calc(100dvh-100px)] md:h-[calc(100vh-61px)] flex flex-col lg:flex-row overflow-hidden md:-mt-6 md:-mb-6">
            {/* Middle Panel: Feed */}
            <div className={cn(
                "relative flex-col min-w-0 overflow-hidden bg-gray-50/50 transition-all duration-300 ease-in-out",
                panelSize === 'full' ? 'hidden w-0' : 'flex-1 flex'
            )}>
                {/* Filters Header (Minimized) */}
                <div className={cn("flex-none transition-all duration-300", showFilters ? "p-6 pb-2 relative z-50" : "p-0")}>
                    <InvestorFilterPanel
                        isOpen={showFilters}
                        filters={filters}
                        onFilterChange={setFilters}
                        onClose={() => setShowFilters(false)}
                    />
                </div>

                {/* Scrollable Feed List */}
                <div className="flex-1 overflow-y-auto px-6 pt-6 sm:px-6 md:px-4 md:pt-6 pb-40 md:pb-32 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Profile Incomplete Warning */}
                        {profileStartup && !isProfileComplete(profileStartup.stage, profileStartup.questionnaire) && (
                            <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-amber-50 border-2 border-amber-200 shadow-sm mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-amber-100 rounded-xl">
                                        <Lock className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-amber-900 mb-1">Your startup profile is incomplete</h3>
                                        <p className="text-xs text-amber-700 leading-relaxed mb-3">
                                            Investors can now see your startup, but higher completion leads to better matches. Complete all mandatory questions to improve your visibility.
                                        </p>
                                        <Link to="/dashboard/startup/profile">
                                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-8 px-4 text-[10px] font-bold">
                                                Complete Questionnaire
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                            <h1 className="text-2xl font-bold text-center sm:text-left">Discover Investors</h1>

                            <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn("gap-2 shadow-sm rounded-xl", showFilters ? "bg-black text-white hover:bg-black/90" : "")}
                                >
                                    <Filter className="h-4 w-4" />
                                    Filter
                                    {(filters.types.length + filters.industries.length + filters.states.length + filters.cities.length + (filters.minFunds !== "0" ? 1 : 0)) > 0 && (
                                        <span className="ml-1 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                            {filters.types.length + filters.industries.length + filters.states.length + filters.cities.length + (filters.minFunds !== "0" ? 1 : 0)}
                                        </span>
                                    )}
                                </Button>
                                <Link to="/dashboard/startup/analytics">
                                    <Button variant="outline" className="gap-2 shadow-sm rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 h-10">
                                        <BarChart3 className="h-4 w-4" />
                                        <span className="text-sm">Analytics</span>
                                    </Button>
                                </Link>
                                <span className="text-sm text-gray-500 hidden sm:inline">
                                    {filteredInvestors.length} matches
                                </span>
                            </div>
                        </div>



                        {filteredInvestors.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-white">
                                <Filter className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No investors found</h3>
                                <p>Try adjusting your search.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
                                {filteredInvestors.map(investor => (
                                    <div
                                        key={investor.id}
                                        className="transform transition-all duration-200 hover:scale-[1.01]"
                                    >
                                        <InvestorCard
                                            investor={investor}
                                            isSelected={selectedId === investor.id}
                                            isSaved={savedInvestorIds.includes(investor.id)}
                                            onMessageClick={handleMessageClick}
                                            onToggleSave={() => handleToggleSave(investor.id, "Investor")}
                                            onClick={() => {
                                                const now = Date.now();
                                                const isMobile = window.innerWidth < 1024;
                                                
                                                if (isMobile) {
                                                    if (lastTap?.id === investor.id && (now - lastTap.time < 300)) {
                                                        // Double tap -> Open Modal
                                                        setDetailInvestor(investor)
                                                        setLastTap(null)
                                                    } else {
                                                        // Single tap -> Highlight only
                                                        setSelectedId(investor.id)
                                                        setLastTap({ id: investor.id, time: now })
                                                    }
                                                } else {
                                                    // Desktop behavior
                                                    setSelectedId(investor.id)
                                                    setDetailInvestor(investor)
                                                    if (panelSize === 'minimized') setPanelSize('default')
                                                }
                                            }}
                                            showImpactPoints={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bottom spacer */}
                        <div className="h-24" />
                    </div>
                </div>

                {/* Expandable Bottom Search Bar */}
                <motion.div 
                    initial={false}
                    animate={{ 
                        height: isSummaryExpanded ? '100dvh' : 'auto',
                        bottom: isSummaryExpanded ? 0 : 84,
                    }}
                    transition={{ 
                        type: "spring", 
                        damping: 25,
                        stiffness: 150,
                        mass: 0.8
                    }}
                    className={cn(
                        "fixed md:absolute left-0 right-0 px-4 md:px-0 z-[45] flex flex-col overflow-hidden pointer-events-none md:pointer-events-auto md:pb-6",
                        isSummaryExpanded 
                            ? "h-[100dvh] pt-0" 
                            : "md:w-[600px] md:mx-auto h-auto"
                    )}
                >
                    <motion.div
                        className={cn(
                            "w-full bg-gray-100/90 backdrop-blur-xl shadow-[0_-8px_30px_rgb(0,0,0,0.15)] flex flex-col h-full pointer-events-auto transition-colors duration-300",
                            isSummaryExpanded 
                                ? "rounded-t-0 p-0" 
                                : "rounded-t-[2.5rem] md:rounded-[2.5rem] border border-gray-400 p-4"
                        )}
                    >
                        <AnimatePresence>
                            {selectedInvestor && !isSummaryExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="flex justify-center shrink-0"
                                >
                                    <motion.button
                                        onClick={() => setIsSummaryExpanded(true)}
                                        className="p-1.5 rounded-full bg-white/60 hover:bg-white border text-gray-500 border-gray-200 hover:border-gray-300 transition-all shadow-sm cursor-pointer"
                                        title="Show Summary"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        drag="y"
                                        dragConstraints={{ top: 0, bottom: 0 }}
                                        onDragEnd={(_, info) => {
                                            if (info.offset.y < -20) setIsSummaryExpanded(true);
                                        }}
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="max-w-md mx-auto w-full shrink-0 relative z-10">
                            <SearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search investors..."
                                className="w-full !relative !bottom-0 !px-0 !pb-0"
                            />
                        </div>

                        <AnimatePresence>
                            {isSummaryExpanded && selectedInvestor && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="flex flex-col bg-white rounded-t-3xl md:rounded-3xl shadow-sm border-t border-gray-200 p-6 sm:p-8 mt-4 flex-1 overflow-y-auto min-h-0 relative z-0 overscroll-contain"
                                >
                                    <div className="absolute top-0 left-0 w-full flex justify-center py-4 z-10">
                                        <motion.button
                                            onClick={() => setIsSummaryExpanded(false)}
                                            drag="y"
                                            dragConstraints={{ top: 0, bottom: 0 }}
                                            dragElastic={0.4}
                                            onDragEnd={(_, info) => {
                                                if (info.offset.y > 40) setIsSummaryExpanded(false);
                                            }}
                                            className="h-1.5 w-16 bg-gray-300 hover:bg-gray-400 rounded-full cursor-grab active:cursor-grabbing transition-colors"
                                        />
                                    </div>
                                    <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4 mt-6 flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                                        {selectedInvestor.name} Summary
                                    </h4>
                                    <div className="prose prose-sm font-medium text-gray-600 max-w-none">
                                        <p className="leading-relaxed text-base">
                                            {selectedInvestor.bio || `${selectedInvestor.name} is an active investor specialize in ${selectedInvestor.expertise.join(", ")}.`}
                                        </p>
                                        <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                            <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Expertise & Focus</h5>
                                            <p className="text-gray-500">{selectedInvestor.expertise.join(" • ")}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-400 uppercase">
                                                {selectedInvestor.title}
                                            </span>
                                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-400 uppercase">
                                                {selectedInvestor.city || selectedInvestor.state || 'Remote'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            </div>
        
            {/* Right Panel: Investor Details (Desktop) */}
            <div className={`
                hidden lg:block border-l border-gray-200 bg-white h-full relative z-10 shadow-xl overflow-hidden transition-all duration-300 ease-in-out
                ${panelSize === 'minimized' ? 'w-0 border-l-0 opacity-0 pointer-events-none' : ''}
                ${panelSize === 'full' ? 'flex-1 border-l-0' : (panelSize === 'minimized' ? '' : 'w-[450px] xl:w-[500px]')}
            `}>
                <InvestorDetail
                    investor={detailInvestor}
                    currentSize={panelSize}
                    onResize={(size) => {
                        if (size === 'minimized') {
                            setPanelSize('minimized')
                        } else {
                            setPanelSize(size)
                        }
                    }}
                    onClose={() => {
                        setSelectedId(null)
                        setPanelSize('default')
                    }}
                // onDisconnect={} // If we want to handle disconnect refresh
                />
            </div>

            {/* Mobile Detail Modal */}
            <div className="lg:hidden">
                <InvestorDetailModal
                    investor={detailInvestor}
                    onClose={() => setDetailInvestor(null)}
                />
            </div>
        </div>
    )
}

