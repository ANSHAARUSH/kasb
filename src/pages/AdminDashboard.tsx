import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../lib/supabase"
import { AdminLayout, type AdminTab } from "../components/admin/AdminLayout"
import { AdminOverview } from "./admin/AdminOverview"
import { StartupManagement } from "./admin/StartupManagement"
import { InvestorManagement } from "./admin/InvestorManagement"
import { ModerationQueue } from "./admin/ModerationQueue"
import { MessagingInsights } from "./admin/MessagingInsights"
import { AdminSettings } from "./admin/AdminSettings"
import { AdminModals } from "./admin/AdminModals"
import { AdminReports } from "./admin/AdminReports"
import { Button } from "../components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../hooks/useToast"

// Define types that match our Supabase schema
// (Keep types for now as they are used in management components)
interface Startup {
    id: string
    name: string
    logo: string
    problem_solving: string
    description?: string
    valuation: string
    stage: string
    traction: string
    email_verified: boolean
    show_in_feed: boolean
    founder_name: string
    founder_avatar: string
    founder_bio: string
    founder_education: string
    founder_work_history: string
    history: string
    tags: string[]
    adhaar_number?: string
    adhaar_doc_url?: string
    verification_level: 'basic' | 'verified' | 'trusted'
    review_requested?: boolean
    industry?: string
    subscription_tier?: string
}

interface Investor {
    id: string
    name: string
    avatar: string
    funds_available: string
    email_verified: boolean
    show_in_feed: boolean
    adhaar_number?: string
    adhaar_doc_url?: string
    verification_level: 'basic' | 'verified' | 'trusted'
    review_requested?: boolean
    subscription_tier?: string
    bio?: string
    website?: string
    investor_type?: 'direct' | 'vc' | 'grant' | 'accelerator'
    grant_scheme?: string
    grant_advantages?: string
    grant_eligibility?: string
    check_size_range?: string
    target_stages?: string
    sector_focus?: string
    geography_focus?: string
    is_lead_investor?: boolean
    equity_taken?: string
    batch_dates?: string
    location_type?: string
    cohort_size?: number
    has_demo_day?: boolean
}

