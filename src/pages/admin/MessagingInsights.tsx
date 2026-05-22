import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { Card, CardContent } from "../../components/ui/card"
import { MessageSquare } from "lucide-react"

export function MessagingInsights() {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMessages()
    }, [])

    const fetchMessages = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error
            if (data) setMessages(data)
        } catch (err) {
            console.error('Error fetching messaging insights:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div>Loading messages...</div>

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Messaging Insights</h2>
                <p className="text-gray-500">Monitor platform communication (Recent 50).</p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                        {messages.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No messages found.</div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-4">
                                    <div className="mt-1">
                                        <MessageSquare className="h-5 w-5 text-gray-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-xs font-mono text-gray-500">
                                                {new Date(msg.created_at).toLocaleString()}
                                            </div>
                                            <div className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                                                {msg.is_read ? 'Read' : 'Unread'}
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {msg.content}
                                        </div>
                                        <div className="mt-1 text-xs text-gray-400 flex items-center gap-2">
                                            <span className="truncate max-w-[150px]">From ID: {msg.sender_id}</span>
                                            <span>→</span>
                                            <span className="truncate max-w-[150px]">To ID: {msg.receiver_id}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
