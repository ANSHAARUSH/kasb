import { useState, useEffect } from "react"
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

export function StartupHome() {
    const { openChat } = useChat()
    const { investors, loading: investorsLoading } = useInvestors()
    const { savedIds: savedInvestorIds, toggleSave: handleToggleSave, loading: savedLoading } = useSavedEntities({
        tableName: 'saved_investors',
        userColumn: 'startup_id',
        targetColumn: 'investor_id'
    })
    const loading = investorsLoading || savedLoading

    const [searchQuery, setSearchQuery] = useState("")
    const { startup: profileStartup } = useStartupProfile()

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

    const filteredInvestors = investors.filter(investor => {
        const query = debouncedSearchQuery.toLowerCase()
        return (
            investor.name.toLowerCase().includes(query) ||
            investor.bio.toLowerCase().includes(query) ||
            investor.expertise.some(e => e.toLowerCase().includes(query))
        )
    })

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
            // Optional: auto-select first one, but maybe don't auto-open unless user interactions happen?
            // InvestorHome does auto-select. Let's do it for consistency but maybe without setting detailInvestor to avoid opening if we want to be less intrusive?
            // Actually InvestorHome sets selectedId but maybe not detailed view?
            // Let's just set selectedId. Interactions will set detailInvestor.
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

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row overflow-hidden">
            {/* Middle Panel: Feed */}
            <div className={`
                flex-col min-w-0 overflow-hidden bg-gray-50/50 transition-all duration-300 ease-in-out
                ${panelSize === 'full' ? 'hidden w-0' : 'flex-1 flex'}
            `}>
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-20 scrollbar-hide">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold">Discover Investors</h1>
                            <div className="flex items-center gap-3">
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

