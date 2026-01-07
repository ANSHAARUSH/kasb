import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { type Startup } from "../data/mockData"

export function useStartups() {
    const [startups, setStartups] = useState<Startup[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<unknown>(null)

    useEffect(() => {
        const fetchStartups = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('startups')
                .select('*')
                .eq('show_in_feed', true)

            if (data) {
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
                    summaryStatus: s.summary_status
                }))
                setStartups(mappedStartups)
            }

            if (error) {
                console.error("Error fetching startups:", error)
                setError(error)
            }
            setLoading(false)
        }

        fetchStartups()
    }, [])

    return { startups, loading, error }
}
