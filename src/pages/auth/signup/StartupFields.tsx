import { Input } from "../../../components/ui/input"
import { INDIAN_STATES } from "../../../lib/constants"

interface StartupFieldsProps {
    companyName: string
    setCompanyName: (val: string) => void
    industries: readonly string[]
    selectedIndustry: string
    setSelectedIndustry: (val: string) => void
    customIndustry: string
    setCustomIndustry: (val: string) => void
    problemSolving: string
    setProblemSolving: (val: string) => void
    isRefining: boolean
    onRefine: () => void
    state: string
    setState: (val: string) => void
    city: string
    setCity: (val: string) => void
    stage: string
    setStage: (val: string) => void
    teamSize: string
    setTeamSize: (val: string) => void
}

export function StartupFields({
    companyName,
    setCompanyName,
    industries,
    selectedIndustry,
    setSelectedIndustry,
    customIndustry,
    setCustomIndustry,
    problemSolving,
    setProblemSolving,
    isRefining,
    onRefine,
    state,
    setState,
    city,
    setCity,
    stage,
    setStage,
    teamSize,
    setTeamSize
}: StartupFieldsProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Company Name</label>
                <Input
                    required
                    placeholder="Enter your startup name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-12 rounded-xl focus:ring-black"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Industry</label>
                <div className="grid grid-cols-2 gap-2">
                    {industries.map((ind) => (
                        <button
                            key={ind}
                            type="button"
                            onClick={() => setSelectedIndustry(ind)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${selectedIndustry === ind
                                ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {ind}
                        </button>
                    ))}
                </div>
                {selectedIndustry === 'Others' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2"
                    >
                        <Input
                            placeholder="Specify your industry"
                            value={customIndustry}
                            onChange={(e) => setCustomIndustry(e.target.value)}
                            className="h-12 rounded-xl focus:ring-black"
                        />
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Current Stage</label>
                    <select
                        id="stage"
                        required
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                        className="w-full h-12 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    >
                        <option value="">Select Stage</option>
                        <option value="Ideation">Ideation</option>
                        <option value="Pre-seed">Pre-seed</option>
                        <option value="Seed">Seed</option>
                        <option value="Series A+">Series A+</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Team Size</label>
                    <Input
                        id="teamSize"
                        required
                        type="number"
                        placeholder="e.g. 5"
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                        className="h-12 rounded-xl focus:ring-black"
                    />
                </div>
            </div>

            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">Location Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">State</label>
                        <select
                            required
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full h-12 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">City</label>
                        <Input
                            required
                            placeholder="e.g. Bangalore"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="h-12 rounded-xl focus:ring-black"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">What problem are you solving?</label>
                    <button
                        type="button"
                        onClick={onRefine}
                        disabled={isRefining || !problemSolving.trim()}
                        className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isRefining ? (
                            <>
                                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                                Refining...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3.5 w-3.5" />
                                Refine with AI
                            </>
                        )}
                    </button>
                </div>
                <textarea
                    id="problemSolving"
                    required
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="Describe the problem your startup addresses..."
                    value={problemSolving}
                    onChange={(e) => setProblemSolving(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 italic">
                    AI will format this as: "helps (who) achieves (outcome) by (unique method)"
                </p>
            </div>
        </div>
    )
}

// Note: I need to import motion for the custom industry field.
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
