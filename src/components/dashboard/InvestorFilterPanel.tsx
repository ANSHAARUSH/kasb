import { Button } from "../ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check } from "lucide-react"

export interface InvestorFilterState {
    types: string[]
    industries: string[]
    minFunds: string // e.g. "0", "10M", "100M"
}

interface InvestorFilterPanelProps {
    isOpen: boolean
    filters: InvestorFilterState
    onFilterChange: (filters: InvestorFilterState) => void
    onClose: () => void
}

const TYPES = ["Angel Investor", "Venture Capital", "Syndicate", "Family Office"]
const INDUSTRIES = [
    "AI", "SaaS", "FinTech", "HealthTech", "EdTech",
    "AgriTech", "CleanTech", "PropTech", "Logistics", "DeepTech", "E-commerce"
]
const FUND_RANGES = [
    { label: "Any Funds", value: "0" },
    { label: "$10M+ Available", value: "10000000" },
    { label: "$50M+ Available", value: "50000000" },
    { label: "$100M+ Available", value: "100000000" },
    { label: "$500M+ Available", value: "500000000" }
]

export function InvestorFilterPanel({ isOpen, filters, onFilterChange, onClose }: InvestorFilterPanelProps) {
    const toggleType = (type: string) => {
        const newTypes = filters.types.includes(type)
            ? filters.types.filter(t => t !== type)
            : [...filters.types, type]
        onFilterChange({ ...filters, types: newTypes })
    }

    const toggleIndustry = (industry: string) => {
        const newIndustries = filters.industries.includes(industry)
            ? filters.industries.filter(i => i !== industry)
            : [...filters.industries, industry]
        onFilterChange({ ...filters, industries: newIndustries })
    }

    const clearFilters = () => {
        onFilterChange({ types: [], industries: [], minFunds: "0" })
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
                    <div className="container mx-auto max-w-6xl p-6 grid gap-8 md:grid-cols-3">

                        {/* Type Filter */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900">Investor Type</h3>
                            <div className="flex flex-wrap gap-2">
                                {TYPES.map(type => {
                                    const isSelected = filters.types.includes(type)
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => toggleType(type)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected
                                                ? "bg-black text-white border-black"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Industry Filter */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900">Expertise / Sector</h3>
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

                        {/* Funds & Actions */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900">Minimum Capital</h3>
                                <select
                                    className="w-full p-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-black outline-none"
                                    value={filters.minFunds}
                                    onChange={(e) => onFilterChange({ ...filters, minFunds: e.target.value })}
                                    style={{
                                        color: 'black',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    {FUND_RANGES.map(range => (
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
                </motion.div>
            )}
        </AnimatePresence>
    )
}
