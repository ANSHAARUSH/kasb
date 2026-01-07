import { motion } from "framer-motion"
import { X, Trophy, DollarSign, Briefcase, Award } from "lucide-react"
import type { ComparisonResult } from "../../lib/ai"
import { Button } from "../ui/button"
import type { Investor } from "../../data/mockData"

interface InvestorComparisonViewProps {
    investor1: Investor
    investor2: Investor
    result: ComparisonResult
    onClose: () => void
}

export function InvestorComparisonView({ investor1, investor2, result, onClose }: InvestorComparisonViewProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b p-6 bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold">AI Investor Comparison</h2>
                        <p className="text-gray-500 text-sm">Powered by Gemini AI</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white">
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {/* Verdict Section */}
                    <div className="mb-8 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-6 border border-green-100">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl bg-white p-3 shadow-sm text-green-600">
                                <Trophy className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-green-900 mb-2">AI Verdict</h3>
                                <p className="text-green-800 leading-relaxed">{result.verdict}</p>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Investor 1 col */}
                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <img src={investor1.avatar} alt={investor1.name} className="h-16 w-16 rounded-full object-cover shadow-sm ring-1 ring-gray-100" />
                                <div>
                                    <h3 className="font-bold text-xl">{investor1.name}</h3>
                                    <p className="text-sm text-gray-500">{investor1.expertise.slice(0, 2).join(", ")}</p>
                                </div>
                            </div>
                            <div className="prose prose-sm text-gray-600">
                                {result.startup1Analysis}
                            </div>
                        </div>

                        {/* Investor 2 col */}
                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <img src={investor2.avatar} alt={investor2.name} className="h-16 w-16 rounded-full object-cover shadow-sm ring-1 ring-gray-100" />
                                <div>
                                    <h3 className="font-bold text-xl">{investor2.name}</h3>
                                    <p className="text-sm text-gray-500">{investor2.expertise.slice(0, 2).join(", ")}</p>
                                </div>
                            </div>
                            <div className="prose prose-sm text-gray-600">
                                {result.startup2Analysis}
                            </div>
                        </div>
                    </div>

                    {/* Feature Comparison */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold mb-4">Detailed Breakdown</h3>

                        <ComparisonRow
                            icon={<DollarSign className="h-5 w-5 text-green-500" />}
                            title="Funds Availability"
                            analysis={result.analysis?.funds || { winner: "N/A", reason: "Analysis not unavailable" }}
                            s1Name={investor1.name}
                            s2Name={investor2.name}
                        />
                        <ComparisonRow
                            icon={<Briefcase className="h-5 w-5 text-blue-500" />}
                            title="Expertise Match"
                            analysis={result.analysis?.expertise || { winner: "N/A", reason: "Analysis not unavailable" }}
                            s1Name={investor1.name}
                            s2Name={investor2.name}
                        />
                        <ComparisonRow
                            icon={<Award className="h-5 w-5 text-amber-500" />}
                            title="Track Record"
                            analysis={result.analysis?.track_record || { winner: "N/A", reason: "Analysis not unavailable" }}
                            s1Name={investor1.name}
                            s2Name={investor2.name}
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function ComparisonRow({ icon, title, analysis, s1Name, s2Name }: {
    icon: React.ReactNode,
    title: string,
    analysis: { winner: string, reason: string },
    s1Name: string,
    s2Name: string
}) {
    if (!analysis) return null; // Safety check

    const winnerIsLeft = analysis.winner.toLowerCase().includes(s1Name.toLowerCase());
    const winnerIsRight = analysis.winner.toLowerCase().includes(s2Name.toLowerCase());

    return (
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 p-4 rounded-xl border bg-gray-50/50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
                <div className="font-semibold">{title}</div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-gray-400">Winner:</span>
                    <span className={cn(
                        "font-bold text-sm px-2 py-0.5 rounded-full",
                        winnerIsLeft ? "bg-green-100 text-green-700" :
                            winnerIsRight ? "bg-green-100 text-green-700" : "bg-gray-200"
                    )}>
                        {analysis.winner}
                    </span>
                </div>
                <p className="text-sm text-gray-600">{analysis.reason}</p>
            </div>
        </div>
    )
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}
