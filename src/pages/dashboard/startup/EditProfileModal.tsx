import { Modal } from "../../../components/ui/modal"
import { Input } from "../../../components/ui/input"
import { Button } from "../../../components/ui/button"
import { ImageUploadInput } from "../../../components/ui/ImageUploadInput"
import { useState, useEffect, useMemo } from "react"
import type { StartupProfileData } from "../../../hooks/useStartupProfile"
import { QUESTIONNAIRE_CONFIG, DEFAULT_STAGE_CONFIG, type Section } from "../../../lib/questionnaire"
import { cn } from "../../../lib/utils"
import { Sparkles, Loader2 } from "lucide-react"
import { refineProblemStatement, generateInvestorSummary } from "../../../lib/ai"
import { COUNTRIES } from "../../../lib/locationData"

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    startup: StartupProfileData
    onSave: (data: Partial<StartupProfileData>) => Promise<boolean>
    saving: boolean
}

export function EditProfileModal({ isOpen, onClose, startup, onSave, saving }: EditProfileModalProps) {
    const [editForm, setEditForm] = useState<Partial<StartupProfileData>>({})
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({})
    const [activeSection, setActiveSection] = useState<string>('')
    const [refining, setRefining] = useState(false)
    const [generatingSummary, setGeneratingSummary] = useState(false)

    useEffect(() => {
        if (startup && isOpen) {
            queueMicrotask(() => {
                setEditForm(startup)
                setAnswers(startup.questionnaire || {})
            })
        }
    }, [startup, isOpen])

    const stageConfig = useMemo(() => {
        const stage = editForm.stage || 'Idea / Pre-Seed'
        // Simple mapping to handle variations in stage naming if necessary, currently exact match
        let config = QUESTIONNAIRE_CONFIG[stage]
        if (!config) {
            // Fallback logic could be robust, for now defaulting to Idea if not found
            if (stage.includes('Seed')) config = QUESTIONNAIRE_CONFIG['MVP / Seed']
            else if (stage.includes('Series A')) config = QUESTIONNAIRE_CONFIG['Early Growth / Series A']
            else config = DEFAULT_STAGE_CONFIG
        }
        return config
    }, [editForm.stage])

    useEffect(() => {
        if (stageConfig && stageConfig.length > 0 && !activeSection) {
            setActiveSection(stageConfig[0].id)
        }
    }, [stageConfig, activeSection])

    const handleAnswerChange = (sectionId: string, questionId: string, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [sectionId]: {
                ...prev[sectionId],
                [questionId]: value
            }
        }))
    }

    const handleRefineWithAI = async () => {
        if (!editForm.problem_solving) return;
        setRefining(true);
        try {
            const refined = await refineProblemStatement(
                editForm.problem_solving,
                import.meta.env.VITE_GROQ_API_KEY
            );
            setEditForm(prev => ({ ...prev, problem_solving: refined }));
        } catch (err) {
            console.error(err);
        } finally {
            setRefining(false);
        }
    };

    const handleGenerateSummary = async () => {
        setGeneratingSummary(true);
        try {
            const summary = await generateInvestorSummary(
                answers,
                editForm.stage || 'Idea',
                import.meta.env.VITE_GROQ_API_KEY
            );
            setEditForm(prev => ({
                ...prev,
                ai_summary: summary,
                summary_status: 'draft'
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setGeneratingSummary(false);
        }
    };

    const handleSubmit = async () => {
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Stage</label>
                            <select
                                className="w-full rounded-md border border-gray-200 p-2 text-sm"
                                value={editForm.stage || ''}
                                onChange={e => setEditForm({ ...editForm, stage: e.target.value })}
                            >
                                <option>Idea / Pre-Seed</option>
                                <option>MVP / Seed</option>
                                <option>Early Growth / Series A</option>
                                <option>Series B+</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Valuation</label>
                            <Input value={editForm.valuation || ''} onChange={e => setEditForm({ ...editForm, valuation: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Traction</label>
                            <Input value={editForm.traction || ''} onChange={e => setEditForm({ ...editForm, traction: e.target.value })} />
                        </div>
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

                {/* Questionnaire Section */}
                <div className="space-y-8 pt-8 border-t-2 border-gray-100">
                    <div>
                        <h3 className="text-xl font-extrabold tracking-tight">Stage Questions</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Specific details for your current stage ({editForm.stage || 'Idea'}).
                        </p>
                    </div>

                    {stageConfig.map((section: Section) => (
                        <div key={section.id} className="space-y-6 pb-6 border-b border-gray-50 last:border-0">
                            <div>
                                <h4 className="text-sm font-bold text-black uppercase tracking-wider">{section.title}</h4>
                                {section.description && <p className="text-gray-500 text-[11px] mt-1">{section.description}</p>}
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {section.questions.map(q => (
                                    <div key={q.id} className={cn("space-y-2", q.type === 'textarea' ? "md:col-span-2" : "")}>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                                            {q.label}
                                            {q.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {q.id === 'location' ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                <select
                                                    className="w-full rounded-xl border-gray-200 focus:border-black focus:ring-black p-3 text-sm"
                                                    value={answers[section.id]?.[q.id]?.split(', ')[1] || ''}
                                                    onChange={e => {
                                                        const country = e.target.value
                                                        const currentState = answers[section.id]?.[q.id]?.split(', ')[0] || ''
                                                        handleAnswerChange(section.id, q.id, `${currentState}, ${country}`)
                                                    }}
                                                >
                                                    <option value="">Select Country...</option>
                                                    {COUNTRIES.map(c => (
                                                        <option key={c.name} value={c.name}>{c.name}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    className="w-full rounded-xl border-gray-200 focus:border-black focus:ring-black p-3 text-sm"
                                                    value={answers[section.id]?.[q.id]?.split(', ')[0] || ''}
                                                    onChange={e => {
                                                        const state = e.target.value
                                                        const currentCountry = answers[section.id]?.[q.id]?.split(', ')[1] || ''
                                                        handleAnswerChange(section.id, q.id, `${state}, ${currentCountry}`)
                                                    }}
                                                    disabled={!answers[section.id]?.[q.id]?.split(', ')[1]}
                                                >
                                                    <option value="">Select State...</option>
                                                    {COUNTRIES.find(c => c.name === answers[section.id]?.[q.id]?.split(', ')[1])?.states.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : q.type === 'textarea' ? (
                                            <textarea
                                                className="w-full rounded-xl border-gray-200 focus:border-black focus:ring-black min-h-[100px] p-3 text-sm"
                                                value={answers[section.id]?.[q.id] || ''}
                                                onChange={e => handleAnswerChange(section.id, q.id, e.target.value)}
                                                placeholder={q.placeholder}
                                            />
                                        ) : q.type === 'select' ? (
                                            <select
                                                className="w-full rounded-xl border-gray-200 focus:border-black focus:ring-black p-3 text-sm"
                                                value={answers[section.id]?.[q.id] || ''}
                                                onChange={e => handleAnswerChange(section.id, q.id, e.target.value)}
                                            >
                                                <option value="">Select...</option>
                                                {q.options?.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <Input
                                                className="rounded-xl border-gray-200 focus:border-black focus:ring-black"
                                                value={answers[section.id]?.[q.id] || ''}
                                                onChange={e => handleAnswerChange(section.id, q.id, e.target.value)}
                                                placeholder={q.placeholder}
                                                type={q.type}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Investor Summary Section */}
                <div className="space-y-6 pt-8 border-t-2 border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-extrabold tracking-tight">Investor Summary</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                A professional narrative for investors based on your answers.
                            </p>
                        </div>
                        <Button
                            onClick={handleGenerateSummary}
                            disabled={generatingSummary || Object.keys(answers).length === 0}
                            className="bg-black text-white hover:bg-gray-800 rounded-full px-6 text-xs font-bold uppercase tracking-wider h-10"
                        >
                            {generatingSummary ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            {editForm.ai_summary ? 'Regenerate Summary' : 'Generate Summary'}
                        </Button>
                    </div>

                    {editForm.ai_summary && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-1">Founder Review Required</p>
                                <p className="text-sm text-amber-900/80 leading-relaxed">
                                    This summary was generated from your structured inputs. Please review, edit if necessary, and finalize below.
                                </p>
                            </div>

                            <textarea
                                className="w-full rounded-2xl border-gray-200 focus:border-black focus:ring-black min-h-[300px] p-6 text-[15px] leading-relaxed shadow-sm font-medium bg-gray-50/50"
                                value={editForm.ai_summary || ''}
                                onChange={e => setEditForm({ ...editForm, ai_summary: e.target.value, summary_status: 'draft' })}
                                placeholder="Review your AI-generated summary here..."
                            />

                            <div className="flex items-center gap-3">
                                <Button
                                    variant={editForm.summary_status === 'final' ? 'default' : 'outline'}
                                    onClick={() => setEditForm({ ...editForm, summary_status: 'final' })}
                                    className={cn(
                                        "rounded-full text-[10px] font-bold uppercase tracking-widest px-6",
                                        editForm.summary_status === 'final' ? "bg-green-600 hover:bg-green-700 text-white border-transparent" : "border-gray-200 text-gray-500"
                                    )}
                                >
                                    {editForm.summary_status === 'final' ? 'Summary Finalized' : 'Mark as Final'}
                                </Button>
                            </div>
                        </div>
                    )}
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
