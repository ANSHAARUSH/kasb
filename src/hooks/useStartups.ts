import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { type Startup } from "../data/mockData"
import { calculateStartupProgress } from "../lib/questionnaire"
import { calculateImpactScore } from "../lib/scoring"

export function useStartups() {
    const [startups, setStartups] = useState<Startup[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<unknown>(null)

    useEffect(() => {
        const fetchStartups = async () => {
            setLoading(true)
            try {
                const { data: startupData, error: startupError } = await supabase
                    .from('startups')
                    .select('*')

                if (startupError) throw startupError;

                if (startupError) throw startupError

                if (startupData && startupData.length > 0) {
                    const userIds = startupData.map((s: any) => s.id)
                    const boostMap: Record<string, number> = {}
                    const subMap: Record<string, string> = {}

                    // Fetch supplementary data in parallel with error handling
                    try {
                        const [boostRes, subRes] = await Promise.all([
                            supabase
                                .from('investor_boosts')
                                .select('startup_id, points_awarded')
                                .in('startup_id', userIds),
                            supabase
                                .from('user_subscriptions')
                                .select('user_id, tier')
                                .in('user_id', userIds)
                        ])

                        boostRes.data?.forEach((b: any) => {
                            boostMap[b.startup_id] = (boostMap[b.startup_id] || 0) + (b.points_awarded || 0)
                        })

                        subRes.data?.forEach((s: any) => {
                            subMap[s.user_id] = s.tier
                        })
                    } catch (secErr) {
                        console.error("Secondary fetches failed (likely RLS):", secErr)
                    }

                    const mappedStartups: Startup[] = (startupData || []).map((s: any) => {
                        if (!s) return null;
                        try {
                            return {
                                id: s.id,
                                name: s.name || 'Unnamed Startup',
                                logo: s.logo || '',
                                problemSolving: s.problem_solving || 'No problem statement provided',
                                description: s.description || '',
                                history: s.history || '',
                                metrics: {
                                    valuation: s.valuation || '',
                                    stage: s.stage || 'Ideation',
                                    traction: s.traction || ''
                                },
                                founder: {
                                    name: s.founder_name || 'Founder',
                                    avatar: s.founder_avatar || '',
                                    bio: s.founder_bio || '',
                                    education: s.founder_education || '',
                                    workHistory: s.founder_work_history || ''
                                },
                                tags: Array.isArray(s.tags) ? s.tags : [],
                                emailVerified: !!s.email_verified,
                                showInFeed: !!s.show_in_feed,
                                verificationLevel: s.verification_level || 'basic',
                                industry: s.industry || 'Unknown',
                                aiSummary: s.ai_summary || '',
                                summaryStatus: s.summary_status || 'draft',
                                questionnaire: typeof s.questionnaire === 'object' ? s.questionnaire : {},
                                communityBoosts: boostMap[s.id] || 0,
                                last_active_at: s.last_active_at,
                                country: s.country,
                                state: s.state,
                                city: s.city,
                                tier: subMap[s.id] || s.subscription_tier || 'discovery'
                            }
                        } catch (e) {
                            console.error("Mapping error for single startup:", e, s);
                            return null;
                        }
                    }).filter(Boolean) as Startup[]

                    // Calculate scores and completion
                    const visibleStartups = mappedStartups.filter(s => s.showInFeed).map(s => {
                        try {
                            const scoreResult = calculateImpactScore(s);
                            const completionPercentage = calculateStartupProgress(s);
                            return {
                                ...s,
                                impactPoints: scoreResult?.total || 100,
                                completionPercentage: completionPercentage || 0
                            };
                        } catch (e) {
                            console.error("Score calculation error:", e, s);
                            return {
                                ...s,
                                impactPoints: 100,
                                completionPercentage: 0
                            }
                        }
                    }).sort((a, b) => (b.impactPoints || 0) - (a.impactPoints || 0))

                    setStartups(visibleStartups)
                } else {
                    setStartups([])
                }
            } catch (err: any) {
                console.error("Critical error fetching startups:", err)
                setError(err.message || String(err))
            } finally {
                setLoading(false)
            }
        }

        fetchStartups()
    }, [])

    return { startups, loading, error }
}
