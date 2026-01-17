import { useState } from "react"
import { type Investor } from "../../data/mockData"
import { InvestorCard } from "../../components/dashboard/InvestorCard"
import { InvestorDetail } from "../../components/dashboard/InvestorDetail"
// import { supabase } from "../../lib/supabase"
// import { useAuth } from "../../context/AuthContext"
// import { useToast } from "../../hooks/useToast"
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
import { FileText } from "lucide-react"

export function StartupHome() {
    // const { user } = useAuth()
    const { openChat } = useChat()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detailInvestor, setDetailInvestor] = useState<Investor | null>(null)
    const { investors, loading: investorsLoading } = useInvestors()
    // const [savedInvestorIds, setSavedInvestorIds] = useState<string[]>([])
    const { savedIds: savedInvestorIds, toggleSave: handleToggleSave, loading: savedLoading } = useSavedEntities({
        tableName: 'saved_investors',
        userColumn: 'startup_id',
        targetColumn: 'investor_id'
    })
    const loading = investorsLoading || savedLoading

    const [searchQuery, setSearchQuery] = useState("")
    const { startup: profileStartup } = useStartupProfile()

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



    const handleCardClick = (id: string) => {
        setSelectedId(id)
    }

    const handleCardDoubleClick = (investor: Investor) => {
        setDetailInvestor(investor)
        setSelectedId(investor.id)
    }

    const handleMessageClick = (investor: Investor) => {
        openChat({
            id: investor.id,
            name: investor.name,
            avatar: investor.avatar,
            role: 'investor'
        })
    }

    // handleToggleSave replaced by hook


    if (loading) {
        return (
            <div className="pb-20">
                <div className="mb-6 flex items-center justify-between">
                    <div className="h-10 w-48 skeleton" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 mt-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[300px] w-full skeleton" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="pb-20 pt-6">
            <div className="mb-6 flex items-center justify-between">
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
                <div className="p-8 text-center text-gray-500 border border-dashed rounded-xl">
                    No investors found matching your search.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredInvestors.map(investor => (
                        <div
                            key={investor.id}
                            onClick={() => handleCardClick(investor.id)}
                            onDoubleClick={() => handleCardDoubleClick(investor)}
                        >
                            <InvestorCard
                                investor={investor}
                                isSelected={selectedId === investor.id}
                                isSaved={savedInvestorIds.includes(investor.id)}
                                onMessageClick={handleMessageClick}
                                onToggleSave={() => handleToggleSave(investor.id, "Investor")}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom spacer */}
            <div className="h-24" />

            {/* Fixed Bottom Search Bar */}
            <div className="fixed bottom-24 left-0 right-0 z-40 px-4 md:left-64 pointer-events-none">
                <div className="max-w-md mx-auto pointer-events-auto">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search investors by name, bio, or expertise..."
                        className="w-full !relative !bottom-0 !px-0 !pb-0"
                    />
                </div>
            </div>

            <InvestorDetail
                investor={detailInvestor}
                onClose={() => setDetailInvestor(null)}
            />
        </div>
    )
}

