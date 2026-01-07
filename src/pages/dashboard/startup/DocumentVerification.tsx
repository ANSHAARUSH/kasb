import { useState, useEffect } from "react"
import { AlertCircle, Sparkles } from "lucide-react"
import { STAGE_CHECKLISTS, type StartupStage } from "../../../data/startupChecklist"
import { getUserSetting, saveUserSetting } from "../../../lib/supabase"
import { useToast } from "../../../hooks/useToast"
import { DocumentUploadItem } from "../../../components/dashboard/DocumentUploadItem"

interface DocumentVerificationProps {
    startupId: string
    stage: string
    onAllMandatoryVerified?: () => void
}

export function DocumentVerification({ startupId, stage, onAllMandatoryVerified }: DocumentVerificationProps) {
    const { toast } = useToast()
    const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)

    const stageKey = (stage as StartupStage) || 'Ideation'
    const allCategories = STAGE_CHECKLISTS[stageKey] || STAGE_CHECKLISTS['Ideation']

    // Flatten mandatory items for progress tracking
    const mandatoryIds = allCategories.flatMap(cat =>
        cat.items.filter(i => i.isMandatory).map(i => i.id)
    )

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
    }, [startupId])

    useEffect(() => {
        if (loading) return

        const allMandatoryDone = mandatoryIds.every(id => completedItems.has(id))
        if (allMandatoryDone && mandatoryIds.length > 0) {
            onAllMandatoryVerified?.()
        }
    }, [completedItems, mandatoryIds, loading])

    const handleVerified = async (id: string) => {
        const newSet = new Set(completedItems)
        newSet.add(id)
        setCompletedItems(newSet)
        await saveUserSetting(startupId, 'checklist_status', JSON.stringify(Array.from(newSet)))
        toast("Document Verified!", "success")
    }

    if (loading) return <div className="p-8 text-center text-gray-400">Loading document checklist...</div>

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
                <div className="text-right">
                    <div className="text-2xl font-black">{completedItems.size}/{allCategories.reduce((acc, c) => acc + c.items.length, 0)}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Docs Verified</div>
                </div>
            </header>

            <div className="space-y-10">
                {allCategories.map((category) => (
                    <div key={category.title}>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{category.title}</h3>
                        <div className="grid gap-2">
                            {category.items.map((item) => (
                                <DocumentUploadItem
                                    key={item.id}
                                    item={item}
                                    isDone={completedItems.has(item.id)}
                                    onVerified={handleVerified}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-indigo-900 font-medium">
                    <span className="font-bold">AI Auto-Deployment:</span> Verify all mandatory documents to automatically list your startup on the investor discovery feed. No manual admin approval required.
                </div>
            </div>
        </section>
    )
}
