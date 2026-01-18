import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../../lib/supabase"
import { ProfileView } from "./ProfileView"
import { Button } from "../../../components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { InvestorProfileData } from "../../../hooks/useInvestorProfile"

export function InvestorPublicProfile() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [investor, setInvestor] = useState<InvestorProfileData | null>(null)
    const [loading, setLoading] = useState(true)

    console.log("InvestorPublicProfile rendering. ID:", id)

    useEffect(() => {
        async function fetchInvestor() {
            if (!id) return

            try {
                const { data, error } = await supabase
                    .from('investors')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                setInvestor(data)
            } catch (error) {
                console.error('Error fetching investor:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchInvestor()
    }, [id])

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            </div>
        )
    }

    if (!investor) {
        return (
            <div className="flex bg-white h-full flex-col items-center justify-center gap-4 rounded-3xl p-8 text-center">
                <div className="rounded-full bg-gray-50 p-4">
                    <span className="text-4xl">🤷‍♂️</span>
                </div>
                <div>
                    <h2 className="text-xl font-bold">Investor Not Found</h2>
                    <p className="text-gray-500">The investor profile you are looking for does not exist or has been removed.</p>
                </div>
                <Button onClick={() => navigate(-1)} variant="outline">
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-3xl p-6 sm:p-8 h-full overflow-y-auto">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="pl-0 hover:bg-transparent hover:text-gray-600 mb-2"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
            </div>

            <ProfileView investor={investor} readOnly={true} />
        </div>
    )
}
