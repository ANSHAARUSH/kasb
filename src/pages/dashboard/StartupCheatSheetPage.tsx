import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
    Sparkles, FileText, Calculator, BarChart3,
    Lightbulb, Gavel, ArrowRight, CheckCircle2
} from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/button"
import { X } from "lucide-react"

const FOUNDER_TOPICS = [
    {
        title: "Pitching Perfect",
        icon: Sparkles,
        desc: "Master the art of storytelling and slide design to capture investor interest.",
        color: "bg-indigo-50 text-indigo-600",
        details: {
            tips: [
                "Keep it under 10 slides for the first meeting.",
                "Start with the 'Why' - the problem you're solving.",
                "Use high-quality visuals over dense text."
            ],
            checklist: ["Problem Statement", "Solution", "Market Size", "Competition", "Team"]
        }
    },
    {
        title: "Term Sheet Basics",
        icon: FileText,
        desc: "Decoding equity, vesting, board rights, and liquidation preferences.",
        color: "bg-emerald-50 text-emerald-600",
        details: {
            tips: [
                "Understand the difference between pre-money and post-money valuation.",
                "Pay attention to 'Control' rights, not just 'Economic' ones.",
                "Standard vesting is usually 4 years with a 1-year cliff."
            ],
            checklist: ["Pre-money Val", "Vesting Schedule", "Board Seats", "Pro-rata Rights"]
        }
    },
    {
        title: "Startup Valuation",
        icon: Calculator,
        desc: "Proven frameworks to price your Seed and Series A funding rounds.",
        color: "bg-amber-50 text-amber-600",
        details: {
            tips: [
                "Use the 'Scorecard' method for pre-revenue startups.",
                "Runway vs. Milestone: Raise enough to reach your next clear goal.",
                "Don't optimize for the highest valuation; optimize for the best partner."
            ],
            checklist: ["Comparable Rounds", "Team Strength", "IP/Technology", "Market Adoption"]
        }
    },
    {
        title: "KPI Mastery",
        icon: BarChart3,
        desc: "The north star metrics like CAC, LTV, and Churn that every founder must track.",
        color: "bg-rose-50 text-rose-600",
        details: {
            tips: [
                "Focus on 'Active Users' over 'Total Downloads'.",
                "Measure your Unit Economics from Day 1.",
                "Clean data is critical for convincing institutional investors."
            ],
            checklist: ["Monthly Recurring Revenue", "Customer Acquisition Cost", "Lifetime Value", "Burn Rate"]
        }
    },
    {
        title: "Investor Psychology",
        icon: Lightbulb,
        desc: "Understanding what makes VCs tick and how to build lasting relationships.",
        color: "bg-sky-50 text-sky-600",
        details: {
            tips: [
                "Investors buy into people first, ideas second.",
                "Build 'Inertia' by providing regular updates before asking for money.",
                "Fear Of Missing Out (FOMO) is a real driver in venture rounds."
            ],
            checklist: ["Founder-Market Fit", "Vision Statement", "Coachability", "Speed of Execution"]
        }
    },
    {
        title: "Legal & Compliance",
        icon: Gavel,
        desc: "Setting up a clean cap table, IP protection, and company structure.",
        color: "bg-slate-50 text-slate-600",
        details: {
            tips: [
                "Fix your Cap Table early; mess is expensive later.",
                "Ensure all IP is legally owned by the company.",
                "Choose the right entity type for your long-term goals."
            ],
            checklist: ["Incorporation Docs", "IP Assignment", "Cap Table Management", "Bylaws"]
        }
    }
] as const

export function StartupCheatSheetPage() {
    const [selectedTopic, setSelectedTopic] = useState<typeof FOUNDER_TOPICS[number] | null>(null)

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-black">Founder's Cheat Sheet</h1>
                <p className="text-gray-500 font-medium text-lg">Essential guides to help you navigate the journey from seed to series A.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {FOUNDER_TOPICS.map((topic, i) => (
                    <motion.div
                        key={topic.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card
                            onClick={() => setSelectedTopic(topic)}
                            className="group cursor-pointer hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300 rounded-[2.5rem] overflow-hidden bg-white border-2 border-black/5 hover:border-black shadow-sm"
                        >
                            <CardHeader className="flex flex-row items-center gap-5 pb-2 p-8">
                                <div className={`rounded-2xl p-4 transition-transform group-hover:rotate-6 ${topic.color}`}>
                                    <topic.icon className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-2xl font-black tracking-tight">{topic.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8">
                                <p className="text-gray-500 font-medium leading-relaxed">{topic.desc}</p>
                                <div className="mt-6 flex items-center text-sm font-bold text-black border-t border-gray-50 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Essentials
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {selectedTopic && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTopic(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[101] overflow-y-auto"
                        >
                            <div className="p-8 space-y-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-2xl shadow-sm ${selectedTopic.color}`}>
                                            <selectedTopic.icon className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black tracking-tight">{selectedTopic.title}</h2>
                                            <p className="text-gray-500 font-medium">Founder Best Practices</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedTopic(null)}
                                        className="rounded-full hover:bg-gray-100"
                                    >
                                        <X className="h-6 w-6" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                                        Key Strategies
                                    </h3>
                                    <Card className="border-0 bg-gray-50 rounded-[2rem]">
                                        <CardContent className="p-8 space-y-4">
                                            {selectedTopic.details.tips.map((tip, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-xs font-black shadow-sm">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-gray-600 font-medium leading-relaxed italic">
                                                        "{tip}"
                                                    </p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        The Checklist
                                    </h3>
                                    <div className="grid gap-3">
                                        {selectedTopic.details.checklist.map((item) => (
                                            <div
                                                key={item}
                                                className="flex items-center gap-3 p-4 rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-black" />
                                                <span className="font-bold text-gray-700">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <Button
                                        onClick={() => setSelectedTopic(null)}
                                        className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:scale-[1.01] transition-transform shadow-xl"
                                    >
                                        Got it, thanks!
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
