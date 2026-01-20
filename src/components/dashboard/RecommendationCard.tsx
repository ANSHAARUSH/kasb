import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";
import type { MatchRecommendation } from "../../lib/recommendations";
import type { Startup, Investor } from "../../data/mockData";
import { StartupCard } from "./StartupCard";
import { InvestorCard } from "./InvestorCard";

interface RecommendationCardProps {
    recommendation: MatchRecommendation;
    type: 'startup' | 'investor';
    onSelect: (id: string) => void;
    onSave?: (id: string) => void;
    onMessage?: (entity: Startup | Investor) => void;
    isSaved?: boolean;
    isSelected?: boolean;
}

export function RecommendationCard({
    recommendation,
    type,
    onSelect,
    onSave,
    onMessage,
    isSaved,
    isSelected
}: RecommendationCardProps) {
    const { matchScore, matchLevel, explanation, keyHighlights, entity } = recommendation;

    const matchColor = {
        high: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        medium: 'bg-amber-50 border-amber-200 text-amber-700',
        low: 'bg-gray-50 border-gray-200 text-gray-600'
    }[matchLevel];

    const matchIcon = {
        high: '🎯',
        medium: '👍',
        low: '💡'
    }[matchLevel];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
        >
            {/* Match Badge Overlay */}
            <div className="absolute -top-2 -right-2 z-10">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 shadow-sm ${matchColor}`}>
                    <span className="text-sm">{matchIcon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {matchScore}% Match
                    </span>
                </div>
            </div>

            {/* AI Insight Banner */}
            <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">
                            AI Insight
                        </p>
                        <p className="text-sm text-indigo-800 leading-relaxed">
                            {explanation}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {keyHighlights.map((highlight, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/60 rounded-full text-xs font-medium text-indigo-700 border border-indigo-100"
                                >
                                    <TrendingUp className="h-3 w-3" />
                                    {highlight}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Entity Card */}
            {type === 'startup' ? (
                <StartupCard
                    startup={entity as Startup}
                    isSelected={isSelected || false}
                    isSaved={isSaved || false}
                    onClick={() => onSelect(entity.id)}
                    onDoubleClick={() => onSelect(entity.id)}
                    onToggleSave={onSave ? () => onSave(entity.id) : undefined}
                    onMessageClick={onMessage ? () => onMessage(entity as Startup) : undefined}
                />
            ) : (
                <InvestorCard
                    investor={entity as Investor}
                    isSelected={isSelected || false}
                    isSaved={isSaved || false}
                    onClick={() => onSelect(entity.id)}
                    onDoubleClick={() => onSelect(entity.id)}
                    onToggleSave={onSave ? () => onSave(entity.id) : undefined}
                    onMessageClick={onMessage ? () => onMessage(entity as Investor) : undefined}
                />
            )}
        </motion.div>
    );
}
