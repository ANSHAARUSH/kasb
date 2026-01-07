import { Input } from "../../../components/ui/input"
import { motion } from "framer-motion"

interface InvestorFieldsProps {
    expertiseAreas: readonly string[]
    selectedExpertise: string[]
    setSelectedExpertise: (val: string[]) => void
    customExpertise: string
    setCustomExpertise: (val: string) => void
}

export function InvestorFields({
    expertiseAreas,
    selectedExpertise,
    setSelectedExpertise,
    customExpertise,
    setCustomExpertise
}: InvestorFieldsProps) {
    const toggleExpertise = (area: string) => {
        if (selectedExpertise.includes(area)) {
            setSelectedExpertise(selectedExpertise.filter(a => a !== area))
        } else {
            setSelectedExpertise([...selectedExpertise, area])
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Investor Type</label>
                    <select
                        id="investorType"
                        required
                        className="w-full h-12 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    >
                        <option value="">Select Type</option>
                        <option>Angel Investor</option>
                        <option>Venture Capitalist</option>
                        <option>Family Office</option>
                        <option>Strategic Investor</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Investment Range</label>
                    <Input
                        id="investmentRange"
                        required
                        placeholder="e.g. $10K-$50K"
                        className="h-12 rounded-xl focus:ring-black"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Areas of Expertise</label>
                <div className="flex flex-wrap gap-2">
                    {expertiseAreas.map((area) => (
                        <button
                            key={area}
                            type="button"
                            onClick={() => toggleExpertise(area)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedExpertise.includes(area)
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {area}
                        </button>
                    ))}
                </div>
                {selectedExpertise.includes('Others') && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mt-2"
                    >
                        <Input
                            placeholder="Specify expertise"
                            value={customExpertise}
                            onChange={(e) => setCustomExpertise(e.target.value)}
                            className="h-12 rounded-xl focus:ring-black"
                        />
                    </motion.div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">About me (Bio)</label>
                <textarea
                    id="investorBio"
                    required
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="Describe your investment thesis..."
                />
            </div>
        </div>
    )
}
