import { Card, CardContent } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Award } from "lucide-react"

interface StartupProfileData {
    verification_level: 'basic' | 'verified' | 'trusted'
    review_requested?: boolean
    email_verified: boolean
}

interface VerificationSectionProps {
    startup: StartupProfileData
    onRequestReview: () => void
}

export function VerificationSection({ startup, onRequestReview }: VerificationSectionProps) {
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

                        {!startup.email_verified && (
                            <div className="mt-4 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-200 text-sm">
                                ⚠️ Please verify your email to become visible in the investor feed.
                            </div>
                        )}
                    </div>

                    {startup.verification_level !== 'trusted' && !startup.review_requested && (
                        <Button
                            onClick={onRequestReview}
                            className="bg-white text-black hover:bg-gray-100 rounded-2xl h-14 px-8 font-bold shadow-xl transition-all hover:scale-105"
                        >
                            Request Verification Review
                        </Button>
                    )}

                    {startup.review_requested && (
                        <div className="px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold">
                            Review in Progress
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
