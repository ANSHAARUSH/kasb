import { createContext, useContext, useEffect, useState } from "react"
import { type Session, type User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

type UserRole = 'investor' | 'startup' | 'admin' | null

interface AuthContextType {
    session: Session | null
    user: User | null
    role: UserRole
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    loading: true,
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<UserRole>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                checkUserRole(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                setLoading(true) // Start loading while we check role
                checkUserRole(session.user.id)
            } else {
                setRole(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const checkUserRole = async (userId: string) => {
        try {
            // Run all checks in parallel
            const [adminResult, startupResult, investorResult] = await Promise.all([
                supabase.from('admins').select('id').eq('id', userId).single(),
                supabase.from('startups').select('id').eq('id', userId).single(),
                supabase.from('investors').select('id').eq('id', userId).single()
            ])

            if (adminResult.data) {
                setRole('admin')
                return
            }

            if (startupResult.data) {
                setRole('startup')
                return
            }

            if (investorResult.data) {
                setRole('investor')
                return
            }

            setRole(null)
        } catch (error) {
            console.error('Error checking user role:', error)
            setRole(null)
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setRole(null)
        setSession(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
