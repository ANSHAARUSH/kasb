import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { VerificationBadge } from "../../../components/ui/VerificationBadge"
import { VerificationSection } from "./VerificationSection"
import { DocumentVerification } from "./DocumentVerification"
import { useMemo } from "react"
import { Sparkles } from "lucide-react"
import { QUESTIONNAIRE_CONFIG, DEFAULT_STAGE_CONFIG } from "../../../lib/questionnaire"
import type { StartupProfileData } from "../../../hooks/useStartupProfile"

interface ProfileViewProps {
    startup: StartupProfileData
    onRequestReview: () => void
    onMarkAsLive: () => void
}

export function ProfileView({ startup, onRequestReview, onMarkAsLive }: ProfileViewProps) {
    const stageConfig = useMemo(() => {
        const stage = startup.stage || 'Idea / Pre-Seed'
        let config = QUESTIONNAIRE_CONFIG[stage]
        if (!config) {
            if (stage.includes('Seed')) config = QUESTIONNAIRE_CONFIG['MVP / Seed']
            else if (stage.includes('Series A')) config = QUESTIONNAIRE_CONFIG['Early Growth / Series A']
            else config = DEFAULT_STAGE_CONFIG
        }
        return config
    }, [startup.stage])

    const answers = startup.questionnaire || {}

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-sm overflow-hidden rounded-[2.5rem] bg-white">
                <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 flex items-center justify-center rounded-3xl bg-gray-50 text-4xl shadow-inner border border-gray-100 overflow-hidden font-bold text-gray-500">
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
                                            parent.className += ' font-bold text-4xl text-gray-500'
                                            parent.style.display = 'flex'
                                            parent.style.alignItems = 'center'
                                            parent.style.justifyContent = 'center'
                                        }
                                    }}
                                />
                            ) : (
                                <span>
                                    {startup.logo || (startup.name?.charAt(0).toUpperCase() || '?')}
                                </span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-3xl font-extrabold tracking-tight">{startup.name}</CardTitle>
                                <VerificationBadge level={startup.verification_level} />
                            </div>
                            <p className="text-gray-400 font-medium mt-1">{startup.industry || 'No industry set'}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-8">
                    {/* Investor Summary Section (For Founder Review) */}
                    {(startup.ai_summary) && (
                        <section className="bg-amber-50/50 -mx-8 px-8 py-10 border-y border-amber-100/50">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-amber-600" />
                                    <h3 className="text-lg font-bold text-amber-900">Professional Investor Summary</h3>
                                </div>
                                {startup.summary_status !== 'final' && (
                                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                        Draft - Review Required
                                    </span>
                                )}
                            </div>
                            <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-line font-medium text-[15px]">
                                {startup.ai_summary}
                            </div>
                        </section>
                    )}

                    {/* Integrated Description & Questionnaire */}
                    <section className="space-y-8 pt-4 border-t border-gray-50">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Startup Description</h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Problem Solving</p>
                                    <p className="text-gray-900 leading-relaxed font-semibold text-xl">
                                        {startup.problem_solving}
                                    </p>
                                </div>

                                {startup.description && (
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">About the Solution</p>
                                        <p className="text-gray-600 leading-relaxed italic border-l-2 border-gray-100 pl-4">
                                            {startup.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dynamics */}
                        <div className="space-y-10">
                            {stageConfig.map(section => {
                                const hasAnswers = section.questions.some(q => answers[section.id]?.[q.id])
                                if (!hasAnswers || section.id === 'basic_info') return null

                                return (
                                    <div key={section.id} className="space-y-4">
                                        <h4 className="text-sm font-bold text-black border-b border-gray-100 pb-2">{section.title}</h4>
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {section.questions.map(q => {
                                                const answer = answers[section.id]?.[q.id]
                                                if (!answer) return null
                                                return (
                                                    <div key={q.id} className={q.type === 'textarea' ? 'col-span-2' : ''}>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{q.label}</p>
                                                        <p className="text-gray-900 whitespace-pre-line leading-relaxed text-[15px]">{answer}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    {/* Standard Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                        <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 transition-all hover:shadow-md hover:scale-[1.02]">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Valuation</p>
                            <p className="text-xl font-extrabold text-black">{startup.valuation}</p>
                        </div>
                        <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 transition-all hover:shadow-md hover:scale-[1.02]">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Stage</p>
                            <p className="text-xl font-extrabold text-black">{startup.stage}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <VerificationSection startup={startup} onRequestReview={onRequestReview} />

            <DocumentVerification
                startupId={startup.id}
                stage={startup.stage}
                onAllMandatoryVerified={() => {
                    if (!startup.show_in_feed) {
                        onMarkAsLive()
                    }
                }}
            />
        </div>
    )
}
