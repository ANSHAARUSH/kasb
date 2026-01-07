import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { type Investor } from "../data/mockData"

export function useInvestors() {
    const [investors, setInvestors] = useState<Investor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<unknown>(null)

    useEffect(() => {
        const fetchInvestors = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('investors')
                .select('*')

            if (data) {
                const mappedInvestors: Investor[] = data.map(i => ({
                    id: i.id,
                    name: i.name,
                    avatar: i.avatar || 'https://i.pravatar.cc/150',
                    bio: i.bio || 'Active Investor',
                    fundsAvailable: i.funds_available || '$0',
                    investments: i.investments_count || 0,
                    expertise: i.expertise || []
                }))
                setInvestors(mappedInvestors)
            }

            if (error) {
                console.error("Error fetching investors:", error)
                setError(error)
            }
            setLoading(false)
        }

        fetchInvestors()
    }, [])

    return { investors, loading, error }
}
