import { useState, useEffect } from "react"
import { Modal } from "../../components/ui/modal"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { ChevronLeft, Building2, Landmark, Rocket } from "lucide-react"

interface AdminModalsProps {
    isStartupModalOpen: boolean
    setIsStartupModalOpen: (open: boolean) => void
    newStartup: {
        name: string
        logo: string
        problem_solving: string
        description: string
        valuation: string
        stage: string
        traction: string
        founder_name: string
        founder_avatar: string
        founder_bio: string
        founder_education: string
        founder_work_history: string
        history: string
        tags: string
        industry: string
    }
    setNewStartup: (startup: any) => void
    handleAddStartup: () => Promise<void>
    isInvestorModalOpen: boolean
    setIsInvestorModalOpen: (open: boolean) => void
    newInvestor: {
        name: string
        avatar: string
        funds_available: string
        bio?: string
        website?: string
        investor_type?: 'direct' | 'vc' | 'grant' | 'accelerator'
        grant_scheme?: string
        grant_advantages?: string
        grant_eligibility?: string
        check_size_range?: string
        target_stages?: string
        sector_focus?: string
        geography_focus?: string
        is_lead_investor?: boolean
        equity_taken?: string
        batch_dates?: string
        location_type?: string
        cohort_size?: number
        has_demo_day?: boolean
        accelerator_type?: string
        cash_investment?: string
        applications_status?: string
        application_deadline?: string
        program_location?: string
        first_cheque_friendly?: string
        investor_intros_strength?: string
        founder_fit_score?: string
        best_for?: string
        program_duration?: string
        cohorts_per_year?: string
        relocation_required?: string
        follow_on_funding?: string
        non_dilutive_support?: string
        eligibility_requirements?: string
        application_difficulty?: string
        acceptance_rate?: string
        application_requirements?: string
        selection_process?: string
        decision_time?: string
        mentorship_access?: string
        investor_access?: string
        post_program_support?: string
        startup_perks?: string
        core_support?: string
        founder_community?: string
    }
    setNewInvestor: (investor: any) => void
    editingInvestor: any | null
    setEditingInvestor: (investor: any | null) => void
    handleAddInvestor: () => Promise<void>
}

