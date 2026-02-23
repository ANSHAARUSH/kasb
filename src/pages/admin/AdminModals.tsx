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
    setNewStartup: React.Dispatch<React.SetStateAction<AdminModalsProps['newStartup']>>
    handleAddStartup: () => Promise<void>
    isInvestorModalOpen: boolean
    setIsInvestorModalOpen: (open: boolean) => void
    newInvestor: {
        name: string
        avatar: string
        funds_available: string
        investments_count: number
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
        portfolio_highlights?: string
        investment_philosophy?: string
        is_lead_investor?: boolean
        equity_taken?: string
        batch_dates?: string
        location_type?: string
        cohort_size?: number
        has_demo_day?: boolean
    }
    setNewInvestor: React.Dispatch<React.SetStateAction<AdminModalsProps['newInvestor']>>
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
    handleAddInvestor
}: AdminModalsProps) {
    const [selectionStep, setSelectionStep] = useState<'selection' | 'form'>('selection')

    // Reset step when modal closes
    useEffect(() => {
        if (!isInvestorModalOpen) {
            setSelectionStep('selection')
        }
    }, [isInvestorModalOpen])

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

            {/* Add Investor Modal */}
            <Modal isOpen={isInvestorModalOpen} onClose={() => setIsInvestorModalOpen(false)} title={selectionStep === 'selection' ? "Select Investor Type" : "Add New Investor"}>
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
                                    <label className="text-sm font-medium">Investments Count</label>
                                    <Input
                                        type="number"
                                        value={newInvestor.investments_count}
                                        onChange={e => setNewInvestor({ ...newInvestor, investments_count: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

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

                                {newInvestor.investor_type === 'accelerator' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Equity Taken (%)</label>
                                                <Input
                                                    value={newInvestor.equity_taken}
                                                    onChange={e => setNewInvestor({ ...newInvestor, equity_taken: e.target.value })}
                                                    placeholder="e.g. 7%"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Cohort Size</label>
                                                <Input
                                                    type="number"
                                                    value={newInvestor.cohort_size}
                                                    onChange={e => setNewInvestor({ ...newInvestor, cohort_size: parseInt(e.target.value) || 0 })}
                                                    placeholder="e.g. 50"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Batch Dates</label>
                                            <Input
                                                value={newInvestor.batch_dates}
                                                onChange={e => setNewInvestor({ ...newInvestor, batch_dates: e.target.value })}
                                                placeholder="e.g. Jan 2025 - Jun 2025"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Location Type</label>
                                            <select
                                                className="w-full rounded-md border border-gray-200 p-2 text-sm"
                                                value={newInvestor.location_type}
                                                onChange={e => setNewInvestor({ ...newInvestor, location_type: e.target.value })}
                                            >
                                                <option value="remote">Remote</option>
                                                <option value="onsite">Onsite</option>
                                                <option value="hybrid">Hybrid</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <input
                                                type="checkbox"
                                                id="has_demo_day"
                                                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                                checked={newInvestor.has_demo_day || false}
                                                onChange={e => setNewInvestor({ ...newInvestor, has_demo_day: e.target.checked })}
                                            />
                                            <label htmlFor="has_demo_day" className="text-sm font-medium text-gray-700">
                                                Includes Demo Day
                                            </label>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Portfolio Highlights</label>
                                    <textarea
                                        className="w-full min-h-[80px] rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 ring-black/5"
                                        value={newInvestor.portfolio_highlights}
                                        onChange={e => setNewInvestor({ ...newInvestor, portfolio_highlights: e.target.value })}
                                        placeholder="e.g. Razorpay, Swiggy (comma-separated)"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Investment Philosophy (Optional)</label>
                                    <textarea
                                        className="w-full min-h-[80px] rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 ring-black/5"
                                        value={newInvestor.investment_philosophy}
                                        onChange={e => setNewInvestor({ ...newInvestor, investment_philosophy: e.target.value })}
                                        placeholder="What kind of founders/problems do you back?"
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
                            </div>
                        </div>

                        <Button onClick={handleAddInvestor} className="w-full bg-black text-white hover:bg-gray-800 rounded-xl py-6 mt-4 sticky bottom-0 active:scale-[0.98] transition-transform shadow-lg">
                            Add Investor Entry
                        </Button>
                    </div>
                )}
            </Modal>
        </>
    )
}
