import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Users, TrendingUp, Activity, MessageSquare } from "lucide-react"

interface OverviewStats {
    totalStartups: number
    totalInvestors: number
    newSignupsThisWeek: number
    activeUsers: number
    totalMessages: number
}

interface AdminOverviewProps {
    stats: OverviewStats
}

export function AdminOverview({ stats }: AdminOverviewProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalStartups + stats.totalInvestors}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalStartups} Startups • {stats.totalInvestors} Investors
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Signups (7d)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.newSignupsThisWeek}</div>
                        <p className="text-xs text-muted-foreground">
                            Last 7 days
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Active in last 24h
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalMessages}</div>
                        <p className="text-xs text-muted-foreground">
                            Platform wide
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Placeholder for charts or lists */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-gray-500 text-center py-8">
                            Activity feed coming soon...
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="text-sm text-gray-500">
                                • Review pending documents
                            </div>
                            <div className="text-sm text-gray-500">
                                • Check flagged messages
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
