import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export function AuthCallback() {
    const { user, loading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!loading) {
            if (user) {
                console.log("[AuthCallback] User session found, moving to dashboard")
                navigate("/dashboard", { replace: true })
            } else {
                console.log("[AuthCallback] No session found, returning to login")
                navigate("/login", { replace: true })
            }
        }
    }, [user, loading, navigate])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
            <h1 className="text-2xl font-black text-black uppercase tracking-tight mb-2">
                Completing Secure Sign-In
            </h1>
            <p className="text-gray-500 font-medium">
                Please wait while we finalize your account access...
            </p>
        </div>
    )
}
