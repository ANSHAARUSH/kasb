import { useState, useEffect, useMemo } from "react"
import { subscriptionManager } from "../../lib/subscriptionManager"
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
import { FileText, Filter } from "lucide-react"
import { InvestorDetail, type PanelSize, InvestorDetailModal } from "../../components/dashboard/InvestorDetail"
import { cn } from "../../lib/utils"

import { InvestorFilterPanel, type InvestorFilterState } from "../../components/dashboard/InvestorFilterPanel"
import { parseRevenue } from "../../lib/utils"

export function StartupHome() {
    // ... hooks ...

    const [filters, setFilters] = useState<InvestorFilterState>({
        types: [],
        industries: [],
        minFunds: "0"
    })
    const [showFilters, setShowFilters] = useState(false)
    const [activeFeed, setActiveFeed] = useState<'discover' | 'top-investors'>('discover')

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
    const { startup: profileStartup } = useStartupProfile() // Used for impact tracker

    // Panel State
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detailInvestor, setDetailInvestor] = useState<Investor | null>(null)
    const [panelSize, setPanelSize] = useState<PanelSize>('default')

    // Track impact points for notifications
    useImpactPointsTracker(profileStartup ? {
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
    } as Startup : null)

    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    const baseFilteredInvestors = investors.filter(investor => {
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

        return true
    })

    const filteredInvestors = useMemo(() => {
        let base = [...baseFilteredInvestors]

        if (activeFeed === 'top-investors') {
            base.sort((a, b) => (b.investments || 0) - (a.investments || 0))
        }

        if (!subscriptionManager.hasPaidPlan() && activeFeed === 'discover') {
            // Randomize feed for free tier
            return base.sort(() => Math.random() - 0.5)
        }
        return base
    }, [baseFilteredInvestors, activeFeed])

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
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
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
        <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row overflow-hidden">
            {/* ... */}
            <div className="...">
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-20 scrollbar-hide">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h1 className="text-2xl font-bold hidden sm:block">Discover Investors</h1>

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
                                    onClick={() => setActiveFeed('top-investors')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                        activeFeed === 'top-investors' ? "bg-black text-white shadow-md" : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    Top Investors
                                </button>
                            </div>

                            <div className="flex items-center gap-3 ml-auto sm:ml-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={cn("gap-2", showFilters ? "bg-black text-white hover:bg-black/90" : "")}
                                >
                                    <Filter className="h-4 w-4" />
                                    Filter
                                    {(filters.types.length + filters.industries.length + (filters.minFunds !== "0" ? 1 : 0)) > 0 && (
                                        <span className="ml-1 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                            {filters.types.length + filters.industries.length + (filters.minFunds !== "0" ? 1 : 0)}
                                        </span>
                                    )}
                                </Button>
                                {/* Removed CheatSheet button to make space or keep it? Checking space... kept logic roughly */}
                                <Link to="/dashboard/startup/cheatsheet" className="md:hidden">
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 border-gray-200 text-gray-600">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-xs">Cheat Sheet</span>
                                    </Button>
                                </Link>
                                <span className="text-sm text-gray-500">
                                    {filteredInvestors.length} matches
                                </span>
                            </div>
                        </div>

                        <InvestorFilterPanel
                            isOpen={showFilters}
                            filters={filters}
                            onFilterChange={setFilters}
                            onClose={() => setShowFilters(false)}
                        />

                        {filteredInvestors.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-white">
                                <Filter className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No investors found</h3>
                                <p>Try adjusting your search.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6 max-w-2xl mx-auto">
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
                                            onClick={() => setSelectedId(investor.id)}
                                            onDoubleClick={() => {
                                                if (window.innerWidth >= 1024) {
                                                    setDetailInvestor(investor)
                                                    if (panelSize === 'minimized') setPanelSize('default')
                                                } else {
                                                    // Mobile: Open modal
                                                    setDetailInvestor(investor)
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bottom spacer */}
                        <div className="h-24" />
                    </div>
                </div>

                {/* Fixed Bottom Search Bar */}
                <div className={cn(
                    "fixed bottom-24 left-0 right-0 z-40 px-4 md:left-64 lg:right-auto transition-all duration-300 pointer-events-none",
                    panelSize === 'minimized'
                        ? "lg:w-[calc(100%-256px)]"
                        : "lg:w-[calc(100%-450px-256px)] xl:w-[calc(100%-500px-256px)]"
                )}>
                    <div className="max-w-md mx-auto pointer-events-auto">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search investors by name, bio, or expertise..."
                            className="w-full !relative !bottom-0 !px-0 !pb-0"
                        />
                    </div>
                </div>
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
                        setDetailInvestor(null)
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

