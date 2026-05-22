import { Crown } from "lucide-react"
import { cn } from "../../lib/utils"

interface PlanBadgeProps {
    tier?: string;
    className?: string;
}

export function PlanBadge({ tier, className }: PlanBadgeProps) {
    if (!tier) return null;

    const tierLower = tier.toLowerCase();

    const getBadgeConfig = () => {
        const sharedClasses = 'bg-black text-white border-gray-800 shadow-lg';

        switch (tierLower) {
            // Startup Tiers
            case 'starter':
                return {
                    label: 'Starter',
                    icon: Crown,
                    classes: sharedClasses,
                    iconColor: 'text-amber-800' // Brown (3rd costly)
                };
            case 'growth':
                return {
                    label: 'Growth',
                    icon: Crown,
                    classes: sharedClasses,
                    iconColor: 'text-slate-300' // Silver (2nd costly)
                };
            case 'fundraise_pro':
                return {
                    label: 'Fundraise Pro',
                    icon: Crown,
                    classes: sharedClasses,
                    iconColor: 'text-yellow-400' // Gold (Most costly)
                };

            // Investor Tiers
            case 'investor_basic':
                return {
                    label: 'Basic',
                    icon: Crown,
                    classes: sharedClasses,
                    iconColor: 'text-amber-800' // Brown (3rd costly)
                };
            case 'investor_pro':
                return {
                    label: 'Pro',
                    icon: Crown,
                    classes: sharedClasses,
                    iconColor: 'text-slate-300' // Silver (2nd costly)
                };
            case 'institutional':
                return {
                    label: 'Institutional',
                    icon: Crown,
                    classes: sharedClasses,
                    iconColor: 'text-yellow-400' // Gold (Most costly)
                };

            // Free Tiers
            case 'discovery':
                return {
                    label: 'Discovery',
                    icon: Crown,
                    classes: sharedClasses,
                    iconColor: 'text-slate-500' // Grey (Free)
                };
            case 'explore':
                return {
                    label: 'Explore',
                    icon: Crown,
                    classes: sharedClasses,
                    iconColor: 'text-slate-500' // Grey (Free)
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
