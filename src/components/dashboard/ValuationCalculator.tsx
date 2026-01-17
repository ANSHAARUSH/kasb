import { useState } from "react"
import { DollarSign, TrendingUp, Users, Target, Rocket, Calculator } from "lucide-react"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"

export function ValuationCalculator() {
    const [method, setMethod] = useState<'revenue' | 'scorecard'>('revenue')
    const [revenue, setRevenue] = useState("")
    const [industry, setIndustry] = useState("SaaS")
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

    return (
        <Card className="border border-gray-100 bg-white shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 pb-8 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Calculator className="h-5 w-5 text-indigo-700" />
                            </div>
                            <CardTitle className="text-xl font-bold">Valuation Calculator</CardTitle>
                        </div>
                        <CardDescription>Estimate your startup's value using industry-standard methods.</CardDescription>
                    </div>
                    <div className="flex p-1 bg-white border border-gray-200 rounded-xl">
                        <button
                            onClick={() => setMethod('revenue')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${method === 'revenue' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Post-Revenue
                        </button>
                        <button
                            onClick={() => setMethod('scorecard')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${method === 'scorecard' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Pre-Revenue
                        </button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-12">
                    {/* INPUTS */}
                    <div className="space-y-6">
                        {method === 'revenue' ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Annual Revenue ($)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            value={revenue}
                                            onChange={e => setRevenue(e.target.value)}
                                            className="pl-9 h-12 text-lg font-bold rounded-xl"
                                            placeholder="100000"
                                            type="number"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">Enter your trailing 12-month revenue.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Industry</label>
                                    <select
                                        value={industry}
                                        onChange={e => setIndustry(e.target.value)}
                                        className="w-full h-12 rounded-xl border-gray-200 font-bold px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {Object.keys(INDUSTRIES).map(ind => (
                                            <option key={ind} value={ind}>{ind} (x{INDUSTRIES[ind as keyof typeof INDUSTRIES]})</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400">Multipliers based on public market comps.</p>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-xs font-medium mb-4">
                                    Adjust sliders based on strength relative to other startups at your stage.
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><Users className="h-3 w-3" /> Team Strength</label>
                                            <span className="text-xs font-bold text-indigo-600">{scorecard.team}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={scorecard.team} onChange={e => setScorecard(p => ({ ...p, team: parseInt(e.target.value) }))} className="w-full accent-indigo-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><Target className="h-3 w-3" /> Market Size</label>
                                            <span className="text-xs font-bold text-indigo-600">{scorecard.market}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={scorecard.market} onChange={e => setScorecard(p => ({ ...p, market: parseInt(e.target.value) }))} className="w-full accent-indigo-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><Rocket className="h-3 w-3" /> Product Readiness</label>
                                            <span className="text-xs font-bold text-indigo-600">{scorecard.product}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={scorecard.product} onChange={e => setScorecard(p => ({ ...p, product: parseInt(e.target.value) }))} className="w-full accent-indigo-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Early Traction</label>
                                            <span className="text-xs font-bold text-indigo-600">{scorecard.traction}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={scorecard.traction} onChange={e => setScorecard(p => ({ ...p, traction: parseInt(e.target.value) }))} className="w-full accent-indigo-600" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* OUTPUT */}
                    <div className="flex flex-col justify-center items-center bg-gray-900 text-white rounded-3xl p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-full w-1/2 bg-white/5 skew-x-[-20deg] translate-x-1/2"></div>

                        <div className="relative z-10 w-full space-y-2">
                            <p className="text-gray-400 font-medium uppercase tracking-widest text-xs">Estimated Valuation</p>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
                                {formatCurrency(valuation)}
                            </h2>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                {method === 'revenue'
                                    ? `Based on ${industry} industry multiple of ${INDUSTRIES[industry as keyof typeof INDUSTRIES]}x`
                                    : "Based on weighted score of risk factors and assets"}
                            </p>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-800 w-full grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Method</p>
                                <p className="font-bold">{method === 'revenue' ? 'Revenue Multiple' : 'Scorecard'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Confidence</p>
                                <p className="font-bold text-yellow-500">{method === 'revenue' ? 'High' : 'Medium'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
