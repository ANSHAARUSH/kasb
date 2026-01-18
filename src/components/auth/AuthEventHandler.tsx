import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export function AuthEventHandler() {
    const navigate = useNavigate()

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, _session) => {
            console.log("Auth Event:", event)

            // Check for hash parameters first (Supabase flow)
            const hash = window.location.hash
            const isRecovery = hash.includes('type=recovery') || event === 'PASSWORD_RECOVERY'
            const isSignup = hash.includes('type=signup')

            if (isRecovery) {
                console.log("Password recovery detected")
                navigate('/update-password', { replace: true })
            } else if (isSignup) {
                console.log("Signup confirmation detected")
                // Sign out to force login flow as requested
                await supabase.auth.signOut()
                navigate('/email-confirmed', { replace: true })
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [navigate])

    return null
}
