import { Search, Sparkles } from "lucide-react"
import { Input } from "../ui/input"

interface SearchInputProps {
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    className?: string
}

export function SearchInput({ value, onChange, placeholder = "Search startups with AI...", className }: SearchInputProps) {
    return (
        <div className={`px-6 pb-4 ${className || "fixed bottom-[80px] left-0 right-0 z-40"}`}>
            <div className="mx-auto max-w-md relative">
                <div className="relative rounded-2xl">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                        <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
                    </div>
                    <Input
                        className="pl-10 h-12 rounded-2xl border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black transition-all"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange?.(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="bg-gray-100 p-1.5 rounded-lg">
                            <Search className="h-4 w-4 text-gray-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