export function AdminModals({
    isStartupModalOpen,
    setIsStartupModalOpen,
    newStartup,
    setNewStartup,
    handleAddStartup,
    isInvestorModalOpen,
    setIsInvestorModalOpen,
    newInvestor,
    setNewInvestor,
    editingInvestor,
    setEditingInvestor,
    handleAddInvestor
}: AdminModalsProps) {
    const [selectionStep, setSelectionStep] = useState<'selection' | 'form'>('selection')

    // Reset step when modal closes
    useEffect(() => {
        if (!isInvestorModalOpen) {
            setSelectionStep('selection')
            setEditingInvestor(null)
        } else if (editingInvestor) {
            // Pre-fill form for editing
            setNewInvestor({
                ...editingInvestor,
                grant_advantages: Array.isArray(editingInvestor.grant_advantages) ? editingInvestor.grant_advantages.map((s: string) => `• ${s}`).join('\n') : editingInvestor.grant_advantages,
                grant_eligibility: Array.isArray(editingInvestor.grant_eligibility) ? editingInvestor.grant_eligibility.map((s: string) => `• ${s}`).join('\n') : editingInvestor.grant_eligibility,
                target_stages: Array.isArray(editingInvestor.target_stages) ? editingInvestor.target_stages.join(', ') : editingInvestor.target_stages,
                sector_focus: Array.isArray(editingInvestor.sector_focus) ? editingInvestor.sector_focus.join(', ') : editingInvestor.sector_focus,
                geography_focus: Array.isArray(editingInvestor.geography_focus) ? editingInvestor.geography_focus.join(', ') : editingInvestor.geography_focus,
            })
            setSelectionStep('form')
        }
    }, [isInvestorModalOpen, editingInvestor])

    const handleTypeSelect = (type: 'grant' | 'vc' | 'accelerator') => {
        setNewInvestor({ ...newInvestor, investor_type: type })
        setSelectionStep('form')
    }

    return (
        <>
            {/* Add Startup Modal */}
            <Modal isOpen={isStartupModalOpen} onClose={() => setIsStartupModalOpen(false)} title="Add New Startup">
                <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Company Name</label>
                            <Input value={newStartup.name} onChange={e => setNewStartup({ ...newStartup, name: e.target.value })} placeholder="e.g. Kasb AI" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Logo Emoji</label>
                            <Input value={newStartup.logo} onChange={e => setNewStartup({ ...newStartup, logo: e.target.value })} placeholder="🚀" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Valuation</label>
                            <Input value={newStartup.valuation} onChange={e => setNewStartup({ ...newStartup, valuation: e.target.value })} placeholder="e.g. $5M" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Stage</label>
                            <select
                                className="w-full rounded-md border border-gray-200 p-2 text-sm"
                                value={newStartup.stage}
                                onChange={e => setNewStartup({ ...newStartup, stage: e.target.value })}
                            >
                                <option>Pre-seed</option>
                                <option>Seed</option>
                                <option>Series A</option>
                                <option>Series B+</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Traction (e.g. Revenue/Users)</label>
                        <Input value={newStartup.traction} onChange={e => setNewStartup({ ...newStartup, traction: e.target.value })} placeholder="e.g. $10K MRR" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Industry</label>
                        <Input value={newStartup.industry} onChange={e => setNewStartup({ ...newStartup, industry: e.target.value })} placeholder="e.g. AI, FinTech" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Problem Solving</label>
                        <Input value={newStartup.problem_solving} onChange={e => setNewStartup({ ...newStartup, problem_solving: e.target.value })} placeholder="What problem are you solving?" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description (Optional)</label>
                        <Input value={newStartup.description} onChange={e => setNewStartup({ ...newStartup, description: e.target.value })} placeholder="About the solution..." />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tags (Comma separated)</label>
                        <Input value={newStartup.tags} onChange={e => setNewStartup({ ...newStartup, tags: e.target.value })} placeholder="SaaS, AI, B2B" />
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-bold mb-3">Founder Info</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input value={newStartup.founder_name} onChange={e => setNewStartup({ ...newStartup, founder_name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Avatar URL</label>
                                <Input value={newStartup.founder_avatar} onChange={e => setNewStartup({ ...newStartup, founder_avatar: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleAddStartup} className="w-full bg-black text-white hover:bg-gray-800 rounded-xl py-6 mt-4">
                        Add Startup Entry
                    </Button>
                </div>
            </Modal>

            {/* Add/Edit Investor Modal */}
            <Modal isOpen={isInvestorModalOpen} onClose={() => setIsInvestorModalOpen(false)} title={editingInvestor ? "Edit Investor" : (selectionStep === 'selection' ? "Select Investor Type" : "Add New Investor")}>
                {selectionStep === 'selection' ? (
                    <div className="grid gap-4 pt-6 pb-2">
                        <button
                            onClick={() => handleTypeSelect('grant')}
                            className="group flex items-center gap-4 p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left"
                        >
                            <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <Landmark className="h-7 w-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-900">Government Grant</h4>
                                <p className="text-sm text-gray-500">Government backed funding programs</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleTypeSelect('vc')}
                            className="group flex items-center gap-4 p-6 rounded-2xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50/50 transition-all text-left"
                        >
                            <div className="h-14 w-14 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                <Building2 className="h-7 w-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-900">VC Firm</h4>
                                <p className="text-sm text-gray-500">Venture capital and investment firms</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleTypeSelect('accelerator')}
                            className="group flex items-center gap-4 p-6 rounded-2xl border-2 border-gray-100 hover:border-orange-500 hover:bg-orange-50/50 transition-all text-left"
                        >
                            <div className="h-14 w-14 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                <Rocket className="h-7 w-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-900">Accelerator</h4>
                                <p className="text-sm text-gray-500">Mentorship and early stage growth</p>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 pt-2 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar relative">
                        {/* Header with Type and Back button */}
                        <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 py-2 mb-2 border-b">
                            <button
                                onClick={() => setSelectionStep('selection')}
                                className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-black transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back to Selection
                            </button>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${newInvestor.investor_type === 'grant' ? 'bg-blue-100 text-blue-700' :
                                newInvestor.investor_type === 'vc' ? 'bg-purple-100 text-purple-700' :
                                    'bg-orange-100 text-orange-700'
                                }`}>
                                {newInvestor.investor_type?.replace('_', ' ')}
                            </div>
                        </div>

                        {/* Outside Card View Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Outside Card View</h3>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Official Name</label>
                                <Input value={newInvestor.name} onChange={e => setNewInvestor({ ...newInvestor, name: e.target.value })} placeholder="e.g. Kasb Venture Partners" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Short Bio</label>
                                <Input value={newInvestor.bio} onChange={e => setNewInvestor({ ...newInvestor, bio: e.target.value })} placeholder="e.g. Supporting early-stage AI startups..." />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Website URL</label>
                                <Input value={newInvestor.website} onChange={e => setNewInvestor({ ...newInvestor, website: e.target.value })} placeholder="https://..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Available Funds</label>
                                    <Input value={newInvestor.funds_available} onChange={e => setNewInvestor({ ...newInvestor, funds_available: e.target.value })} placeholder="e.g. $1M-$5M" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Avatar URL</label>
                                    <Input value={newInvestor.avatar} onChange={e => setNewInvestor({ ...newInvestor, avatar: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Inside Card View</h3>
                            </div>

                            <div className="space-y-4">
                                {newInvestor.investor_type === 'grant' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Scheme Name</label>
                                            <Input
                                                value={newInvestor.grant_scheme}
                                                onChange={e => setNewInvestor({ ...newInvestor, grant_scheme: e.target.value })}
                                                placeholder="e.g. Startup India Seed Fund"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Advantages (one bullet per line)</label>
                                            <textarea
                                                className="w-full min-h-[100px] rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 ring-black/5"
                                                value={newInvestor.grant_advantages}
                                                onChange={e => setNewInvestor({ ...newInvestor, grant_advantages: e.target.value })}
                                                placeholder="• Interest-free loan&#10;• Mentorship support..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Eligibility (one bullet per line)</label>
                                            <textarea
                                                className="w-full min-h-[100px] rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 ring-black/5"
                                                value={newInvestor.grant_eligibility}
                                                onChange={e => setNewInvestor({ ...newInvestor, grant_eligibility: e.target.value })}
                                                placeholder="• DPIIT recognized&#10;• Less than 2 years old..."
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Check Size / Investment Range</label>
                                    <Input
                                        value={newInvestor.check_size_range}
                                        onChange={e => setNewInvestor({ ...newInvestor, check_size_range: e.target.value })}
                                        placeholder="e.g. $100k - $500k"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Stages to Invest In</label>
                                    <Input
                                        value={newInvestor.target_stages}
                                        onChange={e => setNewInvestor({ ...newInvestor, target_stages: e.target.value })}
                                        placeholder="e.g. Seed, Series A (comma-separated)"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Sector Focus</label>
                                    <Input
                                        value={newInvestor.sector_focus}
                                        onChange={e => setNewInvestor({ ...newInvestor, sector_focus: e.target.value })}
                                        placeholder="e.g. FinTech, SaaS (comma-separated)"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Geography Focus</label>
                                    <Input
                                        value={newInvestor.geography_focus}
                                        onChange={e => setNewInvestor({ ...newInvestor, geography_focus: e.target.value })}
                                        placeholder="e.g. India, SE Asia (comma-separated)"
                                    />
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <input
                                        type="checkbox"
                                        id="is_lead"
                                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                        checked={newInvestor.is_lead_investor || false}
                                        onChange={e => setNewInvestor({ ...newInvestor, is_lead_investor: e.target.checked })}
                                    />
                                    <label htmlFor="is_lead" className="text-sm font-medium text-gray-700">
                                        We lead investment rounds
                                    </label>
                                </div>

                                {newInvestor.investor_type === 'accelerator' && (
                                    <>
                                        {/* Outside Card View Additions */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Program Type</label>
                                                <Input value={newInvestor.accelerator_type} onChange={e => setNewInvestor({ ...newInvestor, accelerator_type: e.target.value })} placeholder="e.g. Equity Accelerator" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Cash Investment</label>
                                                <Input value={newInvestor.cash_investment} onChange={e => setNewInvestor({ ...newInvestor, cash_investment: e.target.value })} placeholder="e.g. $500k" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Applications Status</label>
                                                <Input value={newInvestor.applications_status} onChange={e => setNewInvestor({ ...newInvestor, applications_status: e.target.value })} placeholder="e.g. Open / Rolling" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Next Deadline</label>
                                                <Input value={newInvestor.application_deadline} onChange={e => setNewInvestor({ ...newInvestor, application_deadline: e.target.value })} placeholder="e.g. May 15, 2026" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Program Location</label>
                                                <Input value={newInvestor.program_location} onChange={e => setNewInvestor({ ...newInvestor, program_location: e.target.value })} placeholder="e.g. San Francisco, USA" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">First-Cheque Friendly</label>
                                                <Input value={newInvestor.first_cheque_friendly} onChange={e => setNewInvestor({ ...newInvestor, first_cheque_friendly: e.target.value })} placeholder="e.g. Yes / Sometimes" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Investor Intros Strength</label>
                                                <Input value={newInvestor.investor_intros_strength} onChange={e => setNewInvestor({ ...newInvestor, investor_intros_strength: e.target.value })} placeholder="e.g. Strong" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Founder Fit Score</label>
                                                <Input value={newInvestor.founder_fit_score} onChange={e => setNewInvestor({ ...newInvestor, founder_fit_score: e.target.value })} placeholder="e.g. 9.4/10" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Best For</label>
                                            <Input value={newInvestor.best_for} onChange={e => setNewInvestor({ ...newInvestor, best_for: e.target.value })} placeholder="e.g. Best for high-growth startups..." />
                                        </div>

                                        {/* Inside Card View Sections */}
                                        <div className="pt-4 border-t">
                                            <h4 className="font-bold text-sm text-gray-900 mb-4 uppercase tracking-tighter">Core Program Details</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Duration</label>
                                                    <Input value={newInvestor.program_duration} onChange={e => setNewInvestor({ ...newInvestor, program_duration: e.target.value })} placeholder="e.g. 3 months" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Cohorts Per Year</label>
                                                    <Input value={newInvestor.cohorts_per_year} onChange={e => setNewInvestor({ ...newInvestor, cohorts_per_year: e.target.value })} placeholder="e.g. 2" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Relocation Required</label>
                                                    <Input value={newInvestor.relocation_required} onChange={e => setNewInvestor({ ...newInvestor, relocation_required: e.target.value })} placeholder="e.g. Yes / No" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h4 className="font-bold text-sm text-gray-900 mb-4 uppercase tracking-tighter">Funding & Economics</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Follow-on Funding</label>
                                                    <Input value={newInvestor.follow_on_funding} onChange={e => setNewInvestor({ ...newInvestor, follow_on_funding: e.target.value })} placeholder="e.g. Yes, up to $500k" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Non-Dilutive Support</label>
                                                    <Input value={newInvestor.non_dilutive_support} onChange={e => setNewInvestor({ ...newInvestor, non_dilutive_support: e.target.value })} placeholder="e.g. Cloud credits..." />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h4 className="font-bold text-sm text-gray-900 mb-4 uppercase tracking-tighter">Startup Fit / Eligibility</h4>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Eligibility Requirements</label>
                                                    <textarea
                                                        className="w-full min-h-[80px] rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 ring-black/5"
                                                        value={newInvestor.eligibility_requirements}
                                                        onChange={e => setNewInvestor({ ...newInvestor, eligibility_requirements: e.target.value })}
                                                        placeholder="Must have MVP, tech-enabled startup..."
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Application Difficulty</label>
                                                        <Input value={newInvestor.application_difficulty} onChange={e => setNewInvestor({ ...newInvestor, application_difficulty: e.target.value })} placeholder="e.g. Competitive" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Acceptance Rate</label>
                                                        <Input value={newInvestor.acceptance_rate} onChange={e => setNewInvestor({ ...newInvestor, acceptance_rate: e.target.value })} placeholder="e.g. ~2%" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h4 className="font-bold text-sm text-gray-900 mb-4 uppercase tracking-tighter">Application Process</h4>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">What You Need to Apply</label>
                                                    <Input value={newInvestor.application_requirements} onChange={e => setNewInvestor({ ...newInvestor, application_requirements: e.target.value })} placeholder="e.g. Pitch deck, product demo..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Selection Process</label>
                                                    <Input value={newInvestor.selection_process} onChange={e => setNewInvestor({ ...newInvestor, selection_process: e.target.value })} placeholder="e.g. Application -> Screening -> Interview" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Decision Time</label>
                                                    <Input value={newInvestor.decision_time} onChange={e => setNewInvestor({ ...newInvestor, decision_time: e.target.value })} placeholder="e.g. 2-6 weeks" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h4 className="font-bold text-sm text-gray-900 mb-4 uppercase tracking-tighter">Founder Value / Support</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Mentorship Access</label>
                                                    <Input value={newInvestor.mentorship_access} onChange={e => setNewInvestor({ ...newInvestor, mentorship_access: e.target.value })} placeholder="e.g. Dedicated mentors" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Investor Access / Demo Day</label>
                                                    <Input value={newInvestor.investor_access} onChange={e => setNewInvestor({ ...newInvestor, investor_access: e.target.value })} placeholder="e.g. Strong demo day" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Post-Program Support</label>
                                                    <Input value={newInvestor.post_program_support} onChange={e => setNewInvestor({ ...newInvestor, post_program_support: e.target.value })} placeholder="e.g. Warm intros" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Startup Perks</label>
                                                    <Input value={newInvestor.startup_perks} onChange={e => setNewInvestor({ ...newInvestor, startup_perks: e.target.value })} placeholder="e.g. AWS credits" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Core Support</label>
                                                    <Input value={newInvestor.core_support} onChange={e => setNewInvestor({ ...newInvestor, core_support: e.target.value })} placeholder="e.g. GTM, Fundraising" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Founder Community</label>
                                                    <Input value={newInvestor.founder_community} onChange={e => setNewInvestor({ ...newInvestor, founder_community: e.target.value })} placeholder="e.g. Strong alumni" />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <Button onClick={handleAddInvestor} className="w-full bg-black text-white hover:bg-gray-800 rounded-xl py-6 mt-4 sticky bottom-0 active:scale-[0.98] transition-transform shadow-lg">
                            {editingInvestor ? "Update Investor Details" : "Add Investor Entry"}
                        </Button>
                    </div>
                )}
            </Modal>
        </>
    )
}
