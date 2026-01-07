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
import { SearchInput } from "../../components/dashboard/SearchInput"
import { useDebounce } from "../../hooks/useDebounce"

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
        <div className="pb-20">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Discover Investors</h1>
                <span className="text-sm text-gray-500">
                    {filteredInvestors.length} matches
                </span>
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

            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search investors by name, bio, or expertise..."
            />

            <InvestorDetail
                investor={detailInvestor}
                onClose={() => setDetailInvestor(null)}
            />
        </div>
    )
}

