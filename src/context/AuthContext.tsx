import { createContext, useContext, useEffect, useState, useRef } from "react"
import { type Session, type User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import { subscriptionManager, type SubscriptionTier } from "../lib/subscriptionManager"

type UserRole = 'investor' | 'startup' | 'admin' | null
export type KYCStatus = 'pending' | 'submitted' | 'verified' | 'rejected' | null

interface AuthContextType {
    session: Session | null
    user: User | null
    role: UserRole
    kycStatus: KYCStatus
    loading: boolean
    signOut: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    kycStatus: null,
    loading: true,
    signOut: async () => { },
    refreshUser: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<UserRole>(null)
    const [kycStatus, setKycStatus] = useState<KYCStatus>(null)
    const [loading, setLoading] = useState(true)

    // Refs to avoid stale closures in onAuthStateChange
    const roleRef = useRef<UserRole>(null)
    const userRef = useRef<User | null>(null)
    const loadingRef = useRef(true)

    useEffect(() => {
        roleRef.current = role
    }, [role])

    useEffect(() => {
        userRef.current = user
    }, [user])

    useEffect(() => {
        loadingRef.current = loading
    }, [loading])

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
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth event:", event)

            // Skip strict loading/role-check if it's just a token refresh and we already have the user and role
            const isSameUser = session?.user?.id === userRef.current?.id
            const hasRole = !!roleRef.current

            if (event === 'TOKEN_REFRESHED' && isSameUser && hasRole) {
                setSession(session)
                setUser(session?.user ?? null) // Update user object but don't reset role/loading
                return
            }

            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                subscriptionManager.setUserId(session.user.id)

                // Only trigger loading if we don't have a role OR it's a different user
                // This prevents re-loading on simple session updates (like SIGNED_IN firing again on focus)
                if (!hasRole || !isSameUser) {
                    setLoading(true)
                    checkUserRole(session.user.id)
                }
            } else {
                subscriptionManager.setUserId(null)
                setRole(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const updateLastActive = async (userId: string, userRole: UserRole) => {
        if (!userId || !userRole || userRole === 'admin') return

        const targetTable = userRole === 'startup' ? 'startups' : 'investors'

        await supabase
            .from(targetTable)
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', userId)
    }

    useEffect(() => {
        if (!user || !role || role === 'admin') return

        // Update immediately on mount/role change
        updateLastActive(user.id, role)

        // Then every 5 minutes
        const interval = setInterval(() => {
            updateLastActive(user.id, role)
        }, 1000 * 60 * 5)

        return () => clearInterval(interval)
    }, [user?.id, role])

    const checkUserRole = async (userId: string) => {
        try {
            // 1. Check Admin
            const { data: adminData } = await supabase.from('admins').select('id').eq('id', userId).single()
            if (adminData) {
                setRole('admin')
                setKycStatus('verified')
                return
            }

            // 2. Fetch Subscription Tier first or in parallel
            // This is now central
            const { data: subData } = await supabase
                .from('user_subscriptions')
                .select('tier')
                .eq('user_id', userId)
                .single()

            // 3. Check Startup
            const { data: startupData, error: startupError } = await supabase
                .from('startups')
                .select('id, kyc_status')
                .eq('id', userId)
                .single()

            if (startupData) {
                setRole('startup')
                setKycStatus(startupData.kyc_status as KYCStatus || 'pending')
                const tier = (subData?.tier || 'discovery') as SubscriptionTier
                subscriptionManager.setTier(tier)
                return
            }

            // 4. Check Investor
            const { data: investorData, error: investorError } = await supabase
                .from('investors')
                .select('id, kyc_status')
                .eq('id', userId)
                .single()

            if (investorData) {
                setRole('investor')
                setKycStatus(investorData.kyc_status as KYCStatus || 'pending')
                const tier = (subData?.tier || 'explore') as SubscriptionTier
                subscriptionManager.setTier(tier)
                return
            }

            // Log purely informational errors (exclude "no rows found")
            if (startupError && startupError.code !== 'PGRST116') console.error('Startup check error:', startupError)
            if (investorError && investorError.code !== 'PGRST116') console.error('Investor check error:', investorError)

            setRole(null)
            setKycStatus(null)
        } catch (error) {
            console.error('Critical Auth Error:', error)
            setRole(null)
            setKycStatus(null)
        } finally {
            setLoading(false)
        }
    }

    const refreshUser = async () => {
        if (user) {
            await checkUserRole(user.id)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('kasb_user_tier')
        localStorage.removeItem('kasb_user_region')
        localStorage.removeItem('kasb_usage')
        subscriptionManager.setUserId(null)
        setRole(null)
        setSession(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ session, user, role, kycStatus, loading, signOut, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
