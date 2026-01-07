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
        connectionId: data.id
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
