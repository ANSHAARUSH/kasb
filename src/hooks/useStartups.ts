import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { type Startup, MOCK_STARTUPS } from "../data/mockData"
import { isProfileComplete } from "../lib/questionnaire"

export function useStartups() {
    const [startups, setStartups] = useState<Startup[]>(MOCK_STARTUPS)
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
                        questionnaire: s.questionnaire
                    }))

                    // Filter out startups that aren't verified AND don't have complete profiles
                    const visibleStartups = mappedStartups.filter(s => {
                        const isVerified = s.verificationLevel === 'verified' || s.verificationLevel === 'trusted'
                        const isComplete = isProfileComplete(s.metrics.stage, s.questionnaire)
                        return isVerified || isComplete
                    })

                    setStartups([...visibleStartups, ...MOCK_STARTUPS])
                } else {
                    setStartups(MOCK_STARTUPS)
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
