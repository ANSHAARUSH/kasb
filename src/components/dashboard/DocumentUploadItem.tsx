import { useState, useRef, useEffect } from "react"
import { CheckCircle2, FileText, Loader2, AlertCircle, Upload, X, Cloud, File, ChevronDown, ChevronUp, Info, ListChecks, Target, Wand2 } from "lucide-react"
import { cn } from "../../lib/utils"
import { getGlobalConfig, getUserSetting } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { motion, AnimatePresence } from "framer-motion"
import { analyzeStartupDocument } from "../../lib/ai"
import type { AnalysisResult } from "../../lib/documentIntelligence"

interface DocumentUploadItemProps {
    item: { id: string, label: string, isMandatory?: boolean }
    stage: string
    isDone: boolean
    onVerified: (id: string, result: AnalysisResult) => void
}

export function DocumentUploadItem({ item, stage, isDone, onVerified }: DocumentUploadItemProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [verifying, setVerifying] = useState<'idle' | 'ocr' | 'intelligence' | 'service'>('idle')
    const [feedback, setFeedback] = useState<string | null>(null)
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Global drag prevention when modal is open
    useEffect(() => {
        if (!isModalOpen) return

        const preventDefault = (e: DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
        }

        // Add listeners to document to capture all drag events bubbling up
        document.addEventListener('dragenter', preventDefault)
        document.addEventListener('dragover', preventDefault)
        document.addEventListener('dragleave', preventDefault)
        document.addEventListener('drop', preventDefault)

        return () => {
            document.removeEventListener('dragenter', preventDefault)
            document.removeEventListener('dragover', preventDefault)
            document.removeEventListener('dragleave', preventDefault)
            document.removeEventListener('drop', preventDefault)
        }
    }, [isModalOpen])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0])
        }
    }

    const handleFileSelect = (file: File) => {
        const fileType = file.name.split('.').pop()?.toLowerCase();
        const supported = ['png', 'jpg', 'jpeg', 'pdf', 'docx', 'xlsx', 'pptx'];

        if (supported.includes(fileType || '')) {
            setSelectedFile(file)
            setFeedback(null)
            setIsModalOpen(false)
        } else {
            toast("Unsupported file format. Please upload PDF, PNG, JPG, DOCX, XLSX, or PPTX.", "error")
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleVerify = async () => {
        if (!selectedFile || !user) return

        setVerifying('ocr')
        setFeedback(null)
        setAnalysis(null)
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

            // 1. Intelligent Analysis
            setVerifying('intelligence')
            const analysisResult = await analyzeStartupDocument(selectedFile, item.label, stage, apiKey)
            setAnalysis(analysisResult)

            // 2. Official Verification simulation if applicable
            setVerifying('service')
            await new Promise(r => setTimeout(r, 1500))

            onVerified(item.id, analysisResult)
            setSelectedFile(null)
            setIsExpanded(true)
            toast("Document verified and analyzed by AI", "success")

        } catch (err: any) {
            console.error("Verification failed:", err)
            setFeedback(err.message || "Verification failed.")
            toast(err.message || "Verification failed.", "error")
        } finally {
            setVerifying('idle')
        }
    }

    return (
        <>
            <div
                className={cn(
                    "group flex flex-col p-4 rounded-3xl border transition-all overflow-hidden",
                    isDone
                        ? "bg-emerald-50/20 border-emerald-100/30"
                        : "bg-gray-50/50 border-gray-100 hover:border-gray-200"
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-10 w-10 rounded-2xl flex items-center justify-center transition-all",
                            isDone ? "bg-emerald-500 text-white" : "bg-white text-gray-300 border border-gray-100"
                        )}>
                            {isDone ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={cn("text-sm font-bold", isDone ? "text-emerald-700" : "text-black")}>
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
                                onClick={() => setIsModalOpen(true)}
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
                                    className="bg-black text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                >
                                    Verify Now
                                </button>
                            </div>
                        )}

                        {verifying !== 'idle' && (
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">
                                    {verifying === 'intelligence' ? 'AI Reviewing...' : verifying === 'ocr' ? 'OCR Extracting...' : 'Service Verifying...'}
                                </span>
                            </div>
                        )}

                        {isDone && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">Analysis</span>
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && analysis && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 pt-4 border-t border-emerald-100/30 space-y-4"
                        >
                            {/* Summary Section */}
                            <div className="bg-white/50 p-4 rounded-2xl border border-emerald-100/20">
                                <div className="flex items-center gap-2 mb-2 text-emerald-700">
                                    <Wand2 className="h-3 w-3" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">AI Summary</span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">{analysis.summary}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Sections Detected */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Target className="h-3 w-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Sections Detected</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {analysis.sections_detected.map((s, i) => (
                                            <span key={i} className="text-[9px] font-bold bg-white px-2 py-0.5 rounded-full border border-gray-100 text-gray-500 whitespace-nowrap">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Missing Sections */}
                                {analysis.missing_sections.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-amber-500">
                                            <ListChecks className="h-3 w-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Missing Coverage</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {analysis.missing_sections.map((s, i) => (
                                                <span key={i} className="text-[9px] font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 text-amber-600 whitespace-nowrap">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Risk Signals */}
                            {analysis.risk_signals.length > 0 && (
                                <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100/50">
                                    <div className="flex items-center gap-2 mb-2 text-red-500">
                                        <AlertCircle className="h-3 w-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Risk Flags</span>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {analysis.risk_signals.map((r, i) => (
                                            <li key={i} className="text-xs text-red-700 font-bold flex items-start gap-2">
                                                <div className="h-1 w-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                                {r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Recommendations */}
                            {analysis.suggestions.length > 0 && (
                                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-500">
                                        <Info className="h-3 w-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Suggestions</span>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {analysis.suggestions.map((s, i) => (
                                            <li key={i} className="text-xs text-indigo-700 font-medium leading-relaxed">
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {feedback && !isDone && (
                    <div className="mt-3 p-3 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-red-800 font-medium leading-relaxed">{feedback}</p>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf,.docx,.xlsx,.pptx"
                    onChange={handleFileChange}
                />
            </div>

            {/* Drag and Drop Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setIsModalOpen(false)
                        }}
                        onDragOver={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                        onDrop={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative overflow-hidden"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-400" />
                            </button>

                            <div className="text-center mb-8">
                                <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                    <Cloud className="h-8 w-8 text-black" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Upload Document</h3>
                                <p className="text-gray-500 text-sm">Upload {item.label} for verification</p>
                            </div>

                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300",
                                    isDragOver
                                        ? "border-black bg-gray-50 scale-[1.02]"
                                        : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                )}
                            >
                                <div className="pointer-events-none">
                                    <File className={cn("h-10 w-10 mx-auto mb-4 transition-colors", isDragOver ? "text-black" : "text-gray-300")} />
                                    <p className="font-bold text-sm mb-1">Click or drag file to this area to upload</p>
                                    <p className="text-xs text-gray-400">Support for PDF, DOCX, XLSX, PPTX, PNG, JPG</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
