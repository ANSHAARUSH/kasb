import { useState, useEffect } from "react"
import { AlertCircle, Sparkles, ShieldCheck, ShieldAlert, Shield } from "lucide-react"
import { UNIVERSAL_DOCUMENTS, STAGE_SPECIFIC_LOGIC, normalizeStage } from "../../../data/startupChecklist"
import { getUserSetting, saveUserSetting } from "../../../lib/supabase"
import { useToast } from "../../../hooks/useToast"
import { DocumentUploadItem } from "../../../components/dashboard/DocumentUploadItem"
import { calculateTrustScore, detectRisks } from "../../../lib/documentIntelligence"

interface DocumentVerificationProps {
    startupId: string
    stage: string
    onAllMandatoryVerified?: () => void
}

export function DocumentVerification({ startupId, stage, onAllMandatoryVerified }: DocumentVerificationProps) {
    const { toast } = useToast()
    const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
    const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(true)

    const stageKey = normalizeStage(stage)
    const stageData = STAGE_SPECIFIC_LOGIC[stageKey]

    // Unified list for rendering categories
    const categories = [
        { title: "Universal (Required)", items: UNIVERSAL_DOCUMENTS },
        { title: `${stageKey} Stage Mandatory`, items: stageData.mandatory },
        { title: "Optional Trust Builders", items: stageData.optional }
    ]

    const mandatoryIds = [
        ...UNIVERSAL_DOCUMENTS.filter(d => d.isMandatory).map(d => d.id),
        ...stageData.mandatory.map(d => d.id)
    ]

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const status = await getUserSetting(startupId, 'checklist_status')
                if (status) {
                    const savedIds = JSON.parse(status)
                    setCompletedItems(new Set(savedIds))
                }
            } catch (err) {
                console.error("Error loading checklist status:", err)
            } finally {
                setLoading(false)
            }
        }
        loadStatus()
    }, [startupId, stage])

    useEffect(() => {
        if (loading) return

        const allMandatoryDone = mandatoryIds.every(id => completedItems.has(id))
        if (allMandatoryDone && mandatoryIds.length > 0) {
            onAllMandatoryVerified?.()
        }
    }, [completedItems, mandatoryIds, loading])

    const handleVerified = async (id: string, result: any) => {
        const newSet = new Set(completedItems)
        newSet.add(id)
        setCompletedItems(newSet)

        setAnalysisResults(prev => ({ ...prev, [id]: result }))

        await saveUserSetting(startupId, 'checklist_status', JSON.stringify(Array.from(newSet)))
        // We could also save analysis results specifically, but for now we keep in session
        toast("Document Verified!", "success")
    }

    if (loading) return <div className="p-8 text-center text-gray-400">Loading document checklist...</div>

    const trustScore = calculateTrustScore(stageKey as any, Object.values(analysisResults));
    const { level: riskLevel } = detectRisks(Array.from(completedItems), stageKey as any, Object.values(analysisResults).flatMap((r: any) => r.risk_signals || []));

    return (
        <section className="space-y-8 mt-12 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
            <header className="flex items-center justify-between border-b pb-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-indigo-500" />
                        Investor Readiness
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Verification for <span className="text-black font-bold uppercase">{stageKey}</span> stage</p>
                </div>

                <div className="flex items-center gap-8">
                    {/* Trust Score Indicator */}
                    <div className="text-center px-6 border-r border-gray-100">
                        <div className={cn(
                            "text-3xl font-black",
                            trustScore > 80 ? "text-emerald-500" : trustScore > 50 ? "text-amber-500" : "text-red-500"
                        )}>
                            {trustScore}%
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trust Score</div>
                    </div>

                    {/* Risk Level Indicator */}
                    <div className="text-center px-6 border-r border-gray-100">
                        <div className={cn(
                            "flex items-center gap-2 text-xl font-black",
                            riskLevel === 'Low' ? "text-emerald-500" : riskLevel === 'Medium' ? "text-amber-500" : "text-red-500"
                        )}>
                            {riskLevel === 'Low' ? <ShieldCheck className="h-5 w-5" /> : riskLevel === 'Medium' ? <Shield className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                            {riskLevel}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Risk Level</div>
                    </div>

                    <div className="text-right">
                        <div className="text-2xl font-black">
                            {completedItems.size}/{UNIVERSAL_DOCUMENTS.length + stageData.mandatory.length + stageData.optional.length}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Docs Uploaded</div>
                    </div>
                </div>
            </header>

            <div className="space-y-10">
                {categories.map((category) => (
                    <div key={category.title}>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{category.title}</h3>
                        <div className="grid gap-2">
                            {category.items.map((item) => (
                                <DocumentUploadItem
                                    key={item.id}
                                    item={item}
                                    stage={stageKey}
                                    isDone={completedItems.has(item.id)}
                                    onVerified={handleVerified}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed text-indigo-900 font-medium">
                        <span className="font-bold">AI Auto-Deployment:</span> Reach a **Trust Score &gt; 80%** and **Low Risk** to automatically list your startup on the investor discovery feed.
                    </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex items-start gap-4">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed text-emerald-900 font-medium">
                        <span className="font-bold">Verified Data Room:</span> All uploaded documents are automatically structured and encrypted for professional investor due-diligence.
                    </div>
                </div>
            </div>
        </section>
    )
}

import { cn } from "../../../lib/utils"
