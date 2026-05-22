import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { useToast } from "../../hooks/useToast"
import { Button } from "../../components/ui/button"
import { Loader2, Bot, CheckCircle } from "lucide-react"
import { cn } from "../../lib/utils"

export function CustomAIChatbots() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    const fetchRequests = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from("custom_chatbot_requests")
            .select("*")
            .order("created_at", { ascending: false })
            
        if (error) {
            console.error("Error fetching requests:", error)
            toast("Failed to load requests", "error")
        } else {
            setRequests(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'fulfilled' : 'pending'
        const { error } = await supabase
            .from("custom_chatbot_requests")
            .update({ status: newStatus })
            .eq("id", id)
            
        if (error) {
            toast("Failed to update status", "error")
        } else {
            toast(`Request marked as ${newStatus}`, "success")
            fetchRequests()
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Custom AI Requests</h2>
                    <p className="text-gray-500 mt-1">Manage requested chatbots from Fundraise Pro users.</p>
                </div>
                <Button onClick={fetchRequests} variant="outline" className="rounded-xl font-bold">Refresh List</Button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                        <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100 uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-5">User ID</th>
                                <th className="px-6 py-5">Description</th>
                                <th className="px-6 py-5">Requested Date</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {requests.map(req => (
                                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-5 font-medium text-gray-900">
                                        {req.user_id.slice(0, 8)}...
                                    </td>
                                    <td className="px-6 py-5 text-gray-600 max-w-md">
                                        <div className="line-clamp-3 leading-relaxed">{req.description}</div>
                                    </td>
                                    <td className="px-6 py-5 text-gray-500 font-medium">
                                        {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset",
                                            req.status === 'fulfilled' 
                                                ? "bg-green-50 text-green-700 ring-green-600/20" 
                                                : "bg-amber-50 text-amber-700 ring-amber-600/20"
                                        )}>
                                            {req.status === 'fulfilled' ? "Fulfilled" : "Pending"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Button 
                                            onClick={() => toggleStatus(req.id, req.status)}
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 rounded-xl font-bold"
                                        >
                                            <CheckCircle className={cn("h-4 w-4", req.status === 'pending' ? "text-gray-400" : "text-green-500")} />
                                            {req.status === 'pending' ? 'Mark Fulfilled' : 'Mark Pending'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="font-medium text-gray-500 text-base">No custom chatbot requests yet.</p>
                                        <p className="text-sm mt-1">When Fundraise Pro users request custom AI, they will appear here.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
