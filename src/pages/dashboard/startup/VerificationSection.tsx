import { useState, useEffect } from "react"
import { Card, CardContent } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Award, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { supabase } from "../../../lib/supabase"
import { getRequiredDocuments } from "../../../lib/documentUtils"

interface StartupProfileData {
    id: string
    stage: string
    verification_level: 'basic' | 'verified' | 'trusted'
    review_requested?: boolean
    email_verified: boolean
}

interface VerificationSectionProps {
    startup: StartupProfileData
    onRequestReview: () => void
}

export function VerificationSection({ startup, onRequestReview }: VerificationSectionProps) {
    const [checkingDocs, setCheckingDocs] = useState(true)
    const [missingDocs, setMissingDocs] = useState<number>(0)

    useEffect(() => {
        checkDocuments()
    }, [startup.id, startup.stage])

    const checkDocuments = async () => {
        try {
            const requirements = getRequiredDocuments(startup.stage).filter(d => d.required)

            const { data } = await supabase
                .from('startup_documents')
                .select('document_type, status')
                .eq('startup_id', startup.id)
                .eq('status', 'verified')

            const verifiedTypes = new Set(data?.map(d => d.document_type) || [])
            const missing = requirements.filter(req => !verifiedTypes.has(req.type)).length

            setMissingDocs(missing)
        } catch (error) {
            console.error("Error checking docs:", error)
        } finally {
            setCheckingDocs(false)
        }
    }

    const isEligible = startup.email_verified && missingDocs === 0

    return (
        <Card className="border-0 shadow-sm rounded-[2rem] bg-black text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Award className="h-32 w-32" />
            </div>
            <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Build Investor Trust</h3>
                        <p className="text-gray-400 max-w-md">
                            {startup.verification_level === 'basic'
                                ? "Complete your verification to appear in the investor feed and increase your chances of getting funded."
                                : startup.verification_level === 'verified'
                                    ? "You are verified! Apply for the 'Trusted' badge to gain maximum visibility and trust."
                                    : "You are a Trusted Partner. This is the highest level of verification on Kasb.AI."}
                        </p>

                        <div className="space-y-2 mt-4">
                            {!startup.email_verified && (
                                <div className="flex items-center gap-2 text-sm text-red-200 bg-red-900/30 px-3 py-2 rounded-lg border border-red-800/50">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    Verify your email address
                                </div>
                            )}

                            {missingDocs > 0 && (
                                <div className="flex items-center gap-2 text-sm text-amber-200 bg-amber-900/30 px-3 py-2 rounded-lg border border-amber-800/50">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    {checkingDocs ? "Checking documents..." : `Submit ${missingDocs} more required document${missingDocs === 1 ? '' : 's'}`}
                                </div>
                            )}

                            {isEligible && startup.verification_level === 'basic' && !startup.review_requested && (
                                <div className="flex items-center gap-2 text-sm text-emerald-200 bg-emerald-900/30 px-3 py-2 rounded-lg border border-emerald-800/50">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    Ready for review!
                                </div>
                            )}
                        </div>
                    </div>

                    {startup.verification_level !== 'trusted' && !startup.review_requested && (
                        <Button
                            onClick={onRequestReview}
                            disabled={!isEligible}
                            className={`rounded-2xl h-14 px-8 font-bold shadow-xl transition-all ${isEligible
                                ? "bg-white text-black hover:bg-gray-100 hover:scale-105"
                                : "bg-gray-800 text-gray-500 cursor-not-allowed"
                                }`}
                        >
                            {!isEligible ? "Complete Tasks to Request" : "Request Verification Review"}
                        </Button>
                    )}

                    {startup.review_requested && (
                        <div className="px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Review in Progress
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
