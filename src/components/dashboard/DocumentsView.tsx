import { useState, useEffect, useRef } from 'react';
import { type Startup } from '../../data/mockData';
import {
    getRequiredDocuments,
    verifyDocumentWithAI,
    extractTextFromFile,
    type DocumentType
} from '../../lib/documentUtils';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import {
    Upload,
    FileText,
    CheckCircle,
    XCircle,
    Loader2,
    ShieldCheck,
    Scan,
    Sparkles
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface DocumentsViewProps {
    startup: Startup;
}

interface DocStatus {
    id?: string;
    status: 'pending' | 'scanning' | 'verified' | 'rejected';
    reason?: string;
    uploadedAt?: string;
    confidence?: number;
    fileName?: string;
}

export function DocumentsView({ startup }: DocumentsViewProps) {
    const { toast } = useToast();
    const [stats, setStats] = useState<Record<string, DocStatus>>({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const requiredDocs = getRequiredDocuments(startup.metrics.stage);

    useEffect(() => {
        fetchDocuments();
    }, [startup.id]);

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('startup_documents')
                .select('*')
                .eq('startup_id', startup.id);

            if (error) throw error;

            const newStats: Record<string, DocStatus> = {};
            data?.forEach((doc: any) => {
                newStats[doc.document_type] = {
                    id: doc.id,
                    status: doc.status,
                    reason: doc.ai_analysis?.reason,
                    confidence: doc.ai_analysis?.confidence,
                    uploadedAt: doc.uploaded_at,
                    fileName: doc.file_name
                };
            });
            setStats(newStats);
        } catch (error) {
            console.error('Error fetching docs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (type: DocumentType, file: File) => {
        if (!file) return;

        // Check if PDF (for MVP AI scanning)
        if (file.type !== 'application/pdf') {
            toast("Please upload a PDF file for AI verification", "error");
            return;
        }

        setUploading(type);
        setStats(prev => ({
            ...prev,
            [type]: { status: 'scanning', fileName: file.name }
        }));

        try {
            // 1. Extract Text
            toast("AI Scanning document content...");
            const text = await extractTextFromFile(file);

            // 2. Verify with AI
            // Get API Key from env
            const apiKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;
            if (!apiKey) {
                toast("AI Service unavailable (Config Error)", "error");
                setStats(prev => ({ ...prev, [type]: { status: 'pending' } }));
                return;
            }

            const verification = await verifyDocumentWithAI(type, text, apiKey);

            if (!verification.valid) {
                toast(`Verification Failed: ${verification.reason}`, "error");
                setStats(prev => ({
                    ...prev,
                    [type]: {
                        status: 'rejected',
                        reason: verification.reason,
                        confidence: verification.confidence,
                        fileName: file.name
                    }
                }));
                // Optionally save the failed attempt to DB? Let's just reset for now.
                setUploading(null);
                return;
            }

            // 3. Upload to Supabase Storage (Mocked for now, just saving DB record)
            const fileUrl = `https://mock-storage.com/${startup.id}/${file.name}`; // Mock URL

            // 4. Save to DB
            const { error } = await supabase.from('startup_documents').upsert({
                startup_id: startup.id,
                document_type: type,
                file_name: file.name,
                file_url: fileUrl,
                status: 'verified',
                ai_analysis: verification
            });

            if (error) throw error;

            toast("Document verified successfully!", "success");
            setStats(prev => ({
                ...prev,
                [type]: {
                    status: 'verified',
                    reason: verification.reason,
                    confidence: verification.confidence,
                    fileName: file.name,
                    uploadedAt: new Date().toISOString()
                }
            }));

        } catch (error: any) {
            console.error('Upload error:', error);
            toast(`Upload failed: ${error.message}`, "error");
            setStats(prev => ({ ...prev, [type]: { status: 'pending' } }));
        } finally {
            setUploading(null);
        }
    };

    const triggerFileSelect = (type: string) => {
        fileInputRefs.current[type]?.click();
    };

    const verifiedCount = requiredDocs.filter(d => stats[d.type]?.status === 'verified').length;
    const progress = Math.round((verifiedCount / requiredDocs.length) * 100);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-6">
            {/* Header / Progress */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-indigo-600" />
                            Use of Funds Compliance
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Required documents for <strong>{startup.metrics.stage}</strong> stage verification.
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-indigo-600">{progress}%</span>
                        <span className="text-sm text-gray-400 block">Complete</span>
                    </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Document List Grouped by Section */}
            <div className="space-y-8">
                {Object.entries(requiredDocs.reduce((acc, doc) => {
                    const section = doc.section || 'Other';
                    if (!acc[section]) acc[section] = [];
                    acc[section].push(doc);
                    return acc;
                }, {} as Record<string, typeof requiredDocs>)).map(([section, docs]) => (
                    <div key={section} className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-100 pb-2">
                            {section}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            {docs.map((doc) => {
                                const docStat = stats[doc.type];
                                const isScanning = uploading === doc.type;
                                const isVerified = docStat?.status === 'verified';
                                const isRejected = docStat?.status === 'rejected';

                                return (
                                    <Card key={doc.type} className={cn(
                                        "relative overflow-hidden transition-all border-2",
                                        isVerified ? "border-emerald-100 bg-emerald-50/30" :
                                            isRejected ? "border-red-100 bg-red-50/30" : "border-dashed border-gray-200 hover:border-indigo-200"
                                    )}>
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                                        {doc.label}
                                                        {doc.required && <Badge variant="secondary" className="text-[10px] h-5 bg-gray-100 text-gray-500 hover:bg-gray-100">Required</Badge>}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs">
                                                        {doc.description}
                                                    </CardDescription>
                                                </div>
                                                <div className="shrink-0">
                                                    {isScanning ? (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full animate-pulse">
                                                            <Scan className="h-3 w-3 animate-spin" />
                                                            Scanning...
                                                        </span>
                                                    ) : isVerified ? (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Verified
                                                        </span>
                                                    ) : isRejected ? (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                                            <XCircle className="h-3 w-3" />
                                                            Failed
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                            Upload
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {isVerified ? (
                                                <div className="space-y-3">
                                                    <div className="text-sm text-gray-600 flex items-center gap-2 bg-white/50 p-2 rounded-lg border border-emerald-100/50">
                                                        <FileText className="h-4 w-4 text-emerald-500" />
                                                        <span className="truncate flex-1 font-medium">{docStat.fileName}</span>
                                                    </div>
                                                    {docStat.confidence && (
                                                        <div className="text-xs text-emerald-700 flex items-center gap-1.5">
                                                            <Sparkles className="h-3 w-3" />
                                                            AI Confidence: <strong>{docStat.confidence}%</strong>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        className="hidden"
                                                        ref={el => { fileInputRefs.current[doc.type] = el }}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleFileUpload(doc.type, file);
                                                        }}
                                                        disabled={isScanning}
                                                    />

                                                    {isRejected && (
                                                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mb-2">
                                                            <strong>AI Rejection:</strong> {docStat.reason}
                                                        </div>
                                                    )}

                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full h-24 border-2 border-dashed gap-2 hover:bg-gray-50",
                                                            isRejected ? "border-red-200 text-red-600 hover:bg-red-50" : "border-gray-200"
                                                        )}
                                                        onClick={() => triggerFileSelect(doc.type)}
                                                        disabled={isScanning}
                                                    >
                                                        {isScanning ? (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                                                <span className="text-xs text-gray-500">Analyzing content...</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Upload className={cn("h-6 w-6", isRejected ? "text-red-400" : "text-gray-400")} />
                                                                <span className="text-sm font-medium">Click to Upload PDF</span>
                                                                <span className="text-xs text-gray-400">or drag and drop</span>
                                                            </div>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
