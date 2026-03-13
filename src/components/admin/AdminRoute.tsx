import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { LoadingScreen } from "../ui/LoadingScreen"

interface AdminRouteProps {
    children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { user, role, loading } = useAuth()

    if (loading) {
        return <LoadingScreen />
    }

    if (!user || role !== 'admin') {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}
