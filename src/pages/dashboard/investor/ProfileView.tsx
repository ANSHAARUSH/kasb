import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { VerificationBadge } from "../../../components/ui/VerificationBadge"
import { Award, Zap, Target, Briefcase, TrendingUp, MessageSquare, Globe, Linkedin, ShieldCheck, Clock, CheckCircle2 } from "lucide-react"
import type { InvestorProfileData } from "../../../hooks/useInvestorProfile"
import { Avatar } from "../../../components/ui/Avatar"
import { calculateImpactScore } from "../../../lib/scoring"
import { type Investor } from "../../../data/mockData"

interface ProfileViewProps {
    investor: InvestorProfileData
    onRequestReview?: () => Promise<boolean>
    readOnly?: boolean
}

export function ProfileView({ investor, onRequestReview, readOnly = false }: ProfileViewProps) {
    const details = investor.profile_details || {};

    return (
        <div className="space-y-6">
            {/* Header / Basic Info */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                    <div className="h-24 w-24 shrink-0 flex items-center justify-center rounded-full bg-gray-50 overflow-hidden ring-1 ring-gray-100 shadow-sm mx-auto sm:mx-0">
                        <Avatar
                            src={investor.avatar}
                            name={investor.name}
                            fallbackClassName="text-3xl text-gray-500"
                        />
                    </div>
                    <div className="space-y-2 w-full">
                        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-2">
                            <CardTitle className="text-3xl font-bold break-words max-w-full">{investor.name}</CardTitle>
                            <div className="shrink-0">
                                <VerificationBadge level={investor.verification_level} />
                            </div>
                        </div>
                        <p className="text-lg text-gray-500 font-medium break-words">{investor.title || 'Investor'}</p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-500 mt-2">
                            {investor.location && (
                                <span className="flex items-center gap-1">📍 {investor.location}</span>
                            )}
                            {details.social_proof?.investor_type && (
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold uppercase">{details.social_proof.investor_type}</span>
                            )}
                        </div>
                    </div>

                    {/* Impact Points Counter (Visible only in non-readOnly mode) */}
                    {!readOnly && (
                        <div className="shrink-0 flex items-center gap-4 px-6 py-4 bg-orange-50/50 rounded-3xl border border-orange-100 mt-4 sm:mt-0">
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
                    )}
                </CardHeader>
                <CardContent className="pt-6">
                    <p className="text-base leading-relaxed text-gray-700">{investor.bio || "No bio added yet."}</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Key Stats & decision */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Investment Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-600" />
                                Investment Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Ticket Size</p>
                                <p className="text-xl font-bold text-gray-900">
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
                            <div className="col-span-2">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Industry Focus</p>
                                <div className="flex flex-wrap gap-2">
                                    {details.investment_preferences?.industry_focus?.map(ind => (
                                        <span key={ind} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-bold">
                                            {ind}
                                        </span>
                                    )) || <span className="text-gray-400 text-sm">Not specified</span>}
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
                                    <p className="text-2xl font-black text-purple-700">{details.portfolio?.active_count || 0}</p>
                                    <p className="text-xs font-bold text-purple-400 uppercase">Active</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl">
                                    <p className="text-2xl font-black text-green-700">{details.portfolio?.exited_count || 0}</p>
                                    <p className="text-xs font-bold text-green-400 uppercase">Exits</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-lg font-bold text-gray-700">
                                        {details.portfolio?.average_check_size ? `$${details.portfolio.average_check_size.toLocaleString()}` : '-'}
                                    </p>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Avg Check</p>
                                </div>
                            </div>

                            {details.portfolio?.notable_investments && details.portfolio.notable_investments.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold mb-3">Notable Investments</p>
                                    <div className="flex flex-wrap gap-2">
                                        {details.portfolio.notable_investments.map(inv => (
                                            <div key={inv} className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 border border-gray-200">
                                                {inv}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Value Add & Verification */}
                <div className="space-y-6">
                    {/* Value Add */}
                    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-white">
                                <Award className="h-5 w-5 text-yellow-400" />
                                Value Beyond Money
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Expertise Areas</p>
                                <div className="flex flex-wrap gap-2">
                                    {details.value_add?.expertise?.map(exp => (
                                        <span key={exp} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs font-semibold text-white">
                                            {exp}
                                        </span>
                                    ))}
                                    {(!details.value_add?.expertise || details.value_add.expertise.length === 0) && (
                                        <span className="text-gray-500 text-sm italic">No expertise listed</span>
                                    )}
                                </div>
                            </div>

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

                    {/* Communication */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Communication
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm border-b pb-2">
                                <span className="text-gray-500">Response Time</span>
                                <span className="font-medium">{details.communication?.response_time || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b pb-2">
                                <span className="text-gray-500">Pitch Format</span>
                                <span className="font-medium">{details.communication?.pitch_format?.join(', ') || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Contact Mode</span>
                                <span className="font-medium">{details.communication?.contact_mode?.join(', ') || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Verification & Social */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                Verification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                {investor.verification_level !== 'basic' ? (
                                    <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                ) : (
                                    <div className="h-6 w-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-bold">
                                        {investor.verification_level === 'trusted' ? 'Trusted Partner' :
                                            investor.verification_level === 'verified' ? 'Identity Verified' : 'Basic Account'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {investor.verification_level === 'basic' ? 'Complete verification to build trust.' : ' Verified status active.'}
                                    </p>
                                </div>
                            </div>

                            {(details.social_proof?.website || details.social_proof?.linkedin) && (
                                <div className="flex gap-2 pt-2">
                                    {details.social_proof?.website && (
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(details.social_proof?.website, '_blank')}>
                                            <Globe className="h-3 w-3 mr-2" /> Website
                                        </Button>
                                    )}
                                    {details.social_proof?.linkedin && (
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(details.social_proof?.linkedin, '_blank')}>
                                            <Linkedin className="h-3 w-3 mr-2" /> LinkedIn
                                        </Button>
                                    )}
                                </div>
                            )}

                            {!readOnly && investor.verification_level === 'basic' && !investor.review_requested && onRequestReview && (
                                <Button onClick={onRequestReview} className="w-full mt-2 bg-black text-white">
                                    Request Verification
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
