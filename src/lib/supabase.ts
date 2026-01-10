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
    const { error } = await supabase
        .from('connections')
        .insert({ sender_id: senderId, receiver_id: receiverId, status: 'pending' })

    if (error) throw error
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
}

export async function getConnectionStatus(userId1: string, userId2: string): Promise<ConnectionStatus | null> {
    const { data, error } = await supabase
        .from('connections')
        .select('id, status, sender_id, receiver_id')
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .single()

    if (error || !data) return null

    return {
        status: data.status,
        isIncoming: data.receiver_id === userId1,
        connectionId: data.id,
        dealClosed: false // Default to false for now, will be updated after migration
    }
}

export async function acceptConnectionRequest(connectionId: string) {
    const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId)

    if (error) throw error
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
