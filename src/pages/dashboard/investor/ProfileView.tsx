import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { VerificationBadge } from "../../../components/ui/VerificationBadge"
import { Award } from "lucide-react"
import type { InvestorProfileData } from "../../../hooks/useInvestorProfile"
import { cn } from "../../../lib/utils"

interface ProfileViewProps {
    investor: InvestorProfileData
    onRequestReview: () => Promise<boolean>
}

export function ProfileView({ investor, onRequestReview }: ProfileViewProps) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    {investor.avatar ? (
                        <img src={investor.avatar} alt={investor.name} className="h-20 w-20 rounded-full object-cover bg-gray-100" />
                    ) : (
                        <div className="h-20 w-20 rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold">
                            {(investor.avatar && investor.avatar.length <= 2) ? investor.avatar : (investor.name?.[0]?.toUpperCase() || '?')}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-2xl">{investor.name}</CardTitle>
                            <VerificationBadge level={investor.verification_level} />
                        </div>
                        <p className="text-gray-500">{investor.title || 'Investor'}</p>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-xl font-bold">{investor.location || 'Not set'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-sm text-gray-500">Funds Available</p>
                        <p className="text-2xl font-bold text-green-600">{investor.funds_available || 'Not set'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-sm text-gray-500">Portfolio Size</p>
                        <p className="text-2xl font-bold">{investor.investments_count || 0} Companies</p>
                    </div>
                    {investor.bio && (
                        <div className="col-span-2 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <p className="text-sm text-gray-500">Bio</p>
                            <p className="text-base mt-2 leading-relaxed">{investor.bio}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>Verification Status</span>
                        <VerificationBadge level={investor.verification_level} showLabel />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50">
                        <div className="mt-1">
                            {investor.verification_level !== 'basic' ? (
                                <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                            ) : (
                                <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</div>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Basic Verification</p>
                            <p className="text-xs text-gray-500">Email confirmed.</p>
                        </div>
                        {investor.verification_level === 'basic' && !investor.review_requested && (
                            <div className="ml-auto">
                                <Button size="sm" onClick={onRequestReview} className="bg-black text-white rounded-lg text-xs font-bold">
                                    Request Review
                                </Button>
                            </div>
                        )}
                        {investor.review_requested && (
                            <div className="ml-auto px-3 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                                Review Pending
                            </div>
                        )}
                    </div>

                    <div className={cn("p-4 rounded-xl border transition-all",
                        investor.verification_level === 'verified' ? "bg-blue-50 border-blue-100" : "bg-white border-gray-100"
                    )}>
                        <h4 className="font-semibold text-sm mb-3">2. Identity Verification</h4>
                        <div className="text-sm">
                            {investor.verification_level !== 'basic' ? (
                                <p className="text-green-600 font-medium flex items-center gap-2">
                                    ✓ Verified with Adhaar Card {investor.adhaar_number && `(${investor.adhaar_number})`}
                                </p>
                            ) : (
                                <p className="text-gray-500 italic">Please upload your Adhaar Card for verification.</p>
                            )}
                        </div>
                    </div>

                    <div className={cn("p-4 rounded-xl border transition-all",
                        investor.verification_level === 'trusted' ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100"
                    )}>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            3. Trusted Partner Status
                            {investor.verification_level === 'trusted' && <Award className="h-4 w-4 text-amber-500" />}
                        </h4>
                        <p className="text-xs text-gray-500">
                            {investor.verification_level === 'trusted'
                                ? "You are a Trusted Partner."
                                : "Requires verified identity and manual review."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
