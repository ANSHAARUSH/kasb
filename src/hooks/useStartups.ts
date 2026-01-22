import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { type Startup } from "../data/mockData"
import { isProfileComplete } from "../lib/questionnaire"
import { calculateImpactScore } from "../lib/scoring"

export function useStartups() {
    const [startups, setStartups] = useState<Startup[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<unknown>(null)

    useEffect(() => {
        const fetchStartups = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('startups')
                    .select('*')
                    .eq('show_in_feed', true)

                if (data && data.length > 0) {
                    // Fetch all boosts
                    const { data: boostData } = await supabase
                        .from('investor_boosts')
                        .select('startup_id, points_awarded')

                    const boostMap: Record<string, number> = {}
                    boostData?.forEach(b => {
                        boostMap[b.startup_id] = (boostMap[b.startup_id] || 0) + (b.points_awarded || 0)
                    })

                    const mappedStartups: Startup[] = data.map(s => ({
                        id: s.id,
                        name: s.name,
                        logo: s.logo || '🚀',
                        problemSolving: s.problem_solving || 'No problem statement provided',
                        description: s.description,
                        history: s.history || '',
                        metrics: {
                            valuation: s.valuation || '',
                            stage: s.stage || '',
                            traction: s.traction || ''
                        },
                        founder: {
                            name: s.founder_name || 'Founder',
                            avatar: s.founder_avatar || '',
                            bio: s.founder_bio || '',
                            education: s.founder_education || '',
                            workHistory: s.founder_work_history || ''
                        },
                        tags: s.tags || [],
                        emailVerified: s.email_verified,
                        showInFeed: s.show_in_feed,
                        verificationLevel: s.verification_level,
                        industry: s.industry,
                        aiSummary: s.ai_summary,
                        summaryStatus: s.summary_status,
                        questionnaire: s.questionnaire,
                        communityBoosts: boostMap[s.id] || 0,
                        last_active_at: s.last_active_at,
                        country: s.country,
                        state: s.state,
                        city: s.city
                    }))

                    // Calculate scores and filter
                    const visibleStartups = mappedStartups.map(s => {
                        const scoreResult = calculateImpactScore(s);
                        return {
                            ...s,
                            impactPoints: scoreResult.total
                        };
                    }).filter(s => {
                        const isVerified = s.verificationLevel === 'verified' || s.verificationLevel === 'trusted'
                        const isComplete = isProfileComplete(s.metrics.stage, s.questionnaire)
                        return isVerified || isComplete
                    }).sort((a, b) => (b.impactPoints || 0) - (a.impactPoints || 0))

                    setStartups(visibleStartups)
                } else {
                    setStartups([])
                }

                if (error) {
                    console.error("Error fetching startups:", error)
                    setError(error)
                }
            } catch (err) {
                console.error("Critical error fetching startups:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchStartups()
    }, [])

    return { startups, loading, error }
}
