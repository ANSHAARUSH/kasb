import { Modal } from "../../../components/ui/modal"
import { Input } from "../../../components/ui/input"
import { Button } from "../../../components/ui/button"
import { ImageUploadInput } from "../../../components/ui/ImageUploadInput"
import { useState, useEffect } from "react"
import type { StartupProfileData } from "../../../hooks/useStartupProfile"
import { ShieldCheck, Sparkles, Loader2 } from "lucide-react"
import { saveUserSetting } from "../../../lib/supabase"
import { refineProblemStatement } from "../../../lib/ai"
import { useToast } from "../../../hooks/useToast"

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    startup: StartupProfileData
    onSave: (data: Partial<StartupProfileData>) => Promise<boolean>
    saving: boolean
}

export function EditProfileModal({ isOpen, onClose, startup, onSave, saving }: EditProfileModalProps) {
    const { toast } = useToast()
    const [editForm, setEditForm] = useState<Partial<StartupProfileData>>({})
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({})
    const [refining, setRefining] = useState(false)

    useEffect(() => {
        if (startup && isOpen) {
            queueMicrotask(() => {
                setEditForm(startup)
                setAnswers(startup.questionnaire || {})
            })
        }
    }, [startup, isOpen])

    const handleRefineWithAI = async () => {
        if (!editForm.problem_solving) return;

        const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('groq_api_key') || '';
        if (!apiKey) {
            toast("API Key missing. Please check Admin Settings.", "error");
            return;
        }

        setRefining(true);
        try {
            const refined = await refineProblemStatement(
                editForm.problem_solving,
                apiKey
            );
            setEditForm(prev => ({ ...prev, problem_solving: refined }));
            toast("Problem statement refined!", "success");
        } catch (err) {
            console.error(err);
            toast("Failed to refine problem statement", "error");
        } finally {
            setRefining(false);
        }
    };

    const handleSubmit = async () => {
        // Check if stage has changed
        const stageChanged = editForm.stage !== startup.stage

        if (stageChanged) {
            // Reset checklist status in database
            try {
                await saveUserSetting(startup.id, 'checklist_status', '[]')
            } catch (err) {
                console.error("Error resetting checklist status:", err)
            }
        }

        const success = await onSave({
            ...editForm,
            questionnaire: answers
        })
        if (success) onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Startup Profile">
            <div className="space-y-8 pb-10">
                {/* Header / Basic Info */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Company Name</label>
                            <Input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                        <ImageUploadInput
                            label="Company Logo"
                            value={editForm.logo || ''}
                            onChange={url => setEditForm({ ...editForm, logo: url })}
                            placeholder="Logo URL"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Founder Name</label>
                            <Input value={editForm.founder_name || ''} onChange={e => setEditForm({ ...editForm, founder_name: e.target.value })} />
                        </div>
                        <ImageUploadInput
                            label="Founder Avatar"
                            value={editForm.founder_avatar || ''}
                            onChange={url => setEditForm({ ...editForm, founder_avatar: url })}
                            placeholder="Avatar URL"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Founder Bio</label>
                        <textarea
                            className="w-full rounded-md border border-gray-200 p-2 text-sm min-h-[60px]"
                            value={editForm.founder_bio || ''}
                            onChange={e => setEditForm({ ...editForm, founder_bio: e.target.value })}
                            placeholder="Tell investors about yourself..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Industry</label>
                            <Input value={editForm.industry || ''} onChange={e => setEditForm({ ...editForm, industry: e.target.value })} />
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Current Startup Stage</label>
                                <p className="text-[11px] text-indigo-800/60 font-medium">This determines which questions you need to answer.</p>
                            </div>
                        </div>
                        <select
                            className="w-full rounded-2xl border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 p-4 text-sm font-bold bg-white shadow-sm"
                            value={editForm.stage || ''}
                            onChange={e => setEditForm({ ...editForm, stage: e.target.value })}
                        >
                            <option>Ideation</option>
                            <option>Pre-seed</option>
                            <option>MVP</option>
                            <option>Seed</option>
                            <option>Series A+</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Valuation</label>
                            <Input
                                className="rounded-2xl border-gray-200 focus:border-black focus:ring-black h-12"
                                value={editForm.valuation || ''}
                                onChange={e => setEditForm({ ...editForm, valuation: e.target.value })}
                                placeholder="e.g. $2M"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Traction</label>
                            <Input
                                className="rounded-2xl border-gray-200 focus:border-black focus:ring-black h-12"
                                value={editForm.traction || ''}
                                onChange={e => setEditForm({ ...editForm, traction: e.target.value })}
                                placeholder="e.g. 5k MAU"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Funding Requirement</label>
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-indigo-500 bg-white px-2 py-0.5 rounded-full border border-indigo-100 shadow-xs">
                                <Sparkles className="h-2.5 w-2.5" />
                                Highlighted Metric
                            </span>
                        </div>
                        <Input
                            className="rounded-2xl border-indigo-200 focus:border-indigo-600 focus:ring-indigo-600 h-12 bg-white"
                            value={answers['execution_readiness']?.['funding_amount'] ||
                                answers['execution_capital']?.['funding_amount'] ||
                                answers['fundraise_details']?.['funding_amount'] ||
                                answers['fundraise_strategy']?.['funding_amount'] || ''}
                            onChange={e => {
                                const val = e.target.value;
                                // Update in the correct section based on stage
                                let sectionId = 'execution_readiness';
                                if (editForm.stage === 'Pre-seed' || editForm.stage === 'MVP') sectionId = 'execution_capital';
                                if (editForm.stage === 'Seed') sectionId = 'fundraise_details';
                                if (editForm.stage === 'Series A+') sectionId = 'fundraise_strategy';

                                setAnswers(prev => ({
                                    ...prev,
                                    [sectionId]: {
                                        ...prev[sectionId],
                                        funding_amount: val
                                    }
                                }));
                            }}
                            placeholder="e.g. $500k, ₹1Cr"
                        />
                    </div>

                    {/* About the Problem Field */}
                    <div className="space-y-3 pt-4 border-t border-gray-50">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">What problem are you solving?</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRefineWithAI}
                                disabled={refining || !editForm.problem_solving}
                                className="h-8 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-black/5 rounded-full px-4 border border-black/10"
                            >
                                {refining ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                ) : (
                                    <Sparkles className="h-3 w-3 mr-2" />
                                )}
                                Refine with AI
                            </Button>
                        </div>
                        <textarea
                            className="w-full rounded-2xl border-gray-200 focus:border-black focus:ring-black min-h-[100px] p-4 text-sm shadow-sm font-medium"
                            value={editForm.problem_solving || ''}
                            onChange={e => setEditForm({ ...editForm, problem_solving: e.target.value })}
                            placeholder="Describe the problem you are solving..."
                        />
                    </div>

                    {/* About the Solution Field */}
                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">About the Solution</label>
                        <textarea
                            className="w-full rounded-2xl border-gray-200 focus:border-black focus:ring-black min-h-[120px] p-4 text-sm shadow-sm"
                            value={editForm.description || ''}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="Provide a high-level overview of your product or service..."
                        />
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-8 border-t border-gray-100 flex justify-end gap-3 pb-10">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={saving} className="bg-black text-white hover:bg-gray-800 rounded-xl px-12 py-6">
                        {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
