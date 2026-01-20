import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { type Investor } from "../data/mockData"
import { calculateImpactScore } from "../lib/scoring"

export function useInvestors() {
    const [investors, setInvestors] = useState<Investor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<unknown>(null)

    useEffect(() => {
        const fetchInvestors = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('investors')
                    .select('*')

                if (data && data.length > 0) {
                    const mappedInvestors: Investor[] = data.map(i => {
                        const baseInvestor: Investor = {
                            id: i.id,
                            name: i.name,
                            avatar: i.avatar || '',
                            title: i.title,
                            bio: i.bio || 'Active Investor',
                            fundsAvailable: i.funds_available || '$0',
                            investments: i.investments_count || 0,
                            expertise: i.expertise || [],
                            verificationLevel: i.verification_level,
                            profile_details: i.profile_details,
                            last_active_at: i.last_active_at
                        };
                        const scoreResult = calculateImpactScore(baseInvestor);
                        return {
                            ...baseInvestor,
                            impactPoints: scoreResult.total
                        };
                    }).sort((a, b) => b.impactPoints - a.impactPoints)
                    setInvestors(mappedInvestors)
                } else {
                    setInvestors([])
                }

                if (error) {
                    console.error("Error fetching investors:", error)
                    setError(error)
                }
            } catch (err) {
                console.error("Critical error fetching investors:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchInvestors()
    }, [])

    return { investors, loading, error }
}
