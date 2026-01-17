import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getUserSetting(userId: string, key: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('user_settings')
        .select('value')
        .eq('user_id', userId)
        .eq('key', key)
        .single()

    if (error || !data) return null
    return data.value
}

export async function saveUserSetting(userId: string, key: string, value: string) {
    const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, key, value }, { onConflict: 'user_id,key' })

    if (error) throw error
}

export async function getGlobalConfig(key: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('global_config')
        .select('value')
        .eq('key', key)
        .single()

    if (error || !data) return null
    return data.value
}

export async function sendConnectionRequest(senderId: string, receiverId: string) {
    // Check if a connection already exists in either direction
    const { data: existing } = await supabase
        .from('connections')
        .select('id')
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .maybeSingle()

    if (existing) {
        // Delete existing one first because of RLS update restrictions 
        // (sender might not have update perms, but has delete perms)
        const { error: deleteError } = await supabase
            .from('connections')
            .delete()
            .eq('id', existing.id)

        if (deleteError) {
            console.error('Error clearing previous connection record:', deleteError)
        }
    }

    const { error } = await supabase
        .from('connections')
        .insert({
            sender_id: senderId,
            receiver_id: receiverId,
            status: 'pending'
        })

    if (error) {
        console.error('Failed to send connection request:', error)
        throw error
    }
}

export async function updateConnectionStatus(connectionId: string, status: 'accepted' | 'rejected') {
    const { error } = await supabase
        .from('connections')
        .update({ status })
        .eq('id', connectionId)

    if (error) throw error
}

export interface ConnectionStatus {
    status: 'pending' | 'accepted' | 'rejected'
    isIncoming: boolean
    connectionId?: string
    dealClosed?: boolean
    error?: any // Add error info if needed
}

export async function getConnectionStatus(userId1: string, userId2: string): Promise<ConnectionStatus | null> {
    try {
        const { data, error } = await supabase
            .from('connections')
            .select('id, status, sender_id, receiver_id, deal_closed')
            .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
            .maybeSingle() // Use maybeSingle to avoid errors on no rows

        if (error) {
            console.error('Error fetching connection status:', error)
            return null
        }

        if (!data) return null

        return {
            status: data.status,
            isIncoming: data.receiver_id === userId1,
            connectionId: data.id,
            dealClosed: data.deal_closed || false
        }
    } catch (err) {
        console.error('Unexpected error in getConnectionStatus:', err)
        return null
    }
}

export async function acceptConnectionRequest(connectionId: string) {
    const { error } = await supabase
        .from('connections')
        .update({
            status: 'accepted'
        })
        .eq('id', connectionId)

    if (error) {
        console.error('Failed to accept connection:', error)
        throw error
    }
}

export async function declineConnectionRequest(connectionId: string) {
    const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId)

    if (error) throw error
}

export async function disconnectConnection(userId1: string, userId2: string) {
    const { error } = await supabase
        .from('connections')
        .delete()
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)

    if (error) throw error
}

export async function closeDeal(connectionId: string) {
    const { error } = await supabase
        .from('connections')
        .update({
            deal_closed: true,
            deal_closed_at: new Date().toISOString()
        })
        .eq('id', connectionId)

    if (error) throw error
}

export async function getClosedDeals(userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('connections')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .eq('deal_closed', true)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    if (error || !data) return []

    // Return IDs of the other party (not the current user)
    return data.map(conn =>
        conn.sender_id === userId ? conn.receiver_id : conn.sender_id
    )
}

// Analytics Functions
export async function trackProfileView(viewerId: string, startupId: string, location?: string) {
    const { error } = await supabase
        .from('profile_views')
        .insert({
            viewer_id: viewerId,
            viewed_startup_id: startupId,
            viewer_location: location || 'Unknown'
        })

    if (error) console.error('Error tracking view:', error)
}

export async function getProfileViewsCount(startupId: string): Promise<number> {
    const { count, error } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('viewed_startup_id', startupId)

    if (error) return 0
    return count || 0
}

export async function getViewsTimeseries(startupId: string, days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
        .from('profile_views')
        .select('viewed_at')
        .eq('viewed_startup_id', startupId)
        .gte('viewed_at', startDate.toISOString())
        .order('viewed_at', { ascending: true })

    if (error || !data) return []

    // Group by day
    const viewsByDay: Record<string, number> = {}
    data.forEach(view => {
        const date = new Date(view.viewed_at).toLocaleDateString('en-US', { weekday: 'short' })
        viewsByDay[date] = (viewsByDay[date] || 0) + 1
    })

    return Object.entries(viewsByDay).map(([name, views]) => ({ name, views, interest: Math.floor(views * 0.2) }))
}

