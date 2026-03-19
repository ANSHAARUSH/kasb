import { motion, AnimatePresence } from "framer-motion"
import type { Investor } from "../../data/mockData"
import { X, Briefcase, UserMinus, Maximize2, Minimize2, Minus, Target, Zap, Award, CheckCircle2, ExternalLink, Loader2, ChevronDown, ChevronUp, Landmark } from "lucide-react"
import { Button } from "../ui/button"
import { useState, useEffect } from "react"
import { supabase, getConnectionStatus, disconnectConnection, sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest, type ConnectionStatus } from "../../lib/supabase"
import { checkEligibility, identifyMissingEligibilityData, type EligibilityResult, type MissingField } from "../../lib/ai"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { Avatar } from "../ui/Avatar"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { VerificationBadge } from "../ui/VerificationBadge"
import { ensureArray } from "../../lib/utils"
import { Modal } from "../ui/modal"

export type PanelSize = 'default' | 'full' | 'minimized'

interface InvestorDetailProps {
    investor: Investor | null
    onClose: () => void
    onDisconnect?: () => void
    onResize?: (size: PanelSize) => void
    currentSize?: PanelSize
}

export function InvestorDetail({ investor, onClose, onDisconnect, onResize, currentSize = 'default' }: InvestorDetailProps) {
    const { user, role } = useAuth()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null)
    const [isDisconnecting, setIsDisconnecting] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    // Eligibility AI State
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(false)
    const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null)
    const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false)
    const [eligibilityModalMode, setEligibilityModalMode] = useState<'mcq' | 'loading' | 'result'>('result')
    const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({})
    const [pendingStartupData, setPendingStartupData] = useState<any>(null)
    const [pendingCriteria, setPendingCriteria] = useState<string[]>([])
    const [dynamicQuestions, setDynamicQuestions] = useState<MissingField[]>([])

    const [showImprovementMCQ, setShowImprovementMCQ] = useState(false)


    // Ensure we access the details safely
    const details = investor?.profile_details || {}

    useEffect(() => {
        if (!user || !investor?.id) return
        setIsConnecting(false)
        setIsDisconnecting(false)
        setIsProcessing(false)

        async function checkStatus() {
            const status = await getConnectionStatus(user!.id, investor!.id)
            setConnStatus(status)
        }
        checkStatus()
    }, [user, investor?.id])

    const canView = true // Unlimited viewing for everyone

    useEffect(() => {
        if (investor?.id && canView) {
            subscriptionManager.trackView(investor.id)
        }
    }, [investor?.id, canView])

    const handleConnect = async () => {
        if (!user || !investor) return

        if (!subscriptionManager.canContact(investor.id)) {
            toast("Connection limit reached or plan doesn't include direct contact. Upgrade to connect!", "error")
            navigate('/dashboard/pricing')
            return
        }

        setIsConnecting(true)
        try {
            await sendConnectionRequest(user.id, investor.id)
            const status = await getConnectionStatus(user.id, investor.id)
            setConnStatus(status)
            toast("Connection request sent", "success")
        } catch (error: any) {
            console.error(error)
            toast(`Failed to connect: ${error.message || 'Unknown error'}`, "error")
        } finally {
            setIsConnecting(false)
        }
    }

    const handleAccept = async () => {
        if (!connStatus?.connectionId) return
        setIsProcessing(true)
        try {
            await acceptConnectionRequest(connStatus.connectionId)
            const status = await getConnectionStatus(user!.id, investor!.id)
            setConnStatus(status)
            toast("Connection accepted!", "success")
        } catch (error: any) {
            console.error(error)
            toast(`Failed to accept: ${error.message || 'Unknown error'}`, "error")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDecline = async () => {
        if (!connStatus?.connectionId) return
        setIsProcessing(true)
        try {
            await declineConnectionRequest(connStatus.connectionId)
            setConnStatus(null)
            toast("Connection declined", "info")
            onClose()
        } catch (error: any) {
            console.error(error)
            toast(`Failed to decline: ${error.message || 'Unknown error'}`, "error")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDisconnect = async () => {
        if (!user || !investor) return

        setIsDisconnecting(true)
        try {
            await disconnectConnection(user.id, investor.id)
            setConnStatus(null)
            toast("Connection removed", "info")
            onDisconnect?.()
            onClose()
        } catch (error: any) {
            console.error(error)
            toast(`Failed to disconnect: ${error.message || 'Unknown error'}`, "error")
        } finally {
            setIsDisconnecting(false)
        }
    }



    const handleCheckEligibility = async (criteria: string[]) => {
        if (!user || role !== 'startup') {
            toast("Only startups can check eligibility. Please log in as a startup.", "error")
            return
        }

        setIsCheckingEligibility(true)
        setIsEligibilityModalOpen(true)
        setEligibilityModalMode('loading')

        try {
            const { data: startupData } = await supabase.from('startups').select('*').eq('id', user.id).single()
            const envKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY
            const baseUrl = import.meta.env.VITE_OPENAI_BASE_URL

            const finalCriteria = criteria && criteria.length > 0 
                ? criteria 
                : ["Technology sector startup", "Early or growth stage", "Scalable business model"]

            // 1. Get Preliminary Match Score first
            const prelimResult = await checkEligibility(startupData, finalCriteria, envKey, baseUrl)
            
            // 2. Use reasoning to discover missing info more accurately
            const missing = await identifyMissingEligibilityData(startupData, finalCriteria, envKey, baseUrl, prelimResult.reasoning)

            setEligibilityResult(prelimResult)
            setDynamicQuestions(missing || [])
            setPendingStartupData(startupData)
            setPendingCriteria(finalCriteria)
            setMcqAnswers({})
            setEligibilityModalMode('result')
            setShowImprovementMCQ(false)

        } catch (error: any) {
            console.error(error)
            toast(`Failed to check eligibility: ${error.message || 'Unknown error'}`, "error")
            setIsEligibilityModalOpen(false)
        } finally {
            setIsCheckingEligibility(false)
        }
    }

    const handleMcqSubmit = async () => {
        setEligibilityModalMode('loading')
        try {
            // Merge MCQ answers into startup data
            const mergedData = { ...(pendingStartupData || {}), ...mcqAnswers }
            const envKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY
            const baseUrl = import.meta.env.VITE_OPENAI_BASE_URL
            const res = await checkEligibility(mergedData, pendingCriteria, envKey, baseUrl)
            
            setEligibilityResult(res)
            setEligibilityModalMode('result')
            setShowImprovementMCQ(false)
            toast("Match score updated with new information!", "success")
        } catch (error: any) {
            console.error(error)
            toast(`AI refinement failed: ${error.message || 'Unknown error'}`, "error")
            setEligibilityModalMode('result')
        }
    }


    if (!investor) return null

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="flex-none px-6 pt-6 pb-4 border-b border-gray-50">
                <div className="flex items-start justify-between mt-2">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-full bg-gray-50 overflow-hidden ring-1 ring-gray-100 shadow-sm">
                            <Avatar
                                src={investor.avatar}
                                name={investor.name}
                                fallbackClassName="text-2xl text-gray-500"
                            />
                        </div>
                        <div>
                            {!(investor.investor_type === 'vc' || investor.investor_type === 'grant' || investor.investor_type === 'accelerator' || investor.investor_type === 'direct') ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-bold">{investor.name}</h2>
                                        {investor.last_active_at && (
                                            <span className="flex items-center gap-1 font-bold text-[10px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Active {(() => {
                                                    const diff = Date.now() - new Date(investor.last_active_at).getTime()
                                                    const minutes = Math.floor(diff / 60000)
                                                    if (minutes < 5) return 'now'
                                                    if (minutes < 60) return `${minutes}m ago`
                                                    const hours = Math.floor(minutes / 60)
                                                    if (hours < 24) return `${hours}h ago`
                                                    return `${Math.floor(hours / 24)}d ago`
                                                })()}
                                            </span>
                                        )}
                                        {investor.grant_scheme && (
                                            <div className="mt-1">
                                                <p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block uppercase tracking-tight">
                                                    {investor.grant_scheme}
                                                </p>
                                            </div>
                                        )}
                                        {investor.verificationLevel && (
                                            <div className="shrink-0 flex items-center gap-2">
                                                {investor.investor_type === 'grant' && (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border-2 border-blue-200 shadow-sm">
                                                        <span className="text-sm">🏛️</span>
                                                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                                                            Gov Grant
                                                        </span>
                                                    </div>
                                                )}
                                                {investor.investor_type === 'vc' && (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border-2 border-purple-200 shadow-sm">
                                                        <span className="text-sm">🏢</span>
                                                        <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">
                                                            VC Firm
                                                        </span>
                                                    </div>
                                                )}
                                                {investor.investor_type === 'accelerator' && (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border-2 border-orange-200 shadow-sm">
                                                        <span className="text-sm">🚀</span>
                                                        <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">
                                                            Accelerator
                                                        </span>
                                                    </div>
                                                )}
                                                {investor.investor_type === 'direct' && (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border-2 border-emerald-200 shadow-sm">
                                                        <span className="text-sm">👤</span>
                                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                                            Direct Investor
                                                        </span>
                                                    </div>
                                                )}
                                                <VerificationBadge level={investor.verificationLevel} />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500">{(investor.investments || investor.investments_count || 0)} Portfolio Companies</span>
                                </>
                            ) : (
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black uppercase tracking-tight text-black">{investor.name}</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 rounded-full bg-black border border-black shadow-sm">
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                                {investor.investor_type === 'grant' ? 'Government Grant' :
                                                    investor.investor_type === 'vc' ? 'Venture Capital' :
                                                        investor.investor_type === 'accelerator' ? 'Accelerator Program' : 'Direct Investor'}
                                            </span>
                                        </div>
                                        <VerificationBadge level={investor.verificationLevel || (investor as any).verification_level || 'verified'} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {onResize && (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => onResize('minimized')} className="rounded-full hover:bg-gray-100 hidden lg:flex">
                                    <Minus className="h-4 w-4" />
                                </Button>
                                {currentSize === 'full' ? (
                                    <Button variant="ghost" size="icon" onClick={() => onResize('default')} className="rounded-full hover:bg-gray-100 hidden lg:flex">
                                        <Minimize2 className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="icon" onClick={() => onResize('full')} className="rounded-full hover:bg-gray-100 hidden lg:flex">
                                        <Maximize2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </>
                        )}
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24 custom-scrollbar">
                {!(investor.investor_type === 'vc' || investor.investor_type === 'grant' || investor.investor_type === 'accelerator' || investor.investor_type === 'direct') ? (
                    <>
                        {/* Bio Section */}
                        <section>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="bg-black text-white h-6 w-6 rounded-full flex items-center justify-center text-xs">i</span>
                                About
                            </h3>
                            <div className="p-4 rounded-2xl bg-gray-50">
                                <p className="text-gray-600 leading-relaxed">{investor.bio}</p>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 gap-6">
                            {/* Investment Preferences */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Target className="h-5 w-5 text-blue-600" />
                                        Investment Preferences
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Ticket Size</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                ${details.investment_preferences?.ticket_size_min?.toLocaleString() || '0'} - ${details.investment_preferences?.ticket_size_max?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Stage Focus</p>
                                            <div className="flex flex-wrap gap-1">
                                                {details.investment_preferences?.stage?.map(s => (
                                                    <span key={s} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-700">
                                                        {s}
                                                    </span>
                                                )) || <span className="text-gray-400 text-sm">Not specified</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Industry Focus</p>
                                        <div className="flex flex-wrap gap-2">
                                            {investor.expertise.map(ind => (
                                                <span key={ind} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-bold">
                                                    {ind}
                                                </span>
                                            ))}
                                            {investor.expertise.length === 0 && <span className="text-gray-400 text-sm">Not specified</span>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Decision Style */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-amber-500" />
                                        Decision & Engagement
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Decision Speed</p>
                                            <p className="font-semibold">{details.decision_process?.speed || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Due Diligence</p>
                                            <p className="font-semibold">{details.decision_process?.due_diligence || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Hands-on Level</p>
                                            <p className="font-semibold">{details.decision_process?.hands_on_level || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Follow-on?</p>
                                            <p className="font-semibold text-green-600">
                                                {details.decision_process?.follow_on ? 'Yes, interested' : 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Portfolio Intelligence */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-purple-600" />
                                        Portfolio Intelligence
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-4 bg-purple-50 rounded-xl">
                                            <p className="text-2xl font-black text-purple-700">{details.portfolio?.active_count || investor.investments || 0}</p>
                                            <p className="text-xs font-bold text-purple-400 uppercase">Active</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-xl">
                                            <p className="text-2xl font-black text-green-700">{details.portfolio?.exited_count || 0}</p>
                                            <p className="text-xs font-bold text-green-400 uppercase">Exits</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-lg font-bold text-gray-700">
                                                {details.portfolio?.average_check_size ? `$${details.portfolio.average_check_size.toLocaleString()}` : (investor.funds_available || investor.fundsAvailable || '-')}
                                            </p>
                                            <p className="text-xs font-bold text-gray-400 uppercase">Avg Check</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Value Add */}
                            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center justify-between text-white w-full">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-5 w-5 text-yellow-400" />
                                            Value Beyond Money
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(`/#/dashboard/investor/${investor.id}`, '_blank')}
                                            className="h-8 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 px-3 gap-1.5 rounded-full border border-white/10"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Visit Profile
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Network Access</p>
                                        <ul className="space-y-2">
                                            {details.value_add?.network?.map(net => (
                                                <li key={net} className="flex items-center gap-2 text-sm text-gray-300">
                                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                                    {net}
                                                </li>
                                            )) || <li className="text-gray-500 text-xs italic">No network details</li>}
                                        </ul>
                                    </div>

                                    {details.value_add?.has_founder_experience && (
                                        <div className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center">
                                                <Award className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Ex-Founder</p>
                                                <p className="text-xs text-gray-400">Understands the journey</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Admin-Added Disclaimer for Standard Profiles */}
                        {/* Admin-Added Disclaimer for Standard Profiles */}
                        {investor.is_admin_added && (
                            <div className="pt-8 border-t border-gray-100 pb-4 text-center">
                                <p className="text-[10px] text-gray-400 italic leading-relaxed max-w-lg mx-auto">
                                    Kasb.AI is an independent discovery platform. All trademarks, logos, and brand names belong to their respective owners. 
                                    Listings are for informational purposes only and do not imply affiliation, partnership, or endorsement unless explicitly stated.
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {(() => {
                            const scheme = investor.grant_scheme || investor.profile_details?.grant_scheme;

                            // Ensure arrays for mapped fields
                            const stages = ensureArray(investor.target_stages || investor.profile_details?.target_stages);
                            const sectors = ensureArray(investor.sector_focus || investor.profile_details?.sector_focus);
                            const geos = ensureArray(investor.geography_focus || investor.profile_details?.geography_focus);
                            const highlights = ensureArray(investor.portfolio_highlights || investor.profile_details?.portfolio_highlights);
                            const advantages = ensureArray(investor.grant_advantages || investor.profile_details?.grant_advantages);
                            
                            // Combine all available criteria for AI matching
                            const baseEligibility = [
                                ...ensureArray(investor.grant_eligibility || investor.profile_details?.grant_eligibility),
                                ...ensureArray(investor.eligibility_requirements || investor.profile_details?.eligibility_requirements)
                            ];
                            const eligibility = [
                                ...baseEligibility,
                                ...(stages.length > 0 ? [`Must be in one of the following stages: ${stages.join(', ')}`] : []),
                                ...(sectors.length > 0 ? [`Must operate in one of the following sectors: ${sectors.join(', ')}`] : []),
                                ...(geos.length > 0 ? [`Must be located in: ${geos.join(', ')}`] : []),
                                ...(investor.check_size_range ? [`Investment range: ${investor.check_size_range}`] : [])
                            ];

                            // Accelerator specific fields
                            const accType = investor.accelerator_type || investor.profile_details?.accelerator_type;
                            const cashInv = investor.cash_investment || investor.profile_details?.cash_investment;
                            const appStatus = investor.applications_status || investor.profile_details?.applications_status;
                            const appDeadline = investor.application_deadline || investor.profile_details?.application_deadline;
                            const progLoc = investor.program_location || investor.profile_details?.program_location;
                            const firstCheque = investor.first_cheque_friendly || investor.profile_details?.first_cheque_friendly;
                            const introStrength = investor.investor_intros_strength || investor.profile_details?.investor_intros_strength;
                            const fitScore = investor.founder_fit_score || investor.profile_details?.founder_fit_score;
                            const bestFor = investor.best_for || investor.profile_details?.best_for;
                            const duration = investor.program_duration || investor.profile_details?.program_duration;
                            const cohorts = investor.cohorts_per_year || investor.profile_details?.cohorts_per_year;
                            const relocation = investor.relocation_required || investor.profile_details?.relocation_required;
                            const followOn = investor.follow_on_funding || investor.profile_details?.follow_on_funding;
                            const nonDilutive = investor.non_dilutive_support || investor.profile_details?.non_dilutive_support;
                            const appDifficulty = investor.application_difficulty || investor.profile_details?.application_difficulty;
                            const acceptance = investor.acceptance_rate || investor.profile_details?.acceptance_rate;
                            const appReqs = investor.application_requirements || investor.profile_details?.application_requirements;
                            const process = investor.selection_process || investor.profile_details?.selection_process;
                            const decisionTime = investor.decision_time || investor.profile_details?.decision_time;
                            const mentorship = investor.mentorship_access || investor.profile_details?.mentorship_access;
                            const invAccess = investor.investor_access || investor.profile_details?.investor_access;
                            const postProg = investor.post_program_support || investor.profile_details?.post_program_support;
                            const perks = investor.startup_perks || investor.profile_details?.startup_perks;
                            const coreSupport = investor.core_support || investor.profile_details?.core_support;
                            const community = investor.founder_community || investor.profile_details?.founder_community;
                            const equity = investor.equity_taken || investor.profile_details?.equity_taken;
                            const hasDemoDay = investor.has_demo_day || investor.profile_details?.has_demo_day;

                            return (
                                <>
                                    {/* 1. Scheme Name (Top Box) */}
                                    {(scheme || investor.name) && (
                                        <div className="p-6 rounded-3xl bg-black text-white shadow-xl border border-black relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                                <Award className="h-24 w-24" />
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Scheme / Entity Name</p>
                                            <h3 className="text-xl font-black uppercase tracking-tight">{scheme || investor.name}</h3>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* 2. Investment Range */}
                                        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                                {investor.investor_type === 'accelerator' ? 'Investment Amount' :
                                                    investor.investor_type === 'grant' ? 'Grant Size Range' : 'Average Ticket Size'}
                                            </p>
                                            <p className="text-xl font-bold text-black">{investor.check_size_range || investor.fundsAvailable || 'Inquire for details'}</p>
                                        </div>

                                        {/* 3. Target Stages */}
                                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 shadow-sm">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Stages to Invest In</p>
                                            <div className="flex flex-wrap gap-2">
                                                {stages.map(s => (
                                                    <span key={s} className="px-3 py-1 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-black uppercase tracking-wider">
                                                        {s}
                                                    </span>
                                                ))}
                                                {stages.length === 0 && <span className="text-gray-400 text-xs font-medium">Not specified</span>}
                                            </div>
                                        </div>

                                        {/* 4. Sector Focus */}
                                        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sector Focus</p>
                                            <div className="flex flex-wrap gap-2">
                                                {sectors.map(s => (
                                                    <span key={s} className="px-3 py-1 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
                                                        {s}
                                                    </span>
                                                ))}
                                                {sectors.length === 0 && <span className="text-gray-400 text-xs font-medium">Generalist</span>}
                                            </div>
                                        </div>

                                        {/* 5. Geography Focus */}
                                        <div className="p-6 rounded-3xl bg-black text-white shadow-lg border border-black">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Geography Focus</p>
                                            <div className="flex flex-wrap gap-2">
                                                {geos.map(g => (
                                                    <span key={g} className="px-3 py-1 bg-white/10 border border-white/20 rounded-xl text-[10px] font-black text-white uppercase tracking-wider">
                                                        {g}
                                                    </span>
                                                ))}
                                                {geos.length === 0 && <span className="text-gray-500 text-xs font-medium">Global / Pan-India</span>}
                                            </div>
                                        </div>

                                        {/* 6. Portfolio Highlights */}
                                        <div className="md:col-span-2 p-6 rounded-3xl bg-gray-100 border border-gray-200 shadow-sm">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Portfolio Highlights</p>
                                            <div className="flex flex-wrap gap-2">
                                                {highlights.map(p => (
                                                    <span key={p} className="px-3 py-1 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-black uppercase tracking-wider">
                                                        {p}
                                                    </span>
                                                 ))}
                                                 {highlights.length === 0 && <span className="text-gray-400 text-xs font-medium">Confidential</span>}
                                             </div>
                                         </div>

                                         {/* Accelerator Specific: Program Overview */}
                                         {investor.investor_type === 'accelerator' && (
                                             <div className="md:col-span-2 p-6 rounded-3xl bg-white border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Program Overview</p>
                                                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                     <div className="space-y-1">
                                                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Type</p>
                                                         <p className="text-sm font-black text-black">{accType || 'Standard'}</p>
                                                     </div>
                                                     <div className="space-y-1">
                                                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Duration</p>
                                                         <p className="text-sm font-black text-black">{duration || 'Not specified'}</p>
                                                     </div>
                                                     <div className="space-y-1">
                                                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Location</p>
                                                         <p className="text-sm font-black text-black">{progLoc || 'Remote/Hybrid'}</p>
                                                     </div>
                                                     <div className="space-y-1">
                                                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Relocation</p>
                                                         <p className="text-sm font-black text-black">{relocation || 'No'}</p>
                                                     </div>
                                                     <div className="space-y-1">
                                                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Cohorts/Year</p>
                                                         <p className="text-sm font-black text-black">{cohorts || '1-2'}</p>
                                                     </div>
                                                     <div className="space-y-1">
                                                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Demo Day</p>
                                                         <p className="text-sm font-black text-black">{hasDemoDay ? 'Yes' : 'Varies'}</p>
                                                     </div>
                                                     <div className="space-y-1">
                                                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Status</p>
                                                         <p className={`text-sm font-black uppercase tracking-tight ${appStatus?.toLowerCase().includes('open') ? 'text-green-600' : 'text-gray-600'}`}>
                                                             {appStatus || 'Rolling'}
                                                         </p>
                                                     </div>
                                                     <div className="space-y-1 col-span-2">
                                                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Next Deadline</p>
                                                         <p className="text-sm font-black text-black">{appDeadline || 'Inquire for dates'}</p>
                                                     </div>
                                                 </div>
                                             </div>
                                         )}

                                         {/* Accelerator Specific: Economics & Fit */}
                                         {investor.investor_type === 'accelerator' && (
                                             <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                 <div className="p-6 rounded-3xl bg-black text-white shadow-xl border border-black group overflow-hidden">
                                                     <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                                         <Landmark className="h-16 w-16" />
                                                     </div>
                                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Funding & Economics</p>
                                                     <div className="grid grid-cols-2 gap-y-4">
                                                         <div>
                                                             <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Cash Investment</p>
                                                             <p className="text-lg font-black text-white">{cashInv || 'Varies'}</p>
                                                         </div>
                                                         <div>
                                                             <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Equity Taken</p>
                                                             <p className="text-lg font-black text-white">{equity || 'None/Varies'}</p>
                                                         </div>
                                                         <div>
                                                             <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Follow-on</p>
                                                             <p className="text-sm font-bold text-white">{followOn || 'Not guaranteed'}</p>
                                                         </div>
                                                         <div>
                                                             <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Non-Dilutive</p>
                                                             <p className="text-sm font-bold text-white">{nonDilutive || 'N/A'}</p>
                                                         </div>
                                                         <div>
                                                             <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">First Cheque Friendly</p>
                                                             <p className="text-sm font-bold text-white">{firstCheque || 'Yes'}</p>
                                                         </div>
                                                     </div>
                                                 </div>

                                                 <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm relative overflow-hidden group">
                                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quality & Ratings</p>
                                                     <div className="grid grid-cols-2 gap-y-4">
                                                         <div>
                                                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Founder Fit</p>
                                                             <p className="text-2xl font-black text-black">{fitScore || '9.0/10'}</p>
                                                         </div>
                                                         <div>
                                                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Intro Strength</p>
                                                             <p className="text-lg font-black text-black">{introStrength || 'Strong'}</p>
                                                         </div>
                                                         <div className="col-span-2">
                                                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Best For</p>
                                                             <p className="text-xs font-bold text-gray-700 leading-tight">{bestFor || 'Scalable technology startups looking for mentorship and growth.'}</p>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>
                                         )}

                                         {/* Accelerator Specific: Admissions & Value */}
                                         {investor.investor_type === 'accelerator' && (
                                             <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                 <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 shadow-sm">
                                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Admissions & Process</p>
                                                     <div className="space-y-4">
                                                         <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                             <span className="text-[10px] font-bold text-gray-400 uppercase">Acceptance Rate</span>
                                                             <span className="text-sm font-black text-black">{acceptance || 'Competitive'}</span>
                                                         </div>
                                                         <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                             <span className="text-[10px] font-bold text-gray-400 uppercase">Difficulty</span>
                                                             <span className="text-sm font-black text-black">{appDifficulty || 'Standard'}</span>
                                                         </div>
                                                         <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                             <span className="text-[10px] font-bold text-gray-400 uppercase">Decision Time</span>
                                                             <span className="text-sm font-black text-black">{decisionTime || '2-4 weeks'}</span>
                                                         </div>
                                                         <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                                                             <span className="text-[10px] font-bold text-gray-400 uppercase">Process</span>
                                                             <span className="text-xs font-bold text-black">{process || 'Application -> Interview -> Cohort'}</span>
                                                         </div>
                                                         <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                                                             <span className="text-[10px] font-bold text-gray-400 uppercase">Requirements</span>
                                                             <span className="text-xs font-bold text-black">{appReqs || 'Deck, MVP, Tech-focus'}</span>
                                                         </div>
                                                     </div>
                                                 </div>

                                                 <div className="p-6 rounded-3xl bg-black text-white shadow-xl border border-black">
                                                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Founder Support</p>
                                                     <div className="space-y-4">
                                                         <div className="flex flex-wrap gap-2">
                                                             {[
                                                                 mentorship && 'Mentorship',
                                                                 invAccess && 'Investor Access',
                                                                 postProg && 'Post-Prog Support',
                                                                 coreSupport && 'Core Support',
                                                                 community && 'Community',
                                                                 perks && 'Perks'
                                                             ].filter(Boolean).map(tag => (
                                                                 <span key={tag} className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest">
                                                                     {tag}
                                                                 </span>
                                                             ))}
                                                             {(!mentorship && !invAccess && !postProg) && <span className="text-gray-500 text-xs">Full ecosystem support</span>}
                                                         </div>
                                                         <p className="text-[10px] text-gray-400 font-bold italic leading-tight">
                                                             "Our program offers deep-dive mentorship, warm introductions to top-tier VCs, and a lifelong founder community."
                                                         </p>
                                                     </div>
                                                 </div>
                                             </div>
                                         )}

                                        {/* 7. Advantages (Bullet Points) */}
                                        {advantages.length > 0 && (
                                            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Advantages & Benefits</p>
                                                <ul className="space-y-3">
                                                    {advantages.map((adv, idx) => (
                                                        <li key={idx} className="flex items-start gap-3">
                                                            <div className="h-5 w-5 rounded-full bg-black flex items-center justify-center shrink-0 mt-0.5">
                                                                <CheckCircle2 className="h-3 w-3 text-white" />
                                                            </div>
                                                            <p className="text-sm font-bold text-black leading-tight">{adv}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* 8. Eligibility (Bullet Points) */}
                                        {eligibility.length > 0 && (
                                            <div className="p-6 rounded-[2rem] bg-gray-900 text-white shadow-xl border border-gray-800">
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest m-0">Eligibility Criteria</p>
                                                </div>
                                                <ul className="space-y-4 mb-6">
                                                    {eligibility.map((crit, idx) => (
                                                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-300 font-bold">
                                                            <div className="h-2 w-2 rounded-full bg-white mt-1.5 shrink-0" />
                                                            {crit}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* 9. AI Eligibility Check */}
                                        {eligibility.length > 0 && (
                                            <div className="md:col-span-2 p-6 rounded-[2rem] bg-black text-white shadow-xl border border-gray-800">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <h4 className="text-lg font-black flex items-center gap-2 mb-1">
                                                            <Zap className="h-5 w-5 text-yellow-400" />
                                                            AI Eligibility Check
                                                        </h4>
                                                        <p className="text-xs text-gray-400 font-medium">Instantly analyze your startup profile against this investor's requirements.</p>
                                                    </div>
                                                    <Button 
                                                        onClick={() => handleCheckEligibility(eligibility)}
                                                        disabled={isCheckingEligibility}
                                                        className="w-full md:w-auto shrink-0 bg-white hover:bg-gray-200 text-black rounded-xl h-12 flex items-center justify-center gap-2 font-bold px-6 border-none shadow-lg"
                                                    >
                                                        {isCheckingEligibility ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                                                Checking Match...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Check Eligibility Match
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Eligibility Result Modal */}
                                        <Modal
                                            isOpen={isEligibilityModalOpen}
                                            onClose={() => setIsEligibilityModalOpen(false)}
                                            title={eligibilityModalMode === 'mcq' ? "Quick Info Check" : eligibilityModalMode === 'loading' ? "Analyzing..." : "AI Eligibility Match"}
                                        >
                                            {/* MCQ Mode */}
                                            {eligibilityModalMode === 'mcq' && (
                                                <div className="space-y-5">
                                                    <p className="text-sm text-gray-500 -mt-2">To give you an accurate match, please provide some additional details specifically for this investor's criteria:</p>
                                                    {dynamicQuestions.map((q) => (
                                                        <div key={q.field} className="space-y-2">
                                                            <p className="text-sm font-bold text-gray-800">{q.label}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                 {q.options.map((opt) => (
                                                                    <button
                                                                        key={opt}
                                                                        onClick={() => setMcqAnswers(prev => ({ ...prev, [q.field]: opt }))}
                                                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                                                                            mcqAnswers[q.field] === opt
                                                                                ? 'bg-black text-white border-black shadow-md scale-[1.03]'
                                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                                                        }`}
                                                                    >
                                                                        {opt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        onClick={handleMcqSubmit}
                                                        disabled={dynamicQuestions.some(q => !mcqAnswers[q.field])}
                                                        className="w-full mt-2 rounded-xl h-12"
                                                    >
                                                        Analyze My Eligibility
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Loading Mode */}
                                            {eligibilityModalMode === 'loading' && (
                                                <div className="flex flex-col items-center justify-center py-8 gap-4">
                                                    <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                                                    <p className="text-sm font-semibold text-gray-500">AI is reviewing your profile...</p>
                                                </div>
                                            )}

                                            {/* Result Mode */}
                                            {eligibilityModalMode === 'result' && eligibilityResult && (
                                                <div className="flex flex-col items-center justify-center p-4">
                                                    <div className="relative mb-6">
                                                        {eligibilityResult.percentage > 0 ? (
                                                            <div className={`flex items-center justify-center h-28 w-28 shrink-0 rounded-full font-black text-4xl shadow-xl ring-8 ring-offset-4 animate-in zoom-in duration-500 ${eligibilityResult.percentage >= 75 ? 'bg-green-500/10 text-green-500 ring-green-50/50' : eligibilityResult.percentage >= 40 ? 'bg-yellow-500/10 text-yellow-500 ring-yellow-50/50' : 'bg-red-500/10 text-red-500 ring-red-50/50'}`}>
                                                                {eligibilityResult.percentage}%
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center h-28 w-28 shrink-0 rounded-full bg-gray-100 text-gray-400 font-black text-2xl ring-8 ring-gray-50 ring-offset-4 shadow-sm">
                                                                ?
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-center w-full max-w-sm mb-6">
                                                        <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                                                            {Object.keys(mcqAnswers).length > 0 ? "Refined Match Score" : "Preliminary Match Score"}
                                                        </h3>
                                                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-medium text-gray-600 leading-relaxed shadow-inner italic">
                                                            "{eligibilityResult.reasoning}"
                                                        </div>
                                                    </div>
                                                    
                                                    {dynamicQuestions.length > 0 ? (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => setShowImprovementMCQ(!showImprovementMCQ)}
                                                                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 ${showImprovementMCQ ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-900 border border-gray-100 hover:bg-gray-100'}`}
                                                            >
                                                                <div className="flex items-center gap-2 text-left">
                                                                    <Zap className={`h-4 w-4 ${showImprovementMCQ ? 'text-yellow-400' : 'text-gray-400'}`} />
                                                                    <div>
                                                                        <p className="text-sm font-black uppercase tracking-tight">Refine Your Score</p>
                                                                        {!showImprovementMCQ && <p className="text-[10px] opacity-60">Answer {dynamicQuestions.length} questions to improve accuracy</p>}
                                                                    </div>
                                                                </div>
                                                                {showImprovementMCQ ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                            </Button>

                                                            {showImprovementMCQ && (
                                                                <div className="w-full mt-4 p-5 rounded-2xl bg-gray-50/50 border border-gray-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
                                                                    {dynamicQuestions.map((q) => (
                                                                        <div key={q.field} className="space-y-3">
                                                                            <p className="text-xs font-black text-black uppercase tracking-wide">{q.label}</p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {q.options.map((opt) => (
                                                                                    <button
                                                                                        key={opt}
                                                                                        onClick={() => setMcqAnswers(prev => ({ ...prev, [q.field]: opt }))}
                                                                                        className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all duration-200 ${
                                                                                            mcqAnswers[q.field] === opt
                                                                                                ? 'bg-black text-white border-black shadow-md scale-[1.05]'
                                                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black'
                                                                                        }`}
                                                                                    >
                                                                                        {opt}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                    <Button
                                                                        onClick={handleMcqSubmit}
                                                                        disabled={dynamicQuestions.some(q => !mcqAnswers[q.field])}
                                                                        className="w-full bg-black hover:bg-gray-900 text-white rounded-xl h-12 font-black uppercase tracking-widest text-xs shadow-xl disabled:opacity-30"
                                                                    >
                                                                        Recalculate Accurate Match
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Profile Analysis Definitive</p>
                                                            <p className="text-[10px] text-gray-400 font-medium">Your current profile provides enough information for this match score.</p>
                                                        </div>
                                                    )}
                                                    
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setIsEligibilityModalOpen(false)}
                                                        className="w-full mt-4 text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-widest"
                                                    >
                                                        Close Analysis
                                                    </Button>
                                                </div>
                                            )}
                                        </Modal>

                                        {/* official website CTA Note */}
                                        <div className="md:col-span-2 p-8 rounded-[2rem] bg-gray-100 text-black text-center border border-gray-200">
                                            <ExternalLink className="h-6 w-6 text-gray-400 mx-auto mb-3" />
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 italic">Institutional Support Portal</h4>
                                            <p className="text-gray-600 text-[10px] leading-relaxed max-w-[240px] mx-auto font-bold uppercase tracking-tight">
                                                Complete documentation and official application procedures are available via the portal below.
                                            </p>
                                        </div>
                                        
                                        {/* Disclaimer */}
                                        <div className="md:col-span-2 px-8 pb-4 text-center space-y-1">
                                            <p className="text-[8px] text-gray-400 italic leading-relaxed">
                                                *Kasb.AI is a discovery and matchmaking platform designed to help startups find investors, grants, and accelerator opportunities. While we strive to provide accurate information, Kasb.AI does not guarantee funding, selection, or outcomes. Users should conduct their own due diligence before applying or entering into any agreements.*
                                            </p>
                                            {investor.is_admin_added && (
                                                <p className="text-[8px] text-gray-400 italic leading-relaxed">
                                                    Kasb.AI is an independent discovery platform. All trademarks, logos, and brand names belong to their respective owners. 
                                                    Listings are for informational purposes only and do not imply affiliation, partnership, or endorsement unless explicitly stated.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>


            {/* Sticky Action Footer */}
            <div className="flex-none p-6 border-t border-gray-100 bg-white safe-area-bottom">
                {connStatus?.status === 'accepted' ? (
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="w-full rounded-2xl h-12 text-base border-2 border-red-200 text-red-600 hover:bg-red-50"
                    >
                        <UserMinus className="h-4 w-4 mr-2" />
                        {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                    </Button>
                ) : (connStatus?.status === 'pending' && connStatus.isIncoming) ? (
                    <div className="flex gap-3">
                        <Button
                            size="lg"
                            onClick={handleAccept}
                            disabled={isProcessing}
                            className="flex-1 rounded-2xl h-12 text-base bg-black text-white hover:bg-gray-800"
                        >
                            {isProcessing ? "Processing..." : "Accept Request"}
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={handleDecline}
                            disabled={isProcessing}
                            className="flex-1 rounded-2xl h-12 text-base border-2 border-gray-100 hover:bg-gray-50 text-gray-600"
                        >
                            Decline
                        </Button>
                    </div>
                ) : connStatus?.status === 'pending' ? (
                    <Button size="lg" disabled className="w-full rounded-2xl h-12 text-base bg-gray-100 text-gray-400">
                        Request Pending
                    </Button>
                ) : (investor.investor_type === 'vc' || investor.investor_type === 'grant' || investor.investor_type === 'accelerator' || investor.investor_type === 'direct') ? (
                    <Button
                        size="lg"
                        onClick={() => {
                            if (investor.website) {
                                const url = investor.website.startsWith('http') ? investor.website : `https://${investor.website}`;
                                window.open(url, '_blank', 'noopener,noreferrer');
                            } else {
                                alert('No official website provided for this firm.');
                            }
                        }}
                        className="w-full rounded-2xl h-12 text-base bg-black hover:bg-gray-800 text-white shadow-lg transition-all"
                    >
                        <Zap className="h-4 w-4 mr-2" />
                        Official Website
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="w-full rounded-2xl h-12 text-base"
                    >
                        {isConnecting ? "Connecting..." : "Connect with Investor"}
                    </Button>
                )}
            </div>
        </div>
    )
}

export function InvestorDetailModal(props: InvestorDetailProps) {
    return (
        <AnimatePresence>
            {props.investor && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={props.onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 h-[85vh] rounded-t-[2.5rem] bg-white shadow-2xl overflow-hidden flex flex-col lg:hidden"
                    >
                        <InvestorDetail {...props} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
