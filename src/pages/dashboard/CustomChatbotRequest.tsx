import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, ArrowLeft, Send } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"
import { useToast } from "../../hooks/useToast"

export default function CustomChatbotRequest() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { toast } = useToast()
    const [request, setRequest] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!request.trim() || !user) return

        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from("custom_chatbot_requests")
                .insert([
                    {
                        user_id: user.id,
                        description: request.trim(),
                        status: "pending"
                    }
                ])

            if (error) throw error

            toast("Your request has been submitted! Our team will review it shortly.", "success")
            navigate("/dashboard/startup/foundergpt")
        } catch (error: any) {
            console.error("Error submitting request:", error)
            toast(error.message || "Failed to submit request", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] md:-mt-6 bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.02),transparent_50%)]" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl relative z-10"
            >
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>

                <div className="bg-white border border-gray-100 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-black/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white text-xs font-black tracking-widest uppercase mb-6">
                            <Sparkles className="h-3.5 w-3.5" />
                            Fundraise Pro Exclusive
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4">
                            Define Your Custom <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">AI Partner</span>
                        </h1>
                        
                        <p className="text-lg text-gray-500 mb-8 max-w-xl">
                            Tell us exactly who you want to talk to. Whether it's a specific VC persona, an industry expert, or a legendary founder, describe their tone, expertise, and focus area.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Describe your ideal AI assistant
                                </label>
                                <textarea
                                    value={request}
                                    onChange={(e) => setRequest(e.target.value)}
                                    placeholder="e.g. 'I want an AI that acts like Paul Graham. It should focus intensely on talking to users, finding product-market fit, and not getting distracted by fake work. Its tone should be essayistic, calm, and highly direct.'"
                                    className="w-full h-48 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-shadow"
                                    required
                                />
                            </div>

                            <Button 
                                type="submit"
                                disabled={isSubmitting || !request.trim()}
                                className="w-full h-14 rounded-2xl bg-black hover:bg-gray-900 text-white font-bold text-lg shadow-xl shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="flex gap-1.5 items-center">
                                        <div className="w-2 h-2 rounded-full bg-white/40 animate-[bounce_1s_infinite_-0.3s]" />
                                        <div className="w-2 h-2 rounded-full bg-white/40 animate-[bounce_1s_infinite_-0.15s]" />
                                        <div className="w-2 h-2 rounded-full bg-white/40 animate-[bounce_1s_infinite]" />
                                    </div>
                                ) : (
                                    <>
                                        Submit Request
                                        <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
