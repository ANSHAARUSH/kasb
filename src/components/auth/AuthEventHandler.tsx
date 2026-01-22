import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export function AuthEventHandler() {
    const navigate = useNavigate()

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, _session) => {
            console.log("Global Auth Event:", event)

            const hash = window.location.hash
            const isRecovery = hash.includes('type=recovery') || event === 'PASSWORD_RECOVERY'
            const isSignup = hash.includes('type=signup') && _session?.user?.app_metadata?.provider === 'email'

            if (isRecovery) {
                console.log("Redirecting to: /update-password")
                navigate('/update-password', { replace: true })
            } else if (isSignup) {
                console.log("Redirecting to: /email-confirmed (post-signup)")
                await supabase.auth.signOut()
                navigate('/email-confirmed', { replace: true })
            } else if (event === 'SIGNED_IN') {
                const currentHash = window.location.hash
                const isDashboard = currentHash.includes('#/dashboard') || currentHash.includes('#/admin')

                if (!isDashboard || currentHash.includes('access_token') || currentHash.includes('type=')) {
                    console.log(`[AuthEventHandler] SIGNED_IN detected. Redirecting to /dashboard. Current Hash: ${currentHash}`)
                    navigate('/dashboard', { replace: true })
                } else {
                    console.log(`[AuthEventHandler] User already on dashboard path: ${currentHash}`)
                }
            } else if (event === 'SIGNED_OUT') {
                console.log("[AuthEventHandler] User signed out. Redirecting to /login")
                navigate('/login', { replace: true })
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [navigate])

    return null
}