export function AdminDashboard() {
    const { signOut } = useAuth()
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<AdminTab>('overview')

    // Data States
    const [startups, setStartups] = useState<Startup[]>([])
    const [investors, setInvestors] = useState<Investor[]>([])
    const [stats, setStats] = useState({
        totalStartups: 0,
        totalInvestors: 0,
        newSignupsThisWeek: 0,
        activeUsers: 0,
        totalMessages: 0
    })
    const [loading, setLoading] = useState(true)

    // Sub-tabs for User Management
    const [userTypeTab, setUserTypeTab] = useState<'startups' | 'investors'>('startups')

    // Form states
    const [isStartupModalOpen, setIsStartupModalOpen] = useState(false)
    const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false)

    const [newStartup, setNewStartup] = useState({
        name: '', logo: '🚀', problem_solving: '', description: '', valuation: '', stage: 'Seed', traction: '',
        founder_name: '', founder_avatar: '', founder_bio: '', founder_education: '', founder_work_history: '', history: '', tags: '',
        industry: ''
    })
    const [newInvestor, setNewInvestor] = useState<{
        name: string
        avatar: string
        funds_available: string
        bio?: string
        website?: string
        investor_type?: 'direct' | 'vc' | 'grant' | 'accelerator'
        grant_scheme?: string
        grant_advantages?: string
        grant_eligibility?: string
        check_size_range?: string
        target_stages?: string
        sector_focus?: string
        geography_focus?: string
        is_lead_investor?: boolean
        equity_taken?: string
        batch_dates?: string
        location_type?: string
        cohort_size?: number
        has_demo_day?: boolean
    }>({
        name: '',
        avatar: '',
        funds_available: '',
        bio: '',
        website: '',
        investor_type: 'direct',
        grant_scheme: '',
        grant_advantages: '',
        grant_eligibility: '',
        check_size_range: '',
        target_stages: '',
        sector_focus: '',
        geography_focus: '',
        is_lead_investor: false,
        equity_taken: '',
        batch_dates: '',
        location_type: 'remote',
        cohort_size: 0,
        has_demo_day: false
    })

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)

            // 1. Fetch Core Data (Separate calls for robustness)
            const [startupsRes, investorsRes, messagesRes, subsRes] = await Promise.all([
                supabase.from('startups').select('*').order('created_at', { ascending: false }),
                supabase.from('investors').select('*').order('created_at', { ascending: false }),
                supabase.from('messages').select('id', { count: 'exact', head: true }),
                supabase.from('user_subscriptions').select('user_id, tier')
            ])

            if (startupsRes.error) throw new Error(`Startups: ${startupsRes.error.message}`)
            if (investorsRes.error) throw new Error(`Investors: ${investorsRes.error.message}`)
            if (messagesRes.error) throw new Error(`Messages: ${messagesRes.error.message}`)

            // 2. Build Subscription Map
            const subMap = new Map<string, string>()
            subsRes.data?.forEach((s: any) => subMap.set(s.user_id, s.tier))

            // 3. Process Startups
            if (startupsRes.data) {
                setStartups(startupsRes.data.map((s: any) => ({
                    ...s,
                    subscription_tier: subMap.get(s.id) || 'discovery'
                })))
            }

            // 4. Process Investors
            if (investorsRes.data) {
                setInvestors(investorsRes.data.map((i: any) => ({
                    ...i,
                    subscription_tier: subMap.get(i.id) || 'explore'
                })))
            }

            // 5. Calculate Stats
            const now = new Date()
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

            const newStartups = startupsRes.data?.filter((s: any) => new Date((s as any).created_at) > oneWeekAgo).length || 0
            const newInvestors = investorsRes.data?.filter((i: any) => new Date((i as any).created_at) > oneWeekAgo).length || 0

            setStats({
                totalStartups: startupsRes.data?.length || 0,
                totalInvestors: investorsRes.data?.length || 0,
                newSignupsThisWeek: newStartups + newInvestors,
                activeUsers: Math.floor((startupsRes.data?.length || 0) * 0.4),
                totalMessages: messagesRes.count || 0
            })
        } catch (err: any) {
            console.error("Fetch Data Error:", err)
            toast(`Dashboard Error: ${err.message}`, "error")
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Management Actions
    const handleAddStartup = async () => {
        const { tags, ...rest } = newStartup
        const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)
        const { error } = await supabase.from('startups').insert([{ ...rest, tags: tagsArray, email_verified: true, show_in_feed: true }])
        if (!error) {
            setIsStartupModalOpen(false)
            fetchData()
            setNewStartup({
                name: '', logo: '🚀', problem_solving: '', description: '', valuation: '', stage: 'Seed', traction: '',
                founder_name: '', founder_avatar: '', founder_bio: '', founder_education: '', founder_work_history: '', history: '', tags: '',
                industry: ''
            })
        } else {
            alert('Error adding startup: ' + error.message)
        }
    }

    const handleAddInvestor = async () => {
        console.log('Attempting to add investor:', newInvestor)
        try {
            const generateUUID = () => {
                if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
                // Robust UUID v4 fallback
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = (Math.random() * 16) | 0
                    const v = c === 'x' ? r : (r & 0x3) | 0x8
                    return v.toString(16)
                })
            }

            const id = generateUUID()
            console.log('Generated ID (V5):', id)

            const { error } = await supabase.from('investors').insert([{
                id,
                ...newInvestor,
                grant_advantages: newInvestor.grant_advantages?.split('\n').map(s => s.trim().replace(/^•\s*/, '')).filter(Boolean) || [],
                grant_eligibility: newInvestor.grant_eligibility?.split('\n').map(s => s.trim().replace(/^•\s*/, '')).filter(Boolean) || [],
                target_stages: newInvestor.target_stages?.split(',').map(s => s.trim()).filter(Boolean) || [],
                sector_focus: newInvestor.sector_focus?.split(',').map(s => s.trim()).filter(Boolean) || [],
                geography_focus: newInvestor.geography_focus?.split(',').map(s => s.trim()).filter(Boolean) || [],
                email_verified: true,
                show_in_feed: true,
                verification_level: 'verified'
            }])

            if (error) {
                console.error('Supabase error:', error)
                alert('Error adding investor: ' + error.message)
                return
            }

            console.log('Investor added successfully')
            setIsInvestorModalOpen(false)
            fetchData()
            setNewInvestor({
                name: '',
                avatar: '',
                funds_available: '',
                bio: '',
                website: '',
                investor_type: 'direct',
                grant_scheme: '',
                grant_advantages: '',
                grant_eligibility: '',
                check_size_range: '',
                target_stages: '',
                sector_focus: '',
                geography_focus: '',
                is_lead_investor: false,
                equity_taken: '',
                batch_dates: '',
                location_type: 'remote',
                cohort_size: 0,
                has_demo_day: false
            })
        } catch (err) {
            console.error('Unexpected error:', err)
            alert('Unexpected error: ' + (err instanceof Error ? err.message : String(err)))
        }
    }

    const toggleVerifyStartup = async (startup: Startup) => {
        const newLevel = startup.verification_level === 'basic' ? 'verified' : 'basic'
        // If becoming basic, hide. If becoming verified, show.
        const showInFeed = newLevel === 'verified'

        await supabase.from('startups').update({
            verification_level: newLevel,
            review_requested: false,
            show_in_feed: showInFeed
        }).eq('id', startup.id)
        fetchData()
    }

    const toggleVerifyInvestor = async (investor: Investor) => {
        const newLevel = investor.verification_level === 'basic' ? 'verified' : 'basic'
        const showInFeed = newLevel === 'verified'

        await supabase.from('investors').update({
            verification_level: newLevel,
            review_requested: false,
            show_in_feed: showInFeed
        }).eq('id', investor.id)
        fetchData()
    }

    const grantTrusted = async (table: 'startups' | 'investors', id: string) => {
        await supabase.from(table).update({ verification_level: 'trusted' }).eq('id', id)
        fetchData()
    }

    const toggleFeedVisibility = async (startup: Startup) => {
        await supabase.from('startups').update({ show_in_feed: !startup.show_in_feed }).eq('id', startup.id)
        fetchData()
    }

    const promptDelete = async (table: 'startups' | 'investors', id: string) => {
        if (!confirm(`Are you sure you want to delete this ${table === 'startups' ? 'startup' : 'investor'}? This will permanently delete their account.`)) return

        try {
            // 1. Try to delete from Auth via the specialized RPC
            const { error: rpcError } = await supabase.rpc('delete_user_by_id', { user_id: id })

            if (rpcError) {
                console.error('Error deleting auth user (RPC failing):', rpcError)
                // 2. Fallback: Delete from public table directly if RPC fails
                const { error: tableError } = await supabase.from(table).delete().eq('id', id)
                if (tableError) throw tableError
                toast("Removed from public table, but Auth account might remain.", "info")
            } else {
                toast("User deleted successfully", "success")
            }
        } catch (err: any) {
            console.error("Delete error:", err)
            toast("Failed to delete user: " + err.message, "error")
        }

        // Refresh data
        fetchData()
    }

    const updateUserTier = async (_table: 'startups' | 'investors', id: string, tier: string) => {
        const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: id,
                tier,
                updated_at: new Date().toISOString()
            })

        if (error) alert('Error updating tier: ' + error.message)
        else fetchData()
    }

    return (
        <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={async () => {
            await signOut()
            window.location.href = '/'
        }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && (
                        <AdminOverview stats={stats} />
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button onClick={() => setUserTypeTab('startups')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${userTypeTab === 'startups' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>Startups</button>
                                    <button onClick={() => setUserTypeTab('investors')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${userTypeTab === 'investors' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>Investors</button>
                                </div>
                            </div>

                            {userTypeTab === 'startups' ? (
                                <StartupManagement
                                    startups={startups}
                                    loading={loading}
                                    toggleVerifyStartup={toggleVerifyStartup}
                                    grantTrusted={grantTrusted}
                                    toggleFeedVisibility={toggleFeedVisibility}
                                    promptDelete={promptDelete}
                                    onAddClick={() => setIsStartupModalOpen(true)}
                                    updateTier={updateUserTier}
                                />
                            ) : (
                                <InvestorManagement
                                    investors={investors}
                                    loading={loading}
                                    toggleVerifyInvestor={toggleVerifyInvestor}
                                    grantTrusted={grantTrusted}
                                    promptDelete={promptDelete}
                                    onAddClick={() => setIsInvestorModalOpen(true)}
                                    updateTier={updateUserTier}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'moderation' && <ModerationQueue />}

                    {activeTab === 'reports' && <AdminReports />}

                    {activeTab === 'messages' && <MessagingInsights />}

                    {activeTab === 'settings' && <AdminSettings />}
                </motion.div>
            </AnimatePresence>

            {/* Modals are global to the page */}
            <AdminModals
                isStartupModalOpen={isStartupModalOpen}
                setIsStartupModalOpen={setIsStartupModalOpen}
                newStartup={newStartup}
                setNewStartup={setNewStartup}
                handleAddStartup={handleAddStartup}
                isInvestorModalOpen={isInvestorModalOpen}
                setIsInvestorModalOpen={setIsInvestorModalOpen}
                newInvestor={newInvestor}
                setNewInvestor={setNewInvestor}
                handleAddInvestor={handleAddInvestor}
            />

            {/* Quick Add Button only on Users tab */}
            {activeTab === 'users' && (
                <div className="fixed bottom-8 right-8">
                    <Button
                        onClick={() => userTypeTab === 'startups' ? setIsStartupModalOpen(true) : setIsInvestorModalOpen(true)}
                        className="h-14 w-14 rounded-2xl bg-black text-white shadow-2xl hover:scale-105 transition-transform"
                        size="icon"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>
            )}
        </AdminLayout>
    )
}
