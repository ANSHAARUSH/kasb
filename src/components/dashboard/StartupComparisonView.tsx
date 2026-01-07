import { motion } from "framer-motion"
import { X, Trophy, AlertTriangle, Target, TrendingUp } from "lucide-react"
import type { Startup } from "../../data/mockData"
import type { ComparisonResult } from "../../lib/ai"
import { Button } from "../ui/button"

interface StartupComparisonViewProps {
    startup1: Startup
    startup2: Startup
    result: ComparisonResult
    onClose: () => void
}

export function StartupComparisonView({ startup1, startup2, result, onClose }: StartupComparisonViewProps) {
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
                        <h2 className="text-2xl font-bold">AI Comparison Analysis</h2>
                        <p className="text-gray-500 text-sm">Powered by Gemini AI</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white">
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {/* Verdict Section */}
                    <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border border-indigo-100">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl bg-white p-3 shadow-sm text-indigo-600">
                                <Trophy className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-indigo-900 mb-2">AI Verdict</h3>
                                <p className="text-indigo-800 leading-relaxed">{result.verdict}</p>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Startup 1 col */}
                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-4xl">{startup1.logo}</div>
                                <div>
                                    <h3 className="font-bold text-xl">{startup1.name}</h3>
                                    <p className="text-sm text-gray-500">{startup1.metrics.stage}</p>
                                </div>
                            </div>
                            <div className="prose prose-sm text-gray-600">
                                {result.startup1Analysis}
                            </div>
                        </div>

                        {/* Startup 2 col */}
                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-4xl">{startup2.logo}</div>
                                <div>
                                    <h3 className="font-bold text-xl">{startup2.name}</h3>
                                    <p className="text-sm text-gray-500">{startup2.metrics.stage}</p>
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
                            icon={<Target className="h-5 w-5 text-blue-500" />}
                            title="Problem Solved"
                            analysis={result.analysis.problem}
                            s1Name={startup1.name}
                            s2Name={startup2.name}
                        />
                        <ComparisonRow
                            icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                            title="Market Potential"
                            analysis={result.analysis.market}
                            s1Name={startup1.name}
                            s2Name={startup2.name}
                        />
                        <ComparisonRow
                            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                            title="Risk Assessment"
                            analysis={result.analysis.risks}
                            s1Name={startup1.name}
                            s2Name={startup2.name}
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
    // Determine which side won (left or right) to highlight
    // A loose check for name inclusion
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
                        winnerIsLeft ? "bg-blue-100 text-blue-700" :
                            winnerIsRight ? "bg-blue-100 text-blue-700" : "bg-gray-200"
                    )}>
                        {analysis.winner}
                    </span>
                </div>
                <p className="text-sm text-gray-600">{analysis.reason}</p>
            </div>
        </div>
    )
}

// Helper for 'cn' if not imported
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}
