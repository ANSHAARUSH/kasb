import { ShieldCheck, CheckCircle2, Award } from "lucide-react"

interface VerificationBadgeProps {
    level: 'basic' | 'verified' | 'trusted';
    showLabel?: boolean;
}

export function VerificationBadge({ level, showLabel = false }: VerificationBadgeProps) {
    if (level === 'basic') {
        return (
            <div className="flex items-center gap-1 text-gray-500" title="Basic Verification">
                <CheckCircle2 className="h-4 w-4" />
                {showLabel && <span className="text-xs font-semibold">Basic</span>}
            </div>
        )
    }

    if (level === 'verified') {
        return (
            <div className="flex items-center gap-1 text-blue-600" title="Identity Verified">
                <ShieldCheck className="h-4 w-4" />
                {showLabel && <span className="text-xs font-semibold">Verified</span>}
            </div>
        )
    }

    if (level === 'trusted') {
        return (
            <div className="flex items-center gap-1 text-amber-500" title="Trusted Partner">
                <Award className="h-5 w-5 fill-amber-500/10" />
                {showLabel && <span className="text-xs font-bold">Trusted</span>}
            </div>
        )
    }

    return null
}
