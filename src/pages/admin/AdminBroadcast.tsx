import { useState } from "react"
import { motion } from "framer-motion"
import { Send, Users, UserCheck, UserPlus, Megaphone, Loader2 } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { Button } from "../../components/ui/button"
import { useToast } from "../../hooks/useToast"
import { useAuth } from "../../context/AuthContext"

type Audience = 'all' | 'startups' | 'investors'

export function AdminBroadcast() {
    const { user: adminUser } = useAuth()
    const { toast } = useToast()
    const [message, setMessage] = useState("")
    const [audience, setAudience] = useState<Audience>('all')
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState<{ total: number; sent: number } | null>(null)

    const handleBroadcast = async () => {
        if (!message.trim() || !adminUser) return
        if (!confirm(`Are you sure you want to send this message to ${audience === 'all' ? 'ALL users' : audience}? This action cannot be undone.`)) return

        setIsLoading(true)
        setProgress(null)

        try {
            let userIds: string[] = []

            // 1. Fetch Target User IDs
            if (audience === 'all' || audience === 'startups') {
                const { data: startups } = await supabase.from('startups').select('id')
                if (startups) userIds.push(...startups.map(s => s.id))
            }
            if (audience === 'all' || audience === 'investors') {
                const { data: investors } = await supabase.from('investors').select('id')
                if (investors) userIds.push(...investors.map(i => i.id))
            }

            // Remove duplicates and admin's own ID
            userIds = Array.from(new Set(userIds)).filter(id => id !== adminUser.id)

            if (userIds.length === 0) {
                toast("No target users found", "error")
                setIsLoading(false)
                return
            }

            setProgress({ total: userIds.length, sent: 0 })

            // 2. Prepare Bulk Insert
            // We chunk the insert to prevent payload size issues if there are thousands of users
            const CHUNK_SIZE = 100
            for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
                const chunk = userIds.slice(i, i + CHUNK_SIZE)
                const messages = chunk.map(targetId => ({
                    sender_id: adminUser.id,
                    receiver_id: targetId,
                    content: message,
                    is_read: false
                }))

                const { error } = await supabase.from('messages').insert(messages)
                if (error) throw error

                setProgress(prev => prev ? { ...prev, sent: Math.min(prev.sent + CHUNK_SIZE, prev.total) } : null)
            }

            toast(`Successfully broadcasted to ${userIds.length} users!`, "success")
            setMessage("")
        } catch (err: any) {
            console.error("Broadcast Error:", err)
            toast(`Failed to broadcast: ${err.message}`, "error")
        } finally {
            setIsLoading(false)
            setTimeout(() => setProgress(null), 3000)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <Megaphone className="h-8 w-8 text-indigo-600" />
                    Global Broadcast
                </h2>
                <p className="text-gray-500">Send an official announcement from Kasb.AI to your users.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <label className="text-sm font-bold uppercase tracking-widest text-gray-400">Target Audience</label>
                            <div className="flex flex-wrap gap-3">
                                <AudienceButton 
                                    active={audience === 'all'} 
                                    onClick={() => setAudience('all')}
                                    icon={<Users className="h-4 w-4" />}
                                    label="All Users"
                                />
                                <AudienceButton 
                                    active={audience === 'startups'} 
                                    onClick={() => setAudience('startups')}
                                    icon={<UserPlus className="h-4 w-4" />}
                                    label="Startups Only"
                                />
                                <AudienceButton 
                                    active={audience === 'investors'} 
                                    onClick={() => setAudience('investors')}
                                    icon={<UserCheck className="h-4 w-4" />}
                                    label="Investors Only"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold uppercase tracking-widest text-gray-400">Message Content</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your announcement here..."
                                className="w-full h-48 p-6 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-lg resize-none transition-all"
                                disabled={isLoading}
                            />
                        </div>

                        <Button 
                            onClick={handleBroadcast}
                            disabled={isLoading || !message.trim()}
                            className="w-full h-14 rounded-2xl bg-black text-white text-lg font-bold hover:bg-gray-800 transition-all gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Sending Broadcast...
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    Send to {audience === 'all' ? 'Everyone' : audience}
                                </>
                            )}
                        </Button>

                        {progress && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                    <span>Progress</span>
                                    <span>{Math.round((progress.sent / progress.total) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(progress.sent / progress.total) * 100}%` }}
                                        className="h-full bg-indigo-600"
                                    />
                                </div>
                                <p className="text-[10px] text-center text-gray-400 italic">Sending to {progress.total} users...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 space-y-4">
                        <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                             Tips for Admins
                        </h4>
                        <ul className="text-sm text-indigo-800 space-y-3">
                            <li className="flex gap-2">
                                <span className="text-indigo-400 font-bold">•</span>
                                <span>Messages appear instantly in the user's "Kasb.AI" chat.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-indigo-400 font-bold">•</span>
                                <span>Use clear, concise language for higher engagement.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-indigo-400 font-bold">•</span>
                                <span>Announce new features, upcoming events, or policy updates.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

function AudienceButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                active 
                ? 'bg-black text-white shadow-xl shadow-black/10 scale-105' 
                : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200 hover:text-black'
            }`}
        >
            {icon}
            {label}
        </button>
    )
}
