import { Button } from "../ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check } from "lucide-react"
import { STATES, CITIES } from "../../lib/locationData"

export interface FilterState {
    stages: string[]
    industries: string[]
    minRevenue: string // e.g. "0", "100000", "1000000"
    states: string[]
    cities: string[]
}

interface FilterPanelProps {
    isOpen: boolean
    filters: FilterState
    onFilterChange: (filters: FilterState) => void
    onClose: () => void
}

const STAGES = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C+"]
const INDUSTRIES = [
    "AI/ML", "SaaS", "FinTech", "HealthTech", "EdTech",
    "AgriTech", "CleanTech", "ClimateTech", "Manufacturing",
    "E-commerce", "Media & Gaming", "PropTech", "LogisticTech"
]
// Removed local STATES and CITIES to use shared ones
const REVENUE_RANGES = [
    { label: "Any Revenue", value: "0" },
    { label: "$100k+ ARR", value: "100000" },
    { label: "$500k+ ARR", value: "500000" },
    { label: "$1M+ ARR", value: "1000000" },
    { label: "$5M+ ARR", value: "5000000" }
]

export function FilterPanel({ isOpen, filters, onFilterChange, onClose }: FilterPanelProps) {
    const toggleStage = (stage: string) => {
        const newStages = filters.stages.includes(stage)
            ? filters.stages.filter(s => s !== stage)
            : [...filters.stages, stage]
        onFilterChange({ ...filters, stages: newStages })
    }

    const toggleIndustry = (industry: string) => {
        const newIndustries = filters.industries.includes(industry)
            ? filters.industries.filter(i => i !== industry)
            : [...filters.industries, industry]
        onFilterChange({ ...filters, industries: newIndustries })
    }

    const clearFilters = () => {
        onFilterChange({ stages: [], industries: [], minRevenue: "0", states: [], cities: [] })
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-gray-50 border-b border-gray-200"
                >
                    <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
                        <div className="w-full max-w-7xl mx-auto p-6 grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
                            {/* Stage Filter */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900">Stage</h3>
                                <div className="flex flex-wrap gap-2">
                                    {STAGES.map(stage => {
                                        const isSelected = filters.stages.includes(stage)
                                        return (
                                            <button
                                                key={stage}
                                                onClick={() => toggleStage(stage)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected
                                                    ? "bg-black text-white border-black"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                    }`}
                                            >
                                                {stage}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Industry Filter */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900">Industry</h3>
                                <div className="flex flex-wrap gap-2">
                                    {INDUSTRIES.map(industry => {
                                        const isSelected = filters.industries.includes(industry)
                                        return (
                                            <button
                                                key={industry}
                                                onClick={() => toggleIndustry(industry)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected
                                                    ? "bg-black text-white border-black"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                    }`}
                                            >
                                                {industry}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* State Filter */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900">State</h3>
                                <select
                                    className="w-full p-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-black outline-none"
                                    value={filters.states[0] || ""}
                                    onChange={(e) => onFilterChange({ ...filters, states: e.target.value ? [e.target.value] : [] })}
                                >
                                    <option value="">All States</option>
                                    {STATES.map(state => (
                                        <option key={state} value={state}>
                                            {state}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* City Filter */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900">City</h3>
                                <select
                                    className="w-full p-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-black outline-none"
                                    value={filters.cities[0] || ""}
                                    onChange={(e) => onFilterChange({ ...filters, cities: e.target.value ? [e.target.value] : [] })}
                                >
                                    <option value="">All Cities</option>
                                    {CITIES.map(city => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Revenue & Actions */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900">Min Revenue</h3>
                                    <select
                                        className="w-full p-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-black outline-none"
                                        value={filters.minRevenue}
                                        onChange={(e) => onFilterChange({ ...filters, minRevenue: e.target.value })}
                                    >
                                        {REVENUE_RANGES.map(range => (
                                            <option key={range.value} value={range.value}>
                                                {range.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={clearFilters}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Clear
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={onClose}
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Done
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
