import { motion, AnimatePresence } from "framer-motion"
import { X, TrendingUp, Globe, Building2, ExternalLink } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { StartupCard } from "./StartupCard"
import type { Startup } from "../../data/mockData"
import type { LucideIcon } from "lucide-react"
import type { StartupDB } from "../../types"
import { useNavigate } from "react-router-dom"

interface FieldDetailPanelProps {
    field: {
        title: string
        icon: LucideIcon
        desc: string
        color: string
        isAI?: boolean
        aiGrowthData?: { country: string; value: number; growth: string }[]
    } | null
    onClose: () => void
}

export function FieldDetailPanel({ field, onClose }: FieldDetailPanelProps) {
    const navigate = useNavigate()
    const [startups, setStartups] = useState<Startup[]>([])
    const [loading, setLoading] = useState(false)

    const handleViewAll = () => {
        if (!field) return
        onClose()
        navigate(`/dashboard/investor?industry=${encodeURIComponent(field.title)}`)
    }

    useEffect(() => {
        if (field) {
            const fetchStartups = async () => {
                setLoading(true)

                // Break down multi-keyword titles like "AI & SaaS" for better matching
                const searchTerms = field.title.split(/[&/]/).map(t => t.trim())

                let query = supabase.from('startups').select('*')

                // Build a combined ilike filter for any of the search terms
                if (searchTerms.length > 1) {
                    const filterStr = searchTerms.map(term => `industry.ilike.%${term}%`).join(',')
                    query = query.or(filterStr)
                } else {
                    query = query.ilike('industry', `%${field.title}%`)
                }

                // If no verified startups found, try finding unverified ones to avoid empty state
                const { data, error } = await query.limit(4)

                if (error) console.error('Fetch error:', error)

                if (data) {
                    const mappedData: Startup[] = (data as StartupDB[]).map(item => ({
                        id: item.id,
                        name: item.name,
                        logo: item.logo,
                        founder: {
                            name: item.founder_name,
                            avatar: item.founder_avatar || 'https://i.pravatar.cc/150',
                            bio: item.founder_bio || '',
                            education: item.founder_education || '',
                            workHistory: item.founder_work_history || ''
                        },
                        problemSolving: item.problem_solving || '',
                        description: item.description,
                        history: item.history || '',
                        metrics: {
                            valuation: item.valuation,
                            stage: item.stage,
                            traction: item.traction
                        },
                        tags: item.tags || [],
                        emailVerified: item.email_verified,
                        showInFeed: item.show_in_feed,
                        industry: item.industry || ''
                    }))
                    setStartups(mappedData)
                }
                setLoading(false)
            }
            fetchStartups()
        }
    }, [field])

    // Simplified dynamic data generation based on industry title
    const getIndustryGrowthData = (title: string) => {
        const seed = title.length
        return [
            { country: 'India', value: 70 + (seed % 25), growth: `+${20 + (seed % 15)}%` },
            { country: 'USA', value: 80 + (seed % 10), growth: `+${10 + (seed % 5)}%` },
            { country: 'Europe', value: 60 + (seed % 15), growth: `+${5 + (seed % 10)}%` },
            { country: 'SE Asia', value: 40 + (seed % 20), growth: `+${15 + (seed % 10)}%` },
        ]
    }

    const growthData = field?.isAI && field.aiGrowthData ? field.aiGrowthData : (field ? getIndustryGrowthData(field.title) : [])

    return (
        <AnimatePresence>
            {field && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[101] overflow-y-auto"
                    >
                        <div className="p-8 space-y-8">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl shadow-sm ${field.color}`}>
                                        <field.icon className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight">{field.title}</h2>
                                        <p className="text-gray-500 font-medium">Industry Definition & Market Trends</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full hover:bg-gray-100"
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>

                            {/* Definition Card */}
                            <Card className="border-0 bg-gray-50 rounded-[2rem]">
                                <CardContent className="p-8">
                                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-gray-400" />
                                        What is {field.title}?
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">
                                        {field.desc} This sector is witnessing rapid digital transformation,
                                        driven by emerging technologies and evolving consumer behavior in a post-digital world.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Market Insights / Graph Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-green-500" />
                                        Global Growth Trends
                                    </h3>
                                    <span className="text-sm font-bold text-gray-400">Values in billions ($)</span>
                                </div>

                                <div className="grid gap-4">
                                    {growthData.map((item: { country: string; value: number; growth: string }, i: number) => (
                                        <div key={item.country} className="space-y-2">
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="text-gray-600">{item.country}</span>
                                                <span className="text-black">{item.growth} growth</span>
                                            </div>
                                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.value}%` }}
                                                    transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
                                                    className={`h-full rounded-full ${item.country === 'India' ? 'bg-black' : 'bg-gray-400'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Relevant Startups Section */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-blue-500" />
                                        Top Startups in this Field
                                    </h3>
                                    <Button
                                        variant="link"
                                        className="text-black font-bold p-0"
                                        onClick={handleViewAll}
                                    >
                                        View all
                                        <ExternalLink className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>

                                {loading ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-48 rounded-[2rem] bg-gray-50 animate-pulse" />
                                        ))}
                                    </div>
                                ) : startups.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {startups.map(startup => (
                                            <div key={startup.id} className="scale-90 origin-top-left -mb-10">
                                                <StartupCard
                                                    startup={startup}
                                                    onClick={() => { }}
                                                    onDoubleClick={() => { }}
                                                    isSelected={false}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-100">
                                        <p className="text-gray-400 font-bold">No startups found in this sector yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
