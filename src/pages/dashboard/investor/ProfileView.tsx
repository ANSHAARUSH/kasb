import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { VerificationBadge } from "../../../components/ui/VerificationBadge"
import { Award } from "lucide-react"
import type { InvestorProfileData } from "../../../hooks/useInvestorProfile"
import { cn } from "../../../lib/utils"
import { Avatar } from "../../../components/ui/Avatar"
import { calculateImpactScore } from "../../../lib/scoring"
import { type Investor } from "../../../data/mockData"
import { TrendingUp } from "lucide-react"

interface ProfileViewProps {
    investor: InvestorProfileData
    onRequestReview: () => Promise<boolean>
}

export function ProfileView({ investor, onRequestReview }: ProfileViewProps) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                    <div className="h-20 w-20 shrink-0 flex items-center justify-center rounded-full bg-gray-50 overflow-hidden ring-1 ring-gray-100 shadow-sm mx-auto sm:mx-0">
                        <Avatar
                            src={investor.avatar}
                            name={investor.name}
                            fallbackClassName="text-2xl text-gray-500"
                        />
                    </div>
                    <div className="space-y-1 w-full">
                        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-2">
                            <CardTitle className="text-2xl break-words max-w-full">{investor.name}</CardTitle>
                            <div className="shrink-0">
                                <VerificationBadge level={investor.verification_level} />
                            </div>
                        </div>
                        <p className="text-gray-500 break-words">{investor.title || 'Investor'}</p>
                    </div>

                    {/* Impact Points Counter */}
                    <div className="shrink-0 flex items-center gap-4 px-6 py-4 bg-orange-50/50 rounded-3xl border border-orange-100">
                        <div className="h-10 w-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-orange-900 uppercase tracking-widest leading-none mb-1">Boosting Budget</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-orange-600">
                                    {Math.max(0, calculateImpactScore({
                                        ...investor,
                                        fundsAvailable: investor.funds_available,
                                        investments: investor.investments_count,
                                        expertise: investor.expertise || []
                                    } as Investor).total + (investor.purchasedPoints || 0) - (investor.spentPoints || 0))}
                                </span>
                                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Points</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 pt-6">
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-lg sm:text-xl font-bold">{investor.location || 'Not set'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-sm text-gray-500">Funds Available</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{investor.funds_available || 'Not set'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-sm text-gray-500">Portfolio Size</p>
                        <p className="text-2xl font-bold">{investor.investments_count || 0} Companies</p>
                    </div>
                    <div className="col-span-2 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <p className="text-sm text-gray-500">Bio</p>
                        <p className="text-base mt-2 leading-relaxed">{investor.bio}</p>
                    </div>
                    {investor.expertise && investor.expertise.length > 0 && (
                        <div className="col-span-2 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-3">Areas of Expertise</p>
                            <div className="flex flex-wrap gap-2">
                                {investor.expertise.map(exp => (
                                    <span key={exp} className="px-3 py-1 bg-white border border-gray-100 text-gray-600 rounded-full text-xs font-bold shadow-sm uppercase">
                                        {exp}
                                    </span>
                                ))}
                            </div>
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
                            <div className="ml-auto shrink-0">
                                <Button size="sm" onClick={onRequestReview} className="bg-black text-white rounded-lg text-xs font-bold px-2 py-1 h-auto">
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
                                <p className="text-gray-500 italic">Verification process is currently being updated.</p>
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
