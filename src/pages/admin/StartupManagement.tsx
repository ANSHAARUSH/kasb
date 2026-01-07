import { Trash2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { VerificationBadge } from "../../components/ui/VerificationBadge"
import { cn } from "../../lib/utils"
import { Award } from "lucide-react"

interface Startup {
    id: string
    name: string
    logo: string
    problem_solving: string
    description?: string
    valuation: string
    stage: string
    traction: string
    email_verified: boolean
    show_in_feed: boolean
    founder_name: string
    founder_avatar: string
    founder_bio: string
    founder_education: string
    founder_work_history: string
    history: string
    tags: string[]
    adhaar_number?: string
    adhaar_doc_url?: string
    verification_level: 'basic' | 'verified' | 'trusted'
    review_requested?: boolean
    industry?: string
}

interface StartupManagementProps {
    startups: Startup[]
    loading: boolean
    toggleVerifyStartup: (startup: Startup) => void
    grantTrusted: (table: 'startups' | 'investors', id: string) => void
    toggleFeedVisibility: (startup: Startup) => void
    promptDelete: (table: 'startups' | 'investors', id: string) => void
    onAddClick: () => void
}

export function StartupManagement({
    startups,
    loading,
    toggleVerifyStartup,
    grantTrusted,
    toggleFeedVisibility,
    promptDelete,
    onAddClick
}: StartupManagementProps) {
    if (loading) {
        return <div className="p-8 text-center text-gray-400">Loading startups...</div>
    }

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {startups.map(startup => (
                    <div key={startup.id} className="flex items-center justify-between p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="text-2xl h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl bg-gray-50 overflow-hidden font-bold text-gray-500 ring-1 ring-gray-100 shadow-sm">
                                {(startup.logo?.startsWith('http') || startup.logo?.startsWith('/')) ? (
                                    <img
                                        src={startup.logo}
                                        alt={startup.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                            const parent = target.parentElement
                                            if (parent) {
                                                parent.innerText = startup.name?.charAt(0).toUpperCase() || '?'
                                            }
                                        }}
                                    />
                                ) : (
                                    <span>{startup.logo || (startup.name?.charAt(0).toUpperCase() || '?')}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="font-bold text-base">{startup.name}</div>
                                    <VerificationBadge level={startup.verification_level} />
                                    {startup.review_requested && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold border border-amber-200 animate-pulse">
                                            Review Requested
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-400 flex items-center gap-2">
                                    {startup.valuation && <span>{startup.valuation} valuation</span>}
                                    {startup.verification_level !== 'basic' && (
                                        <>
                                            {startup.valuation && <span>•</span>}
                                            <button
                                                onClick={() => toggleFeedVisibility(startup)}
                                                className={cn("hover:underline", startup.show_in_feed ? "text-green-600" : "text-gray-400")}
                                            >
                                                {startup.show_in_feed ? "Visible in feed" : "Hidden from feed"}
                                            </button>
                                        </>
                                    )}
                                </div>
                                {startup.adhaar_number && (
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                        <span>Adhaar: {startup.adhaar_number}</span>
                                        {startup.adhaar_doc_url && (
                                            <a href={startup.adhaar_doc_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                                [View Doc]
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "rounded-full text-xs font-bold transition-all",
                                    startup.verification_level === 'verified'
                                        ? "border-green-200 text-green-600 bg-green-50"
                                        : startup.verification_level === 'trusted'
                                            ? "border-amber-200 text-amber-600 bg-amber-50"
                                            : "bg-black text-white hover:bg-gray-800 border-transparent"
                                )}
                                onClick={() => toggleVerifyStartup(startup)}
                            >
                                {startup.verification_level === 'basic' ? "Verify Adhaar" : "Toggle Verified"}
                            </Button>

                            {startup.verification_level !== 'basic' && startup.verification_level !== 'trusted' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full text-xs border-amber-200 text-amber-600 hover:bg-amber-50"
                                    onClick={() => grantTrusted('startups', startup.id)}
                                >
                                    <Award className="h-3 w-3 mr-1" />
                                    Grant Trusted
                                </Button>
                            )}

                            <Button onClick={() => promptDelete('startups', startup.id)} variant="ghost" size="icon" className="rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50">
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                ))}
                <div className="p-4 text-center border-t border-gray-50 bg-gray-50/30">
                    <Button onClick={onAddClick} variant="outline" className="w-full rounded-2xl border-dashed border-gray-300 hover:border-black transition-colors py-6">
                        + Add New Startup
                    </Button>
                </div>
            </div>
        </div>
    )
}
