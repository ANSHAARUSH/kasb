import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

interface AdminRouteProps {
    children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { user, role, loading } = useAuth()

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    if (!user || role !== 'admin') {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}
