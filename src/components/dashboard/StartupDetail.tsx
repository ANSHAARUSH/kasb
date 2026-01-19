import { motion, AnimatePresence } from "framer-motion"
import type { Startup } from "../../data/mockData"
import { X, GraduationCap, Briefcase, UserMinus, Maximize2, Minimize2, Minus, Sparkles, TrendingUp, BarChart3, Lock, ShieldCheck } from "lucide-react"
import { Button } from "../ui/button"
import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
    supabase,
    getConnectionStatus,
    disconnectConnection,
    sendConnectionRequest,
    getGlobalConfig,
    getUserSetting,
    trackProfileView,
    acceptConnectionRequest,
    declineConnectionRequest,
    type ConnectionStatus,
    hasInvestorBoosted,
    boostStartup,
    getStartupBoosts
} from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { calculateImpactScore } from "../../lib/scoring"
import { type Investor } from "../../data/mockData"
import { Input } from "../ui/input"
import { generateValuationInsights } from "../../lib/ai"
import { Avatar } from "../ui/Avatar"
import { QUESTIONNAIRE_CONFIG, DEFAULT_STAGE_CONFIG, type Section, type Question } from "../../lib/questionnaire"
import { cn, parseRevenue } from "../../lib/utils"
import { ValuationCalculator } from "./ValuationCalculator"

export type PanelSize = 'default' | 'full' | 'minimized'

interface StartupDetailProps {
    startup: Startup | null
    onClose: () => void
    onDisconnect?: () => void
    onResize?: (size: PanelSize) => void
    currentSize?: PanelSize
    triggerUpdate?: { startupId: string; timestamp: number } | null
    onConnectionChange?: (startupId: string) => void
}

