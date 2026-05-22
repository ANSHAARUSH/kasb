import { useState } from "react"
import { DollarSign, TrendingUp, Users, Target, Rocket, Calculator, Sparkles, Lock } from "lucide-react"
import { Input } from "../ui/input"
import { Link } from "react-router-dom"
import { Button } from "../ui/button"
import { subscriptionManager } from "../../lib/subscriptionManager"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"

interface ValuationCalculatorProps {
    initialRevenue?: string
    initialIndustry?: string
    readOnly?: boolean
}

export function ValuationCalculator({ initialRevenue = "", initialIndustry = "SaaS", readOnly = false }: ValuationCalculatorProps) {
    const [method, setMethod] = useState<'revenue' | 'scorecard'>('revenue')
    const [revenue, setRevenue] = useState(initialRevenue)
    const [industry, setIndustry] = useState(initialIndustry)
    const [scorecard, setScorecard] = useState({
        baseValue: 2.0, // $M
        team: 0, // 0-125%
        market: 0,
        product: 0,
        traction: 0
    })

    const INDUSTRIES = {
        "SaaS": 10,
        "Fintech": 12,
        "E-commerce": 4,
        "HealthTech": 8,
        "EdTech": 6,
        "Marketplace": 7,
        "Hardware": 3,
        "Other": 5
    }

    const calculateRevenueValuation = () => {
        const rev = parseFloat(revenue.replace(/,/g, '')) || 0
        const multiplier = INDUSTRIES[industry as keyof typeof INDUSTRIES] || 5
        return (rev * multiplier)
    }

    const calculateScorecardValuation = () => {
        // Simple Berkeley Method adaptation
        // Base is ~2M. Each factor adds up to 500k-1M depending on strength.
        // Normalized: 0 = Weak, 1 = Strong
        // Let's us weighted add-ons.
        let val = scorecard.baseValue; // Base Pre-money
        val += (scorecard.team / 100) * 0.75; // Max add 0.75M for great team
        val += (scorecard.market / 100) * 0.50; // Max add 0.5M for huge market
        val += (scorecard.product / 100) * 0.50; // Max add 0.5M for product
        val += (scorecard.traction / 100) * 0.50; // Max add 0.5M for early traction
        return val * 1000000; // Convert to actual value
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val)
    }

    const valuation = method === 'revenue'
        ? calculateRevenueValuation()
        : calculateScorecardValuation()

    const hasPaidPlan = subscriptionManager.hasPaidPlan()

    return (
        <Card className="border border-gray-100 bg-white shadow-sm rounded-3xl overflow-hidden relative">
            {!hasPaidPlan && (
                <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 max-w-sm transform scale-100 transition-all hover:scale-105">
                        <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Unlock Valuation</h3>
                        <p className="text-gray-500 text-sm mb-6">Upgrade to Growth to calculate your startup's valuation using industry-standard models.</p>
                        <Link to="/dashboard/pricing">
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-bold shadow-lg shadow-indigo-200">Upgrade Now</Button>
                        </Link>
                    </div>
                </div>
            )}
            <CardHeader className="bg-gray-50/50 pb-8 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Calculator className="h-5 w-5 text-indigo-700" />
                            </div>
                            <CardTitle className="text-xl font-bold">Valuation Calculator</CardTitle>
                        </div>
                        <CardDescription>
                            Estimate your startup's value using industry-standard methods.
                            <span className="block mt-1 text-indigo-600 font-bold text-[10px] uppercase tracking-wider">
                                Powered and calculated by Kasb.AI
                            </span>
                        </CardDescription>
                    </div>
                    <div className="flex p-1 bg-white border border-gray-200 rounded-xl">
                        <button
                            onClick={() => !readOnly && setMethod('revenue')}
                            disabled={readOnly}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${method === 'revenue' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'} ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Post-Revenue
                        </button>
                        <button
                            onClick={() => !readOnly && setMethod('scorecard')}
                            disabled={readOnly}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${method === 'scorecard' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'} ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Pre-Revenue
                        </button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-8">
                <div className="flex flex-col gap-10">
                    {/* OUTPUT - Top Priority, Full Width */}
                    <div className="flex flex-col justify-center items-center bg-[#0B0F1A] text-white rounded-[2.5rem] p-10 text-center relative overflow-hidden shadow-2xl shadow-indigo-900/10">
                        <div className="absolute top-0 right-0 h-full w-1/2 bg-white/5 skew-x-[-20deg] translate-x-1/2"></div>

                        <div className="relative z-10 w-full space-y-3">
                            <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-[10px]">Estimated Valuation</p>
                            <h2 className={`font-black tracking-tighter text-white break-words leading-none ${valuation > 9999999 ? 'text-4xl md:text-6xl' : 'text-5xl md:text-7xl'}`}>
                                {formatCurrency(valuation)}
                            </h2>
                            <p className="text-sm text-gray-400 max-w-md mx-auto font-medium">
                                {method === 'revenue'
                                    ? `Based on ${industry} industry multiple of ${INDUSTRIES[industry as keyof typeof INDUSTRIES]}x`
                                    : "Based on weighted score of risk factors and assets"}
                            </p>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/10 w-full grid grid-cols-2 gap-8">
                            <div className="text-left md:text-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Calculation Method</p>
                                <p className="font-bold text-lg">{method === 'revenue' ? 'Revenue Multiple' : 'Scorecard'}</p>
                            </div>
                            <div className="text-right md:text-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Data Confidence</p>
                                <p className={`font-bold text-lg ${method === 'revenue' ? 'text-green-400' : 'text-yellow-400'}`}>{method === 'revenue' ? 'High' : 'Medium'}</p>
                            </div>
                        </div>
                    </div>

                    {/* INPUTS - Below the result */}
                    <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Adjust Parameters</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12">
                            {method === 'revenue' ? (
                                <>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Annual Revenue ($)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                                            <Input
                                                value={revenue}
                                                onChange={e => !readOnly && setRevenue(e.target.value)}
                                                disabled={readOnly}
                                                className="pl-12 h-14 text-xl font-bold rounded-2xl border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="100000"
                                                type="number"
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium">Enter your trailing 12-month revenue.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Industry Sector</label>
                                        <select
                                            value={industry}
                                            onChange={e => !readOnly && setIndustry(e.target.value)}
                                            disabled={readOnly}
                                            className={`w-full h-14 rounded-2xl border-gray-200 font-bold px-4 text-lg focus:ring-indigo-500 focus:border-indigo-500 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {Object.keys(INDUSTRIES).map(ind => (
                                                <option key={ind} value={ind}>{ind} (x{INDUSTRIES[ind as keyof typeof INDUSTRIES]})</option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-gray-400 font-medium">Multipliers based on public market comps.</p>
                                    </div>
                                </>
                            ) : (
                                <div className="md:col-span-2 space-y-10">
                                    <div className="p-5 bg-indigo-600 text-white rounded-2xl text-xs font-bold flex items-center gap-3">
                                        <Sparkles className="h-5 w-5" />
                                        <span>Adjust the risk/asset sliders below based on your startup's relative strength.</span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2"><Users className="h-3.5 w-3.5 text-indigo-500" /> Team Strength</label>
                                                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{scorecard.team}%</span>
                                            </div>
                                            <input type="range" min="0" max="100" value={scorecard.team} onChange={e => !readOnly && setScorecard(p => ({ ...p, team: parseInt(e.target.value) }))} disabled={readOnly} className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2"><Target className="h-3.5 w-3.5 text-indigo-500" /> Market Size</label>
                                                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{scorecard.market}%</span>
                                            </div>
                                            <input type="range" min="0" max="100" value={scorecard.market} onChange={e => !readOnly && setScorecard(p => ({ ...p, market: parseInt(e.target.value) }))} disabled={readOnly} className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2"><Rocket className="h-3.5 w-3.5 text-indigo-500" /> Product Readiness</label>
                                                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{scorecard.product}%</span>
                                            </div>
                                            <input type="range" min="0" max="100" value={scorecard.product} onChange={e => !readOnly && setScorecard(p => ({ ...p, product: parseInt(e.target.value) }))} disabled={readOnly} className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-indigo-500" /> Early Traction</label>
                                                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{scorecard.traction}%</span>
                                            </div>
                                            <input type="range" min="0" max="100" value={scorecard.traction} onChange={e => !readOnly && setScorecard(p => ({ ...p, traction: parseInt(e.target.value) }))} disabled={readOnly} className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
