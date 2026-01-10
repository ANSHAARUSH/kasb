import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Check, X, AlertTriangle } from "lucide-react"
import { Avatar } from "../../components/ui/Avatar"

interface ModerationItem {
    id: string
    name: string
    type: 'startup' | 'investor'
    review_requested?: boolean
    logo?: string
    avatar?: string
    description?: string
    founder_bio?: string
    adhaar_doc_url?: string
}

export function ModerationQueue() {
    const [queue, setQueue] = useState<ModerationItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchQueue()
    }, [])

    const fetchQueue = async () => {
        try {
            setLoading(true)
            // Fetch startups and investors needing review
            const { data: startups, error: startupError } = await supabase
                .from('startups')
                .select('*')
                .eq('review_requested', true)
                .limit(20)

            if (startupError) throw startupError

            const { data: investors, error: investorError } = await supabase
                .from('investors')
                .select('*')
                .eq('review_requested', true)
                .limit(20)

            if (investorError) throw investorError

            const combined = [
                ...(startups || []).map(s => ({ ...s, type: 'startup' } as ModerationItem)),
                ...(investors || []).map(i => ({ ...i, type: 'investor' } as ModerationItem))
            ]
            setQueue(combined)
        } catch (error) {
            console.error('Error fetching moderation queue:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (item: ModerationItem) => {
        const table = item.type === 'startup' ? 'startups' : 'investors'
        await supabase.from(table).update({
            verification_level: 'verified',
            review_requested: false,
            show_in_feed: true
        }).eq('id', item.id)

        setQueue(prev => prev.filter(i => i.id !== item.id))
    }

    const handleReject = async (item: ModerationItem) => {
        const table = item.type === 'startup' ? 'startups' : 'investors'
        // For now just clear the review flag, effectively "ignoring" or "rejecting" the request
        await supabase.from(table).update({
            review_requested: false
        }).eq('id', item.id)

        setQueue(prev => prev.filter(i => i.id !== item.id))
    }

    if (loading) return <div className="p-12 text-center text-gray-500">Loading moderation queue...</div>

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Moderation Queue</h2>
                <p className="text-gray-500">Review pending profiles and verification requests.</p>
            </div>

            {queue.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                    <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold">All caught up!</h3>
                    <p className="text-gray-400">No pending items in the queue.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {queue.map(item => (
                        <Card key={item.id} className="overflow-hidden border border-gray-100 shadow-sm rounded-3xl">
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-2xl bg-gray-50 overflow-hidden ring-1 ring-gray-100 shadow-sm">
                                    <Avatar
                                        src={item.logo || item.avatar}
                                        name={item.name}
                                        fallbackClassName="text-2xl text-gray-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">{item.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.type === 'startup' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                            {item.type}
                                        </span>
                                        {item.review_requested && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-tight">
                                                <AlertTriangle className="h-2.5 w-2.5" />
                                                Review Requested
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                        {item.description || item.founder_bio || "No description provided."}
                                    </p>

                                    {/* Documents */}
                                    {item.adhaar_doc_url && (
                                        <div className="mt-3 inline-block">
                                            <a href={item.adhaar_doc_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                                View Attached Document (Adhaar)
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(item)}>
                                        <Check className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 border-red-100" onClick={() => handleReject(item)}>
                                        <X className="h-4 w-4 mr-1" /> Reject
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
