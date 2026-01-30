import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../../lib/supabase"
import { ProfileView } from "./ProfileView"
import { Button } from "../../../components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { StartupProfileData } from "../../../hooks/useStartupProfile"

export function StartupPublicProfile() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [startup, setStartup] = useState<StartupProfileData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStartup() {
            if (!id) return

            try {
                const { data, error } = await supabase
                    .from('startups')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                setStartup(data)
            } catch (error) {
                console.error('Error fetching startup:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStartup()
    }, [id])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            </div>
        )
    }

    if (!startup) {
        return (
            <div className="flex bg-white h-screen flex-col items-center justify-center gap-4 p-8 text-center uppercase tracking-widest font-black">
                <div className="rounded-full bg-gray-50 p-6 mb-4">
                    <span className="text-6xl">🔍</span>
                </div>
                <div>
                    <h2 className="text-2xl font-black mb-2">Startup Not Found</h2>
                    <p className="text-gray-400 text-sm">We couldn't find the startup profile you're looking for.</p>
                </div>
                <Button onClick={() => {
                    if (window.history.length > 1) {
                        navigate(-1)
                    } else {
                        navigate('/dashboard')
                    }
                }} variant="outline" className="mt-4 rounded-full border-black px-8">
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen p-4 sm:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (window.history.length > 1) {
                                navigate(-1)
                            } else {
                                navigate('/dashboard')
                            }
                        }}
                        className="pl-0 hover:bg-transparent hover:text-gray-600 mb-2 font-bold uppercase tracking-widest text-[10px]"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Search
                    </Button>
                </div>

                <ProfileView startup={startup} onRequestReview={() => { }} readOnly={true} />
            </div>
        </div>
    )
}
