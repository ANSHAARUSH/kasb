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
import { Button } from "../components/ui/button"
import { Plus } from "lucide-react"

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
}

interface Investor {
    id: string
    name: string
    avatar: string
    funds_available: string
    investments_count: number
    email_verified: boolean
    show_in_feed: boolean
    adhaar_number?: string
    adhaar_doc_url?: string
    verification_level: 'basic' | 'verified' | 'trusted'
    review_requested?: boolean
}

export function AdminDashboard() {
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
        founder_name: '', founder_avatar: 'https://i.pravatar.cc/150', founder_bio: '', founder_education: '', founder_work_history: '', history: '', tags: '',
        industry: ''
    })
    const [newInvestor, setNewInvestor] = useState({ name: '', avatar: 'https://i.pravatar.cc/150', funds_available: '', investments_count: 0 })

    const fetchData = useCallback(async () => {
        const { data: startupData } = await supabase.from('startups').select('*').order('created_at', { ascending: false })
        const { data: investorData } = await supabase.from('investors').select('*').order('created_at', { ascending: false })
        const { count: messageCount } = await supabase.from('messages').select('*', { count: 'exact', head: true })

        if (startupData) setStartups(startupData)
        if (investorData) setInvestors(investorData)

        // Calculate simple stats
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const newStartups = startupData?.filter(s => new Date((s as any).created_at) > oneWeekAgo).length || 0
        const newInvestors = investorData?.filter(i => new Date((i as any).created_at) > oneWeekAgo).length || 0

        setStats({
            totalStartups: startupData?.length || 0,
            totalInvestors: investorData?.length || 0,
            newSignupsThisWeek: newStartups + newInvestors,
            activeUsers: Math.floor((startupData?.length || 0) * 0.4), // Mock active users for now
            totalMessages: messageCount || 0
        })

        setLoading(false)
    }, [])

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
                founder_name: '', founder_avatar: 'https://i.pravatar.cc/150', founder_bio: '', founder_education: '', founder_work_history: '', history: '', tags: '',
                industry: ''
            })
        } else {
            alert('Error adding startup: ' + error.message)
        }
    }

    const handleAddInvestor = async () => {
        const { error } = await supabase.from('investors').insert([{ ...newInvestor, email_verified: true, show_in_feed: true }])
        if (!error) {
            setIsInvestorModalOpen(false)
            fetchData()
            setNewInvestor({ name: '', avatar: 'https://i.pravatar.cc/150', funds_available: '', investments_count: 0 })
        } else {
            alert('Error adding investor: ' + error.message)
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
        if (!confirm(`Are you sure you want to delete this ${table === 'startups' ? 'startup' : 'investor'}?`)) return
        const { error } = await supabase.from(table).delete().eq('id', id)
        if (error) alert('Error deleting: ' + error.message)
        else fetchData()
    }

    return (
        <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => window.location.href = '/'}>
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
                                />
                            ) : (
                                <InvestorManagement
                                    investors={investors}
                                    loading={loading}
                                    toggleVerifyInvestor={toggleVerifyInvestor}
                                    grantTrusted={grantTrusted}
                                    promptDelete={promptDelete}
                                    onAddClick={() => setIsInvestorModalOpen(true)}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'moderation' && <ModerationQueue />}

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