export function StartupDetail({ startup, onClose, onDisconnect, onResize, currentSize = 'default', triggerUpdate, onConnectionChange }: StartupDetailProps) {
    const { user, role } = useAuth()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<'questions' | 'metrics'>('questions')
    const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null)
    const [isDisconnecting, setIsDisconnecting] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
    const [valuationInsights, setValuationInsights] = useState<string | null>(null)
    const [isGeneratingValuation, setIsGeneratingValuation] = useState(false)
    const [showLiteralAnswers, setShowLiteralAnswers] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [hasBoosted, setHasBoosted] = useState(false)
    const [isBoosting, setIsBoosting] = useState(false)
    const [boostAmount, setBoostAmount] = useState(50)
    const [investorBudget, setInvestorBudget] = useState(0)
    const [impactPoints, setImpactPoints] = useState(startup?.impactPoints || 0)
    const [prevStartupId, setPrevStartupId] = useState(startup?.id)

    if (startup?.id !== prevStartupId) {
        setPrevStartupId(startup?.id)
        setShowDisconnectConfirm(false)
        setValuationInsights(null)
        setIsGeneratingValuation(false)
        setIsProcessing(false)
        setShowLiteralAnswers(false)
        setConnStatus(null)
        if (startup) setImpactPoints(startup.impactPoints || 0)
    }

    const stageConfig = useMemo(() => {
        const stage = startup?.metrics.stage || 'Ideation'
        let config = QUESTIONNAIRE_CONFIG[stage]
        if (!config) {
            config = DEFAULT_STAGE_CONFIG
        }
        return config
    }, [startup?.metrics.stage])

    const answers = startup?.questionnaire || {}

    useEffect(() => {
        if (!user || !startup?.id) return

        async function checkStatus() {
            try {
                const [status, boosted, points] = await Promise.all([
                    getConnectionStatus(user!.id, startup!.id),
                    hasInvestorBoosted(user!.id, startup!.id),
                    getStartupBoosts(startup!.id)
                ])
                setConnStatus(status)
                setHasBoosted(boosted)

                // Calculate TOTAL impact points (Base + Boosts)
                const total = calculateImpactScore({
                    ...startup!,
                    communityBoosts: points
                }).total
                setImpactPoints(total)

                // Fetch budget if investor
                if (role === 'investor') {
                    const [
                        investorRes,
                        boostRes,
                        purchaseRes
                    ] = await Promise.all([
                        supabase.from('investors').select('*').eq('id', user!.id).single(),
                        supabase.from('investor_boosts').select('points_awarded').eq('investor_id', user!.id),
                        supabase.from('point_purchases').select('points').eq('investor_id', user!.id)
                    ])

                    if (investorRes.error) console.error('Investor fetch error:', investorRes.error)
                    if (boostRes.error) console.error('Boost fetch error:', boostRes.error)
                    if (purchaseRes.error) console.error('Purchase fetch error:', purchaseRes.error)

                    if (investorRes.data) {
                        const spent = boostRes.data?.reduce((sum: number, b: any) => sum + (b.points_awarded || 0), 0) || 0
                        const purchased = purchaseRes.data?.reduce((sum: number, p: any) => sum + (p.points || 0), 0) || 0
                        const totalEarned = calculateImpactScore({
                            ...investorRes.data,
                            fundsAvailable: investorRes.data.funds_available,
                            investments: investorRes.data.investments_count,
                            expertise: investorRes.data.expertise || []
                        } as Investor).total

                        const finalBudget = Math.max(0, totalEarned + purchased - spent)
                        console.log('Budget Calculation Success:', { totalEarned, purchased, spent, finalBudget })
                        setInvestorBudget(finalBudget)
                    }
                }
            } catch (err) {
                console.error('Critical error in checkStatus:', err)
            }
        }
        checkStatus()
    }, [user, startup?.id, triggerUpdate, role])

    const canView = subscriptionManager.canViewProfile(startup?.id) || connStatus?.status === 'accepted'

    useEffect(() => {
        if (startup?.id && canView && user) {
            // Create a unique key for this view session
            const viewKey = `view_${user.id}_${startup.id}`
            const hasTracked = sessionStorage.getItem(viewKey)

            if (!hasTracked) {
                subscriptionManager.trackView(startup.id)
                // Track in database for analytics (only once per session)
                trackProfileView(user.id, startup.id, 'Unknown')
                sessionStorage.setItem(viewKey, 'true')
            }
        }
    }, [startup?.id, canView, user])

    const handleConnect = async () => {
        if (!user || !startup) return

        if (!subscriptionManager.canContact()) {
            toast("Connection limit reached. Upgrade to connect with more startups!", "error")
            navigate('/dashboard/pricing')
            return
        }

        setIsConnecting(true)
        try {
            await sendConnectionRequest(user.id, startup.id)
            subscriptionManager.trackContact(startup.id)
            setConnStatus({ status: 'pending', isIncoming: false })
            onConnectionChange?.(startup.id)
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
            const status = await getConnectionStatus(user!.id, startup!.id)
            setConnStatus(status)
            onConnectionChange?.(startup!.id)
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
            onConnectionChange?.(startup!.id)
            toast("Connection declined", "info")
        } catch (error: any) {
            console.error(error)
            toast(`Failed to decline: ${error.message || 'Unknown error'}`, "error")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDisconnect = async () => {
        if (!user || !startup) return

        setIsDisconnecting(true)
        try {
            await disconnectConnection(user.id, startup.id)
            setConnStatus(null)
            toast("Connection removed", "info")
            onDisconnect?.()
            onConnectionChange?.(startup.id)
            onClose()
        } catch (error: any) {
            console.error(error)
            toast(`Failed to disconnect: ${error.message || 'Unknown error'}`, "error")
        } finally {
            setIsDisconnecting(false)
        }
    }

    const handleGenerateValuation = async () => {
        setIsGeneratingValuation(true)
        try {
            let apiKey = import.meta.env.VITE_GROQ_API_KEY
            if (!apiKey) apiKey = await getGlobalConfig('ai_api_key') || ''
            if (!apiKey && user) apiKey = await getUserSetting(user.id, 'ai_api_key') || ''

            if (!apiKey) {
                toast("AI features not configured.", "error")
                return
            }

            const insights = await generateValuationInsights(startup, apiKey)
            setValuationInsights(insights)
            toast("Valuation insights generated", "success")
        } catch (error: any) {
            console.error(error)
            toast(`Generation failed: ${error.message || 'Unknown error'}`, "error")
        } finally {
            setIsGeneratingValuation(false)
        }
    }

    const handleBoost = async () => {
        if (!user || !startup || role !== 'investor') return

        const currentTier = subscriptionManager.getTier()
        const isFreeTier = currentTier === 'explore'

        if (isFreeTier) {
            toast("Investor Basic plan required to boost startups.", "error")
            navigate('/dashboard/pricing')
            return
        }

        if (boostAmount <= 0) {
            toast("Please enter a valid amount of points.", "error")
            return
        }

        if (boostAmount > investorBudget) {
            toast(`Insufficient points! Your budget is ${investorBudget}.`, "error")
            return
        }

        setIsBoosting(true)
        try {
            await boostStartup(user.id, startup.id, boostAmount)
            setHasBoosted(true)
            setInvestorBudget(prev => prev - boostAmount)

            // Refresh impact points
            const boostCount = await getStartupBoosts(startup.id)
            const total = calculateImpactScore({
                ...startup,
                communityBoosts: boostCount
            }).total
            setImpactPoints(total)

            onConnectionChange?.(startup.id) // Trigger refresh in feed
            toast(`Startup boosted! +${boostAmount} Impact Points awarded.`, "success")
        } catch (error: any) {
            console.error(error)
            toast(error.message || "Failed to boost startup", "error")
        } finally {
            setIsBoosting(false)
        }
    }

    if (!startup) {
        return (
            <div className="hidden lg:flex h-full items-center justify-center text-gray-400 p-8 text-center border-l border-gray-200">
                <div>
                    <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                        <Briefcase className="h-8 w-8 text-gray-400" />
                    </div>
                    <p>Select a startup to view details</p>
                </div>
            </div>
        )
    }

    // Determine if we are on a large screen (panel mode) or small screen (modal mode)
    // For simplicity, we can reuse this component. Ideally, the parent controls the rendering mode.
    // However, to keep it clean, let's export the inner content as a separate component or just handle it here.
    // Given the request, let's treat the 'panel' usage by checking if it's being rendered inside the new layout.
    // But since this is a shared component, let's allow it to adapt or be clean.

    // Better approach: New Prop `isPanel`?
    // Let's assume the parent handles the layout. We just need to ensure this component RENDERS the content.
    // The previous implementation had fixed position and modal logic.
    // We will separate the Content from the Modal Wrapper.


    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="flex-none px-6 pt-6 pb-4 border-b border-gray-50">
                <div className="flex items-start justify-between mt-2">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
                            <Avatar
                                src={startup.logo}
                                name={startup.name}
                                fallbackClassName="text-2xl text-gray-500"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-bold">{startup.name}</h2>
                                <div className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-indigo-100">
                                    {startup.metrics.stage}
                                </div>
                            </div>
                            <span className="text-sm text-gray-500">{startup.industry || 'No industry set'} • {startup.metrics.valuation}</span>
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
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100 hidden lg:flex">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex mt-6 -mb-4">
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                            activeTab === 'questions' ? "border-black text-black" : "border-transparent text-gray-400"
                        )}
                    >
                        Stage Questions
                    </button>
                    <button
                        onClick={() => setActiveTab('metrics')}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                            activeTab === 'metrics' ? "border-black text-black" : "border-transparent text-gray-400"
                        )}
                    >
                        Metrics
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'questions' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Summary Section (Prioritized) */}
                        {startup.aiSummary ? (
                            <section className="bg-amber-50/50 rounded-3xl p-6 border border-amber-100 relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="h-4 w-4 text-amber-600" />
                                    <h3 className="text-xs font-bold text-amber-900 uppercase tracking-widest">
                                        {startup.summaryStatus === 'final' ? 'Professional Summary' : 'AI Draft Summary'}
                                    </h3>
                                </div>

                                <div className={cn(
                                    "text-sm text-gray-800 leading-relaxed whitespace-pre-line font-medium",
                                    !subscriptionManager.hasFeature('AI Startup Summaries') && "blur-sm select-none"
                                )}>
                                    {startup.aiSummary}
                                </div>

                                {!subscriptionManager.hasFeature('AI Startup Summaries') && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] p-6 text-center">
                                        <Lock className="h-6 w-6 text-amber-600 mb-2" />
                                        <p className="text-[10px] font-bold text-amber-900 uppercase tracking-widest">Premium Plan Required</p>
                                        <Button variant="outline" size="sm" className="mt-3 rounded-xl border-amber-200 text-amber-700 bg-white/80 h-8 text-[10px]" onClick={() => navigate('/dashboard/pricing')}>
                                            View Plans
                                        </Button>
                                    </div>
                                )}
                            </section>
                        ) : (
                            <section className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 text-center">
                                <Sparkles className="h-6 w-6 text-indigo-400 mx-auto mb-3" />
                                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-2">Summary Pending</h4>
                                <p className="text-indigo-800/60 text-xs leading-relaxed max-w-[200px] mx-auto font-medium">
                                    This startup is currently finalizing its AI-verified investor summary.
                                </p>
                            </section>
                        )}

                        {/* Founder Section (Identity) */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-500 h-5 w-5 rounded-full flex items-center justify-center text-[10px]">F</span>
                                Founder Profile
                            </h3>
                            <div className="flex items-start gap-4 p-5 rounded-[2rem] bg-gray-50 border border-gray-100">
                                <img src={startup.founder.avatar || null as any} alt={startup.founder.name} className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm" />
                                <div>
                                    <h4 className="font-bold text-sm">{startup.founder.name}</h4>
                                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{startup.founder.bio}</p>
                                    <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-500 font-medium">
                                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-gray-100">
                                            <GraduationCap className="h-3 w-3" /> {startup.founder.education}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-gray-100">
                                            <Briefcase className="h-3 w-3" /> {startup.founder.workHistory}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Literal Answers Toggle */}
                        <div className="pt-4">
                            {!showLiteralAnswers ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLiteralAnswers(true)}
                                    className="w-full rounded-2xl border-dashed border-2 text-gray-400 hover:text-black hover:bg-gray-50 h-14 font-bold text-xs uppercase tracking-widest"
                                >
                                    View literal answers supplied by founder
                                </Button>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Questionnaire Data</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowLiteralAnswers(false)}
                                            className="h-8 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 px-3"
                                        >
                                            Hide Details
                                        </Button>
                                    </div>

                                    {/* Problem & Description */}
                                    <section className="space-y-6">
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Problem Statement</h3>
                                            <p className="text-[15px] text-gray-900 leading-relaxed font-medium bg-white p-4 rounded-2xl border border-gray-50">
                                                {startup.problemSolving}
                                            </p>
                                        </div>

                                        {startup.description && (
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Solution Context</h3>
                                                <p className="text-[14px] text-gray-600 leading-relaxed bg-white p-4 rounded-2xl border border-gray-50">
                                                    {startup.description}
                                                </p>
                                            </div>
                                        )}
                                    </section>

                                    {/* Stage Specific Questions */}
                                    <section className="space-y-8">
                                        {stageConfig.map((section: Section) => {
                                            const sectionAnswers = answers[section.id] || {}
                                            const hasAnswers = section.questions.some((q: Question) => sectionAnswers[q.id])
                                            if (!hasAnswers) return null

                                            return (
                                                <div key={section.id} className="space-y-4">
                                                    <h4 className="text-[11px] font-bold text-black uppercase tracking-widest border-b border-gray-100 pb-2">
                                                        {section.title}
                                                    </h4>
                                                    <div className="grid gap-6">
                                                        {section.questions.map((q: Question) => {
                                                            const answer = sectionAnswers[q.id]
                                                            if (!answer) return null
                                                            return (
                                                                <div key={q.id} className={cn(
                                                                    "transition-all duration-300 rounded-2xl",
                                                                    q.id === 'funding_amount' ? "bg-indigo-50/50 p-6 border-2 border-indigo-100/50 shadow-sm ring-1 ring-indigo-50" : ""
                                                                )}>
                                                                    <div className="flex items-center justify-between mb-1.5">
                                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{q.label}</p>
                                                                        {q.id === 'funding_amount' && (
                                                                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100 shadow-xs">
                                                                                <Sparkles className="h-2.5 w-2.5" />
                                                                                Strategic Metric
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className={cn(
                                                                        "text-gray-900 whitespace-pre-line leading-relaxed text-[15px] font-medium",
                                                                        q.id === 'funding_amount' ? "text-indigo-900 text-lg" : ""
                                                                    )}>
                                                                        {answer}
                                                                    </p>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </section>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'metrics' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                                <TrendingUp className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Traction</p>
                                <p className="text-xl font-bold text-gray-900">{startup.metrics.traction}</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                                <BarChart3 className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valuation</p>
                                <p className="text-xl font-bold text-gray-900">{startup.metrics.valuation}</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-orange-50/50 border border-orange-100 text-center">
                                <Sparkles className="h-5 w-5 text-orange-600 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Impact Points</p>
                                <p className="text-xl font-bold text-orange-900">{impactPoints.toLocaleString()}</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                                <ShieldCheck className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stage</p>
                                <p className="text-xl font-bold text-gray-900">{startup.metrics.stage}</p>
                            </div>
                        </div>

                        {/* AI Valuation Insights */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Strategic Insights</h3>
                            {!valuationInsights ? (
                                <Button
                                    variant="outline"
                                    onClick={handleGenerateValuation}
                                    disabled={isGeneratingValuation}
                                    className="w-full rounded-[2rem] border-dashed border-2 hover:bg-gray-50 h-20 flex flex-col items-center justify-center gap-1"
                                >
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-indigo-600" />
                                        <span className="font-bold text-sm">
                                            {isGeneratingValuation ? "Analyzing Market Data..." : "Generate AI Valuation Insights"}
                                        </span>
                                    </div>
                                    {!subscriptionManager.hasFeature('AI Valuation Insights') && (
                                        <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded-full font-bold">UPGRADE REQUIRED</span>
                                    )}
                                </Button>
                            ) : (
                                <div className="p-8 rounded-[2rem] bg-gray-900 text-white animate-in zoom-in-95 duration-500 shadow-xl border border-gray-800">
                                    <div className="flex items-center gap-2 mb-4 text-indigo-400">
                                        <Sparkles className="h-4 w-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Market Valuation Analysis</span>
                                    </div>
                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-line leading-relaxed font-medium">
                                        {valuationInsights}
                                    </div>
                                    <p className="mt-6 text-[9px] text-gray-500 italic border-t border-gray-800 pt-4">
                                        * This is an AI-generated estimate based on provided metrics and typical sector multiples.
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* Valuation Calculator */}
                        <div className="mb-8">
                            <ValuationCalculator
                                initialRevenue={parseRevenue(startup.metrics.traction).toString()}
                                initialIndustry={startup.industry}
                                readOnly={role === 'investor'}
                            />
                        </div>

                        {/* Additional Metrics Placeholder */}
                        <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 text-center">
                            <BarChart3 className="h-6 w-6 text-indigo-400 mx-auto mb-3" />
                            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-2">Growth Charts</h4>
                            <p className="text-indigo-800/60 text-xs leading-relaxed max-w-[200px] mx-auto font-medium">
                                Visual traction charts and burn rate analysis will appear as the startup updates its monthly records.
                            </p>
                        </div>
                    </div>
                )}

                {startup.history && (
                    <section className="mt-8 px-1">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">History</h3>
                        <p className="text-sm text-gray-600 leading-relaxed font-sm">
                            {startup.history}
                        </p>
                    </section>
                )}

                {/* Investor Boost Section */}
                {role === 'investor' && (
                    <section className="mt-12 pt-8 border-t border-gray-100 mb-12">
                        <div className="bg-orange-50/50 rounded-[2.5rem] p-8 border border-orange-100 text-center relative overflow-hidden group/boost">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingUp className="h-24 w-24 text-orange-600 rotate-12" />
                            </div>

                            <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-4" />
                            <h3 className="text-sm font-bold text-orange-900 uppercase tracking-[0.2em] mb-2">Push this startup up</h3>
                            <p className="text-orange-800/60 text-xs leading-relaxed max-w-[240px] mx-auto font-medium mb-6">
                                Believe in this team? Award them Impact Points to help them climb the High Impact rankings.
                            </p>

                            <div className="flex flex-col items-center gap-4">
                                {hasBoosted && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/50 text-orange-600 rounded-full border border-orange-100 text-[10px] font-bold shadow-sm mb-2 animate-in fade-in slide-in-from-top-1">
                                        <Sparkles className="h-3 w-3" />
                                        You have previously boosted this team
                                    </div>
                                )}
                                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-bold text-orange-900/50 uppercase tracking-widest">Amount</span>
                                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Budget: {investorBudget}</span>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={boostAmount}
                                            onChange={(e) => setBoostAmount(parseInt(e.target.value) || 0)}
                                            className="bg-white/50 border-orange-200 focus:border-orange-500 rounded-2xl h-12 text-center font-bold text-orange-900"
                                            min={1}
                                            max={investorBudget}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-orange-400 uppercase">Pts</div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleBoost}
                                    disabled={isBoosting || boostAmount <= 0}
                                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 h-12 text-sm font-bold shadow-lg shadow-orange-200 transition-all hover:scale-105 active:scale-95 translate-y-0 w-full max-w-[200px]"
                                >
                                    {isBoosting ? "Boosting..." : hasBoosted ? "Boost Again" : "Award Impact Points"}
                                </Button>

                                {subscriptionManager.getTier() === 'explore' && (
                                    <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                        Partner or Pro Plan Required
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Upgrade Overlay for restricted profiles */}
            {!canView && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                    <div className="h-20 w-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-6">
                        <Lock className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Profile Locked</h3>
                    <p className="text-gray-500 max-w-xs mb-8">
                        You've reached your monthly profile view limit. Upgrade your plan to discover more opportunities.
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <Button size="lg" className="rounded-2xl h-12 text-base font-bold shadow-lg shadow-black/5" onClick={() => navigate('/dashboard/pricing')}>
                            View Plans
                        </Button>
                        <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-black hover:bg-transparent font-medium">
                            Maybe later
                        </Button>
                    </div>
                </div>
            )}

            {/* Sticky Action Footer */}
            <div className="flex-none p-6 border-t border-gray-100 bg-white">
                {connStatus?.status === 'accepted' ? (
                    showDisconnectConfirm ? (
                        <div className="flex gap-3 animate-in fade-in zoom-in-95 duration-200">
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => setShowDisconnectConfirm(false)}
                                className="flex-1 rounded-2xl h-12 text-base border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={handleDisconnect}
                                disabled={isDisconnecting}
                                className="flex-1 rounded-2xl h-12 text-base bg-red-50 border-2 border-red-500 text-red-600 hover:bg-red-100"
                            >
                                {isDisconnecting ? "Disconnecting..." : "Confirm"}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setShowDisconnectConfirm(true)}
                            disabled={isDisconnecting}
                            className="w-full rounded-2xl h-12 text-base border-2 border-red-200 text-red-600 hover:bg-red-50"
                        >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Disconnect
                        </Button>
                    )
                ) : (connStatus?.status === 'pending' && connStatus.isIncoming) ? (
                    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Button
                            size="lg"
                            onClick={handleAccept}
                            disabled={isProcessing}
                            className="flex-1 rounded-2xl h-12 text-base bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/5"
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
                ) : (
                    <Button
                        size="lg"
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="w-full rounded-2xl h-12 text-base"
                    >
                        {isConnecting ? "Connecting..." : "Connect with Founder"}
                    </Button>
                )}
            </div>
        </div>
    )
}

// Wrapper for Modal behavior if needed (legacy support or mobile specifics)
export function StartupDetailModal(props: StartupDetailProps) {
    return (
        <AnimatePresence>
            {props.startup && (
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
                        <div className="relative flex-none px-6 pt-6 pb-4 border-b border-gray-50">
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-gray-200" />
                            {/* Re-use Header logic or simplify */}
                            <div className="flex justify-end">
                                <Button variant="ghost" size="icon" onClick={props.onClose} className="rounded-full hover:bg-gray-100">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        <StartupDetail {...props} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
