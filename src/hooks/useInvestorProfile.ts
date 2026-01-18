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
    spentPoints?: number
    purchasedPoints?: number
    profile_details?: InvestorProfileDetails
}

export interface InvestorProfileDetails {
    investment_preferences?: {
        stage: string[]
        ticket_size_min: number
        ticket_size_max: number
        industry_focus: string[]
        geographic_preference: string[]
        business_model: string[]
        revenue_preference: string
        ownership_percentage_min: number
        ownership_percentage_max: number
    }
    decision_process?: {
        speed: 'Fast' | 'Moderate' | 'Long-term'
        due_diligence: 'Light' | 'Standard' | 'Deep'
        follow_on: boolean
        syndication: 'Solo' | 'Co-invests' | 'Lead'
        hands_on_level: 'Mentor' | 'Board Member' | 'Strategic Advisor' | 'Passive'
    }
    value_add?: {
        expertise: string[]
        network: string[]
        has_founder_experience: boolean
        exits_count: number
    }
    portfolio?: {
        stage_breakdown: Record<string, number>
        active_count: number
        exited_count: number
        notable_investments: string[]
        average_check_size: number
        success_stories: string[]
    }
    communication?: {
        pitch_format: string[]
        contact_mode: string[]
        office_hours: string
        response_time: string
    }
    social_proof?: {
        linkedin: string
        website: string
        investor_type: string
        references: string[]
    }
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

            const [
                investorRes,
                boostRes,
                purchaseRes
            ] = await Promise.all([
                supabase.from('investors').select('*').eq('id', user.id).single(),
                supabase.from('investor_boosts').select('points_awarded').eq('investor_id', user.id),
                supabase.from('point_purchases').select('points').eq('investor_id', user.id)
            ])

            if (investorRes.error) console.error('Profile Investor fetch error:', investorRes.error)
            if (boostRes.error) console.error('Profile Boost fetch error:', boostRes.error)
            if (purchaseRes.error) console.error('Profile Purchase fetch error:', purchaseRes.error)

            if (investorRes.data) {
                console.log('Fetched Investor Data:', investorRes.data)
                const spent = boostRes.data?.reduce((sum, b) => sum + (b.points_awarded || 0), 0) || 0
                const purchased = purchaseRes.data?.reduce((sum, p) => sum + (p.points || 0), 0) || 0
                console.log('Profile Budget Trace:', { purchased, spent })
                setInvestor({
                    ...investorRes.data,
                    spentPoints: spent,
                    purchasedPoints: purchased
                })
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
        console.log('Updating profile with:', formData)
        try {
            // Remove metadata, non-updatable fields, and computed fields
            const { id, created_at, updated_at, email_verified, spentPoints, purchasedPoints, expertise, ...updateData } = formData as any

            console.log('Payload sent to Supabase:', updateData)

            const { error } = await supabase
                .from('investors')
                .update(updateData)
                .eq('id', investor.id)

            if (error) {
                console.error('Supabase update error:', error)
                throw error
            }

            console.log('Update success, updating local state')
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
