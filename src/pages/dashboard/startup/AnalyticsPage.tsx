import { useState, useEffect } from "react"
import {
    BarChart3,
    Users,
    Eye,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    Globe,
    Activity,
    CheckCircle2,
    Clock,
    XCircle,
    Sparkles,
    Bookmark
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { useAuth } from "../../../context/AuthContext"
import {
    getProfileViewsCount,
    getViewsTimeseries,
    getViewsGeography,
    getConnectionStats,
    getStartupBoosts,
    getRecentBoosts,
    getStartupSaveCount,
    getStartupProfile
} from "../../../lib/supabase"
import { calculateImpactScore } from "../../../lib/scoring"
import { motion } from "framer-motion"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"

export function AnalyticsPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        totalViews: 0,
        viewChange: 0,
        totalRequests: 0,
        requestsChange: 0,
        pendingRequests: 0,
        acceptedRequests: 0,
        rejectedRequests: 0,
        totalSaves: 0,
        impactPoints: 0
    })
    const [viewData, setViewData] = useState<any[]>([])
    const [geoData, setGeoData] = useState<any[]>([])
    const [recentBoosts, setRecentBoosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchAnalytics()
        }
    }, [user])

    const fetchAnalytics = async () => {
        if (!user) return

        try {
            // Fetch all analytics data in parallel
            const [viewsCount, timeseries, geography, connectionStats, saveCount, impactPoints, recentBoostsData, profileData] = await Promise.all([
                getProfileViewsCount(user.id),
                getViewsTimeseries(user.id, 7),
                getViewsGeography(user.id),
                getConnectionStats(user.id),
                getStartupSaveCount(user.id),
                getStartupBoosts(user.id),
                getRecentBoosts(user.id),
                getStartupProfile(user.id)
            ])

            // Calculate TOTAL impact points (Base + Boosts)
            let totalImpactScore = impactPoints
            if (profileData) {
                totalImpactScore = calculateImpactScore({
                    ...profileData,
                    communityBoosts: impactPoints,
                    problemSolving: profileData.problem_solving,
                    metrics: {
                        valuation: profileData.valuation,
                        stage: profileData.stage,
                        traction: profileData.traction
                    },
                    founder: {
                        name: profileData.founder_name,
                        avatar: profileData.founder_avatar,
                        bio: profileData.founder_bio,
                        education: '',
                        workHistory: ''
                    }
                } as any).total
            }

            // Calculate view change (mock calculation based on recent activity)
            const viewChange = viewsCount > 0 ? Math.min(Math.round((connectionStats.recentChange / viewsCount) * 100), 50) : 0

            setStats({
                totalViews: viewsCount,
                viewChange: viewChange,
                totalRequests: connectionStats.total,
                requestsChange: connectionStats.recentChange > 0 ? Math.round((connectionStats.recentChange / Math.max(connectionStats.total, 1)) * 100) : 0,
                pendingRequests: connectionStats.pending,
                acceptedRequests: connectionStats.accepted,
                rejectedRequests: connectionStats.rejected,
                totalSaves: saveCount,
                impactPoints: totalImpactScore
            })

            setViewData(timeseries.length > 0 ? timeseries : [
                { name: 'Mon', views: 0, interest: 0 },
                { name: 'Tue', views: 0, interest: 0 },
                { name: 'Wed', views: 0, interest: 0 },
                { name: 'Thu', views: 0, interest: 0 },
                { name: 'Fri', views: 0, interest: 0 },
                { name: 'Sat', views: 0, interest: 0 },
                { name: 'Sun', views: 0, interest: 0 },
            ])

            setGeoData(geography.length > 0 ? geography : [
                { country: 'No data yet', views: 0, percentage: 0 }
            ])

            setRecentBoosts(recentBoostsData)
        } catch (err) {
            console.error("Error fetching analytics:", err)
        } finally {
            setLoading(false)
        }
    }

    const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
        <Card className="border-gray-100 overflow-hidden relative">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {change !== undefined && change !== 0 && (
                        <div className={`flex items-center text-xs font-bold ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                            {Math.abs(change)}%
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <h3 className="text-3xl font-bold mt-1">{value}</h3>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Icon className="h-16 w-16" />
                </div>
            </CardContent>
        </Card>
    )

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Startup Analytics</h2>
                <p className="text-gray-500 mt-1">Track your performance and investor interest in real-time.</p>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                    title="Investor Views"
                    value={stats.totalViews}
                    change={stats.viewChange}
                    icon={Eye}
                    color="bg-blue-500 text-blue-500"
                />
                <StatCard
                    title="Connection Requests"
                    value={stats.totalRequests}
                    change={stats.requestsChange}
                    icon={Users}
                    color="bg-indigo-500 text-indigo-500"
                />
                <StatCard
                    title="Active Discussions"
                    value={stats.acceptedRequests}
                    icon={Activity}
                    color="bg-emerald-500 text-emerald-500"
                />
                <StatCard
                    title="Investor Saves"
                    value={stats.totalSaves}
                    icon={Bookmark}
                    color="bg-amber-500 text-amber-500"
                />
                <StatCard
                    title="Impact Points"
                    value={stats.impactPoints.toLocaleString()}
                    icon={Sparkles}
                    color="bg-orange-500 text-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Views Chart */}
                <Card className="lg:col-span-2 border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Investor Engagement (Last 7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.totalViews === 0 ? (
                            <div className="h-[300px] flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <Eye className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No views yet</p>
                                    <p className="text-xs mt-1">Views will appear here once investors discover your profile</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={viewData}>
                                        <defs>
                                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                padding: '12px'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="views"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorViews)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="interest"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fill="transparent"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Connection Status Breakdown */}
                <Card className="border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Request Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-blue-500" />
                                    <span className="font-semibold text-sm">Pending</span>
                                </div>
                                <span className="font-bold">{stats.pendingRequests}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <span className="font-semibold text-sm">Accepted</span>
                                </div>
                                <span className="font-bold">{stats.acceptedRequests}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-red-50/50 border border-red-100">
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    <span className="font-semibold text-sm">Rejected</span>
                                </div>
                                <span className="font-bold">{stats.rejectedRequests}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Engagement Tips</h4>
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    💡 <strong>Tip:</strong> Startups with a complete "Cheat Sheet" see 3x more views.
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    🚀 <strong>Tip:</strong> Respond to connections within 24h for higher trust scores.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Geography / Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Visitor Geography
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-5">
                            {geoData.map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold">{item.country}</span>
                                        <span className="text-gray-500">{item.views} views</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.percentage}%` }}
                                            className="h-full bg-black"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Support History */}
                <Card className="border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-orange-500" />
                            Recent Support
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentBoosts.length === 0 ? (
                            <div className="py-8 text-center text-gray-400">
                                <p className="text-sm">No boosts received yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentBoosts.map((boost, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                                <TrendingUp className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">Investor Boost</p>
                                                <p className="text-[10px] text-gray-500">{new Date(boost.created_at).toLocaleDateString()} at {new Date(boost.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                        <div className="text-orange-600 font-bold text-sm">
                                            +{boost.points_awarded}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Profile Completion Hook */}
                <Card className="border-gray-100 bg-gray-50/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-sm mb-1">Update Financials</h4>
                            <p className="text-xs text-gray-500 mb-3">Investors are filtering for companies with updated Series A projections.</p>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-1/3" />
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-sm mb-1">Add Team Avatars</h4>
                            <p className="text-xs text-gray-500 mb-3">Profiles with human faces receive 45% higher click-through rates.</p>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-2/3" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
