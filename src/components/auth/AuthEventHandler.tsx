import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export function AuthEventHandler() {
    const navigate = useNavigate()

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, _session) => {
            if (event === 'PASSWORD_RECOVERY') {
                console.log("Password recovery event detected, redirecting...")
                navigate('/update-password', { replace: true })
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [navigate])

    return null
}
