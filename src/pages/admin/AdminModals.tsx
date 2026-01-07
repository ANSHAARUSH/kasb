import { Modal } from "../../components/ui/modal"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"

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
            <Modal isOpen={isInvestorModalOpen} onClose={() => setIsInvestorModalOpen(false)} title="Add New Investor">
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Investor Name / Firm</label>
                        <Input value={newInvestor.name} onChange={e => setNewInvestor({ ...newInvestor, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Avatar URL</label>
                        <Input value={newInvestor.avatar} onChange={e => setNewInvestor({ ...newInvestor, avatar: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Available Funds</label>
                        <Input value={newInvestor.funds_available} onChange={e => setNewInvestor({ ...newInvestor, funds_available: e.target.value })} placeholder="e.g. $1M-$5M" />
                    </div>
                    <Button onClick={handleAddInvestor} className="w-full bg-black text-white hover:bg-gray-800 rounded-xl py-6 mt-4">
                        Add Investor Entry
                    </Button>
                </div>
            </Modal>
        </>
    )
}
