import { createContext, useContext, useEffect, useState } from "react"
import { type Session, type User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import { subscriptionManager, type SubscriptionTier } from "../lib/subscriptionManager"

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
                subscriptionManager.setUserId(session.user.id)
                checkUserRole(session.user.id)
            } else {
                subscriptionManager.setUserId(null)
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
                subscriptionManager.setUserId(session.user.id)
                setLoading(true) // Start loading while we check role
                checkUserRole(session.user.id)
            } else {
                subscriptionManager.setUserId(null)
                setRole(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const checkUserRole = async (userId: string) => {
        try {
            // 1. Check Admin
            const { data: adminData } = await supabase.from('admins').select('id').eq('id', userId).single()
            if (adminData) {
                setRole('admin')
                return
            }

            // 2. Check Startup
            const { data: startupData, error: startupError } = await supabase
                .from('startups')
                .select('id, subscription_tier')
                .eq('id', userId)
                .single()

            if (startupData) {
                setRole('startup')
                const tier = (startupData.subscription_tier || 'discovery') as SubscriptionTier
                subscriptionManager.setTier(tier)
                return
            }

            // 3. Check Investor
            const { data: investorData, error: investorError } = await supabase
                .from('investors')
                .select('id, subscription_tier')
                .eq('id', userId)
                .single()

            if (investorData) {
                setRole('investor')
                const tier = (investorData.subscription_tier || 'explore') as SubscriptionTier
                subscriptionManager.setTier(tier)
                return
            }

            // Log purely informational errors (exclude "no rows found")
            if (startupError && startupError.code !== 'PGRST116') console.error('Startup check error:', startupError)
            if (investorError && investorError.code !== 'PGRST116') console.error('Investor check error:', investorError)

            setRole(null)
        } catch (error) {
            console.error('Critical Auth Error:', error)
            setRole(null)
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        subscriptionManager.setUserId(null)
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
