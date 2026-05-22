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
                        className="pl-10 h-12 rounded-2xl bg-white border-2 border-indigo-100 shadow-lg hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 transition-all text-black placeholder:text-gray-400"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange?.(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                window.dispatchEvent(new CustomEvent('show-autofill-vault', { detail: { url: window.location.href } }));
                            }}
                            className="bg-black hover:bg-gray-800 text-white p-1.5 rounded-lg transition-all hover:scale-105 shadow-sm flex items-center gap-1"
                            title="Open AI Auto-Fill Vault"
                        >
                            <Sparkles className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest px-1 hidden sm:block">AI Vault</span>
                        </button>
                        <div className="bg-gray-100 p-1.5 rounded-lg">
                            <Search className="h-4 w-4 text-gray-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
