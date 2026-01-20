import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export interface StartupProfileData {
    id: string
    name: string
    logo: string
    founder_name: string
    founder_avatar: string
    founder_bio: string
    industry: string
    traction: string
    problem_solving: string
    description?: string
    valuation: string
    stage: string
    email_verified: boolean
    show_in_feed: boolean
    history?: string
    tags?: string[]
    adhaar_number?: string
    adhaar_doc_url?: string
    verification_level: 'basic' | 'verified' | 'trusted'
    review_requested?: boolean
    questionnaire?: Record<string, Record<string, string>>
    ai_summary?: string
    summary_status?: 'draft' | 'final'
    last_active_at?: string
}

export function useStartupProfile() {
    const navigate = useNavigate()
    const [startup, setStartup] = useState<StartupProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const fetchProfile = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                navigate('/login')
                return
            }

            const { data, error } = await supabase
                .from('startups')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error
            if (data) setStartup(data)
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }, [navigate])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    const updateProfile = async (formData: Partial<StartupProfileData>) => {
        if (!startup) return false
        setSaving(true)
        try {
            // Remove metadata and non-updatable fields
            const { id, created_at, updated_at, email_verified, ...updateData } = formData as any

            const { error } = await supabase
                .from('startups')
                .update(updateData)
                .eq('id', startup.id)

            if (error) {
                console.error('Supabase update error:', error)
                throw error
            }

            setStartup(prev => prev ? { ...prev, ...formData } : null)
            return true
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile. Check console for details.')
            return false
        } finally {
            setSaving(false)
        }
    }

    const requestReview = async () => {
        if (!startup) return
        try {
            const { error } = await supabase
                .from('startups')
                .update({ review_requested: true })
                .eq('id', startup.id)
            if (error) throw error
            setStartup({ ...startup, review_requested: true })
            return true
        } catch (error) {
            console.error('Error requesting review:', error)
            return false
        }
    }

    const markAsLive = async () => {
        if (!startup || startup.show_in_feed) return
        try {
            const { error } = await supabase
                .from('startups')
                .update({ show_in_feed: true, verification_level: 'verified' })
                .eq('id', startup.id)
            if (error) throw error
            setStartup({ ...startup, show_in_feed: true, verification_level: 'verified' })
            return true
        } catch (error) {
            console.error('Error marking as live:', error)
            return false
        }
    }

    return { startup, loading, saving, updateProfile, requestReview, markAsLive, refetch: fetchProfile }
}
