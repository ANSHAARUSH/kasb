import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { type Investor, MOCK_INVESTORS } from "../data/mockData"

export function useInvestors() {
    const [investors, setInvestors] = useState<Investor[]>(MOCK_INVESTORS)
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
                    const mappedInvestors: Investor[] = data.map(i => ({
                        id: i.id,
                        name: i.name,
                        avatar: i.avatar || 'https://i.pravatar.cc/150',
                        bio: i.bio || 'Active Investor',
                        fundsAvailable: i.funds_available || '$0',
                        investments: i.investments_count || 0,
                        expertise: i.expertise || []
                    }))
                    setInvestors([...mappedInvestors, ...MOCK_INVESTORS])
                } else {
                    setInvestors(MOCK_INVESTORS)
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
