import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { Button } from "../../components/ui/button"
import { Trash2, CheckCircle, Clock } from "lucide-react"

interface Report {
    id: string
    created_at: string
    reporter_id: string
    reported_message_id: string
    conversation_partner_id: string
    reason: string
    status: 'pending' | 'resolved'
    message_content?: string
    reporter_name?: string
    reported_name?: string
}

export function AdminReports() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)

    const fetchReports = async () => {
        setLoading(true)
        const { data: reportsData, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })

        if (error || !reportsData) {
            setLoading(false)
            return
        }

        // Fetch related data manually or via complex join
        // For simplicity, let's fetch messages and profiles in bulk
        const messageIds = reportsData.map(r => r.reported_message_id)
        const userIds = new Set<string>()
        reportsData.forEach(r => {
            userIds.add(r.reporter_id)
            userIds.add(r.conversation_partner_id) // This is the person who was reported? No, this is "partner". 
            // Wait, conversation_partner_id is who the reporter was talking to. So usually the reported user.
        })

        const { data: messages } = await supabase.from('messages').select('id, content').in('id', messageIds)
        const { data: startups } = await supabase.from('startups').select('id, name').in('id', Array.from(userIds))
        const { data: investors } = await supabase.from('investors').select('id, name').in('id', Array.from(userIds))

        const messageMap = new Map(messages?.map(m => [m.id, m.content]))
        const nameMap = new Map()
        startups?.forEach(s => nameMap.set(s.id, s.name))
        investors?.forEach(i => nameMap.set(i.id, i.name))

        const fullReports = reportsData.map(r => ({
            ...r,
            message_content: messageMap.get(r.reported_message_id) || '[Message Deleted or Not Found]',
            reporter_name: nameMap.get(r.reporter_id) || 'Unknown User',
            reported_name: nameMap.get(r.conversation_partner_id) || 'Unknown User' // Assuming partner = reported
        }))

        setReports(fullReports)
        setLoading(false)
    }

    useEffect(() => {
        fetchReports()
    }, [])

    const handleDismiss = async (id: string) => {
        await supabase.from('reports').update({ status: 'resolved' }).eq('id', id)
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r))
    }

    const handleDeleteMessage = async (report: Report) => {
        // Mark message as deleted
        await supabase.from('messages').update({ is_deleted: true }).eq('id', report.reported_message_id)
        // Mark report as resolved
        await handleDismiss(report.id)
    }

    if (loading) return <div>Loading reports...</div>

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Reported Messages</h2>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="p-4">Status</th>
                            <th className="p-4">Reporter</th>
                            <th className="p-4">Reported User</th>
                            <th className="p-4">Message</th>
                            <th className="p-4">Reason</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">No reports found</td>
                            </tr>
                        ) : (
                            reports.map(report => (
                                <tr key={report.id} className="hover:bg-gray-50/50">
                                    <td className="p-4">
                                        {report.status === 'pending' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-100">
                                                <Clock className="h-3 w-3" /> Pending
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                                                <CheckCircle className="h-3 w-3" /> Resolved
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 font-medium">{report.reporter_name}</td>
                                    <td className="p-4 text-red-600 font-medium">{report.reported_name}</td>
                                    <td className="p-4 text-gray-600 max-w-xs truncate" title={report.message_content}>
                                        "{report.message_content}"
                                    </td>
                                    <td className="p-4 text-gray-500">{report.reason}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {report.status === 'pending' && (
                                                <>
                                                    <Button size="sm" variant="outline" onClick={() => handleDismiss(report.id)}>
                                                        Dismiss
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteMessage(report)}>
                                                        <Trash2 className="h-4 w-4 mr-1" /> Delete Msg
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
