import { useState, useEffect } from "react"
import { type Startup } from "../../data/mockData"
import { StartupCard } from "../../components/dashboard/StartupCard"
import { SearchInput } from "../../components/dashboard/SearchInput"
import { StartupDetail, type PanelSize } from "../../components/dashboard/StartupDetail"
// import { supabase } from "../../lib/supabase"

// import { useAuth } from "../../context/AuthContext"
// import { useToast } from "../../hooks/useToast"

import { Filter, SlidersHorizontal, X, FileText } from "lucide-react"
import { Button } from "../../components/ui/button"
import { FilterPanel, type FilterState } from "../../components/dashboard/FilterPanel"
import { useChat } from "../../hooks/useChat"
import { useDebounce } from "../../hooks/useDebounce"
import { useSearchParams, Link } from "react-router-dom"
import { useSavedEntities } from "../../hooks/useSavedEntities"
import { parseRevenue, cn } from "../../lib/utils"
import { useStartups } from "../../hooks/useStartups"

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

    const handleConnectionChange = (startupId: string) => {
        setConnectionUpdate({ startupId, timestamp: Date.now() })
    }
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
        minRevenue: "0"
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


    // Filter logic remains the same
    const activeFilterCount =
        filters.stages.length +
        filters.industries.length +
        (filters.minRevenue !== "0" ? 1 : 0)

    const filteredStartups = startups.filter(startup => {
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

        return true
    })

    // Auto-select first startup if none selected and we have results
    // Only on mount or when list changes significantly, but ideally just defaulting to the first one for the view
    useEffect(() => {
        // Only auto-select on desktop (lg breakpoint is 1024px)
        if (!selectedId && filteredStartups.length > 0 && !detailStartup && window.innerWidth >= 1024) {
            setSelectedId(filteredStartups[0].id)
            setDetailStartup(filteredStartups[0])
        }
    }, [filteredStartups, selectedId, detailStartup])


    if (loading) {
        return (
            <div className="flex h-[calc(100vh-100px)] overflow-hidden">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
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
                <div className="flex-none p-6 pb-2">
                    <FilterPanel
                        isOpen={showFilters}
                        filters={filters}
                        onFilterChange={setFilters}
                        onClose={() => setShowFilters(false)}
                    />
                </div>

                {/* Scrollable Feed List */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-20 scrollbar-hide">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold">Discover Startups</h1>
                            <div className="flex items-center gap-3">
                                <Link to="/dashboard/investor/cheatsheet" className="md:hidden">
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 border-gray-200 text-gray-600">
                                        <FileText className="h-3.5 w-3.5" />
                                        <span className="text-xs">Cheat Sheet</span>
                                    </Button>
                                </Link>
                                <span className="text-sm text-gray-500">{filteredStartups.length} matches</span>
                            </div>
                        </div>

                        {filteredStartups.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-white">
                                <Filter className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No startups found</h3>
                                <p>Try adjusting your filters.</p>
                            </div>
                        ) : (
                            filteredStartups.map(startup => (
                                <div key={startup.id} className="transform transition-all duration-200 hover:scale-[1.01]">
                                    <StartupCard
                                        startup={startup}
                                        isSelected={selectedId === startup.id}
                                        isSaved={savedStartupIds.includes(startup.id)}
                                        onClick={() => {
                                            setSelectedId(startup.id)
                                            // Desktop: Open details panel
                                            if (window.innerWidth >= 1024) {
                                                setDetailStartup(startup)
                                                if (panelSize === 'minimized') setPanelSize('default')
                                            }
                                        }}
                                        onDoubleClick={() => {
                                            // Mobile: specific double tap to open details modal
                                            if (window.innerWidth < 1024) {
                                                setDetailStartup(startup)
                                                setSelectedId(startup.id)
                                            }
                                        }}
                                        onToggleSave={() => handleToggleSave(startup.id, "Startup")}
                                        onMessageClick={handleMessage}
                                        triggerUpdate={connectionUpdate}
                                        onConnectionChange={handleConnectionChange}
                                    />
                                </div>
                            ))
                        )}
                        {/* Bottom spacer */}
                        <div className="h-20" />
                    </div>
                </div>

                {/* Fixed Bottom Search & Filter Bar */}
                <div className="fixed bottom-24 left-0 right-0 z-40 px-4 md:left-64 lg:right-auto lg:w-[calc(100%-450px-256px)] xl:w-[calc(100%-500px-256px)] pointer-events-none">
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

