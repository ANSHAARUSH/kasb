import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import type { LucideIcon } from "lucide-react"
import {
    BookOpen, Sprout, Coins, HeartPulse,
    Factory, ShoppingCart, Bot, Leaf, Gamepad2,
    Building2, Truck, Rocket
} from "lucide-react"
import { useState } from "react"
import { FieldDetailPanel } from "../../components/dashboard/FieldDetailPanel"
import { motion } from "framer-motion"
import { Input } from "../../components/ui/input"
import { Search, Loader2, Sparkles } from "lucide-react"
import { getIndustryInsights } from "../../lib/ai"
import { useToast } from "../../hooks/useToast"
import { useAuth } from "../../context/AuthContext"
import { getUserSetting, getGlobalConfig } from "../../lib/supabase"

const TOPICS = [
    {
        title: "EdTech",
        icon: BookOpen,
        desc: "Technology facilitating learning and improving performance.",
        color: "bg-blue-50 text-blue-600"
    },
    {
        title: "HealthTech",
        icon: HeartPulse,
        desc: "Tech enabled healthcare products, services, and pharmaceutical innovations.",
        color: "bg-red-50 text-red-600"
    },
    {
        title: "Manufacturing",
        icon: Factory,
        desc: "Modern industrial practices utilizing automation and data exchange.",
        color: "bg-slate-50 text-slate-600"
    },
    {
        title: "FinTech",
        icon: Coins,
        desc: "New tech that seeks to improve and automate financial services.",
        color: "bg-yellow-50 text-yellow-600"
    },
    {
        title: "E-commerce",
        icon: ShoppingCart,
        desc: "Commercial transactions conducted electronically on the Internet.",
        color: "bg-orange-50 text-orange-600"
    },
    {
        title: "AI & SaaS",
        icon: Bot,
        desc: "Artificial Intelligence and Software as a Service solutions.",
        color: "bg-purple-50 text-purple-600"
    },
    {
        title: "AgriTech",
        icon: Sprout,
        desc: "Technology in agriculture, horticulture, and food production efficiency.",
        color: "bg-green-50 text-green-600"
    },
    {
        title: "CleanTech",
        icon: Leaf,
        desc: "Processes to reduce negative environmental impacts and conserve energy.",
        color: "bg-emerald-50 text-emerald-600"
    },
    {
        title: "Media & Gaming",
        icon: Gamepad2,
        desc: "Interactive entertainment and digital media distribution.",
        color: "bg-pink-50 text-pink-600"
    },
    {
        title: "PropTech",
        icon: Building2,
        desc: "Technology for the real estate and property management industry.",
        color: "bg-cyan-50 text-cyan-600"
    },
    {
        title: "LogisticTech",
        icon: Truck,
        desc: "Optimizing supply chain and logistics operations through technology.",
        color: "bg-amber-50 text-amber-600"
    },
    {
        title: "ClimateTech",
        icon: Rocket,
        desc: "Technologies mitigating climate change and space exploration.",
        color: "bg-sky-50 text-sky-600"
    }
] as const

interface CheatSheetField {
    title: string
    icon: LucideIcon
    desc: string
    color: string
    isAI?: boolean
    aiGrowthData?: { country: string; value: number; growth: string }[]
}

export function CheatSheetPage() {
    const [selectedField, setSelectedField] = useState<CheatSheetField | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const { toast } = useToast()
    const { user } = useAuth()

    const handleAISearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setIsGenerating(true)
        try {
            let apiKey = import.meta.env.VITE_GROQ_API_KEY
            if (!apiKey) {
                const globalKey = await getGlobalConfig('ai_api_key')
                if (globalKey) apiKey = globalKey
            }
            if (!apiKey && user) {
                const storedKey = await getUserSetting(user.id, 'ai_api_key')
                if (storedKey) apiKey = storedKey
            }

            if (!apiKey) {
                toast("AI features are not setup. Please contact the administrator.", "error")
                return
            }

            const insight = await getIndustryInsights(searchQuery, apiKey)

            // Map IndustryInsight to Field structure for the Panel
            setSelectedField({
                title: insight.title,
                icon: Sparkles,
                desc: insight.desc,
                color: "bg-black text-white",
                isAI: true,
                aiGrowthData: insight.growthData
            })
            setSearchQuery("")
        } catch (error) {
            console.error("AI Error:", error)
            toast("Failed to generate insights for this industry.", "error")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tighter">Industry Cheat Sheet</h1>
                    <p className="text-gray-500 font-medium">Click on any sector to explore growth trends and active startups.</p>
                </div>

                <form onSubmit={handleAISearch} className="relative w-full md:w-96">
                    <div className="relative group">
                        <Input
                            placeholder="Ask about any other industry..."
                            className="h-14 pl-12 pr-12 rounded-2xl border-0 ring-1 ring-gray-100 shadow-lg focus:ring-2 focus:ring-black transition-all bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <button
                            type="submit"
                            disabled={isGenerating || !searchQuery.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                        >
                            {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {TOPICS.map((topic, i) => (
                    <motion.div
                        key={topic.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card
                            onClick={() => setSelectedField(topic)}
                            className="group cursor-pointer hover:shadow-2xl hover:scale-[1.02] border-0 ring-1 ring-gray-100 transition-all duration-300 rounded-[2.5rem] overflow-hidden bg-white"
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
                                    Explore Trends
                                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <FieldDetailPanel
                field={selectedField}
                onClose={() => setSelectedField(null)}
            />
        </div>
    )
}
