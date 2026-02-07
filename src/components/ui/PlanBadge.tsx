import { Zap, Sparkles, Crown, Rocket, Star, Globe } from "lucide-react"
import { cn } from "../../lib/utils"

interface PlanBadgeProps {
    tier?: string;
    className?: string;
}

export function PlanBadge({ tier, className }: PlanBadgeProps) {
    if (!tier) return null;

    const tierLower = tier.toLowerCase();

    const getBadgeConfig = () => {
        switch (tierLower) {
            // Startup Tiers
            case 'starter':
                return {
                    label: 'Starter',
                    icon: Rocket,
                    classes: 'bg-blue-50 text-blue-600 border-blue-100',
                    iconColor: 'text-blue-500'
                };
            case 'growth':
                return {
                    label: 'Growth',
                    icon: Zap,
                    classes: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm',
                    iconColor: 'text-indigo-500'
                };
            case 'fundraise_pro':
                return {
                    label: 'Fundraise Pro',
                    icon: Crown,
                    classes: 'bg-gray-900 text-white border-gray-800 shadow-lg',
                    iconColor: 'text-yellow-400'
                };

            // Investor Tiers
            case 'investor_basic':
                return {
                    label: 'Basic',
                    icon: Star,
                    classes: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    iconColor: 'text-emerald-500'
                };
            case 'investor_pro':
                return {
                    label: 'Pro',
                    icon: Sparkles,
                    classes: 'bg-violet-50 text-violet-600 border-violet-100 shadow-sm',
                    iconColor: 'text-violet-500'
                };
            case 'institutional':
                return {
                    label: 'Institutional',
                    icon: Globe,
                    classes: 'bg-black text-white border-black shadow-lg',
                    iconColor: 'text-blue-400'
                };

            // Free Tiers
            case 'discovery':
                return {
                    label: 'Discovery',
                    icon: Rocket,
                    classes: 'bg-slate-50 text-slate-500 border-slate-100',
                    iconColor: 'text-slate-400'
                };
            case 'explore':
                return {
                    label: 'Explore',
                    icon: Star,
                    classes: 'bg-slate-50 text-slate-500 border-slate-100',
                    iconColor: 'text-slate-400'
                };
            default:
                return null;
        }
    };

    const config = getBadgeConfig();
    if (!config) return null;

    const Icon = config.icon;

    return (
        <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-transform duration-300 hover:scale-110",
            config.classes,
            className
        )} title={config.label}>
            <Icon className={cn("w-5 h-5", config.iconColor)} />
        </div>
    );
}
