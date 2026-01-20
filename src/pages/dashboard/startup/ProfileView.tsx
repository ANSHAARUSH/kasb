import { Card, CardContent } from "../../../components/ui/card"
import { VerificationBadge } from "../../../components/ui/VerificationBadge"
import { VerificationSection } from "./VerificationSection"
import { useMemo, useState, useEffect } from "react"
import { Sparkles, BarChart3, Info, TrendingUp, ShieldCheck, Pencil, Save, X, Loader2, FileText } from "lucide-react"
import { QUESTIONNAIRE_CONFIG, DEFAULT_STAGE_CONFIG } from "../../../lib/questionnaire"
import type { StartupProfileData } from "../../../hooks/useStartupProfile"
import { Avatar } from "../../../components/ui/Avatar"
import { cn, parseRevenue } from "../../../lib/utils"
import { getStartupBoosts } from "../../../lib/supabase"
import { useAuth } from "../../../context/AuthContext"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { generateInvestorSummary } from "../../../lib/ai"
import { useToast } from "../../../hooks/useToast"
import { COUNTRIES } from "../../../lib/locationData"
import { ValuationCalculator } from "../../../components/dashboard/ValuationCalculator"
import { calculateImpactScore } from "../../../lib/scoring"
import { DocumentsView } from "../../../components/dashboard/DocumentsView"
import type { Startup } from "../../../data/mockData"

interface ProfileViewProps {
    startup: StartupProfileData
    onRequestReview: () => void
    onMarkAsLive?: () => void
    onSave?: (data: Partial<StartupProfileData>) => Promise<boolean>
    saving?: boolean
}