export async function getViewsGeography(startupId: string) {
    const { data, error } = await supabase
        .from('profile_views')
        .select('viewer_location')
        .eq('viewed_startup_id', startupId)

    if (error || !data) return []

    // Count by location
    const locationCounts: Record<string, number> = {}
    data.forEach(view => {
        const location = view.viewer_location || 'Unknown'
        locationCounts[location] = (locationCounts[location] || 0) + 1
    })

    const total = data.length
    return Object.entries(locationCounts)
        .map(([country, views]) => ({
            country,
            views,
            percentage: Math.round((views / total) * 100)
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
}

export async function getConnectionStats(startupId: string) {
    const { data, error } = await supabase
        .from('connections')
        .select('status, created_at')
        .eq('receiver_id', startupId)

    if (error || !data) return {
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        recentChange: 0
    }

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats = {
        total: data.length,
        pending: data.filter(c => c.status === 'pending').length,
        accepted: data.filter(c => c.status === 'accepted').length,
        rejected: data.filter(c => c.status === 'rejected').length,
        recentChange: data.filter(c => new Date(c.created_at) > weekAgo).length
    }

    return stats
}

export async function calculateProfileStrength(startupId: string): Promise<number> {
    const { data, error } = await supabase
        .from('startups')
        .select('*')
        .eq('id', startupId)
        .single()

    if (error || !data) return 0

    let score = 0
    const weights = {
        // Basic Info (30 points)
        name: 5,
        logo: 5,
        industry: 5,
        stage: 5,
        description: 10,

        // Founder Info (20 points)
        founder_name: 5,
        founder_avatar: 5,
        founder_bio: 5,
        founder_education: 2.5,
        founder_work_history: 2.5,

        // Problem & Solution (20 points)
        problem_solving: 15,
        history: 5,

        // Metrics (15 points)
        valuation: 7.5,
        traction: 7.5,

        // AI Summary (15 points)
        ai_summary: 10,
        summary_status: 5 // Bonus if finalized
    }

    // Check each field and add points
    if (data.name && data.name.trim()) score += weights.name
    if (data.logo && data.logo.trim() && !data.logo.includes('placeholder')) score += weights.logo
    if (data.industry && data.industry.trim()) score += weights.industry
    if (data.stage && data.stage.trim()) score += weights.stage
    if (data.description && data.description.trim().length > 50) score += weights.description

    if (data.founder_name && data.founder_name.trim()) score += weights.founder_name
    if (data.founder_avatar && data.founder_avatar.trim()) score += weights.founder_avatar
    if (data.founder_bio && data.founder_bio.trim().length > 30) score += weights.founder_bio
    if (data.founder_education && data.founder_education.trim()) score += weights.founder_education
    if (data.founder_work_history && data.founder_work_history.trim()) score += weights.founder_work_history

    if (data.problem_solving && data.problem_solving.trim().length > 50) score += weights.problem_solving
    if (data.history && data.history.trim().length > 30) score += weights.history

    if (data.valuation && data.valuation.trim()) score += weights.valuation
    if (data.traction && data.traction.trim()) score += weights.traction

    if (data.ai_summary && data.ai_summary.trim().length > 100) score += weights.ai_summary
    if (data.summary_status === 'final') score += weights.summary_status

    return Math.round(score)
}

export async function boostStartup(investorId: string, startupId: string, points: number = 50) {
    const { error } = await supabase
        .from('investor_boosts')
        .insert({
            investor_id: investorId,
            startup_id: startupId,
            points_awarded: points
        })

    if (error) throw error
}

export async function getStartupBoosts(startupId: string): Promise<number> {
    const { data, error } = await supabase
        .from('investor_boosts')
        .select('points_awarded')
        .eq('startup_id', startupId)

    if (error || !data) return 0
    return data.reduce((sum, boost) => sum + (boost.points_awarded || 0), 0)
}

export async function getStartupProfile(userId: string) {
    const { data, error } = await supabase
        .from('startups')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) return null
    return data
}

export async function getRecentBoosts(startupId: string) {
    const { data, error } = await supabase
        .from('investor_boosts')
        .select('created_at, points_awarded, investor_id')
        .eq('startup_id', startupId)
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) return []
    return data
}

export async function getStartupSaveCount(startupId: string): Promise<number> {
    const { count, error } = await supabase
        .from('future_plans')
        .select('*', { count: 'exact', head: true })
        .eq('startup_id', startupId)

    if (error) return 0
    return count || 0
}

export async function hasInvestorBoosted(investorId: string, startupId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('investor_boosts')
        .select('id')
        .eq('investor_id', investorId)
        .eq('startup_id', startupId)
        .maybeSingle()

    if (error || !data) return false
    return true
}

export async function purchaseImpactPoints(investorId: string, points: number, price: number) {
    const { error } = await supabase
        .from('point_purchases')
        .insert({
            investor_id: investorId,
            points: points,
            price: price
        })

    if (error) throw error
}
