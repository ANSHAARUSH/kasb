import { Trash2, Award, Pencil } from "lucide-react"
import { Button } from "../../components/ui/button"
import { VerificationBadge } from "../../components/ui/VerificationBadge"
import { cn } from "../../lib/utils"
import { Avatar } from "../../components/ui/Avatar"

interface Investor {
    id: string
    name: string
    avatar: string
    funds_available: string
    email_verified: boolean
    show_in_feed: boolean
    adhaar_number?: string
    adhaar_doc_url?: string
    verification_level: 'basic' | 'verified' | 'trusted'
    review_requested?: boolean
    subscription_tier?: string
    bio?: string
    website?: string
    investor_type?: 'direct' | 'vc' | 'grant' | 'accelerator'
    grant_scheme?: string
    grant_advantages?: string
    grant_eligibility?: string
    check_size_range?: string
    target_stages?: string
    sector_focus?: string
    geography_focus?: string
    is_lead_investor?: boolean
    equity_taken?: string
    batch_dates?: string
    location_type?: string
    cohort_size?: number
    has_demo_day?: boolean
    is_admin_added?: boolean
    // Accelerator specific fields
    accelerator_type?: string
    cash_investment?: string
    applications_status?: string
    application_deadline?: string
    program_location?: string
    first_cheque_friendly?: string
    investor_intros_strength?: string
    founder_fit_score?: string
    best_for?: string
    program_duration?: string
    cohorts_per_year?: string
    relocation_required?: string
    follow_on_funding?: string
    non_dilutive_support?: string
    eligibility_requirements?: string
    application_difficulty?: string
    acceptance_rate?: string
    application_requirements?: string
    selection_process?: string
    decision_time?: string
    mentorship_access?: string
    investor_access?: string
    post_program_support?: string
    startup_perks?: string
    core_support?: string
    founder_community?: string
}

interface InvestorManagementProps {
    investors: Investor[]
    loading: boolean
    toggleVerifyInvestor: (investor: Investor) => void
    grantTrusted: (table: 'startups' | 'investors', id: string) => void
    promptDelete: (table: 'startups' | 'investors', id: string) => void
    onAddClick: () => void
    onEditClick: (investor: Investor) => void
    updateTier: (table: 'startups' | 'investors', id: string, tier: string) => void
}

export function InvestorManagement({
    investors,
    loading,
    toggleVerifyInvestor,
    grantTrusted,
    promptDelete,
    onAddClick,
    onEditClick,
    updateTier
}: InvestorManagementProps) {
    if (loading) {
        return <div className="p-8 text-center text-gray-400">Loading investors...</div>
    }

    const INVESTOR_PLANS = ['explore', 'investor_basic', 'investor_pro', 'institutional']

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {investors.map(investor => (
                    <div key={investor.id} className="flex items-center justify-between p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl bg-gray-50 overflow-hidden ring-1 ring-gray-100 shadow-sm">
                                <Avatar
                                    src={investor.avatar}
                                    name={investor.name}
                                    fallbackClassName="text-2xl text-gray-500"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="font-bold text-base">{investor.name}</div>
                                    <VerificationBadge level={investor.verification_level} />
                                    {investor.review_requested && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold border border-amber-200 animate-pulse">
                                            Review Requested
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-400">{investor.funds_available} available</div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Plan:</span>
                                    <select
                                        value={investor.subscription_tier || 'explore'}
                                        onChange={(e) => updateTier('investors', investor.id, e.target.value)}
                                        className="text-xs font-bold bg-gray-50 border-none rounded-lg px-2 py-1 focus:ring-1 ring-black cursor-pointer hover:bg-gray-100 transition-colors capitalize"
                                    >
                                        {INVESTOR_PLANS.map(plan => (
                                            <option key={plan} value={plan}>{plan.replace('investor_', '').replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                {investor.adhaar_number && (
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                        <span>Adhaar: {investor.adhaar_number}</span>
                                        {investor.adhaar_doc_url && (
                                            <a href={investor.adhaar_doc_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
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
                                    investor.verification_level === 'verified'
                                        ? "border-green-200 text-green-600 bg-green-50"
                                        : investor.verification_level === 'trusted'
                                            ? "border-amber-200 text-amber-600 bg-amber-50"
                                            : "bg-black text-white hover:bg-gray-800 border-transparent"
                                )}
                                onClick={() => toggleVerifyInvestor(investor)}
                            >
                                {investor.verification_level === 'basic' ? "Verify Adhaar" : "Toggle Verified"}
                            </Button>

                            {investor.is_admin_added && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                    onClick={() => onEditClick(investor)}
                                >
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit
                                </Button>
                            )}

                            {investor.verification_level !== 'basic' && investor.verification_level !== 'trusted' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full text-xs border-amber-200 text-amber-600 hover:bg-amber-50"
                                    onClick={() => grantTrusted('investors', investor.id)}
                                >
                                    <Award className="h-3 w-3 mr-1" />
                                    Grant Trusted
                                </Button>
                            )}

                            <Button onClick={() => promptDelete('investors', investor.id)} variant="ghost" size="icon" className="rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50">
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                ))}
                <div className="p-4 text-center border-t border-gray-50 bg-gray-50/30">
                    <Button onClick={onAddClick} variant="outline" className="w-full rounded-2xl border-dashed border-gray-300 hover:border-black transition-colors py-6">
                        + Add New Investor
                    </Button>
                </div>
            </div>
        </div>
    )
}
