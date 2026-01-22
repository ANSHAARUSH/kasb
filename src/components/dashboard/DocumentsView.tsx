import { useState, useEffect, useRef } from 'react';
import { type Startup } from '../../data/mockData';
import {
    getRequiredDocuments,
    type DocumentType
} from '../../lib/documentUtils';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Upload,
    FileText,
    CheckCircle,
    Loader2,
    ShieldCheck,
    Plus,
    X,
    FileUp
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { Badge } from '../ui/badge';
import { cn, getViewableUrl } from '../../lib/utils';

interface DocumentsViewProps {
    startup: Startup;
}

interface DocStatus {
    id?: string;
    status: 'pending' | 'uploading' | 'verified' | 'rejected';
    fileName?: string;
    label?: string;
}

export function DocumentsView({ startup }: DocumentsViewProps) {
    const { toast } = useToast();
    const [stats, setStats] = useState<Record<string, DocStatus>>({});
    const [customDocs, setCustomDocs] = useState<{ id: string, label: string, file?: File }[]>([]);
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
            const standardTypes = new Set(requiredDocs.map(d => d.type as string));
            const customs: { id: string, label: string }[] = [];

            data?.forEach((doc: any) => {
                if (standardTypes.has(doc.document_type)) {
                    newStats[doc.document_type] = {
                        id: doc.id,
                        status: doc.status,
                        fileName: doc.file_name,
                        fileUrl: doc.file_url // Ensure we keep the URL
                    } as any;
                } else {
                    // It's a custom document
                    newStats[doc.id] = {
                        id: doc.id,
                        status: doc.status,
                        fileName: doc.file_name,
                        label: doc.document_type,
                        fileUrl: doc.file_url // Ensure we keep the URL
                    } as any;
                    customs.push({ id: doc.id, label: doc.document_type });
                }
            });
            setStats(newStats);
            // We only show existing customs, new ones are added via state
            setCustomDocs(customs);
        } catch (error) {
            console.error('Error fetching docs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (typeOrId: string, file: File, customLabel?: string) => {
        if (!file) return;

        setUploading(typeOrId);
        setStats(prev => ({
            ...prev,
            [typeOrId]: { ...prev[typeOrId], status: 'uploading', fileName: file.name }
        }));

        try {
            toast("Uploading document...");

            const bucketName = 'startup-documents';
            const filePath = `${startup.id}/${file.name}`;

            // Upload actual file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, {
                    upsert: true,
                    cacheControl: '3600'
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            const fileUrl = urlData.publicUrl;

            const docData = {
                startup_id: startup.id,
                document_type: customLabel || typeOrId,
                file_name: file.name,
                file_url: fileUrl,
                status: 'verified', // Auto-verify for now as per instructions (removed complex AI scan)
                uploaded_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('startup_documents')
                .upsert(docData)
                .select()
                .single();

            if (error) throw error;

            toast("Document uploaded successfully!", "success");

            const finalId = data.id;
            setStats(prev => ({
                ...prev,
                [typeOrId]: {
                    id: finalId,
                    status: 'verified',
                    fileName: file.name,
                    label: customLabel,
                    fileUrl: fileUrl // Save to local state too
                }
            }));

            // If it was a new custom doc, we might need to update its ID in customDocs
            if (customLabel) {
                setCustomDocs(prev => prev.map(d => d.id === typeOrId ? { ...d, id: finalId } : d));
            }

        } catch (error: any) {
            console.error('Upload error:', error);
            toast(`Upload failed: ${error.message}`, "error");
            setStats(prev => ({ ...prev, [typeOrId]: { status: 'pending' } }));
        } finally {
            setUploading(null);
        }
    };

    const addCustomSlot = () => {
        const tempId = `temp-${Date.now()}`;
        setCustomDocs(prev => [...prev, { id: tempId, label: '' }]);
    };

    const removeCustomSlot = async (id: string) => {
        if (!id.startsWith('temp-')) {
            // It's in the DB, delete it
            const { error } = await supabase.from('startup_documents').delete().eq('id', id);
            if (error) {
                toast("Failed to delete document", "error");
                return;
            }
        }
        setCustomDocs(prev => prev.filter(d => d.id !== id));
        setStats(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const triggerFileSelect = (id: string) => {
        fileInputRefs.current[id]?.click();
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-black" /></div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        <ShieldCheck className="h-7 w-7 text-emerald-500" />
                        Founder Pitch Deck
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium">
                        Upload your core pitch deck in **PowerPoint (.pptx)** format for investors to review.
                    </p>
                </div>
            </div>

            {/* Mandatory Pitch Deck Card */}
            <div className="grid gap-6">
                {requiredDocs.map((doc) => {
                    const docStat = stats[doc.type];
                    const isUploading = uploading === doc.type;
                    const isVerified = docStat?.status === 'verified';

                    return (
                        <Card key={doc.type} className={cn(
                            "relative overflow-hidden transition-all border-2",
                            isVerified ? "border-emerald-100 bg-emerald-50/20" : "border-dashed border-gray-200 hover:border-black/20"
                        )}>
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            {doc.label}
                                            <Badge variant="default" className="text-[10px] bg-black text-white hover:bg-black uppercase tracking-widest">Mandatory</Badge>
                                        </CardTitle>
                                        <CardDescription className="text-sm font-medium">
                                            {doc.description}
                                        </CardDescription>
                                    </div>
                                    <div className="shrink-0">
                                        {isVerified && (
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full">
                                                <CheckCircle className="h-4 w-4" />
                                                Uploaded
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <input
                                    type="file"
                                    accept=".pptx,.ppt,.pdf"
                                    className="hidden"
                                    ref={el => { fileInputRefs.current[doc.type] = el }}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(doc.type as string, file);
                                    }}
                                    disabled={isUploading}
                                />

                                {isVerified ? (
                                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                                        <a
                                            href={docStat.id ? stats[doc.type]?.id === docStat.id ? getViewableUrl((stats[doc.type] as any).fileUrl) || '#' : '#' : '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                                        >
                                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-emerald-500" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-gray-900 truncate max-w-[200px] md:max-w-md">{docStat.fileName}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">View Presentation</p>
                                            </div>
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs font-bold text-gray-400 hover:text-black ml-2"
                                            onClick={() => triggerFileSelect(doc.type as string)}
                                        >
                                            Replace
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => triggerFileSelect(doc.type as string)}
                                        disabled={isUploading}
                                        className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-black/20 hover:bg-gray-100/50 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-black/20" />
                                        ) : (
                                            <>
                                                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                    <Upload className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-gray-900">Choose Pitch Deck File</p>
                                                    <p className="text-xs text-gray-400 font-medium">PPTX, PPT, or PDF (Max 20MB)</p>
                                                </div>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Additional Documents Section */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Plus className="h-5 w-5 text-gray-400" />
                            Additional Documents
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            Optional documents to show to investors (e.g. Financials, Team Bios, Product Plans)
                        </p>
                    </div>
                    <Button
                        onClick={addCustomSlot}
                        variant="outline"
                        className="rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-widest border-2 border-gray-100 hover:border-black hover:bg-black hover:text-white transition-all shadow-sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Document
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {customDocs.map((doc) => {
                        const docStat = stats[doc.id];
                        const isUploading = uploading === doc.id;
                        const isVerified = docStat?.status === 'verified';

                        return (
                            <Card key={doc.id} className="border-2 border-gray-50 bg-gray-50/30 rounded-2xl overflow-hidden group">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 mr-4">
                                            {isVerified ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                                        <FileUp className="h-4 w-4 text-emerald-600" />
                                                    </div>
                                                    <h4 className="font-bold text-sm text-gray-900 truncate">{doc.label}</h4>
                                                </div>
                                            ) : (
                                                <Input
                                                    placeholder="Document Name (e.g. Financials)"
                                                    value={doc.label}
                                                    onChange={(e) => {
                                                        const newVal = e.target.value;
                                                        setCustomDocs(prev => prev.map(d => d.id === doc.id ? { ...d, label: newVal } : d));
                                                    }}
                                                    className="h-9 rounded-lg border-gray-200 text-sm font-bold bg-white"
                                                />
                                            )}
                                        </div>
                                        <button
                                            onClick={() => removeCustomSlot(doc.id)}
                                            className="p-1.5 rounded-lg hover:bg-black/5 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {!isVerified ? (
                                        <div className="space-y-2">
                                            <input
                                                type="file"
                                                accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls"
                                                className="hidden"
                                                ref={el => { fileInputRefs.current[doc.id] = el }}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileUpload(doc.id, file, doc.label);
                                                }}
                                                disabled={isUploading || !doc.label.trim()}
                                            />
                                            <Button
                                                variant="outline"
                                                className="w-full h-16 border-2 border-dashed border-gray-200 bg-white hover:border-black/20 text-xs font-bold"
                                                onClick={() => triggerFileSelect(doc.id)}
                                                disabled={isUploading || !doc.label.trim()}
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-black/20" />
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <p>Click to Upload File</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">{!doc.label.trim() ? '(Enter name first)' : 'Any format accepted'}</p>
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                                            <a
                                                href={getViewableUrl((docStat as any).fileUrl) || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="truncate max-w-[150px] hover:text-black transition-colors"
                                            >
                                                {docStat.fileName}
                                            </a>
                                            <span className="text-emerald-600">✓ Uploaded</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}

                    {customDocs.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No extra documents added</p>
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">Click "Add Document" to upload more files</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