export function ProfileView({ startup, onRequestReview, onSave, saving }: ProfileViewProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<'questions' | 'metrics' | 'documents'>('questions')
    const [isEditing, setIsEditing] = useState(false)
    const [localAnswers, setLocalAnswers] = useState<Record<string, Record<string, string>>>({})
    const [localStartup, setLocalStartup] = useState<Partial<StartupProfileData>>({})
    const [generatingSummary, setGeneratingSummary] = useState(false)

    const [stats, setStats] = useState({
        boosts: 0
    })

    const totalImpactPoints = useMemo(() => {
        if (!startup) return 0;
        return calculateImpactScore({
            ...startup,
            problemSolving: startup.problem_solving,
            metrics: {
                valuation: startup.valuation,
                stage: startup.stage,
                traction: startup.traction
            },
            founder: {
                name: startup.founder_name,
                avatar: startup.founder_avatar,
                bio: startup.founder_bio,
                education: '',
                workHistory: ''
            },
            tags: startup.tags || [],
            communityBoosts: stats.boosts
        } as any).total
    }, [startup, stats.boosts])

    useEffect(() => {
        if (startup) {
            setLocalStartup(startup)
            setLocalAnswers(startup.questionnaire || {})
        }
    }, [startup])

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return
            try {
                const boostCount = await getStartupBoosts(user.id)
                setStats({
                    boosts: boostCount
                })
            } catch (err) {
                console.error("Error fetching stats:", err)
            }
        }
        fetchStats()
    }, [user])

    const stageConfig = useMemo(() => {
        const stage = localStartup.stage || startup.stage || 'Ideation'
        let config = QUESTIONNAIRE_CONFIG[stage]
        if (!config) {
            config = DEFAULT_STAGE_CONFIG
        }
        return config
    }, [localStartup.stage, startup.stage])

    const handleAnswerChange = (sectionId: string, questionId: string, value: string) => {
        setLocalAnswers(prev => ({
            ...prev,
            [sectionId]: {
                ...prev[sectionId],
                [questionId]: value
            }
        }))
    }

    const handleSave = async () => {
        if (!onSave) return
        const success = await onSave({
            ...localStartup,
            questionnaire: localAnswers
        })
        if (success) {
            setIsEditing(false)
            toast("Answers saved", "success")
            // Automatically update AI summary after answers change
            handleGenerateSummary(true)
        }
    }

    const handleGenerateSummary = async (autoSave: boolean = false) => {
        setGeneratingSummary(true)
        try {
            // Only pass answers relevant to the current stage/config to avoid hallucination or mixing with old stage data
            const filteredAnswers: Record<string, Record<string, string>> = {}
            stageConfig.forEach(section => {
                const sectionAnswers = localAnswers[section.id]
                if (sectionAnswers) {
                    filteredAnswers[section.id] = {}
                    section.questions.forEach(q => {
                        if (sectionAnswers[q.id]) {
                            filteredAnswers[section.id][q.id] = sectionAnswers[q.id]
                        }
                    })
                }
            })

            const summary = await generateInvestorSummary(
                filteredAnswers,
                localStartup.stage || startup.stage || 'Ideation',
                import.meta.env.VITE_GROQ_API_KEY
            )
            const updatedData = {
                ...localStartup,
                ai_summary: summary,
                summary_status: 'draft' as const
            }
            setLocalStartup(updatedData)

            // If auto-saving after answer update, push to database
            if (autoSave && onSave) {
                await onSave(updatedData)
            }

            toast("AI summary updated", "success")
        } catch (err) {
            console.error(err)
            toast("Failed to update summary", "error")
        } finally {
            setGeneratingSummary(false)
        }
    }

    const tabs = [
        { id: 'questions' as const, label: 'Stage Questions', icon: Info },
        { id: 'metrics' as const, label: 'Metrics', icon: BarChart3 },
        { id: 'documents' as const, label: 'Documents', icon: FileText },
    ]

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0 space-y-8">
                    {/* Instagram Style Header */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-12 px-4 text-center sm:text-left">
                        <div className="relative group shrink-0">
                            <div className="h-24 w-24 sm:h-32 sm:w-32 flex items-center justify-center rounded-full bg-gray-50/50 border border-gray-100/50 overflow-hidden">
                                <Avatar
                                    src={startup.logo}
                                    name={startup.name}
                                    className="h-full w-full rounded-full"
                                    fallbackClassName="text-3xl text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 pt-2 w-full">
                            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 justify-center sm:justify-start">
                                <h1 className="text-2xl font-bold tracking-tight break-words max-w-full">{startup.name}</h1>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                                        {startup.stage || 'Ideation'}
                                    </div>
                                    <VerificationBadge level={startup.verification_level} />
                                </div>
                            </div>

                            {/* Integrated Bio & Founder Section */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="font-bold text-[15px] text-gray-900 break-words">{startup.industry || 'No industry set'}</p>
                                    <p className="text-gray-800 leading-relaxed font-medium text-sm break-words">
                                        {startup.problem_solving}
                                    </p>
                                    {startup.description && (
                                        <p className="text-gray-500 text-xs leading-relaxed max-w-xl mx-auto sm:mx-0 break-words">
                                            {startup.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 border-t border-gray-100/50">
                                    <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 shrink-0">
                                        <Avatar
                                            src={startup.founder_avatar}
                                            name={startup.founder_name}
                                            className="h-full w-full object-cover"
                                            fallbackClassName="text-xs text-gray-400"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Founded by</p>
                                        <p className="text-sm font-bold text-gray-900">{startup.founder_name || 'Founder'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex border-t border-gray-100 mt-8">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-all border-t-2 -mt-[2px]",
                                    activeTab === tab.id
                                        ? "border-black text-black"
                                        : "border-transparent text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-black" : "text-gray-400")} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="pt-4 px-4">
                        {activeTab === 'questions' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Instructional Banner (Mobile-Optimized) */}
                                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 mb-8">
                                    <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700 mb-2">
                                        <Sparkles className="h-4 w-4" />
                                        Important for Founders
                                    </h4>
                                    <p className="text-sm text-amber-900/80 leading-relaxed font-medium">
                                        Answer these questions as they will be displayed as the core description of your startup.
                                        You can further refine the generated AI summary after answering all questions.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <h3 className="text-xl font-extrabold tracking-tight">Stage Questions</h3>
                                    {!isEditing ? (
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 rounded-full px-4 text-[10px] font-bold uppercase tracking-widest border border-black/10 hover:bg-black/5"
                                        >
                                            <Pencil className="h-3 w-3 mr-2" />
                                            Edit Answers
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => {
                                                    setIsEditing(false)
                                                    setLocalAnswers(startup.questionnaire || {})
                                                    setLocalStartup(startup)
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 rounded-full px-4 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600"
                                            >
                                                <X className="h-3 w-3 mr-2" />
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSave}
                                                disabled={saving}
                                                size="sm"
                                                className="h-8 rounded-full px-6 text-[10px] font-bold uppercase tracking-widest bg-black text-white"
                                            >
                                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-2" />}
                                                Save
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {stageConfig.map(section => {
                                    const sectionAnswers = localAnswers[section.id] || {}
                                    const hasAnswers = section.questions.some(q => sectionAnswers[q.id])

                                    return (
                                        <div key={section.id} className="space-y-6">
                                            <div>
                                                <h4 className="text-xs font-bold text-black uppercase tracking-wider flex items-center justify-between">
                                                    {section.title}
                                                    {!isEditing && !hasAnswers && <span className="text-[10px] text-gray-400 font-normal italic">No answers provided</span>}
                                                </h4>
                                                {section.description && <p className="text-[11px] text-gray-500 mt-1">{section.description}</p>}
                                            </div>

                                            <div className="grid gap-8 md:grid-cols-2">
                                                {section.questions.map(q => {
                                                    const answer = sectionAnswers[q.id]
                                                    return (
                                                        <div key={q.id} className={cn(
                                                            "min-w-0 rounded-2xl transition-all duration-300",
                                                            q.type === 'textarea' ? 'col-span-2' : '',
                                                            q.id === 'funding_amount' ? 'bg-indigo-50/50 p-6 ring-1 ring-indigo-100 border-2 border-indigo-200 shadow-sm' : ''
                                                        )}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                    {q.label}
                                                                    {isEditing && q.required && <span className="text-red-500 ml-1">*</span>}
                                                                </label>
                                                                {q.id === 'funding_amount' && (
                                                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100 shadow-xs">
                                                                        <Sparkles className="h-2.5 w-2.5" />
                                                                        Strategic Metric
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {isEditing ? (
                                                                q.id === 'location' ? (
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <select
                                                                            className="w-full rounded-2xl border-gray-200 focus:border-black focus:ring-black p-3 text-base sm:text-sm font-medium"
                                                                            value={sectionAnswers[q.id]?.split(', ')[1] || ''}
                                                                            onChange={e => {
                                                                                const country = e.target.value
                                                                                const currentState = sectionAnswers[q.id]?.split(', ')[0] || ''
                                                                                handleAnswerChange(section.id, q.id, `${currentState}, ${country}`)
                                                                            }}
                                                                        >
                                                                            <option value="">Country...</option>
                                                                            {COUNTRIES.map(c => (
                                                                                <option key={c.name} value={c.name}>{c.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        <select
                                                                            className="w-full rounded-2xl border-gray-200 focus:border-black focus:ring-black p-3 text-base sm:text-sm font-medium"
                                                                            value={sectionAnswers[q.id]?.split(', ')[0] || ''}
                                                                            onChange={e => {
                                                                                const state = e.target.value
                                                                                const currentCountry = sectionAnswers[q.id]?.split(', ')[1] || ''
                                                                                handleAnswerChange(section.id, q.id, `${state}, ${currentCountry}`)
                                                                            }}
                                                                            disabled={!sectionAnswers[q.id]?.split(', ')[1]}
                                                                        >
                                                                            <option value="">State...</option>
                                                                            {COUNTRIES.find(c => c.name === sectionAnswers[q.id]?.split(', ')[1])?.states.map(s => (
                                                                                <option key={s} value={s}>{s}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                ) : q.type === 'textarea' ? (
                                                                    <textarea
                                                                        className="w-full rounded-2xl border-gray-200 focus:border-black focus:ring-black min-h-[120px] p-4 text-base sm:text-sm font-medium leading-relaxed bg-gray-50/30"
                                                                        value={sectionAnswers[q.id] || ''}
                                                                        onChange={e => handleAnswerChange(section.id, q.id, e.target.value)}
                                                                        placeholder={q.placeholder}
                                                                    />
                                                                ) : q.type === 'select' ? (
                                                                    <select
                                                                        className="w-full rounded-2xl border-gray-200 focus:border-black focus:ring-black p-4 text-base sm:text-sm font-bold bg-gray-50/30"
                                                                        value={sectionAnswers[q.id] || ''}
                                                                        onChange={e => handleAnswerChange(section.id, q.id, e.target.value)}
                                                                    >
                                                                        <option value="">Select...</option>
                                                                        {q.options?.map(opt => (
                                                                            <option key={opt} value={opt}>{opt}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <Input
                                                                        className="rounded-2xl border-gray-200 focus:border-black focus:ring-black h-12 font-medium"
                                                                        value={sectionAnswers[q.id] || ''}
                                                                        onChange={e => handleAnswerChange(section.id, q.id, e.target.value)}
                                                                        placeholder={q.placeholder}
                                                                        type={q.type}
                                                                    />
                                                                )
                                                            ) : (
                                                                <p className={cn(
                                                                    "leading-relaxed text-[15px] break-words",
                                                                    answer ? "text-gray-900 whitespace-pre-line font-medium" : "text-gray-300 italic"
                                                                )}>
                                                                    {answer || 'Not provided'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* AI Summary Section (Integrated) */}
                                <div className="pt-12 border-t border-gray-100 space-y-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-extrabold tracking-tight">Investor Summary</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                A professional narrative based on your answers.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => handleGenerateSummary()}
                                            disabled={generatingSummary || Object.keys(localAnswers).length === 0}
                                            className="bg-black text-white hover:bg-gray-800 rounded-full px-6 text-[10px] font-bold uppercase tracking-widest h-10"
                                        >
                                            {generatingSummary ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Sparkles className="h-4 w-4 mr-2" />
                                            )}
                                            {localStartup.ai_summary ? 'Regenerate Summary' : 'Generate Summary'}
                                        </Button>
                                    </div>

                                    {localStartup.ai_summary && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                            <textarea
                                                className="w-full rounded-3xl border-gray-200 focus:border-black focus:ring-black min-h-[300px] p-8 text-[15px] leading-relaxed shadow-sm font-medium bg-gray-50/50"
                                                value={localStartup.ai_summary || ''}
                                                onChange={e => setLocalStartup(prev => ({ ...prev, ai_summary: e.target.value, summary_status: 'draft' }))}
                                                placeholder="Review your AI-generated summary here..."
                                            />

                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant={localStartup.summary_status === 'final' ? 'default' : 'outline'}
                                                    onClick={() => setLocalStartup(prev => ({ ...prev, summary_status: 'final' }))}
                                                    className={cn(
                                                        "rounded-full text-[10px] font-bold uppercase tracking-widest px-6 h-10",
                                                        localStartup.summary_status === 'final' ? "bg-green-600 hover:bg-green-700 text-white border-transparent" : "border-gray-200 text-gray-500"
                                                    )}
                                                >
                                                    {localStartup.summary_status === 'final' ? 'Summary Finalized' : 'Mark as Final'}
                                                </Button>
                                                {localStartup.summary_status !== 'final' && (
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Summary is in draft mode</p>
                                                )}

                                                {isEditing === false && localStartup !== startup && (
                                                    <div className="ml-auto flex gap-2">
                                                        <Button
                                                            onClick={handleSave}
                                                            disabled={saving}
                                                            size="sm"
                                                            className="h-10 rounded-full px-8 text-[10px] font-bold uppercase tracking-widest bg-black text-white"
                                                        >
                                                            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                                                            Save All Changes
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'metrics' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                                        <TrendingUp className="h-5 w-5 text-indigo-600 mb-2" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Valuation</p>
                                        <p className="text-xl font-bold">{startup.valuation || 'Not Set'}</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600 mb-2" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Stage</p>
                                        <p className="text-xl font-bold">{startup.stage || 'Ideation'}</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                                        <TrendingUp className="h-5 w-5 text-amber-600 mb-2" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Traction</p>
                                        <p className="text-xl font-bold">{startup.traction || '0'}</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-orange-50/50 border border-orange-100">
                                        <Sparkles className="h-5 w-5 text-orange-600 mb-2" />
                                        <p className="text-[10px] font-bold text-orange-400 uppercase mb-1">Impact Points</p>
                                        <p className="text-xl font-bold">{totalImpactPoints.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Valuation Calculator */}
                                <ValuationCalculator
                                    initialRevenue={parseRevenue(startup.traction).toString()}
                                    initialIndustry={startup.industry}
                                    readOnly={false}
                                />

                                {/* KPI Placeholder */}
                                <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100">
                                    <h4 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" />
                                        Key Performance Indicators
                                    </h4>
                                    <p className="text-indigo-800/70 text-sm leading-relaxed">
                                        Detailed monthly traction, burn rate, and growth charts will be displayed here as you update your monthly metrics.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <DocumentsView
                                    startup={{
                                        ...startup,
                                        id: startup.id,
                                        name: startup.name,
                                        logo: startup.logo,
                                        metrics: {
                                            valuation: startup.valuation,
                                            stage: startup.stage,
                                            traction: startup.traction
                                        },
                                        founder: {
                                            name: startup.founder_name,
                                            avatar: startup.founder_avatar,
                                            bio: startup.founder_bio,
                                            education: '',
                                            workHistory: ''
                                        },
                                        problemSolving: startup.problem_solving,
                                        history: startup.history || '',
                                        tags: startup.tags || [],
                                        emailVerified: startup.email_verified,
                                        showInFeed: startup.show_in_feed,
                                        verificationLevel: startup.verification_level
                                    } as Startup}
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="pt-8 border-t border-gray-100">
                <VerificationSection startup={startup} onRequestReview={onRequestReview} />
            </div>
        </div>
    )
}
