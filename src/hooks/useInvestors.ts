import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { type Investor } from "../data/mockData"
import { calculateImpactScore } from "../lib/scoring"
import { calculateInvestorProgress } from "../lib/questionnaire"

export function useInvestors() {
    const [investors, setInvestors] = useState<Investor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<unknown>(null)

    useEffect(() => {
        const fetchInvestors = async () => {
            setLoading(true)
            try {
                const { data: investorData, error: investorError } = await supabase
                    .from('investors')
                    .select('*')

                if (investorError) throw investorError;

                if (investorError) throw investorError

                if (investorData && investorData.length > 0) {
                    const userIds = investorData.map(i => i.id)
                    const subMap: Record<string, string> = {}

                    try {
                        const { data: subData, error: subError } = await supabase
                            .from('user_subscriptions')
                            .select('user_id, tier')
                            .in('user_id', userIds)

                        if (subError) throw subError

                        subData?.forEach((s: any) => {
                            subMap[s.user_id] = s.tier
                        })
                    } catch (subErr) {
                        console.error("Secondary fetch failed (likely RLS):", subErr)
                    }

                    const mappedInvestors: Investor[] = (investorData || []).map((i: any) => {
                        if (!i) return null;
                        try {
                            const baseInvestor: Investor = {
                                id: i.id,
                                name: i.name || 'Unnamed Investor',
                                avatar: i.avatar || '',
                                title: i.title || 'Investor',
                                bio: i.bio || 'Active Investor',
                                fundsAvailable: i.funds_available || '$0',
                                investments: i.investments_count || 0,
                                expertise: Array.isArray(i.expertise) ? i.expertise : [],
                                verificationLevel: i.verification_level || 'basic',
                                profile_details: typeof i.profile_details === 'object' ? i.profile_details : {},
                                last_active_at: i.last_active_at,
                                state: i.state || '',
                                city: i.city || '',
                                investor_type: i.investor_type || 'Individual',
                                tier: subMap[i.id] || i.subscription_tier || 'explore'
                            };
                            const scoreResult = calculateImpactScore(baseInvestor);
                            const completionPercentage = calculateInvestorProgress(i);
                            return {
                                ...baseInvestor,
                                impactPoints: scoreResult?.total || 100,
                                completionPercentage: completionPercentage || 0
                            };
                        } catch (e) {
                            console.error("Mapping error for single investor:", e, i);
                            return null;
                        }
                    }).filter(Boolean) as Investor[]
                    setInvestors(mappedInvestors)
                } else {
                    setInvestors([])
                }

                if (investorError) {
                    console.error("Error fetching investors:", investorError)
                    setError(investorError)
                }
            } catch (err: any) {
                console.error("Critical error fetching investors:", err)
                setError(err.message || String(err))
            } finally {
                setLoading(false)
            }
        }

        fetchInvestors()
    }, [])

    return { investors, loading, error }
}
