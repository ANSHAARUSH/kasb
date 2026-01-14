import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

export interface InvestorProfileData {
    id: string
    name: string
    avatar: string
    title: string
    funds_available: string
    investments_count: number
    bio: string
    location?: string
    email_verified?: boolean
    show_in_feed?: boolean
    adhaar_number?: string
    adhaar_doc_url?: string
    verification_level: 'basic' | 'verified' | 'trusted'
    review_requested?: boolean
    expertise?: string[]
}

export function useInvestorProfile() {
    const navigate = useNavigate()
    const [investor, setInvestor] = useState<InvestorProfileData | null>(null)
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
                .from('investors')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error
            if (data) {
                setInvestor(data)
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }, [navigate])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    const updateProfile = async (formData: Partial<InvestorProfileData>) => {
        if (!investor) return false
        setSaving(true)
        try {
            // Remove metadata and non-updatable fields
            const { id, created_at, updated_at, email_verified, ...updateData } = formData as any

            const { error } = await supabase
                .from('investors')
                .update(updateData)
                .eq('id', investor.id)

            if (error) {
                console.error('Supabase update error:', error)
                throw error
            }

            setInvestor(prev => prev ? { ...prev, ...formData } : null)
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
        if (!investor) return false
        try {
            const { error } = await supabase
                .from('investors')
                .update({ review_requested: true })
                .eq('id', investor.id)
            if (error) throw error
            setInvestor({ ...investor, review_requested: true })
            return true
        } catch (err) {
            console.error(err)
            return false
        }
    }

    const toggleFeedVisibility = async () => {
        if (!investor) return false
        try {
            const { error } = await supabase
                .from('investors')
                .update({ show_in_feed: !investor.show_in_feed })
                .eq('id', investor.id)

            if (error) throw error
            setInvestor({ ...investor, show_in_feed: !investor.show_in_feed })
            return true
        } catch (err) {
            console.error('Error updating feed visibility:', err)
            return false
        }
    }

    return {
        investor,
        loading,
        saving,
        updateProfile,
        requestReview,
        toggleFeedVisibility,
        refreshProfile: fetchProfile
    }
}
