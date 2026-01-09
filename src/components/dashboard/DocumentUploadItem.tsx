import { useState, useRef } from "react"
import { CheckCircle2, FileText, Loader2, AlertCircle, Upload, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { analyzeDocument } from "../../lib/ai"
import { useToast } from "../../hooks/useToast"
import { getGlobalConfig, getUserSetting } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

interface DocumentUploadItemProps {
    item: { id: string, label: string, isMandatory?: boolean }
    isDone: boolean
    onVerified: (id: string) => void
}

export function DocumentUploadItem({ item, isDone, onVerified }: DocumentUploadItemProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [verifying, setVerifying] = useState<'idle' | 'ocr' | 'service'>('idle')
    const [feedback, setFeedback] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
            setFeedback(null)
        }
    }

    const handleVerify = async () => {
        if (!selectedFile || !user) return

        setVerifying('ocr')
        setFeedback(null)
        try {
            // Get API Key
            let apiKey = import.meta.env.VITE_GROQ_API_KEY
            if (!apiKey) {
                apiKey = await getGlobalConfig('ai_api_key') || ''
            }
            if (!apiKey) {
                apiKey = await getUserSetting(user.id, 'ai_api_key') || ''
            }

            if (!apiKey) {
                toast("AI services not configured. Verification unavailable.", "error")
                return
            }

            const result = await analyzeDocument(item.label, selectedFile, apiKey)
            setVerifying('service')
            await new Promise(r => setTimeout(r, 1000))

            if (result.status === 'verified') {
                onVerified(item.id)
                setSelectedFile(null)
            } else {
                setFeedback(result.feedback)
                toast(result.feedback, "error")
            }
        } catch (err: any) {
            setFeedback(err.message || "Verification failed.")
            toast(err.message || "Verification failed.", "error")
        } finally {
            setVerifying('idle')
        }
    }

    return (
        <div
            className={cn(
                "group flex flex-col p-4 rounded-3xl border transition-all",
                isDone
                    ? "bg-emerald-50/30 border-emerald-100/50"
                    : "bg-gray-50/50 border-gray-100 hover:border-gray-200"
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-10 w-10 rounded-2xl flex items-center justify-center transition-all",
                        isDone ? "bg-emerald-500 text-white" : "bg-white text-gray-300 border border-gray-100 group-hover:scale-110"
                    )}>
                        {isDone ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-bold", isDone ? "text-emerald-700" : "text-soft-black")}>
                                {item.label}
                            </span>
                            {item.isMandatory && !isDone && (
                                <span className="text-[8px] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-tighter">Mandatory</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isDone && verifying === 'idle' && !selectedFile && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-xl bg-white border border-gray-100 text-gray-500 hover:text-black hover:border-gray-300 transition-all shadow-sm"
                        >
                            <Upload className="h-4 w-4" />
                        </button>
                    )}

                    {selectedFile && verifying === 'idle' && !isDone && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-gray-500 max-w-[100px] truncate">{selectedFile.name}</span>
                            <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500">
                                <X className="h-3 w-3" />
                            </button>
                            <button
                                onClick={handleVerify}
                                className="bg-black text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                            >
                                Verify Now
                            </button>
                        </div>
                    )}

                    {verifying !== 'idle' && (
                        <div className="flex items-center gap-2 text-indigo-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">
                                {verifying === 'ocr' ? 'OCR Extracting...' : 'Service Verifying...'}
                            </span>
                        </div>
                    )}

                    {isDone && (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                        </div>
                    )}
                </div>
            </div>

            {feedback && !isDone && (
                <div className="mt-3 p-3 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-800 font-medium leading-relaxed">{feedback}</p>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
            />
        </div>
    )
}
